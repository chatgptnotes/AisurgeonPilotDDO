# Patient Login System - Setup Guide

## Overview
The patient login system has been completely integrated with the main application. Patients can now:
1. Login using email/password
2. View their dashboard
3. Register for first-time visit
4. Book regular appointments

## Setup Instructions

### Step 1: Create Patient User in Supabase

**Via Supabase Dashboard (RECOMMENDED):**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp
2. Navigate to **Authentication → Users**
3. Click **"Invite User"** or **"Add User"**
4. Enter the following details:
   - Email: `patient@test.com`
   - Password: `patient123`
   - Email Confirm: Check "Auto Confirm User" or send confirmation email
5. Click **"Create User"**

### Step 2: Create Patient Profile in Database

After creating the auth user, run this SQL in **SQL Editor**:

```sql
-- Create patient profile linked to auth user
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

-- Verify patient was created
SELECT id, name, email, phone_number, is_verified
FROM public.patients
WHERE email = 'patient@test.com';
```

### Step 3: Test the Patient Flow

1. **Start Dev Server** (if not running):
   ```bash
   npm run dev
   ```

2. **Access Patient Login**:
   ```
   http://localhost:8080/patient-login
   ```

3. **Login with Test Credentials**:
   - Email: `patient@test.com`
   - Password: `patient123`

4. **After Login, you should see**:
   - Patient Dashboard at `/patient-dashboard`
   - Patient profile information
   - Two registration options:
     - First Time Visit
     - Regular Appointment

5. **Test Registration Flow**:
   - Click "Register for First Visit" or "Book Appointment"
   - Complete the registration form
   - Submit and verify data is saved

## Patient Portal Routes

### Public Routes (No Authentication Required):
- `/patient-login` - Patient login page

### Protected Routes (Authentication Required):
- `/patient-dashboard` - Main patient dashboard
- `/patient-register` - Patient registration/appointment booking

## Patient Flow Diagram

```
1. Patient visits website
   ↓
2. Navigates to /patient-login
   ↓
3. Enters email & password
   ↓
4. System validates credentials (Supabase Auth)
   ↓
5. Loads patient profile from patients table
   ↓
6. Redirects to /patient-dashboard
   ↓
7. Patient can:
   - View profile information
   - Register for first-time visit
   - Book regular appointment
   - View medical records
   - View prescriptions
   - View billing
   - View past visits
```

## Key Features Implemented

### 1. Patient Authentication
- ✅ Email/Password login using Supabase Auth
- ✅ Session management
- ✅ Logout functionality
- ✅ Protected routes

### 2. Patient Dashboard
- ✅ Profile information display
- ✅ Two registration paths:
  - First Time Visit (comprehensive)
  - Regular Appointment (quick)
- ✅ Quick actions for common tasks
- ✅ Recent visits display
- ✅ Responsive design

### 3. Patient Registration
- ✅ 4-step wizard for first-time patients
- ✅ Quick appointment booking for regular patients
- ✅ Integration with existing patient management system
- ✅ Auto-saves to patients and visits tables

## Database Integration

### Tables Used:
1. **auth.users** - Supabase authentication
2. **public.patients** - Patient profiles and information
3. **public.visits** - Patient appointments and visits

### Authentication Flow:
1. User logs in → Supabase Auth validates
2. System fetches patient profile using email
3. Stores patient_id in localStorage
4. All subsequent requests use patient_id

## Files Created/Modified

### New Files:
- `src/pages/PatientLogin.tsx` - Patient login page
- `src/pages/PatientDashboardNew.tsx` - Patient dashboard
- `src/contexts/PatientAuthContext.tsx` - Patient auth context (optional)
- `create_patient_user.sql` - SQL script for setup
- `PATIENT_SETUP_GUIDE.md` - This file

### Modified Files:
- `src/components/AppRoutes.tsx` - Added patient routes
- `src/App.tsx` - Updated authRoutes array

## Testing Checklist

- [ ] Create patient user in Supabase Dashboard
- [ ] Create patient profile in database
- [ ] Navigate to `/patient-login`
- [ ] Login with test credentials
- [ ] Verify redirect to `/patient-dashboard`
- [ ] Check profile information displays correctly
- [ ] Click "Register for First Visit"
- [ ] Complete registration form
- [ ] Verify data saved in database
- [ ] Click "Book Appointment"
- [ ] Complete appointment form
- [ ] Verify visit created in database
- [ ] Test logout functionality
- [ ] Verify can't access dashboard when logged out

## Troubleshooting

### Issue: "Patient profile not found"
**Solution:** Make sure you created both:
1. Auth user in Supabase Dashboard
2. Patient profile in database with matching email

### Issue: "Please login to continue"
**Solution:** Check that:
1. You're logging in with correct credentials
2. Browser localStorage is enabled
3. Supabase connection is working

### Issue: Registration not saving
**Solution:**
1. Check browser console for errors
2. Verify RLS policies allow inserts
3. Check required fields are filled

### Issue: Can't access /patient-dashboard
**Solution:**
1. Verify you're logged in
2. Check localStorage has 'patient_id' and 'patient_auth'
3. Try clearing cache and logging in again

## Next Steps

### Immediate:
1. Create patient user and test the flow
2. Verify all features work as expected
3. Test on different browsers

### Short-term:
1. Add more patient test users
2. Integrate appointment scheduling with calendar
3. Add email/WhatsApp notifications
4. Implement payment integration for appointments

### Long-term:
1. Add patient medical records view
2. Implement prescription downloads
3. Add video consultation feature
4. Build patient messaging system
5. Add appointment reminders

## Security Notes

✅ **Implemented:**
- Supabase Auth for secure authentication
- Session-based authentication
- Protected routes
- Input validation

⚠️ **To Implement:**
- Rate limiting on login attempts
- Two-factor authentication
- Password reset functionality
- Email verification enforcement

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check SQL logs in Supabase
4. Review this guide

---

**Status:** ✅ Ready for Testing
**Last Updated:** 2025-01-14
**Version:** 2.0.0
