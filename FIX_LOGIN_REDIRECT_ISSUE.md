# Fix Login Redirect Issue - Complete Guide

## Problem Summary
After logging in successfully, users are redirected back to the login page because:
1. Doctor profile exists in database with email
2. But `user_id` field is NULL or doesn't match Supabase Auth user ID
3. Dashboard queries by `user_id`, gets 0 rows (PGRST116 error)
4. Error handler redirects back to login

## Solution Applied

### 1. Database Migration (06_link_doctors_to_auth_users.sql)
**Location**: `database/migrations/06_link_doctors_to_auth_users.sql`

**What it does**:
- Links existing doctor records to auth users by matching email
- Handles email variations (with/without "dr." prefix)
- Creates trigger to auto-populate `user_id` on new doctor records
- Creates function to manually link doctors: `link_doctor_to_auth_user(email)`

### 2. Dashboard Fallback Logic (DoctorDashboard.tsx)
**Location**: `src/pages/doctor/DoctorDashboard.tsx` (Line 193-293)

**What it does**:
- **Strategy 1**: Try fetching doctor by `user_id` (preferred)
- **Strategy 2**: If PGRST116 error, fallback to fetching by email
- **Auto-link**: If found by email, automatically updates `user_id` field
- **User-friendly**: Shows success message when profile is linked

## How to Apply the Fix

### Step 1: Run the Database Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to: https://qfneoowktsirwpzehgxp.supabase.co
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy contents of `database/migrations/06_link_doctors_to_auth_users.sql`
5. Paste into editor
6. Click **Run** (or press Cmd+Enter)
7. Check output for success messages

**Option B: Via Supabase CLI**
```bash
# If you have supabase CLI installed
supabase db push --file database/migrations/06_link_doctors_to_auth_users.sql
```

**Expected Output**:
```
============================================
Linking Doctors to Auth Users...
============================================
  ✅ Linked: Dr. Priya Sharma (dr.priya.sharma@aisurgeonpilot.com) to auth user
  ... (more doctors)
============================================
Linking Complete!
  Total doctors: 10
  Successfully linked: X
  Not linked (no auth user): Y
============================================
```

### Step 2: Verify the Migration

Run this query in Supabase SQL Editor:
```sql
-- Check if doctors are linked
SELECT
  id,
  full_name,
  email,
  user_id,
  CASE
    WHEN user_id IS NOT NULL THEN '✅ Linked'
    ELSE '❌ Not linked'
  END as status
FROM public.doctors
ORDER BY email;
```

### Step 3: Test the Login Flow

1. **Clear browser cache and localStorage**:
   - Open DevTools (F12)
   - Application tab → Local Storage → Clear All
   - Or use: `localStorage.clear()` in console

2. **Navigate to login page**:
   ```
   http://localhost:8080/login
   ```

3. **Login with credentials**:
   - Email: `priya.sharma@aisurgeonpilot.com` (no "dr." prefix)
   - Password: `Doctor@123`
   - Role: Doctor

4. **Expected behavior**:
   - ✅ Login succeeds
   - ✅ Redirects to `/doctor/dashboard`
   - ✅ Dashboard loads successfully
   - ✅ If profile wasn't linked: Shows "Profile linked successfully!" toast
   - ✅ Doctor name and email display in header

### Step 4: Check Console Logs

Open DevTools Console (F12) and look for:
```
✅ GOOD:
- "Doctor profile loaded successfully: Dr. Priya Sharma"

⚠️ NEEDS ATTENTION:
- "Doctor not found by user_id, trying email fallback..."
  (This is OK - it means auto-linking is working)
- "Linking doctor profile to auth user..."
- "Successfully linked doctor profile to auth user"

❌ BAD:
- "Doctor profile not found by email either"
  (Means no doctor record exists with that email)
```

## Troubleshooting

### Issue 1: Still getting redirected to login

**Cause**: Doctor record doesn't exist in database

**Solution**:
```sql
-- Check if doctor exists
SELECT * FROM public.doctors WHERE email = 'priya.sharma@aisurgeonpilot.com';

-- If not found, create doctor record
INSERT INTO public.doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  qualifications,
  experience_years,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  is_active,
  is_verified,
  is_accepting_patients
) VALUES (
  (SELECT id FROM public.tenants LIMIT 1),
  'Dr. Priya Sharma',
  'priya.sharma@aisurgeonpilot.com',
  '+91-9876543210',
  ARRAY['General Medicine'],
  'MBBS, MD',
  5,
  1000.00,
  700.00,
  'INR',
  true,
  true,
  true
);
```

### Issue 2: Email mismatch

**Problem**: Auth user has email `priya.sharma@aisurgeonpilot.com` but doctor record has `dr.priya.sharma@aisurgeonpilot.com`

**Solution**: The migration handles this automatically! It checks:
1. Exact match
2. Without "dr." prefix
3. With "dr." prefix

Or manually link:
```sql
-- Find the auth user ID
SELECT id, email FROM auth.users WHERE email LIKE '%priya.sharma%';

-- Manually link doctor to auth user
SELECT link_doctor_to_auth_user('dr.priya.sharma@aisurgeonpilot.com');
```

### Issue 3: RLS (Row Level Security) blocking queries

**Cause**: Supabase RLS policies may block doctor updates

**Solution**:
```sql
-- Temporarily check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'doctors';

-- If needed, grant update permission (run as admin)
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can update own profile" ON public.doctors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Issue 4: Migration already ran but still failing

**Cause**: Need to re-link specific doctor

**Solution**:
```sql
-- Re-run linking for specific doctor
SELECT link_doctor_to_auth_user('priya.sharma@aisurgeonpilot.com');
```

## Testing Checklist

After applying the fix, verify:

- [ ] Migration ran successfully without errors
- [ ] Doctors table has `user_id` values populated
- [ ] Can login without being redirected back
- [ ] Dashboard loads and shows doctor name
- [ ] Today's appointments section visible
- [ ] Hospital management cards display
- [ ] No PGRST116 errors in console
- [ ] Auto-linking toast appears (first login only)

## What Changed

### Before Fix:
```
User logs in → Dashboard loads → Queries by user_id → 0 rows → PGRST116 → Redirect to login
```

### After Fix:
```
User logs in → Dashboard loads → Queries by user_id → 0 rows → PGRST116
→ Fallback: Query by email → Found! → Auto-link user_id → Dashboard loads successfully
```

### Next Login:
```
User logs in → Dashboard loads → Queries by user_id → Found! → Dashboard loads (no fallback needed)
```

## Additional Features Added

1. **Auto-linking function**: `link_doctor_to_auth_user(email)`
   - Can be called manually to link any doctor
   - Handles email variations automatically

2. **Trigger on insert/update**: `trigger_auto_link_doctor`
   - Automatically links new doctors when created
   - Runs before insert/update on doctors table

3. **Auth signup trigger**: `trigger_create_doctor_after_signup`
   - Automatically creates doctor profile after auth signup
   - Only if user metadata has `role: 'doctor'`

## Rollback (if needed)

To undo changes:

```sql
-- Remove triggers
DROP TRIGGER IF EXISTS trigger_auto_link_doctor ON public.doctors;
DROP TRIGGER IF EXISTS trigger_create_doctor_after_signup ON auth.users;

-- Remove functions
DROP FUNCTION IF EXISTS public.link_doctor_to_auth_user(TEXT);
DROP FUNCTION IF EXISTS public.auto_link_doctor_to_auth();
DROP FUNCTION IF EXISTS public.create_doctor_profile_after_signup();

-- Clear user_id values (optional - NOT recommended)
-- UPDATE public.doctors SET user_id = NULL;
```

## Support

If issues persist:
1. Check Supabase logs: Dashboard → Logs → Database
2. Verify auth user exists: `SELECT * FROM auth.users WHERE email = 'your@email.com';`
3. Verify doctor exists: `SELECT * FROM public.doctors WHERE email = 'your@email.com';`
4. Check RLS policies are not blocking queries
5. Contact administrator: admin@aisurgeonpilot.com

---

## Technical Details

**Files Modified**:
- ✅ `src/pages/doctor/DoctorDashboard.tsx` (Line 193-293)
- ✅ `database/migrations/06_link_doctors_to_auth_users.sql` (New file)

**Database Changes**:
- ✅ Function: `link_doctor_to_auth_user(email)`
- ✅ Function: `auto_link_doctor_to_auth()`
- ✅ Function: `create_doctor_profile_after_signup()`
- ✅ Trigger: `trigger_auto_link_doctor`
- ✅ Trigger: `trigger_create_doctor_after_signup`

**No Breaking Changes**:
- Existing functionality preserved
- Only adds fallback logic
- Safe to deploy to production

---

**Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: ✅ Ready for Testing
