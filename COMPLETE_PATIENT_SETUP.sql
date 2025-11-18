-- ============================================
-- COMPLETE PATIENT SETUP
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- This will create the patient profile and show you what to do next
-- ============================================

-- Step 1: Check existing patients
SELECT
  '=== EXISTING PATIENTS ===' as info,
  id,
  name,
  email,
  phone_number,
  created_at
FROM public.patients
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Create patient profile
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
  name = EXCLUDED.name,
  phone_number = EXCLUDED.phone_number,
  is_verified = true;

-- Step 3: Verify patient was created
SELECT
  '=== PATIENT PROFILE CREATED ===' as status,
  id,
  name,
  email,
  phone_number,
  is_verified,
  created_at
FROM public.patients
WHERE email = 'patient@test.com';

-- Step 4: Check if auth user exists (this will show nothing, that's expected)
-- You need to create the auth user manually in Supabase Dashboard

-- ============================================
-- INSTRUCTIONS AFTER RUNNING THIS SCRIPT:
-- ============================================
--
-- 1. The patient PROFILE in database is now created ✓
--
-- 2. Now you need to create the AUTH USER:
--
--    a. Go to: Authentication → Users (left sidebar)
--
--    b. Click "Add user" button
--
--    c. Fill in:
--       Email: patient@test.com
--       Password: patient123
--       ✓ Auto Confirm User
--
--    d. Click "Create user"
--
-- 3. After creating auth user, you can login at:
--    http://localhost:8080/login
--
--    Use "Patient Login" tab:
--    Email: patient@test.com
--    Password: patient123
--
-- ============================================

-- Additional: Check staff users to make sure staff login works
SELECT
  '=== EXISTING STAFF USERS ===' as info,
  id,
  email,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
