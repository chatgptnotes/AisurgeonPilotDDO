# Fix Booking Errors - Complete Guide

## Errors You're Seeing

### 1. ⚠️ WhatsApp Notification Skipped
```
⚠ No patient phone number - WhatsApp notification skipped
```

### 2. ❌ Doctor Availability 406 Error
```
Failed to load resource: the server responded with a status of 406 ()
doctor_availability?doctor_id=eq.00000000-0000-0000-0001-000000000002
```

### 3. ⚠️ React Component Warning
```
Warning: The tag <videocam> is unrecognized in this browser
```

---

## Quick Fixes

### Fix 1: Add Patient Phone Number ✅

**Problem:** WhatsApp can't send notification without phone number

**Solution:** Add phone when logging in as patient

```javascript
// CORRECT - With phone number
localStorage.setItem('patient_id', 'YOUR_PATIENT_ID');
localStorage.setItem('patient_name', 'Test Patient');
localStorage.setItem('patient_email', 'test@example.com');
localStorage.setItem('patient_phone', '+919876543210'); // ← Add this!
window.location.href = '/doctors';
```

**Your Phone Number Format:**
- Must start with + and country code (+91 for India)
- No spaces: +919876543210 ✅
- Not: +91 9876543210 ❌
- Not: 9876543210 ❌

---

### Fix 2: Add Doctor Availability ✅

**Problem:** Doctors don't have availability schedule set

**Solution:** Run this SQL to add availability for all doctors

**File:** `database/ADD_DOCTOR_AVAILABILITY.sql`

Or run this directly in Supabase SQL Editor:

```sql
DO $$
DECLARE
  v_doctor RECORD;
  v_day INT;
BEGIN
  FOR v_doctor IN
    SELECT id, full_name FROM doctors
    WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  LOOP
    FOR v_day IN 1..5 LOOP
      INSERT INTO doctor_availability (
        doctor_id, day_of_week, start_time, end_time, is_active, max_appointments_per_slot
      ) VALUES (
        v_doctor.id, v_day, '09:00:00', '17:00:00', true, 4
      )
      ON CONFLICT (doctor_id, day_of_week) DO UPDATE SET
        start_time = '09:00:00', end_time = '17:00:00', is_active = true;
    END LOOP;
  END LOOP;
END $$;
```

This creates availability:
- **Days:** Monday - Friday (day_of_week 1-5)
- **Hours:** 9 AM - 5 PM
- **Slots:** 4 appointments per slot
- **For:** All doctors in the system

---

### Fix 3: Clear Browser Cache ✅

**Problem:** Old React code cached causing warnings

**Solution:**

**Option A: Hard Refresh**
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

**Option B: Clear Cache**
1. Open DevTools (F12)
2. Right-click on refresh button
3. Select "Empty Cache and Hard Reload"

**Option C: Restart Dev Server**
```bash
# Kill the current server (Ctrl+C)
# Then restart
npm run dev
```

---

## Complete Setup Steps

### Step 1: Check Doctors Exist
```sql
SELECT id, full_name, email FROM doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY full_name;
```

**Expected:** See all 10 doctors listed

### Step 2: Add Doctor Availability
Run: `database/ADD_DOCTOR_AVAILABILITY.sql` in Supabase SQL Editor

**Verify:**
```sql
SELECT COUNT(*) FROM doctor_availability;
```
**Expected:** 50 rows (10 doctors × 5 days)

### Step 3: Set Patient Phone Number
```javascript
localStorage.setItem('patient_phone', '+919876543210'); // Your number!
```

### Step 4: Clear Browser Cache
Hard refresh: `Cmd + Shift + R` or `Ctrl + Shift + R`

### Step 5: Test Booking
1. Go to: http://localhost:8086/doctors
2. Select any doctor
3. Choose date and time
4. Fill details
5. Click "Confirm Booking (Free)"
6. ✅ Should work without errors!

---

## Verification Checklist

After running the fixes:

### Database:
- [ ] All 10 doctors exist
- [ ] Each doctor has 5 availability records (Mon-Fri)
- [ ] Availability is_active = true

### Patient Session:
- [ ] patient_id set in localStorage
- [ ] patient_name set in localStorage
- [ ] patient_email set in localStorage
- [ ] patient_phone set in localStorage (with +91)

### Browser:
- [ ] Cache cleared
- [ ] No console errors
- [ ] Dev server running

### Booking Flow:
- [ ] Can select doctor
- [ ] Can see available time slots
- [ ] Can book appointment
- [ ] Confirmation page loads
- [ ] WhatsApp notification sent (check console)

---

## Detailed Error Explanations

### Error: "406 Not Acceptable" on doctor_availability

**What it means:**
- Doctor doesn't have availability schedule
- System can't generate time slots
- Booking page can't show available times

**Why it happens:**
- Doctor records created without availability
- `doctor_availability` table is empty for this doctor

**Fix:**
Run `ADD_DOCTOR_AVAILABILITY.sql` to create schedules for all doctors

---

### Error: "WhatsApp notification skipped"

**What it means:**
- `patient_phone` not found in localStorage
- WhatsApp service can't send message
- Booking still succeeds (non-blocking)

**Why it happens:**
- You logged in without setting phone number
- Phone number format is incorrect
- Phone number not stored

**Fix:**
Add phone to localStorage before booking:
```javascript
localStorage.setItem('patient_phone', '+919876543210');
```

---

### Warning: "Tag videocam is unrecognized"

**What it means:**
- Old cached React code
- Component name issue
- Browser needs refresh

**Why it happens:**
- Browser cache has old version
- Hot module reload didn't update properly

**Fix:**
- Hard refresh browser (Cmd+Shift+R)
- Restart dev server
- Clear browser cache

---

## SQL Queries for Debugging

### Check Doctor Availability
```sql
SELECT
  d.full_name,
  COUNT(da.id) as availability_days
FROM doctors d
LEFT JOIN doctor_availability da ON d.id = da.doctor_id
WHERE d.tenant_id = '00000000-0000-0000-0000-000000000001'
GROUP BY d.id, d.full_name
ORDER BY d.full_name;
```

**Expected:** Each doctor should have 5 days (Mon-Fri)

### Check Specific Doctor
```sql
SELECT
  d.full_name,
  da.day_of_week,
  da.start_time,
  da.end_time,
  da.is_active
FROM doctors d
JOIN doctor_availability da ON d.id = da.doctor_id
WHERE d.email = 'priya.sharma@aisurgeonpilot.com'
ORDER BY da.day_of_week;
```

### Check All Availability
```sql
SELECT
  d.full_name,
  da.day_of_week,
  da.start_time,
  da.end_time
FROM doctor_availability da
JOIN doctors d ON d.id = da.doctor_id
WHERE d.tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY d.full_name, da.day_of_week;
```

---

## Testing After Fixes

### 1. Test Patient Login
```javascript
localStorage.setItem('patient_id', 'test-patient-id');
localStorage.setItem('patient_name', 'Test Patient');
localStorage.setItem('patient_email', 'test@example.com');
localStorage.setItem('patient_phone', '+919876543210'); // YOUR number
window.location.href = '/doctors';
```

### 2. Verify in Console
Press F12, go to Console tab, type:
```javascript
console.log('Patient Phone:', localStorage.getItem('patient_phone'));
```
**Expected:** Should show your phone number with +91

### 3. Book Appointment
- Select any doctor
- Choose tomorrow's date
- Select any time slot
- Fill reason for visit
- Click "Confirm Booking (Free)"

### 4. Check Console Logs
After booking, you should see:
```
✓ WhatsApp confirmation sent to: +919876543210
Appointment booked successfully!
```

### 5. Check WhatsApp
You should receive a message on WhatsApp with appointment details!

---

## Common Issues

### "No time slots available"
**Fix:** Run `ADD_DOCTOR_AVAILABILITY.sql`

### "WhatsApp not received"
**Check:**
1. Phone format: +919876543210 ✅
2. Console shows: "WhatsApp confirmation sent"
3. DoubleTick template `appointment_confirmation_ddo` exists
4. API key in .env is correct

### "Confirmation page crashes"
**Already Fixed!** See `APPOINTMENT_CONFIRMATION_FIX.md`

### "Doctor directory empty"
**Fix:** Run `ADD_MISSING_DOCTORS.sql`

---

## Summary of Files

| File | Purpose |
|------|---------|
| `ADD_DOCTOR_AVAILABILITY.sql` | Adds availability for all doctors |
| `CHECK_EXISTING_DOCTORS.sql` | See which doctors exist |
| `ADD_MISSING_DOCTORS.sql` | Create missing doctors |
| `ALL_DOCTOR_CREDENTIALS.md` | Login scripts |
| `WHATSAPP_BOOKING_NOTIFICATION.md` | WhatsApp setup |
| `FIX_BOOKING_ERRORS.md` | This file |

---

## Quick Fix Commands

**1. Add Availability:**
```sql
-- Run in Supabase SQL Editor
-- Copy from: database/ADD_DOCTOR_AVAILABILITY.sql
```

**2. Set Patient Phone:**
```javascript
// Run in Browser Console
localStorage.setItem('patient_phone', '+919876543210');
```

**3. Clear Cache:**
```
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows)
```

**4. Test:**
```
http://localhost:8086/doctors
```

---

**Status:** All fixes provided ✅

**Next:** Run the fixes and test booking!

**Questions?** Check the detailed error explanations above.
