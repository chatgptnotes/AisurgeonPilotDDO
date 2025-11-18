# Create Doctor Authentication Account

## For Dr. Priya Sharma

### Step 1: Create Auth User in Supabase

Go to Supabase Dashboard → Authentication → Users → Add User

**OR** run this in Supabase SQL Editor:

```sql
-- This creates a Supabase auth user for Dr. Priya Sharma
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp/sql

-- Method 1: Using Supabase Dashboard (Recommended)
-- 1. Go to: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp/auth/users
-- 2. Click "Add User" button
-- 3. Enter:
--    Email: priya.sharma@aisurgeonpilot.com
--    Password: Doctor@123
--    Auto Confirm: YES (check this box)
-- 4. Click "Create User"
-- 5. Copy the user ID from the created user
-- 6. Run the update query below to link the doctor profile

-- Method 2: Using SQL (if dashboard method doesn't work)
-- NOTE: You may need admin privileges for this
```

### Step 2: Link Auth User to Doctor Profile

After creating the auth user, run this SQL to link it to the doctor profile:

```sql
-- Get the doctor's current info
SELECT id, full_name, email, user_id
FROM doctors
WHERE email = 'priya.sharma@aisurgeonpilot.com';

-- Get the auth user ID (replace with actual UUID from auth.users)
SELECT id, email
FROM auth.users
WHERE email = 'priya.sharma@aisurgeonpilot.com';

-- Update the doctor profile with the auth user_id
-- REPLACE 'USER_UUID_HERE' with the actual UUID from auth.users
UPDATE doctors
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'priya.sharma@aisurgeonpilot.com'
)
WHERE email = 'priya.sharma@aisurgeonpilot.com';
```

### Step 3: Verify the Setup

```sql
-- Verify the link
SELECT
  d.id as doctor_id,
  d.full_name,
  d.email,
  d.user_id,
  u.email as auth_email,
  u.confirmed_at
FROM doctors d
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE d.email = 'priya.sharma@aisurgeonpilot.com';
```

## Login Credentials

Once setup is complete, use these credentials:

**Email:** priya.sharma@aisurgeonpilot.com
**Password:** Doctor@123

## How to Login

1. Go to: http://localhost:8086/login
2. Click the **"Doctor"** tab
3. Enter credentials or click "Click to auto-fill"
4. Click "Sign In as Doctor"
5. You'll be redirected to the Doctor Dashboard with the professional sidebar

## Alternative: Quick Setup (No Auth Required)

If you want to bypass Supabase auth for testing, the console method still works:

```javascript
// Open browser console at http://localhost:8086
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'priya.sharma@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

## Troubleshooting

### Error: "Doctor profile not found"
- Make sure the doctor exists in the `doctors` table
- Check that the email matches exactly (case-insensitive)

### Error: "Invalid credentials"
- Verify the auth user was created in Supabase Auth
- Check that the password is correct: `Doctor@123`
- Ensure "Auto Confirm" was checked when creating the user

### Error: "Doctor profile not found. Please contact administrator"
- The auth user exists but isn't linked to a doctor profile
- Run the UPDATE query in Step 2 to link them

## Security Note

**For Production:**
- Change all default passwords
- Implement proper password requirements
- Add 2FA for doctors
- Use proper email verification
- Store passwords securely (Supabase handles this)

**For Testing:**
- Current setup is fine for local development
- Credentials are shown in the login page for convenience
