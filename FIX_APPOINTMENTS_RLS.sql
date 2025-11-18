-- Fix RLS Policies for Appointments Table
-- This allows patients to create appointments and both patients/doctors to view them

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated read access" ON appointments;
DROP POLICY IF EXISTS "Allow patients to insert appointments" ON appointments;
DROP POLICY IF EXISTS "Allow patients to update their appointments" ON appointments;
DROP POLICY IF EXISTS "Allow doctors to update their appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anyone to insert appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anyone to read appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anyone to update appointments" ON appointments;

-- For testing: Allow all operations (you can restrict this later)
CREATE POLICY "Allow anyone to read appointments"
  ON appointments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anyone to insert appointments"
  ON appointments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anyone to update appointments"
  ON appointments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'appointments';
