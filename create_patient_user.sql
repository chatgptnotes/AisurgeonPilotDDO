-- ============================================
-- CREATE PATIENT USER IN SUPABASE AUTH
-- ============================================
-- This creates a test patient user that you can use to login

-- Patient Test User Credentials:
-- Email: patient@test.com
-- Password: patient123
-- Phone: +919876543210

-- Note: This SQL creates the user in auth.users via a stored procedure
-- Run this in Supabase SQL Editor

-- Step 1: Create the patient user in auth.users
-- You'll need to do this via Supabase Dashboard > Authentication > Users > Invite User
-- OR use the Supabase Management API

-- For now, let's create the patient record that will be linked after login
INSERT INTO public.patients (
  name,
  email,
  phone_number,
  date_of_birth,
  gender,
  address,
  is_verified,
  created_at
) VALUES (
  'Test Patient',
  'patient@test.com',
  '+919876543210',
  '1990-01-01',
  'M',
  'Test Address, Mumbai, India',
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  phone_number = EXCLUDED.phone_number,
  is_verified = true;

-- Verify the patient was created
SELECT id, name, email, phone_number, is_verified
FROM public.patients
WHERE email = 'patient@test.com';
