-- ============================================================================
-- CORRECT PATIENT SIGNUP FIX - ANALYZED FROM DATABASE
-- ============================================================================
-- This fixes the RLS policy issue preventing patient signup
-- Error: "new row violates row-level security policy for table \"patients\""
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix RLS Policies on Patients Table
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON patients;
DROP POLICY IF EXISTS "Patients see own data" ON patients;
DROP POLICY IF EXISTS "Patients update own data" ON patients;

-- Create correct policy: Allow authenticated users to INSERT their own record
CREATE POLICY "Allow authenticated insert for own record"
ON patients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow patients to view their own profile
CREATE POLICY "Allow patients to view own profile"
ON patients FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow patients to update their own profile
CREATE POLICY "Allow patients to update own profile"
ON patients FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow staff/doctors to view all patients (for consultations)
CREATE POLICY "Allow staff to view all patients"
ON patients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctors WHERE user_id = auth.uid()
  )
  OR auth.uid() = id
);

-- ============================================================================
-- STEP 2: Ensure Default Tenant Exists (with correct slug field)
-- ============================================================================

-- Insert default tenant with all required fields including slug
INSERT INTO tenants (
  id,
  name,
  slug,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'AI Surgeon Pilot',
  'ai-surgeon-pilot',  -- Required slug field
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  updated_at = NOW();

-- ============================================================================
-- STEP 3: Verify RLS Policies Were Created
-- ============================================================================

SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- ============================================================================
-- STEP 4: Verify Tenant Was Created
-- ============================================================================

SELECT id, name, slug FROM tenants
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- Policies (should show 4 policies):
--   Allow authenticated insert for own record  | INSERT | {authenticated}
--   Allow patients to view own profile         | SELECT | {authenticated}
--   Allow patients to update own profile       | UPDATE | {authenticated}
--   Allow staff to view all patients           | SELECT | {authenticated}
--
-- Tenant (should show 1 row):
--   00000000-0000-0000-0000-000000000001 | AI Surgeon Pilot | ai-surgeon-pilot
-- ============================================================================

-- ============================================================================
-- TESTING
-- ============================================================================
-- After running this SQL:
-- 1. Go to: http://localhost:8081/signup-enhanced
-- 2. Fill out signup form
-- 3. Submit
-- 4. Expected: ✅ Account created successfully!
-- 5. No more 401 or 42501 errors
-- ============================================================================
