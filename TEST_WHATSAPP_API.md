# Test WhatsApp API Directly

## Quick Test Command

Try this curl command with your actual phone number to see the exact error:

```bash
curl --request POST \
     --url "https://public.doubletick.io/whatsapp/message/template" \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'Authorization: key_8sc9MP6JpQ' \
     --data '{
       "messages": [{
         "to": "+919422102188",
         "content": {
           "templateName": "appointment_confirmation_ddo",
           "language": "en",
           "templateData": {
             "body": {
               "placeholders": ["Kirtan Rajesh", "Tuesday, November 25, 2025", "12:20 PM", "Dr. Ramesh Kumar"]
             }
           }
         }
       }]
     }'
```

This will tell you the exact error from DoubleTick API.

## Common Issues & Solutions

### Issue 1: Template Doesn't Exist
**Error:** `Template not found` or `Invalid template name`
**Solution:**
1. Login to DoubleTick dashboard
2. Go to Templates section
3. Check if `appointment_confirmation_ddo` exists
4. If not, create it
5. If it exists, verify the exact name (case-sensitive)

### Issue 2: Template Not Approved
**Error:** `Template not approved` or `Template status: PENDING`
**Solution:**
1. Check template status in DoubleTick dashboard
2. Template must have status: "APPROVED"
3. If pending, wait for WhatsApp approval (24-48 hours)

### Issue 3: Wrong Number of Placeholders
**Error:** `Placeholder count mismatch` or `Invalid template data`

Your curl example shows 8 placeholders:
```json
"placeholders": ["1","2","3","4","5","6","7","8"]
```

But our code sends only 4:
```json
"placeholders": ["Kirtan Rajesh", "Tuesday, November 25, 2025", "12:20 PM", "Dr. Ramesh Kumar"]
```

**Solution:** Check your template in DoubleTick - how many placeholders does it have?

### Issue 4: Missing Header Field
Your curl shows:
```json
"templateData": {
  "header": {"type": "TEXT"},
  "body": {"placeholders": [...]}
}
```

Our code doesn't include header. If your template has a header, we need to add it.

### Issue 5: Phone Number Format
**Current format:** `+919422102188` ✅ (This looks correct)

Should be:
- Include country code (+91 for India)
- No spaces, dashes, or parentheses
- Start with +

## Steps to Debug

### Step 1: Check Template in DoubleTick
1. Login to https://doubletick.io/
2. Go to Templates
3. Find `appointment_confirmation_ddo`
4. Check:
   - Status (must be APPROVED)
   - Number of placeholders in template
   - Whether template has header

### Step 2: Test API Directly
Run the curl command above and copy the response here. It will show the exact error.

### Step 3: Update Code Based on Template

If template has **4 placeholders** (current):
- No changes needed

If template has **8 placeholders**:
We need to update the code to send 8 values. Example:
```typescript
variables: [
  patientName,        // 1
  date,               // 2
  time,               // 3
  doctorName,         // 4
  clinicName,         // 5
  clinicAddress,      // 6
  appointmentType,    // 7
  phoneNumber         // 8
]
```

If template has **header**:
We need to add header to payload:
```typescript
templateData: {
  header: { type: "TEXT" },
  body: { placeholders: [...] }
}
```

## Create New Template (Recommended)

Instead of debugging the existing template, create a new simple one:

### Template Name
`appointment_booking_confirmation`

### Template Content
**Body:**
```
Hello {{1}},

Your appointment is confirmed!

📅 Date: {{2}}
⏰ Time: {{3}}
👨‍⚕️ Doctor: {{4}}

See you soon!
```

**Category:** UTILITY
**Language:** English

This has exactly 4 placeholders matching our code.

Then update code to use new template:
```typescript
// In whatsappService.ts line 781
template: 'appointment_booking_confirmation'
```

## Test Booking Again

After making changes:
1. Book a new appointment
2. Check console for full API response
3. Look for the new detailed error logs
4. Share the output here

## Expected Success Response

When it works, you should see:
```json
{
  "success": true,
  "data": {
    "message_id": "wamid.xxxxx",
    "status": "sent"
  }
}
```

## Expected Failure Response

When it fails, you'll see something like:
```json
{
  "success": false,
  "error": "Template not found",
  "message": "The template 'appointment_confirmation_ddo' does not exist"
}
```

---

**Next Step:** Please try booking an appointment again and share the console output that shows the "Full API Response" log. This will tell us exactly what's wrong.
