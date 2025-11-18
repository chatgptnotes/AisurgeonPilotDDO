# 🧪 Complete Testing Pipeline - DDO Platform

**Purpose**: End-to-end verification of all features
**Time Required**: 30-45 minutes
**Status**: Ready to execute

---

## 📋 Pre-Test Checklist

Before starting, ensure:

- [ ] Dev server running: `npm run dev` (http://localhost:8086)
- [ ] All 3 database migrations completed (DDO_01, DDO_02, DDO_03)
- [ ] Environment variables configured in `.env`
- [ ] Supabase project accessible
- [ ] API keys configured (WhatsApp, OpenAI, etc.)

---

## 🔍 Testing Pipeline

### **PHASE 1: System Health Check** ⏱️ 5 minutes

#### Test 1.1: System Test Dashboard
```
URL: http://localhost:8086/system-test
```

**Actions**:
1. Open URL in browser
2. Click **"Run All Tests"** button
3. Wait for all tests to complete

**Expected Results**:
- ✅ Database Connection: PASS
- ✅ API Key Configuration: PASS
- ✅ Route Registration: PASS (100+ routes)
- ✅ Table Access Tests:
  - doctors ✅
  - patients ✅
  - appointments ✅
  - doctor_availability ✅
  - consultation_transcriptions ✅
  - soap_notes ✅

**If ANY test fails**: STOP and fix before continuing

---

#### Test 1.2: Database Verification (SQL)
```sql
-- Run in Supabase SQL Editor

-- 1. Check all critical tables exist
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'doctors', 'patients', 'appointments',
  'doctor_availability', 'consultation_types',
  'consultation_transcriptions', 'soap_notes'
)
ORDER BY tablename;

-- Expected: 7 rows, all with rls_enabled = true
```

```sql
-- 2. Check doctor availability data
SELECT COUNT(*) as total_schedules,
       COUNT(DISTINCT doctor_id) as doctors_with_schedules
FROM doctor_availability;

-- Expected: 60+ schedules, 10+ doctors
```

```sql
-- 3. Verify RLS policies on doctor_availability
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'doctor_availability'
ORDER BY policyname;

-- Expected: 2 policies
-- - "Doctors manage own availability" (ALL)
-- - "Public read availability" (SELECT)
```

**Pass Criteria**: All queries return expected results ✅

---

### **PHASE 2: Patient Journey** ⏱️ 10 minutes

#### Test 2.1: Patient Registration
```
URL: http://localhost:8086/patient-signup
```

**Actions**:
1. Fill out the form with test data:
   ```
   Email: test.patient@example.com
   Password: TestPass123!
   First Name: John
   Last Name: Doe
   Phone: +919876543210
   Date of Birth: 1990-01-15
   Age: 34
   Gender: Male
   Weight: 75 kg
   Height: 175 cm
   Blood Group: O+
   ```

2. Click **"Create Account"**

**Expected Results**:
- ✅ Form validation passes
- ✅ Patient ID generated (format: P{timestamp})
- ✅ Redirect to email verification page
- ✅ Patient ID displayed on verification page
- ✅ "Resend Email" button visible

**Verify in Database**:
```sql
SELECT id, email, first_name, last_name, patient_id, email_verified
FROM patients
WHERE email = 'test.patient@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: 1 row with all data, email_verified = false
```

**Screenshots**: Take screenshot of Patient ID for later use

---

#### Test 2.2: Email Verification Flow
```
URL: http://localhost:8086/verify-email
```

**Actions**:
1. Note: Email won't actually send without Resend API key (demo mode)
2. Check console logs for verification link
3. Verify UI shows:
   - Patient ID
   - "Check your email" message
   - "Resend Email" button works

**Expected Results**:
- ✅ Verification page loads correctly
- ✅ Patient ID matches from signup
- ✅ Resend button triggers console log
- ✅ UI states (pending/success/error) work

---

#### Test 2.3: Patient Login
```
URL: http://localhost:8086/login
```

**Actions**:
1. Enter credentials from Test 2.1
2. Click **"Sign In"**

**Expected Results**:
- ✅ Login successful (or shows "verify email" message)
- ✅ Redirect to patient dashboard
- ✅ No errors in console

---

#### Test 2.4: Patient Dashboard
```
URL: http://localhost:8086/patient-dashboard
```

**Actions**:
1. Verify dashboard loads
2. Check sections display:
   - Welcome message with patient name
   - Upcoming appointments (empty for new user)
   - Quick actions (Book Appointment, Medical Records, etc.)

**Expected Results**:
- ✅ Dashboard renders without errors
- ✅ Patient name displayed correctly
- ✅ All navigation links work
- ✅ No RLS errors (403)

---

### **PHASE 3: Doctor Directory & Availability** ⏱️ 5 minutes

#### Test 3.1: Browse Doctors
```
URL: http://localhost:8086/doctors
```

**Actions**:
1. Load doctor directory page
2. Verify doctors are listed
3. Check each doctor card shows:
   - Name
   - Specialties
   - Consultation fee
   - "Book Appointment" button

**Expected Results**:
- ✅ All active doctors displayed
- ✅ Doctor information accurate
- ✅ "Book Appointment" buttons clickable
- ✅ No 403 errors (RLS working)

**Verify in Database**:
```sql
SELECT id, full_name, specialties, consultation_fee_standard, is_active
FROM doctors
WHERE is_active = true
ORDER BY full_name
LIMIT 5;

-- Expected: List of active doctors
```

---

#### Test 3.2: Doctor Profile
```
URL: http://localhost:8086/doctor/{doctor_id}
```
*Replace {doctor_id} with actual ID from database*

**Actions**:
1. Click on a doctor from directory
2. View detailed profile
3. Check sections:
   - Doctor information
   - Specialties
   - Qualifications
   - Consultation types
   - Availability calendar (if available)

**Expected Results**:
- ✅ Profile loads correctly
- ✅ All information displayed
- ✅ "Book Appointment" button visible
- ✅ No loading errors

---

### **PHASE 4: Booking Flow** ⏱️ 10 minutes

#### Test 4.1: Initiate Booking
```
URL: http://localhost:8086/book/{doctor_id}
```

**Actions**:
1. Navigate to booking page
2. Verify page loads with:
   - Doctor information
   - Consultation type selector
   - Drilling calendar component

**Expected Results**:
- ✅ Booking page renders
- ✅ Doctor details shown
- ✅ Consultation types loaded from database
- ✅ Calendar component visible

---

#### Test 4.2: Select Consultation Type
```
Current Page: /book/{doctor_id}
```

**Actions**:
1. Select a consultation type (e.g., "In-Person Consultation")
2. Verify fee updates
3. Check availability loads

**Expected Results**:
- ✅ Consultation type selected
- ✅ Fee displayed correctly
- ✅ Calendar updates to show available slots
- ✅ No errors in console

**Verify Slots Generated**:
```sql
-- Check if doctor has availability
SELECT day_of_week, start_time, end_time, is_active
FROM doctor_availability
WHERE doctor_id = '{doctor_id}'
ORDER BY day_of_week;

-- Expected: 7 rows (one per day of week)
```

---

#### Test 4.3: Drilling Calendar - Date Selection
```
Current Page: /book/{doctor_id}
```

**Actions**:
1. View calendar showing current month
2. Select an available date (should have green/available indicator)
3. Verify time slots appear

**Expected Results**:
- ✅ Calendar shows current month
- ✅ Available dates highlighted
- ✅ Clicking date shows time slots
- ✅ Slots grouped by time of day:
  - Morning (6 AM - 12 PM)
  - Afternoon (12 PM - 5 PM)
  - Evening (5 PM - 10 PM)

---

#### Test 4.4: Drilling Calendar - Time Selection
```
Current Page: /book/{doctor_id}
```

**Actions**:
1. Select a time slot (e.g., "9:00 AM")
2. Verify slot gets locked
3. Check "Back to dates" navigation works

**Expected Results**:
- ✅ Time slot selected and highlighted
- ✅ "Continue" or "Confirm" button appears
- ✅ Back button returns to date selection
- ✅ Slot remains locked for 10 minutes

**Verify Slot Lock**:
```sql
-- Check if slot was locked
SELECT * FROM slot_locks
WHERE doctor_id = '{doctor_id}'
AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;

-- Expected: 1 row with recent lock
```

---

#### Test 4.5: Patient Details & Payment
```
Current Page: /book/{doctor_id}
```

**Actions**:
1. After selecting slot, fill patient details (if required)
2. Proceed to payment step
3. In demo mode, click "Pay Now"
4. Confirm payment simulation

**Expected Results**:
- ✅ Patient details pre-filled (if logged in)
- ✅ Payment summary shows correct amount
- ✅ Payment button works
- ✅ Demo mode shows success dialog
- ✅ Console logs payment details

**Demo Mode Check**:
```javascript
// Should see in console:
// "Payment Demo Mode: Simulating successful payment"
// "Payment Details: { orderId: '...', amount: ... }"
```

---

#### Test 4.6: Appointment Confirmation
```
URL: http://localhost:8086/appointment/confirm/{appointment_id}
```

**Actions**:
1. After payment, verify redirect to confirmation page
2. Check displayed information:
   - Appointment ID
   - Doctor name
   - Date and time
   - Consultation type
   - Payment status

**Expected Results**:
- ✅ Confirmation page loads
- ✅ All details accurate
- ✅ Appointment ID shown
- ✅ Options to:
  - Add to calendar
  - View appointment details
  - Return to dashboard

**Verify in Database**:
```sql
-- Check appointment was created
SELECT
  a.id,
  a.patient_id,
  a.doctor_id,
  a.appointment_date,
  a.start_at,
  a.end_at,
  a.status,
  a.payment_status,
  p.amount as payment_amount
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE a.patient_id = (SELECT id FROM patients WHERE email = 'test.patient@example.com')
ORDER BY a.created_at DESC
LIMIT 1;

-- Expected: 1 row with status = 'confirmed', payment_status = 'paid'
```

---

### **PHASE 5: Notifications** ⏱️ 5 minutes

#### Test 5.1: WhatsApp Notification Test
```
URL: http://localhost:8086/test-whatsapp-api
```

**Actions**:
1. Open WhatsApp test page
2. Enter your phone number (with country code, e.g., +919876543210)
3. Click "Send Test WhatsApp Message"
4. Check your phone for message

**Expected Results**:
- ✅ Form accepts phone number
- ✅ Send button works
- ✅ Success message shown
- ✅ WhatsApp message received on phone
- ✅ Message uses correct template

**Console Check**:
```javascript
// Should see API response:
// "WhatsApp API Response: { status: 'success', ... }"
```

---

#### Test 5.2: Email Notification (Console)
```
Check Browser Console after booking
```

**Actions**:
1. After creating appointment in Test 4.6
2. Check browser console for email logs

**Expected Results** (Demo Mode):
```javascript
// Console should show:
// "Email Demo Mode: Would send appointment confirmation"
// "To: test.patient@example.com"
// "Subject: Appointment Confirmed - {Doctor Name}"
// "Body: [Email content preview]"
```

**Note**: Add Resend API key to `.env` for real email sending

---

### **PHASE 6: Doctor Portal** ⏱️ 5 minutes

#### Test 6.1: Doctor Dashboard Access
```
URL: http://localhost:8086/doctor/dashboard
```

**Actions**:
1. Logout of patient account
2. Login with doctor credentials (if available)
3. Navigate to doctor dashboard

**Expected Results**:
- ✅ Doctor dashboard loads
- ✅ Today's appointments shown
- ✅ Patient list visible
- ✅ Quick stats displayed (total patients, appointments, etc.)

**If no doctor account**: Create one in Supabase:
```sql
-- Create test doctor user (run in Supabase SQL Editor)
-- First create auth user in Supabase Auth UI
-- Then link to doctors table
UPDATE doctors
SET user_id = '{auth_user_id}'
WHERE id = '{doctor_id}'
LIMIT 1;
```

---

#### Test 6.2: View Appointments
```
URL: http://localhost:8086/doctor/dashboard
```

**Actions**:
1. View "Today's Appointments" section
2. Check appointment details displayed:
   - Patient name
   - Appointment time
   - Consultation type
   - Status

**Expected Results**:
- ✅ Appointments listed correctly
- ✅ Can click for details
- ✅ RLS properly filters (only doctor's appointments shown)
- ✅ No 403 errors

---

### **PHASE 7: AI Features (Optional)** ⏱️ 10 minutes

*Note: These features require actual consultation sessions*

#### Test 7.1: Audio Transcription Service
```
Test via Service Layer
```

**Actions**:
1. Open browser console
2. Test the service directly:

```javascript
// Import the service
import { aiTranscriptionService } from './src/services/aiTranscriptionService';

// Test with a small audio file
const testFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });

// Upload and transcribe
const result = await aiTranscriptionService.uploadAndTranscribe(
  testFile,
  'appointment-id-here',
  'doctor-id-here',
  'patient-id-here'
);

console.log('Transcription:', result);
```

**Expected Results**:
- ✅ File uploads to Supabase storage
- ✅ OpenAI Whisper API called
- ✅ Transcription saved to database
- ✅ Transcription ID returned

**Verify in Database**:
```sql
SELECT id, appointment_id, transcription_text, language, created_at
FROM consultation_transcriptions
ORDER BY created_at DESC
LIMIT 1;

-- Expected: 1 row with transcription data
```

---

#### Test 7.2: SOAP Notes Generation
```
Test via Service Layer
```

**Actions**:
1. Using transcription from Test 7.1
2. Generate SOAP notes:

```javascript
import { aiSoapNotesService } from './src/services/aiSoapNotesService';

const soapNotes = await aiSoapNotesService.generateSOAPNotes(
  'transcription-text-here',
  'appointment-id-here',
  'doctor-id-here',
  'patient-id-here'
);

console.log('SOAP Notes:', soapNotes);
```

**Expected Results**:
- ✅ GPT-4 API called
- ✅ Structured SOAP notes returned:
  - Subjective
  - Objective
  - Assessment
  - Plan
- ✅ ICD-10 codes included
- ✅ Saved to database

**Verify in Database**:
```sql
SELECT id, appointment_id, soap_notes, ai_generated, reviewed_by_doctor
FROM soap_notes
ORDER BY created_at DESC
LIMIT 1;

-- Expected: 1 row with SOAP notes JSON
```

---

### **PHASE 8: Security & RLS** ⏱️ 5 minutes

#### Test 8.1: Row Level Security Isolation
```
Test cross-tenant data access
```

**Actions**:
1. Login as Patient A
2. Try to access Patient B's data via URL manipulation
3. Verify 403 errors or no data shown

**URLs to Test**:
```
http://localhost:8086/patient-dashboard
http://localhost:8086/appointment/confirm/{other_patient_appointment_id}
```

**Expected Results**:
- ✅ Can only see own data
- ✅ Cannot access other patients' appointments
- ✅ RLS blocks unauthorized queries
- ✅ 403 errors or empty results for unauthorized access

---

#### Test 8.2: Anonymous Access Control
```
Logout and test public access
```

**Actions**:
1. Logout completely
2. Try to access protected pages:
   - `/patient-dashboard`
   - `/doctor/dashboard`
   - `/appointment/confirm/{id}`

**Expected Results**:
- ✅ Redirect to login page
- ✅ Or show "Unauthorized" message
- ✅ No sensitive data visible
- ✅ Public pages work (doctors directory, home page)

---

## 📊 Test Results Summary

### ✅ Pass Criteria

**All phases must pass** for production readiness:

| Phase | Test | Status | Notes |
|-------|------|--------|-------|
| 1 | System Health | ⬜ | Database, APIs, Routes |
| 2 | Patient Journey | ⬜ | Signup, Login, Dashboard |
| 3 | Doctor Directory | ⬜ | Browse, Profile |
| 4 | Booking Flow | ⬜ | Complete booking process |
| 5 | Notifications | ⬜ | WhatsApp, Email |
| 6 | Doctor Portal | ⬜ | Dashboard, Appointments |
| 7 | AI Features | ⬜ | Optional but recommended |
| 8 | Security & RLS | ⬜ | Critical for production |

---

## 🐛 Common Issues & Fixes

### Issue 1: 403 Forbidden Errors
**Cause**: RLS policy missing or incorrect
**Fix**: Check policy exists in Supabase Dashboard → Policies

### Issue 2: Slots Not Showing
**Cause**: No doctor availability data
**Fix**: Run query:
```sql
SELECT * FROM doctor_availability WHERE doctor_id = '{doctor_id}';
```

### Issue 3: Payment Not Working
**Cause**: Razorpay keys missing (expected in demo mode)
**Fix**: Demo mode should show confirmation dialog

### Issue 4: WhatsApp Not Sending
**Cause**: API key incorrect or template not configured
**Fix**: Verify `VITE_DOUBLETICK_API_KEY` in `.env`

### Issue 5: AI Features Failing
**Cause**: OpenAI API key missing or invalid
**Fix**: Verify `VITE_OPENAI_API_KEY` in `.env`

---

## 📝 Testing Checklist

Mark each item as you complete:

### Pre-Testing
- [ ] Dev server running (port 8086)
- [ ] All migrations run successfully
- [ ] Environment variables configured
- [ ] Database accessible

### System Tests
- [ ] System test dashboard all green
- [ ] Database tables verified
- [ ] RLS policies active

### Patient Flow
- [ ] Patient signup works
- [ ] Email verification flow works
- [ ] Patient login successful
- [ ] Patient dashboard accessible

### Booking Flow
- [ ] Doctor directory loads
- [ ] Doctor profiles accessible
- [ ] Booking page renders
- [ ] Consultation type selection works
- [ ] Calendar shows available dates
- [ ] Time slot selection works
- [ ] Slot locking verified
- [ ] Payment (demo) completes
- [ ] Confirmation page shows

### Notifications
- [ ] WhatsApp test successful
- [ ] Email logs in console (demo mode)

### Doctor Portal
- [ ] Doctor dashboard accessible
- [ ] Appointments visible
- [ ] Patient list shows

### AI Features (Optional)
- [ ] Audio transcription works
- [ ] SOAP notes generation works

### Security
- [ ] RLS prevents cross-tenant access
- [ ] Anonymous users redirected
- [ ] No data leaks

---

## 🚀 After Testing

Once all tests pass:

1. **Document Results**: Note any issues found
2. **Fix Critical Issues**: Before deployment
3. **Optional Enhancements**: Can wait for post-launch
4. **Prepare for Deployment**:
   - Run `npm run build`
   - Test production build
   - Deploy to Vercel/Netlify

---

## 📞 Support

If any tests fail:
1. Check console for error messages
2. Verify database migrations completed
3. Check RLS policies in Supabase Dashboard
4. Review API key configuration
5. Check documentation for specific feature

---

**Estimated Total Time**: 45-60 minutes
**Recommendation**: Run this pipeline before every major deployment

🎯 **Ready to test? Start with Phase 1!**
