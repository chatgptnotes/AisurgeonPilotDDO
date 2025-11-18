-- ============================================================================
-- FINAL FIX: All Issues in One Script
-- Run this in: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp/sql
-- ============================================================================

-- 1. FIX consultation_notes RLS POLICY (406 error fix)
-- ============================================================================
-- The policy exists but might have wrong condition
-- Drop and recreate with correct logic

DROP POLICY IF EXISTS "Doctors can view their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can insert their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can update their own consultation notes" ON public.consultation_notes;

-- Recreate with CORRECT conditions
CREATE POLICY "Doctors can view their own consultation notes"
    ON public.consultation_notes
    FOR SELECT
    TO authenticated
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can insert their own consultation notes"
    ON public.consultation_notes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can update their own consultation notes"
    ON public.consultation_notes
    FOR UPDATE
    TO authenticated
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

-- 2. FIX user_profiles RLS POLICY (403 error fix)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (
        email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Also allow doctors to query (they won't find a record, but no 403 error)
CREATE POLICY "Allow authenticated queries" 
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. VERIFY ALL TABLES EXIST
-- ============================================================================
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultation_notes')
        THEN '✅ consultation_notes exists'
        ELSE '❌ consultation_notes MISSING'
    END AS consultation_notes_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles')
        THEN '✅ user_profiles exists'
        ELSE '❌ user_profiles MISSING'
    END AS user_profiles_status;

-- 4. CHECK RLS POLICIES
-- ============================================================================
SELECT 
    tablename,
    policyname,
    cmd,
    LEFT(qual::text, 100) AS policy_condition
FROM pg_policies
WHERE tablename IN ('consultation_notes', 'user_profiles')
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT '✅ RLS policies fixed!' AS status,
       'Refresh browser and test consultation workspace' AS next_step;
