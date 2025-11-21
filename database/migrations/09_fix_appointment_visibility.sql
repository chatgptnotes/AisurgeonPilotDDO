-- =====================================================
-- Migration: Fix Appointment Visibility Issues
-- Version: 09
-- Date: 2025-11-21
-- Description: Fixes RLS policies and schema to ensure appointments are visible
-- =====================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS
-- ============================================================================

-- Add buffer_minutes to doctor_availability (expected by booking components)
ALTER TABLE public.doctor_availability
ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 10;

COMMENT ON COLUMN public.doctor_availability.buffer_minutes IS 'Buffer time between appointments in minutes';

-- Ensure appointments table has all required fields
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
ADD COLUMN IF NOT EXISTS appointment_date DATE,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS mode VARCHAR(20),
ADD COLUMN IF NOT EXISTS symptoms TEXT,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS booked_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Add index on tenant_id for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments(patient_id, appointment_date);

-- ============================================================================
-- 2. FIX RLS POLICIES FOR APPOINTMENTS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Doctors see own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors see own appointments - email fallback" ON public.appointments;
DROP POLICY IF EXISTS "Doctors update own appointments" ON public.appointments;

-- Policy: Doctors see appointments (supports both user_id and email-based auth)
CREATE POLICY "Doctors see own appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors
    WHERE user_id = auth.uid()  -- Primary: Match by user_id
    OR (
      user_id IS NULL  -- Fallback: Match by email when user_id not set
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Doctors can update own appointments (with same fallback logic)
CREATE POLICY "Doctors update own appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors
    WHERE user_id = auth.uid()
    OR (
      user_id IS NULL
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM public.doctors
    WHERE user_id = auth.uid()
    OR (
      user_id IS NULL
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- ============================================================================
-- 3. CREATE HELPER FUNCTION TO LINK DOCTORS TO AUTH USERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.link_doctor_to_auth_user(
  p_doctor_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_doctor_id UUID;
  v_updated BOOLEAN := FALSE;
BEGIN
  -- Find auth user by email
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = p_doctor_email
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found with email: %', p_doctor_email;
    RETURN FALSE;
  END IF;

  -- Find doctor by email
  SELECT id INTO v_doctor_id
  FROM public.doctors
  WHERE email = p_doctor_email
  AND (user_id IS NULL OR user_id != v_auth_user_id)
  LIMIT 1;

  IF v_doctor_id IS NULL THEN
    RAISE NOTICE 'No doctor found with email: % or already linked', p_doctor_email;
    RETURN FALSE;
  END IF;

  -- Link doctor to auth user
  UPDATE public.doctors
  SET user_id = v_auth_user_id
  WHERE id = v_doctor_id;

  v_updated := TRUE;

  RAISE NOTICE 'Successfully linked doctor % to auth user %', p_doctor_email, v_auth_user_id;
  RETURN v_updated;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error linking doctor: %', SQLERRM;
    RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.link_doctor_to_auth_user IS 'Links a doctor profile to their auth user by email';

-- ============================================================================
-- 4. AUTO-LINK ALL DOCTORS WITH MATCHING EMAIL
-- ============================================================================

DO $$
DECLARE
  v_doctor RECORD;
  v_linked_count INTEGER := 0;
BEGIN
  FOR v_doctor IN
    SELECT d.id, d.email, d.full_name
    FROM public.doctors d
    WHERE d.user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM auth.users au WHERE au.email = d.email
    )
  LOOP
    IF public.link_doctor_to_auth_user(v_doctor.email) THEN
      v_linked_count := v_linked_count + 1;
      RAISE NOTICE 'Linked: % (%)', v_doctor.full_name, v_doctor.email;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Auto-linked % doctor(s) to auth users', v_linked_count;
END $$;

-- ============================================================================
-- 5. FIX APPOINTMENT CREATION PERMISSIONS
-- ============================================================================

-- Drop and recreate patient creation policy to include tenant_id validation
DROP POLICY IF EXISTS "Patients create appointments" ON public.appointments;

CREATE POLICY "Patients create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (
  patient_id IN (
    SELECT id FROM public.patients WHERE auth.uid() = id
  )
  OR EXISTS (
    -- Allow creation if user is authenticated (for QuickBookingModal by staff)
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff', 'superadmin')
  )
);

-- ============================================================================
-- 6. ADD TRIGGER TO AUTO-SET APPOINTMENT_DATE FROM START_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_appointment_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-set appointment_date from start_at if not provided
  IF NEW.appointment_date IS NULL AND NEW.start_at IS NOT NULL THEN
    NEW.appointment_date := DATE(NEW.start_at AT TIME ZONE 'UTC');
  END IF;

  -- Auto-calculate duration_minutes if not provided
  IF NEW.duration_minutes IS NULL AND NEW.start_at IS NOT NULL AND NEW.end_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_at - NEW.start_at)) / 60;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_appointment_date ON public.appointments;

CREATE TRIGGER trg_set_appointment_date
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.set_appointment_date();

-- ============================================================================
-- 7. UPDATE EXISTING APPOINTMENTS TO FIX MISSING DATA
-- ============================================================================

-- Set appointment_date for existing appointments
UPDATE public.appointments
SET appointment_date = DATE(start_at AT TIME ZONE 'UTC')
WHERE appointment_date IS NULL AND start_at IS NOT NULL;

-- Set duration_minutes for existing appointments
UPDATE public.appointments
SET duration_minutes = EXTRACT(EPOCH FROM (end_at - start_at)) / 60
WHERE duration_minutes IS NULL AND start_at IS NOT NULL AND end_at IS NOT NULL;

-- Set default tenant_id if NULL (use first available tenant)
UPDATE public.appointments
SET tenant_id = (SELECT id FROM public.tenants LIMIT 1)
WHERE tenant_id IS NULL
AND EXISTS (SELECT 1 FROM public.tenants);

-- ============================================================================
-- 8. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_buffer_col_exists BOOLEAN;
  v_linked_doctors INTEGER;
  v_appointments_with_tenant INTEGER;
BEGIN
  -- Check if buffer_minutes column was added
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'doctor_availability'
    AND column_name = 'buffer_minutes'
  ) INTO v_buffer_col_exists;

  -- Count linked doctors
  SELECT COUNT(*) INTO v_linked_doctors
  FROM public.doctors
  WHERE user_id IS NOT NULL;

  -- Count appointments with tenant_id
  SELECT COUNT(*) INTO v_appointments_with_tenant
  FROM public.appointments
  WHERE tenant_id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 09 VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'buffer_minutes column exists: %', v_buffer_col_exists;
  RAISE NOTICE 'Doctors linked to auth users: %', v_linked_doctors;
  RAISE NOTICE 'Appointments with tenant_id: %', v_appointments_with_tenant;

  IF v_buffer_col_exists AND v_linked_doctors > 0 THEN
    RAISE NOTICE '✅ Migration 09 completed successfully';
  ELSE
    RAISE WARNING '⚠️  Migration may be incomplete';
  END IF;

  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.link_doctor_to_auth_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_appointment_date() TO authenticated;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================

COMMENT ON TABLE public.appointments IS 'Appointments with fixed RLS policies for email-based auth';
COMMENT ON FUNCTION public.link_doctor_to_auth_user IS 'Helper function to manually link doctors to auth users by email';
COMMENT ON FUNCTION public.set_appointment_date IS 'Auto-sets appointment_date and duration from start_at/end_at';

-- To manually link a specific doctor:
-- SELECT public.link_doctor_to_auth_user('doctor@example.com');
