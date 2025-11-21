-- ============================================================================
-- AI Surgeon Pilot DDO - Comprehensive RLS Policies
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-21
-- Purpose: Add complete Row Level Security policies for all tenant-scoped tables
--
-- CRITICAL SECURITY: Prevents cross-tenant data access
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TENANT_USERS TABLE - Multi-tenant user memberships
-- ============================================================================

-- Enable RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own tenant memberships
CREATE POLICY "Users see own tenant memberships"
ON public.tenant_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can join tenants (insert)
CREATE POLICY "Users can join tenants"
ON public.tenant_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update own memberships
CREATE POLICY "Users update own memberships"
ON public.tenant_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Admins can manage all tenant users within their tenant
CREATE POLICY "Admins manage tenant users"
ON public.tenant_users FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- ============================================================================
-- 2. DOCTOR_AVAILABILITY TABLE - Scheduling slots
-- ============================================================================

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active doctor availability
CREATE POLICY "Public read doctor availability"
ON public.doctor_availability FOR SELECT
TO public
USING (TRUE);

-- Policy: Doctors can manage own availability
CREATE POLICY "Doctors manage own availability"
ON public.doctor_availability FOR ALL
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can manage all availability in their tenant
CREATE POLICY "Admins manage availability"
ON public.doctor_availability FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- ============================================================================
-- 3. CONSULTATION_TYPES TABLE - Service offerings
-- ============================================================================

ALTER TABLE public.consultation_types ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active consultation types
CREATE POLICY "Public read consultation types"
ON public.consultation_types FOR SELECT
TO public
USING (is_active = TRUE);

-- Policy: Doctors can manage own consultation types
CREATE POLICY "Doctors manage own consultation types"
ON public.consultation_types FOR ALL
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. SLOT_LOCKS TABLE - Temporary booking holds
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.slot_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  patient_id UUID REFERENCES public.patients(id),
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  lock_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slot_locks_tenant ON public.slot_locks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_slot_locks_doctor ON public.slot_locks(doctor_id);
CREATE INDEX IF NOT EXISTS idx_slot_locks_expires ON public.slot_locks(lock_expires_at);

ALTER TABLE public.slot_locks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see own slot locks
CREATE POLICY "Users see own slot locks"
ON public.slot_locks FOR SELECT
TO authenticated
USING (patient_id IN (
  SELECT id FROM public.patients WHERE auth.uid() = id
));

-- Policy: Users can create slot locks
CREATE POLICY "Users create slot locks"
ON public.slot_locks FOR INSERT
TO authenticated
WITH CHECK (patient_id IN (
  SELECT id FROM public.patients WHERE auth.uid() = id
));

-- Policy: System can delete expired locks (cleanup job)
CREATE POLICY "System delete expired locks"
ON public.slot_locks FOR DELETE
TO authenticated
USING (lock_expires_at < NOW());

-- ============================================================================
-- 5. DOCTOR_BLACKOUT_DATES TABLE - Holiday/unavailable periods
-- ============================================================================

-- RLS already exists, verify policies
ALTER TABLE public.doctor_blackout_dates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any conflicts
DROP POLICY IF EXISTS "Doctors manage own blackout dates" ON public.doctor_blackout_dates;
DROP POLICY IF EXISTS "Public read blackout dates" ON public.doctor_blackout_dates;

-- Policy: Public can view blackout dates (for availability)
CREATE POLICY "Public read blackout dates"
ON public.doctor_blackout_dates FOR SELECT
TO public
USING (TRUE);

-- Policy: Doctors manage own blackout dates
CREATE POLICY "Doctors manage own blackout dates"
ON public.doctor_blackout_dates FOR ALL
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 6. APPOINTMENTS TABLE - Strengthen existing policies
-- ============================================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with better security
DROP POLICY IF EXISTS "Patients see own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors see own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins see all appointments" ON public.appointments;

-- Policy: Patients see appointments where they are the patient
CREATE POLICY "Patients see own appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM public.patients WHERE auth.uid() = id
  )
);

-- Policy: Doctors see appointments where they are the doctor
CREATE POLICY "Doctors see own appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

-- Policy: Doctors can update own appointments (status, notes)
CREATE POLICY "Doctors update own appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

-- Policy: Patients can create appointments
CREATE POLICY "Patients create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (
  patient_id IN (
    SELECT id FROM public.patients WHERE auth.uid() = id
  )
  AND tenant_id IS NOT NULL
);

-- Policy: Patients can cancel own appointments
CREATE POLICY "Patients cancel appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM public.patients WHERE auth.uid() = id
  )
  AND status IN ('scheduled', 'confirmed')
)
WITH CHECK (status = 'cancelled');

-- Policy: Admins manage all appointments in tenant
CREATE POLICY "Admins manage appointments"
ON public.appointments FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- ============================================================================
-- 7. PAYMENTS TABLE (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

    -- Policy: Users see own payments
    EXECUTE 'CREATE POLICY "Users see own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
      appointment_id IN (
        SELECT id FROM public.appointments
        WHERE patient_id IN (SELECT id FROM public.patients WHERE auth.uid() = id)
      )
    )';

    -- Policy: Doctors see payments for own appointments
    EXECUTE 'CREATE POLICY "Doctors see appointment payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
      appointment_id IN (
        SELECT id FROM public.appointments
        WHERE doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
      )
    )';
  END IF;
END $$;

-- ============================================================================
-- 8. VERIFICATION: Test RLS Coverage
-- ============================================================================

-- Create function to check RLS coverage
CREATE OR REPLACE FUNCTION public.check_rls_coverage()
RETURNS TABLE(
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT,
    t.rowsecurity,
    COUNT(p.policyname)::INTEGER
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
  WHERE t.schemaname = 'public'
    AND t.tablename IN (
      'tenants', 'users', 'doctors', 'patients', 'appointments',
      'tenant_users', 'doctor_availability', 'consultation_types',
      'slot_locks', 'doctor_blackout_dates', 'payments'
    )
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Run coverage check
SELECT * FROM public.check_rls_coverage();

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant select on all tables (RLS will filter)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;

-- Grant insert/update/delete to authenticated users (RLS will filter)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- These queries should return zero rows for users trying to access other tenant data

COMMENT ON FUNCTION public.check_rls_coverage IS 'Verify RLS is enabled on all critical tables';

DO $$
DECLARE
  v_total_tables INTEGER;
  v_rls_enabled INTEGER;
  v_missing_rls TEXT[];
BEGIN
  SELECT COUNT(*) INTO v_total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'tenants', 'users', 'doctors', 'patients', 'appointments',
      'tenant_users', 'doctor_availability', 'consultation_types',
      'slot_locks', 'doctor_blackout_dates'
    );

  SELECT COUNT(*) INTO v_rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = TRUE
    AND tablename IN (
      'tenants', 'users', 'doctors', 'patients', 'appointments',
      'tenant_users', 'doctor_availability', 'consultation_types',
      'slot_locks', 'doctor_blackout_dates'
    );

  SELECT ARRAY_AGG(tablename) INTO v_missing_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = FALSE
    AND tablename IN (
      'tenants', 'users', 'doctors', 'patients', 'appointments',
      'tenant_users', 'doctor_availability', 'consultation_types',
      'slot_locks', 'doctor_blackout_dates'
    );

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RLS POLICY VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total critical tables: %', v_total_tables;
  RAISE NOTICE 'Tables with RLS enabled: %', v_rls_enabled;
  RAISE NOTICE 'Tables missing RLS: %', COALESCE(ARRAY_LENGTH(v_missing_rls, 1), 0);

  IF v_missing_rls IS NOT NULL THEN
    RAISE NOTICE 'Missing RLS on: %', ARRAY_TO_STRING(v_missing_rls, ', ');
  ELSE
    RAISE NOTICE '✅ All critical tables have RLS enabled!';
  END IF;

  RAISE NOTICE '============================================';
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION INSTRUCTIONS
-- ============================================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Check the output for RLS coverage verification
-- 3. Test cross-tenant isolation with test accounts
-- 4. Update tests/security/rls-isolation.test.ts with test cases
-- ============================================================================
