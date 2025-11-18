# 🚨 WhatsApp Template Missing - Create It Now!

## Why Patient Didn't Receive Message

The message was sent to DoubleTick successfully:
```
Status: ENQUEUED
MessageId: 101b44ec-1bbb-4873-af3d-28fb80c348f7
```

**But** the template `consultation_summary_ddo` doesn't exist in DoubleTick, so it was rejected.

---

## ✅ Create the Template in DoubleTick

### Step 1: Login to DoubleTick
```
https://doubletick.io/dashboard
```

### Step 2: Go to Templates
Navigate to: **Templates** → **Create New Template**

### Step 3: Fill Template Details

**Template Name**: `consultation_summary_ddo`

**Category**: `UTILITY` or `TRANSACTIONAL`

**Language**: `English`

**Template Body**:
```
Hello {{1}},

Thank you for your consultation with Dr. {{2}} on {{3}}.

*Diagnosis:*
{{4}}

*Prescribed Medications:*
{{5}}

*Follow-up Instructions:*
{{6}}

For any queries, please contact {{7}} at {{8}}.

Take care!
```

**Variables** (8 total):
1. {{1}} = Patient Name (e.g., "John Doe")
2. {{2}} = Doctor Name (e.g., "Priya Sharma")
3. {{3}} = Consultation Date (e.g., "November 16, 2025")
4. {{4}} = Diagnosis/Assessment (e.g., "Tension headache")
5. {{5}} = Medications List (e.g., "Ibuprofen 400mg - Twice daily for 5 days")
6. {{6}} = Follow-up Instructions (e.g., "Return in 1 week if symptoms persist")
7. {{7}} = Hospital Name (e.g., "AI Surgeon Pilot")
8. {{8}} = Contact Phone (e.g., "+91-XXX-XXX-XXXX")

### Step 4: Submit for Approval

Click "Submit" and wait for WhatsApp approval (usually 1-24 hours)

---

## Alternative: Use Existing Template for Now

Instead of creating a new template, let's use an existing approved template.

### Check What Templates You Have

1. Login to DoubleTick: https://doubletick.io/dashboard
2. Go to **Templates**
3. Look for **APPROVED** templates
4. Share the list with me

### Common Approved Templates:

Most accounts have these by default:
- `appointment_confirmation`
- `appointment_reminder`
- `payment_receipt`
- `otp_verification`

We can temporarily use one of these while waiting for the new template approval.

---

## Quick Fix: Use appointment_confirmation Template

If you have `appointment_confirmation` template approved, I can modify the code to use that instead while we wait for the new template.

**Let me know:**
1. What templates do you have APPROVED in DoubleTick?
2. Do you want me to modify the code to use an existing template temporarily?

---

## After Template is Approved

Once `consultation_summary_ddo` is approved:
1. ✅ WhatsApp will be sent automatically
2. ✅ Patient will receive prescription details
3. ✅ No code changes needed

---

## Check Template Status

To check if template is approved:
1. Login to DoubleTick
2. Go to Templates
3. Look for `consultation_summary_ddo`
4. Status should be: **APPROVED** (green)

---

**Next Step**: Create the template in DoubleTick OR tell me what approved templates you have so I can use one temporarily.
