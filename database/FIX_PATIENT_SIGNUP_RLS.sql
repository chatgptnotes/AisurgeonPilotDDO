-- ============================================================================
-- FIX PATIENT SIGNUP - RLS POLICIES
-- ============================================================================
-- This script fixes the patients table RLS policies to allow signups
-- Issue: 401 error when trying to create patient profile during signup
-- Root Cause: RLS blocking INSERT for new users who aren't authenticated yet

-- ============================================================================
-- STEP 1: Check existing policies
-- ============================================================================
SELECT
  tablename,
  policyname,
  cmd,
  roles::text,
  CASE WHEN qual IS NOT NULL THEN 'Has USING' ELSE 'No USING' END as using_clause,
  CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK' ELSE 'No WITH CHECK' END as with_check_clause
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Drop existing restrictive policies (if any)
-- ============================================================================

-- Drop old policies that might be too restrictive
DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON patients;

-- ============================================================================
-- STEP 3: Create new policies that allow signup
-- ============================================================================

-- Policy 1: Allow authenticated users to INSERT their own patient record
-- This runs AFTER auth.signUp() succeeds, so user IS authenticated
CREATE POLICY "Allow authenticated insert for own record"
ON patients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id  -- User can only insert their own record (id = auth user id)
);

-- Policy 2: Allow patients to view their own profile
CREATE POLICY "Allow patients to view own profile"
ON patients
FOR SELECT
TO authenticated
USING (
  auth.uid() = id  -- Can only see their own record
);

-- Policy 3: Allow patients to update their own profile
CREATE POLICY "Allow patients to update own profile"
ON patients
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Policy 4: Allow staff/doctors to view all patients (for booking, consultations)
CREATE POLICY "Allow staff to view all patients"
ON patients
FOR SELECT
TO authenticated
USING (
  -- Allow if user is a doctor or staff member
  EXISTS (
    SELECT 1 FROM doctors
    WHERE user_id = auth.uid()
  )
  OR
  -- Or if user is viewing their own record
  auth.uid() = id
);

-- ============================================================================
-- STEP 4: Verify policies were created
-- ============================================================================
SELECT
  policyname,
  cmd,
  roles::text,
  CASE WHEN qual IS NOT NULL THEN 'Has USING' ELSE 'No USING' END as using_clause,
  CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK' ELSE 'No WITH CHECK' END as with_check_clause
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- ============================================================================
-- STEP 5: Ensure RLS is enabled
-- ============================================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'patients';

-- ============================================================================
-- TESTING GUIDE
-- ============================================================================
-- After running this script, test the signup flow:
--
-- 1. Go to: http://localhost:8081/signup-enhanced
-- 2. Fill out the patient signup form
-- 3. Submit
-- 4. Expected: ✅ Account created successfully
--
-- If you still get a 401 error, check:
-- - Run: SELECT auth.uid(); (should return your user ID after signup)
-- - Run: SELECT * FROM patients WHERE id = auth.uid();
-- - Check Supabase logs for policy violations
-- ============================================================================

-- ============================================================================
-- EXPLANATION
-- ============================================================================
-- Why this fixes the issue:
--
-- BEFORE:
-- - No policy allowed INSERT for new users
-- - Even though auth.signUp() succeeds, user couldn't create patient record
-- - Result: 401 Unauthorized
--
-- AFTER:
-- - "Allow authenticated insert for own record" policy permits INSERT
-- - Condition: auth.uid() = id (user can only insert their own record)
-- - After auth.signUp(), user IS authenticated with a session
-- - INSERT succeeds ✅
--
-- Security:
-- - Users can only insert/view/update their OWN records
-- - Doctors/staff can view all patients (for consultations)
-- - Multi-tenant isolation maintained (if needed, add tenant_id checks)
-- ============================================================================

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- If you need to rollback these changes:
--
-- DROP POLICY IF EXISTS "Allow authenticated insert for own record" ON patients;
-- DROP POLICY IF EXISTS "Allow patients to view own profile" ON patients;
-- DROP POLICY IF EXISTS "Allow patients to update own profile" ON patients;
-- DROP POLICY IF EXISTS "Allow staff to view all patients" ON patients;
--
-- Then re-create your original policies
-- ============================================================================
