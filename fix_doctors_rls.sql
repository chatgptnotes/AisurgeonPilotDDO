-- Check existing RLS policies on doctors table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'doctors';

-- Enable RLS on doctors table if not already enabled
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if any
DROP POLICY IF EXISTS "Doctors can view their own profile" ON doctors;
DROP POLICY IF EXISTS "Allow authenticated users to read doctors" ON doctors;
DROP POLICY IF EXISTS "Public read access to doctors" ON doctors;

-- Create a policy to allow authenticated users to read all doctors
-- (needed for doctor directory and login)
CREATE POLICY "Allow authenticated users to read doctors"
ON doctors
FOR SELECT
TO authenticated
USING (true);

-- Create a policy to allow public read access to doctors
-- (needed for public doctor directory)
CREATE POLICY "Public read access to doctors"
ON doctors
FOR SELECT
TO anon
USING (true);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'doctors';
