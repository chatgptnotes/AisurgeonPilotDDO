-- ============================================================================
-- CLEANUP DUPLICATE RLS POLICIES ON PATIENTS TABLE
-- ============================================================================
-- Current state: Multiple overlapping policies causing confusion
-- Goal: Keep only the necessary policies for signup to work
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop ALL existing policies
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated insert for own record" ON patients;
DROP POLICY IF EXISTS "Allow authenticated users to insert patients" ON patients;
DROP POLICY IF EXISTS "Allow authenticated users to update patients" ON patients;
DROP POLICY IF EXISTS "Allow authenticated users to view patients" ON patients;
DROP POLICY IF EXISTS "Allow patients to update own profile" ON patients;
DROP POLICY IF EXISTS "Allow patients to view own profile" ON patients;
DROP POLICY IF EXISTS "Allow staff to view all patients" ON patients;
DROP POLICY IF EXISTS "Doctors see their patients" ON patients;
DROP POLICY IF EXISTS "Patients see own data" ON patients;
DROP POLICY IF EXISTS "Patients update own data" ON patients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON patients;

-- ============================================================================
-- STEP 2: Create clean, non-overlapping policies
-- ============================================================================

-- Policy 1: Allow INSERT for own record (CRITICAL for signup)
CREATE POLICY "patients_insert_own"
ON patients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 2: Allow SELECT for own record
CREATE POLICY "patients_select_own"
ON patients FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Allow UPDATE for own record
CREATE POLICY "patients_update_own"
ON patients FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow doctors to SELECT all patients
CREATE POLICY "patients_select_by_doctors"
ON patients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctors WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- STEP 3: Verify final policies
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
-- Expected Output (4 policies):
-- ============================================================================
-- patients_insert_own          | INSERT | {authenticated} | No USING        | Has WITH CHECK
-- patients_select_by_doctors   | SELECT | {authenticated} | Has USING       | No WITH CHECK
-- patients_select_own          | SELECT | {authenticated} | Has USING       | No WITH CHECK
-- patients_update_own          | UPDATE | {authenticated} | Has USING       | Has WITH CHECK
-- ============================================================================

-- ============================================================================
-- EXPLANATION
-- ============================================================================
-- Policy 1 (patients_insert_own):
--   - Allows authenticated users to INSERT their own patient record
--   - Condition: auth.uid() must equal the id field being inserted
--   - This is what allows signup to work!
--
-- Policy 2 (patients_select_own):
--   - Allows patients to SELECT their own data
--   - Condition: auth.uid() must equal the id field
--
-- Policy 3 (patients_update_own):
--   - Allows patients to UPDATE their own data
--   - Condition: auth.uid() must equal the id field (both before and after)
--
-- Policy 4 (patients_select_by_doctors):
--   - Allows doctors to SELECT all patient records
--   - Condition: user_id exists in doctors table
--   - Needed for doctors to view patient lists and details
-- ============================================================================
