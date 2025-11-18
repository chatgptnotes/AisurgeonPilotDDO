# Fix Doctor Calendar 406 Errors

## Problem Analysis

The doctor calendar is showing 406 (Not Acceptable) errors when trying to fetch data:

```
qfneoowktsirwpzehgxp.supabase.co/rest/v1/doctors?select=*&user_id=eq.7ac9b4c7-aeda-4ca1-9938-8dbb0d331e16  →  406
qfneoowktsirwpzehgxp.supabase.co/rest/v1/doctors?select=id&user_id=eq.7ac9b4c7-aeda-4ca1-9938-8dbb0d331e16  →  406
```

## Root Cause

**406 errors in Supabase** typically mean:
1. RLS (Row Level Security) policies are blocking access
2. The authenticated user doesn't have permission to read the data
3. The policies are checking for wrong columns or conditions

## Solution

### Step 1: Check Current RLS Policies

Run this SQL in Supabase to check existing policies on the `doctors` table:

```sql
-- Check RLS policies on doctors table
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'doctors'
ORDER BY policyname;
```

### Step 2: Fix RLS Policies

The doctors table needs policies that allow doctors to read their own profile using `auth.uid()`.

Run this SQL:

```sql
-- Drop existing conflicting policies (if any)
DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can read their own data" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can select their own profile" ON public.doctors;

-- Create proper SELECT policy for doctors
CREATE POLICY "Doctors can view their own profile"
    ON public.doctors
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- Verify the policy was created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'doctors' AND cmd = 'SELECT';
```

### Step 3: Check Appointments Policies

```sql
-- Check appointments RLS policies
SELECT
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'appointments' AND cmd = 'SELECT'
ORDER BY policyname;
```

### Step 4: Fix Appointments Policies (if needed)

```sql
-- Ensure doctors can view their own appointments
DROP POLICY IF EXISTS "Doctors can view their own appointments" ON public.appointments;

CREATE POLICY "Doctors can view their own appointments"
    ON public.appointments
    FOR SELECT
    TO authenticated
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );
```

### Step 5: Verify User Authentication

Check if the user is properly authenticated:

```sql
-- This will show NULL if not authenticated
SELECT auth.uid() AS current_user_id;

-- Check if this user exists in doctors table
SELECT id, user_id, full_name, email
FROM public.doctors
WHERE user_id = '7ac9b4c7-aeda-4ca1-9938-8dbb0d331e16';
```

## Code Changes Made

### 1. Updated DoctorCalendar.tsx

Changed from `.single()` to `.maybeSingle()` to avoid errors when no data is found:

```typescript
// Before:
const { data: doctor, error } = await supabase
  .from('doctors')
  .select('*')
  .eq('user_id', user.id)
  .single();  // ❌ Throws error if no data

// After:
const { data: doctor, error } = await supabase
  .from('doctors')
  .select('id, user_id, full_name, email, profile_photo_url')
  .eq('user_id', user.id)
  .maybeSingle();  // ✅ Returns null if no data

if (!doctor) {
  toast.error('Doctor profile not found');
  navigate('/login');
  return;
}
```

### 2. Added Better Error Logging

Added console.error logging to see exact error messages:

```typescript
if (error) {
  console.error('Error fetching doctor profile:', error);
  throw error;
}
```

## Testing Steps

1. **Run the SQL scripts** in Supabase SQL Editor
2. **Login as a doctor** at http://localhost:8081/login
3. **Navigate to calendar** at http://localhost:8081/doctor/calendar
4. **Check browser console** for errors
5. **Verify appointments appear** in the calendar grid

## Expected Results

After fixing RLS policies:

✅ No 406 errors
✅ Doctor profile loads successfully
✅ Appointments appear in calendar
✅ Calendar grid shows appointment data
✅ Upcoming appointments list populates

## If Still Not Working

### Check Authentication State

Open browser DevTools Console and run:

```javascript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('Authenticated user:', user);

// Check session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### Manually Test Query

```javascript
// Test doctor profile query
const { data, error } = await supabase
  .from('doctors')
  .select('id, full_name, email')
  .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  .maybeSingle();

console.log('Doctor data:', data);
console.log('Error:', error);
```

## Alternative: Temporary RLS Disable (NOT RECOMMENDED FOR PRODUCTION)

**Only for testing**, you can temporarily disable RLS:

```sql
-- TEMPORARY - FOR TESTING ONLY
ALTER TABLE public.doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
```

**Remember to re-enable**:

```sql
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
```

## Summary

The 406 errors are caused by RLS policies blocking authenticated doctors from viewing their own data. The fix is to create/update SELECT policies that use `user_id = auth.uid()` condition.

**Next Step**: Run the SQL scripts in Supabase SQL Editor and test the calendar again.
