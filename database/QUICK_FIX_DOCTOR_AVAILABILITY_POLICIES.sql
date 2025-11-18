-- ============================================================================
-- QUICK FIX: Create Missing RLS Policies for doctor_availability
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor and run it
-- ============================================================================

-- Policy 1: Allow public to view active schedules (for booking)
CREATE POLICY "Public read availability"
ON doctor_availability FOR SELECT
TO public
USING (is_active = true);

-- Policy 2: Allow doctors to manage their own availability
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

-- Verify policies were created
SELECT
  policyname,
  cmd,
  roles::text,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'doctor_availability'
ORDER BY policyname;
