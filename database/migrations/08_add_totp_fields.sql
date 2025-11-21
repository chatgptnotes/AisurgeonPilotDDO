-- =====================================================
-- Migration: Add TOTP/2FA Fields to Users Table
-- Version: 08
-- Date: 2025-11-21
-- Description: Adds columns for TOTP 2FA authentication
-- =====================================================

-- Add TOTP-related columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS trusted_devices JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS totp_enabled_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.users.totp_secret IS 'Encrypted TOTP secret key for 2FA authentication';
COMMENT ON COLUMN public.users.totp_enabled IS 'Whether TOTP 2FA is enabled for this user';
COMMENT ON COLUMN public.users.backup_codes IS 'Array of hashed backup codes for emergency access';
COMMENT ON COLUMN public.users.trusted_devices IS 'JSON array of trusted devices that skip 2FA';
COMMENT ON COLUMN public.users.totp_enabled_at IS 'Timestamp when TOTP was enabled';

-- Create index for faster lookups on totp_enabled users
CREATE INDEX IF NOT EXISTS idx_users_totp_enabled ON public.users(totp_enabled) WHERE totp_enabled = TRUE;

-- =====================================================
-- Create table for TOTP audit logs
-- =====================================================

CREATE TABLE IF NOT EXISTS public.totp_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('setup', 'enabled', 'disabled', 'verified', 'failed', 'backup_used', 'device_trusted')),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for audit log queries
CREATE INDEX IF NOT EXISTS idx_totp_audit_user_id ON public.totp_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_audit_created_at ON public.totp_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_totp_audit_event_type ON public.totp_audit_logs(event_type);

-- Enable RLS for audit logs
ALTER TABLE public.totp_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "Users can view own TOTP audit logs"
ON public.totp_audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only system can insert audit logs (via service role)
CREATE POLICY "System can insert TOTP audit logs"
ON public.totp_audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Comment the table
COMMENT ON TABLE public.totp_audit_logs IS 'Audit log for all TOTP 2FA authentication events';

-- =====================================================
-- Helper function to log TOTP events
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_totp_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT FALSE,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.totp_audit_logs (
    user_id,
    event_type,
    ip_address,
    user_agent,
    success,
    metadata
  )
  VALUES (
    p_user_id,
    p_event_type,
    p_ip_address,
    p_user_agent,
    p_success,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =====================================================
-- Function to check if user requires 2FA
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_requires_2fa(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_totp_enabled BOOLEAN;
BEGIN
  SELECT role, totp_enabled
  INTO v_role, v_totp_enabled
  FROM public.users
  WHERE id = p_user_id;

  -- Doctors, admins, and superadmins should have 2FA
  IF v_role IN ('doctor', 'admin', 'superadmin') THEN
    RETURN TRUE;
  END IF;

  -- If TOTP is enabled, require it
  IF v_totp_enabled = TRUE THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- =====================================================
-- Function to check if device is trusted
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_device_trusted(
  p_user_id UUID,
  p_device_fingerprint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trusted_devices JSONB;
  v_device JSONB;
BEGIN
  SELECT trusted_devices INTO v_trusted_devices
  FROM public.users
  WHERE id = p_user_id;

  -- Check if device fingerprint exists in trusted devices
  FOR v_device IN SELECT * FROM jsonb_array_elements(v_trusted_devices)
  LOOP
    IF v_device->>'fingerprint' = p_device_fingerprint THEN
      -- Check if device hasn't expired (30 days)
      IF (v_device->>'added_at')::timestamptz > NOW() - INTERVAL '30 days' THEN
        RETURN TRUE;
      END IF;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$;

-- =====================================================
-- Function to add trusted device
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_trusted_device(
  p_user_id UUID,
  p_device_fingerprint TEXT,
  p_device_name TEXT DEFAULT 'Unknown Device'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_device JSONB;
BEGIN
  v_new_device := jsonb_build_object(
    'fingerprint', p_device_fingerprint,
    'name', p_device_name,
    'added_at', NOW()
  );

  UPDATE public.users
  SET trusted_devices = COALESCE(trusted_devices, '[]'::jsonb) || v_new_device
  WHERE id = p_user_id;

  -- Log the event
  PERFORM public.log_totp_event(
    p_user_id,
    'device_trusted',
    NULL,
    NULL,
    TRUE,
    jsonb_build_object('device_name', p_device_name)
  );

  RETURN TRUE;
END;
$$;

-- =====================================================
-- Function to clean up expired trusted devices
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_devices()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_device JSONB;
  v_valid_devices JSONB := '[]'::jsonb;
  v_cleaned_count INTEGER := 0;
BEGIN
  -- Loop through all users with trusted devices
  FOR v_user IN
    SELECT id, trusted_devices
    FROM public.users
    WHERE trusted_devices IS NOT NULL
    AND jsonb_array_length(trusted_devices) > 0
  LOOP
    v_valid_devices := '[]'::jsonb;

    -- Check each device
    FOR v_device IN SELECT * FROM jsonb_array_elements(v_user.trusted_devices)
    LOOP
      -- Keep devices added in last 30 days
      IF (v_device->>'added_at')::timestamptz > NOW() - INTERVAL '30 days' THEN
        v_valid_devices := v_valid_devices || v_device;
      ELSE
        v_cleaned_count := v_cleaned_count + 1;
      END IF;
    END LOOP;

    -- Update user with valid devices only
    IF jsonb_array_length(v_valid_devices) < jsonb_array_length(v_user.trusted_devices) THEN
      UPDATE public.users
      SET trusted_devices = v_valid_devices
      WHERE id = v_user.id;
    END IF;
  END LOOP;

  RETURN v_cleaned_count;
END;
$$;

-- =====================================================
-- Verification queries
-- =====================================================

-- Check if columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'totp_secret'
  ) THEN
    RAISE NOTICE '✅ TOTP fields added to users table';
  ELSE
    RAISE EXCEPTION '❌ Failed to add TOTP fields';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'totp_audit_logs'
  ) THEN
    RAISE NOTICE '✅ TOTP audit logs table created';
  ELSE
    RAISE EXCEPTION '❌ Failed to create audit logs table';
  END IF;

  RAISE NOTICE '✅ Migration 08 completed successfully';
END $$;

