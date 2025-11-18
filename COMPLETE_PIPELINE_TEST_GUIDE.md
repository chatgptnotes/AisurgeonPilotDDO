# Complete Pipeline Test Guide

## Test User Details

### Patient Profile
```
Name: Kirtan Rajesh
Email: kirtanrajesh@gmail.com
Phone: +919876543210
Date of Birth: June 15, 1995
Gender: Male
Blood Group: O+
Address: 123 Marine Drive, Mumbai, Maharashtra - 400001
```

### Doctor Profile
```
Name: Dr. Priya Sharma
Email: priya.sharma@aisurgeonpilot.com
Phone: +919876543211
Specialization: Cardiology, Internal Medicine
Qualifications: MBBS, MD (Cardiology), FACC
Experience: 12 years
Consultation Fee: ₹800 (Standard), ₹500 (Follow-up)
Zoom Link: https://zoom.us/j/9876543210
Zoom Password: cardio123
```

---

## Setup Instructions

### Step 1: Create Test Data in Supabase

Go to your Supabase SQL Editor and run this SQL:

```sql
-- Get tenant ID
DO $$
DECLARE
  v_tenant_id UUID;
  v_patient_id UUID;
  v_doctor_id UUID;
  v_appointment_id UUID;
BEGIN
  -- Get or create tenant
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;

  IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (name, created_at)
    VALUES ('AI Surgeon Pilot', NOW())
    RETURNING id INTO v_tenant_id;
  END IF;

  RAISE NOTICE 'Tenant ID: %', v_tenant_id;

  -- ================================================================
  -- CREATE PATIENT
  -- ================================================================
  INSERT INTO patients (
    tenant_id, name, email, phone, date_of_birth, gender, age,
    blood_group, address, city_town, state, pin_code,
    emergency_contact_name, emergency_contact_phone,
    is_active, created_at
  ) VALUES (
    v_tenant_id,
    'Kirtan Rajesh',
    'kirtanrajesh@gmail.com',
    '+919876543210',
    '1995-06-15',
    'Male',
    29,
    'O+',
    '123 Marine Drive',
    'Mumbai',
    'Maharashtra',
    '400001',
    'Rajesh Kumar',
    '+919876543211',
    true,
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    age = EXCLUDED.age
  RETURNING id INTO v_patient_id;

  RAISE NOTICE 'Patient ID: %', v_patient_id;

  -- ================================================================
  -- CREATE DOCTOR
  -- ================================================================
  INSERT INTO doctors (
    tenant_id, full_name, email, phone,
    specialties, qualifications, experience_years,
    consultation_fee_standard, consultation_fee_followup, currency,
    rating_avg, rating_count, is_verified, is_accepting_patients,
    bio, languages, is_active,
    meeting_platform, meeting_link, meeting_password, meeting_id, meeting_instructions,
    created_at
  ) VALUES (
    v_tenant_id,
    'Dr. Priya Sharma',
    'priya.sharma@aisurgeonpilot.com',
    '+919876543211',
    ARRAY['Cardiology', 'Internal Medicine'],
    'MBBS, MD (Cardiology), FACC',
    12,
    800.00,
    500.00,
    'INR',
    4.8,
    95,
    true,
    true,
    'Board-certified cardiologist with 12+ years of experience in diagnosing and treating heart conditions. Specialized in preventive cardiology and lifestyle management.',
    ARRAY['English', 'Hindi', 'Marathi'],
    true,
    'zoom',
    'https://zoom.us/j/9876543210',
    'cardio123',
    '9876543210',
    'Please join 5 minutes before your appointment. Ensure you have a stable internet connection.',
    NOW()
  )
  ON CONFLICT (tenant_id, email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    meeting_link = EXCLUDED.meeting_link,
    meeting_password = EXCLUDED.meeting_password,
    meeting_id = EXCLUDED.meeting_id
  RETURNING id INTO v_doctor_id;

  RAISE NOTICE 'Doctor ID: %', v_doctor_id;

  -- ================================================================
  -- CREATE APPOINTMENT
  -- ================================================================
  INSERT INTO appointments (
    tenant_id, patient_id, doctor_id,
    appointment_date, start_at, duration_minutes,
    appointment_type, mode, status,
    payment_amount, payment_status, currency,
    meeting_link, symptoms, reason, notes, booked_by,
    created_at
  ) VALUES (
    v_tenant_id,
    v_patient_id,
    v_doctor_id,
    (CURRENT_DATE + INTERVAL '1 day')::DATE, -- Tomorrow
    (CURRENT_DATE + INTERVAL '1 day' + TIME '10:00:00')::TIMESTAMP WITH TIME ZONE,
    30,
    'opd',
    'video',
    'pending',
    800.00,
    'pending',
    'INR',
    'https://zoom.us/j/9876543210',
    'Experiencing chest discomfort and shortness of breath during exercise',
    'Routine cardiac checkup',
    'Patient requested video consultation',
    'patient',
    NOW()
  )
  RETURNING id INTO v_appointment_id;

  RAISE NOTICE 'Appointment ID: %', v_appointment_id;

  -- ================================================================
  -- SHOW RESULTS
  -- ================================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST DATA CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Patient: Kirtan Rajesh (ID: %)', v_patient_id;
  RAISE NOTICE 'Doctor: Dr. Priya Sharma (ID: %)', v_doctor_id;
  RAISE NOTICE 'Appointment ID: %', v_appointment_id;
  RAISE NOTICE '========================================';
END $$;
```

**Expected Output:**
```
NOTICE: Tenant ID: <uuid>
NOTICE: Patient ID: <uuid>
NOTICE: Doctor ID: <uuid>
NOTICE: Appointment ID: <uuid>
NOTICE: ========================================
NOTICE: TEST DATA CREATED SUCCESSFULLY
NOTICE: ========================================
```

Copy the UUIDs from the output for the next steps.

---

## Testing Workflow

### Test 1: Patient Dashboard

1. **Open Browser Console** (F12)
2. **Set Patient Context:**
   ```javascript
   localStorage.setItem('patient_id', '<PATIENT_ID_FROM_SQL>');
   localStorage.setItem('patient_name', 'Kirtan Rajesh');
   localStorage.setItem('patient_email', 'kirtanrajesh@gmail.com');
   ```

3. **Navigate to Patient Dashboard:**
   ```
   http://localhost:8086/patient-dashboard
   ```

4. **Verify:**
   - ✅ Dashboard loads without errors
   - ✅ Appointment appears in "Upcoming Appointments"
   - ✅ Shows "Dr. Priya Sharma"
   - ✅ Shows tomorrow's date and "10:00 AM"
   - ✅ Shows "Video Consultation" mode
   - ✅ Real-time status indicator shows "Live" (green)

---

### Test 2: Doctor Discovery

1. **Navigate to Doctor Directory:**
   ```
   http://localhost:8086/doctors
   ```

2. **Verify:**
   - ✅ Page loads without errors
   - ✅ "Dr. Priya Sharma" appears in the list
   - ✅ Shows specialties: "Cardiology, Internal Medicine"
   - ✅ Shows rating (if available)
   - ✅ Shows "Book Appointment" button

3. **Click on Doctor Card** to view profile

4. **Verify Doctor Profile:**
   - ✅ Shows full bio
   - ✅ Shows qualifications
   - ✅ Shows consultation fees
   - ✅ Shows available time slots
   - ✅ "Book Appointment" button works

---

### Test 3: Appointment Booking Flow

1. **Click "Book Appointment"** from doctor profile

2. **Fill Booking Form:**
   - Mode: Video Consultation
   - Date: Select tomorrow
   - Time: Select 11:00 AM slot
   - Symptoms: "General health checkup"
   - Reason: "Preventive consultation"

3. **Submit Booking**

4. **Verify:**
   - ✅ Redirects to confirmation page
   - ✅ Shows appointment details
   - ✅ Shows Zoom meeting link
   - ✅ Shows meeting password
   - ✅ "Join Video Call" button present (but disabled until 15 min before)
   - ✅ PDF download button works

---

### Test 4: Doctor Dashboard

1. **Open New Browser Tab/Window**

2. **Open Browser Console** (F12)

3. **Set Doctor Context:**
   ```javascript
   localStorage.setItem('doctor_id', '<DOCTOR_ID_FROM_SQL>');
   localStorage.setItem('doctor_name', 'Dr. Priya Sharma');
   localStorage.setItem('doctor_email', 'priya.sharma@aisurgeonpilot.com');
   ```

4. **Navigate to Doctor Dashboard:**
   ```
   http://localhost:8086/doctor/dashboard
   ```

5. **Verify:**
   - ✅ Dashboard loads without errors
   - ✅ Shows pending appointments
   - ✅ Shows "Kirtan Rajesh" appointment
   - ✅ Shows appointment details
   - ✅ "Confirm" button is visible
   - ✅ Real-time status indicator shows "Live"

---

### Test 5: Real-Time Sync

**Setup:** Keep both Patient Dashboard and Doctor Dashboard open side-by-side

1. **From Doctor Dashboard:**
   - Click "Confirm" on Kirtan's appointment

2. **Watch Patient Dashboard:**
   - ✅ Appointment status changes to "Confirmed" in real-time
   - ✅ Toast notification appears
   - ✅ Meeting link becomes visible/active

3. **Verify:**
   - ✅ No page refresh needed
   - ✅ Status changes within 2 seconds
   - ✅ Real-time indicator stays green

---

### Test 6: Video Meeting Integration

1. **From Patient Dashboard:**
   - Click on confirmed appointment

2. **Verify Meeting Details:**
   - ✅ Zoom link is displayed
   - ✅ Meeting password shown: "cardio123"
   - ✅ Instructions visible
   - ✅ "Join Video Call" button present

3. **Test Meeting Link:**
   - ✅ Click "Copy Link" button
   - ✅ Link copies to clipboard
   - ✅ Test link opens in new tab (don't actually join)

---

### Test 7: PDF Generation

1. **Navigate to PDF Test Page:**
   ```
   http://localhost:8086/pdf-test
   ```

2. **Test Receipt PDF:**
   - Click "Generate Receipt PDF"
   - **Verify:**
     - ✅ PDF generates without errors
     - ✅ Shows patient name
     - ✅ Shows amount
     - ✅ Shows receipt number
     - ✅ Professional formatting
     - ✅ "Download PDF" button works
     - ✅ PDF preview loads in iframe

3. **Test Prescription PDF:**
   - Click "Generate Prescription PDF"
   - **Verify:**
     - ✅ PDF generates without errors
     - ✅ Shows doctor name
     - ✅ Shows medications table
     - ✅ Shows diagnosis
     - ✅ Shows doctor's advice
     - ✅ Professional medical format

---

### Test 8: WhatsApp Notification

**Note:** This requires DoubleTick templates to be approved

1. **Navigate to WhatsApp Test Page:**
   ```
   http://localhost:8086/whatsapp-service-test
   ```

2. **Update Phone Number:**
   - Change to: `+919876543210` (your actual WhatsApp number)

3. **Test Payment Receipt:**
   - Click "Send Payment Receipt"
   - **Check Console:**
     - ✅ Request logged
     - ✅ API endpoint shows: `https://public.doubletick.io/whatsapp/message/template`
     - ✅ Template name: `payment_receipt_pdf_ddo`
     - ✅ Variables array has 5 items
     - ✅ Response shows success or error

4. **Check Your WhatsApp:**
   - ✅ Message received (if templates approved)
   - ✅ Contains patient name
   - ✅ Contains receipt details
   - ✅ Contains PDF download link
   - ✅ Message ends with "Thank you"

5. **Test Other Templates:**
   - Prescription Ready
   - Appointment Confirmation
   - Lab Report Ready

---

### Test 9: Email Notification

**Note:** Requires Resend API key

1. **Check Environment Variables:**
   ```bash
   # In .env file
   VITE_RESEND_API_KEY=your_resend_api_key
   ```

2. **Test from Confirmation Page:**
   - When appointment is confirmed
   - Check email: kirtanrajesh@gmail.com

3. **Verify Email:**
   - ✅ Subject: "Appointment Confirmed"
   - ✅ Contains appointment details
   - ✅ Contains doctor information
   - ✅ Contains meeting link
   - ✅ Professional formatting

---

### Test 10: Doctor Settings

1. **From Doctor Dashboard:**
   - Click "Settings" or navigate to:
   ```
   http://localhost:8086/doctor/settings
   ```

2. **Verify Meeting Settings:**
   - ✅ Shows current Zoom link
   - ✅ Shows meeting password
   - ✅ Shows instructions
   - ✅ "Test Link" button works
   - ✅ "Copy Link" button works

3. **Update Meeting Link:**
   - Change to a different Zoom URL
   - Click "Save"
   - **Verify:**
     - ✅ Success message appears
     - ✅ Settings persist after refresh
     - ✅ New appointments use new link

---

## Console Commands Reference

### Patient Context
```javascript
// Set patient session
localStorage.setItem('patient_id', '<PATIENT_ID>');
localStorage.setItem('patient_name', 'Kirtan Rajesh');
localStorage.setItem('patient_email', 'kirtanrajesh@gmail.com');
window.location.href = '/patient-dashboard';

// Clear patient session
localStorage.removeItem('patient_id');
localStorage.removeItem('patient_name');
localStorage.removeItem('patient_email');
```

### Doctor Context
```javascript
// Set doctor session
localStorage.setItem('doctor_id', '<DOCTOR_ID>');
localStorage.setItem('doctor_name', 'Dr. Priya Sharma');
localStorage.setItem('doctor_email', 'priya.sharma@aisurgeonpilot.com');
window.location.href = '/doctor/dashboard';

// Clear doctor session
localStorage.removeItem('doctor_id');
localStorage.removeItem('doctor_name');
localStorage.removeItem('doctor_email');
```

### Test WhatsApp Service
```javascript
import { whatsappService } from '@/services/whatsappService';

// Test payment receipt
const result = await whatsappService.sendPaymentReceiptWithPDF({
  patientName: 'Kirtan Rajesh',
  patientPhone: '+919876543210',
  receiptNumber: 'RCT-TEST-001',
  amount: 800,
  pdfUrl: 'https://example.com/receipt.pdf',
  date: '15 Nov 2024'
});

console.log('WhatsApp Result:', result);
```

---

## Verification Checklist

### Database
- [ ] Tenant exists
- [ ] Patient created with correct details
- [ ] Doctor created with meeting link
- [ ] Appointment created with status "pending"

### Patient Portal
- [ ] Patient dashboard loads
- [ ] Appointments list displays
- [ ] Appointment details correct
- [ ] Real-time sync works

### Doctor Portal
- [ ] Doctor dashboard loads
- [ ] Pending appointments visible
- [ ] Can confirm appointments
- [ ] Settings page works
- [ ] Meeting link configurable

### Booking Flow
- [ ] Doctor directory loads
- [ ] Can view doctor profile
- [ ] Can book appointment
- [ ] Confirmation page displays
- [ ] Meeting details shown

### Notifications
- [ ] WhatsApp service configured
- [ ] Templates use `_ddo` suffix
- [ ] API calls logged in console
- [ ] Email service configured
- [ ] Emails sent successfully

### PDF Generation
- [ ] Receipt PDF generates
- [ ] Prescription PDF generates
- [ ] PDFs upload to storage
- [ ] Public URLs work
- [ ] Download button works

### Real-Time
- [ ] Connection status shows "Live"
- [ ] Changes sync automatically
- [ ] Toast notifications appear
- [ ] No manual refresh needed

---

## Troubleshooting

### Issue: "Tenant or user not found"
**Solution:** The pooler connection doesn't support data modification. Use Supabase SQL Editor instead.

### Issue: Appointment not showing
**Solution:**
1. Check localStorage has correct patient_id/doctor_id
2. Verify appointment exists in database
3. Check browser console for errors
4. Refresh page

### Issue: Real-time not working
**Solution:**
1. Check WebSocket connection in Network tab
2. Verify Supabase URL and anon key in .env
3. Check browser console for connection errors
4. Try refreshing page

### Issue: WhatsApp not sending
**Solution:**
1. Check DoubleTick templates are approved
2. Verify API key is correct
3. Check template names match (with `_ddo` suffix)
4. Check variable count matches template
5. Review browser console for API errors

### Issue: PDF not generating
**Solution:**
1. Check Supabase storage buckets exist
2. Run `database/setup_pdf_storage.sql`
3. Verify public access is enabled
4. Check browser console for errors

---

## Expected Results

After completing all tests, you should have:

1. ✅ Patient account with appointments visible
2. ✅ Doctor account with appointments visible
3. ✅ Real-time sync working between dashboards
4. ✅ Appointment booking flow complete
5. ✅ PDF generation working
6. ✅ WhatsApp notifications configured (pending template approval)
7. ✅ Email notifications configured (pending API key)
8. ✅ Meeting links properly configured
9. ✅ Professional, production-ready interface

---

## Next Steps

1. **Get Your WhatsApp Number:**
   - Update test scripts with your actual number
   - Test WhatsApp notifications

2. **Approve DoubleTick Templates:**
   - Create templates in DoubleTick dashboard
   - Wait for WhatsApp approval (1-3 days)
   - Test sending after approval

3. **Configure Email:**
   - Get Resend API key
   - Add to .env
   - Test email sending

4. **Production Deployment:**
   - Deploy to Vercel/Netlify
   - Configure environment variables
   - Test on production

---

**Test Status:** Ready for Execution
**Last Updated:** 15 Nov 2024
**Version:** 1.0
