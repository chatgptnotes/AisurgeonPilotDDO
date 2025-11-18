-- Check what INSERT policies currently exist
SELECT
  policyname,
  cmd,
  with_check::text as condition
FROM pg_policies
WHERE tablename = 'patients' AND cmd = 'INSERT'
ORDER BY policyname;
