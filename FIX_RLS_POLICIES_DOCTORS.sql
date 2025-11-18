-- ============================================================================
-- FIX: Doctor Calendar 406 Errors - RLS Policies
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to fix permission issues
-- ============================================================================

-- 1. CHECK CURRENT STATE
-- ============================================================================

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('doctors', 'appointments')
    AND schemaname = 'public';

-- Check current policies on doctors table
SELECT
    tablename,
    policyname,
    cmd,
    qual::text AS using_expression
FROM pg_policies
WHERE tablename = 'doctors'
ORDER BY policyname;

-- 2. FIX DOCTORS TABLE POLICIES
-- ============================================================================

-- Drop any conflicting SELECT policies
DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can read their own data" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can select their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view own profile" ON public.doctors;
DROP POLICY IF EXISTS "Enable read access for doctors" ON public.doctors;

-- Create correct SELECT policy
CREATE POLICY "Doctors can view their own profile"
    ON public.doctors
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- Verify the policy was created
SELECT
    policyname,
    cmd,
    qual::text AS using_expression
FROM pg_policies
WHERE tablename = 'doctors' AND cmd = 'SELECT';

-- 3. FIX APPOINTMENTS TABLE POLICIES
-- ============================================================================

-- Check current policies on appointments table
SELECT
    tablename,
    policyname,
    cmd,
    qual::text AS using_expression
FROM pg_policies
WHERE tablename = 'appointments' AND cmd = 'SELECT'
ORDER BY policyname;

-- Drop conflicting SELECT policies for doctors
DROP POLICY IF EXISTS "Doctors can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can select their appointments" ON public.appointments;

-- Create correct SELECT policy for doctors
CREATE POLICY "Doctors can view their own appointments"
    ON public.appointments
    FOR SELECT
    TO authenticated
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

-- Verify appointments policy
SELECT
    policyname,
    cmd,
    qual::text AS using_expression
FROM pg_policies
WHERE tablename = 'appointments' AND cmd = 'SELECT'
ORDER BY policyname;

-- 4. VERIFY USER EXISTS IN DOCTORS TABLE
-- ============================================================================

-- Check if the user from the error exists
SELECT
    id,
    user_id,
    full_name,
    email,
    specialties,
    created_at
FROM public.doctors
WHERE user_id = '7ac9b4c7-aeda-4ca1-9938-8dbb0d331e16';

-- Count total doctors
SELECT COUNT(*) AS total_doctors FROM public.doctors;

-- 5. TEST QUERIES
-- ============================================================================

-- Test if authenticated user can query their own profile
-- Note: This will work when run as the authenticated user in the app
-- In SQL Editor, you'll need to use Service Role to see results

-- Show all RLS policies summary
SELECT
    tablename,
    COUNT(*) FILTER (WHERE cmd = 'SELECT') AS select_policies,
    COUNT(*) FILTER (WHERE cmd = 'INSERT') AS insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE') AS update_policies,
    COUNT(*) FILTER (WHERE cmd = 'DELETE') AS delete_policies,
    COUNT(*) AS total_policies
FROM pg_policies
WHERE tablename IN ('doctors', 'appointments')
GROUP BY tablename;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ RLS policies updated successfully!' AS status,
       'Now test the doctor calendar at http://localhost:8081/doctor/calendar' AS next_step;
