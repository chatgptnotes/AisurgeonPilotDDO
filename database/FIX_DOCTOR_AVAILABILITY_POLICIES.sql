-- ============================================================================
-- FIX: Create RLS Policies for doctor_availability
-- ============================================================================
-- Purpose: Standalone script to create missing RLS policies
-- Run this in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "Allow authenticated read access" ON doctor_availability;
DROP POLICY IF EXISTS "Public read availability" ON doctor_availability;
DROP POLICY IF EXISTS "Doctors manage own availability" ON doctor_availability;
DROP POLICY IF EXISTS "Enable read access for all users" ON doctor_availability;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON doctor_availability;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON doctor_availability;

-- ============================================================================
-- POLICY 1: Public Read Access (for booking system)
-- ============================================================================

CREATE POLICY "Public read availability"
ON doctor_availability FOR SELECT
TO public
USING (is_active = true);

COMMENT ON POLICY "Public read availability" ON doctor_availability IS
'Allows everyone (authenticated and anonymous) to view active doctor schedules for booking';

-- ============================================================================
-- POLICY 2: Doctors Manage Own Availability
-- ============================================================================

CREATE POLICY "Doctors manage own availability"
ON doctor_availability FOR ALL
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

COMMENT ON POLICY "Doctors manage own availability" ON doctor_availability IS
'Allows doctors to fully manage (SELECT, INSERT, UPDATE, DELETE) their own availability schedules';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show created policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'doctor_availability'
ORDER BY policyname;

-- Verify RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename = 'doctor_availability';

-- Test query (should work for authenticated users)
SELECT COUNT(*) as total_active_schedules
FROM doctor_availability
WHERE is_active = true;

COMMIT;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
-- 1. Two policies created:
--    - "Public read availability" (SELECT for public)
--    - "Doctors manage own availability" (ALL for authenticated)
--
-- 2. RLS enabled: true
--
-- 3. Test query should return count of active schedules
-- ============================================================================
