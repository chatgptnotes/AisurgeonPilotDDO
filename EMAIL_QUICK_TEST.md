# Email Service Quick Test Guide

## ✅ Status: WORKING

Your email service is now configured and working!

---

## Quick Test (2 minutes)

### Step 1: Ensure Proxy Server is Running

```bash
# Check if running
curl http://localhost:3001/health

# If not running, start it:
node email-proxy-server.mjs
```

**Expected Output**:
```json
{"status":"ok","message":"Email proxy server running"}
```

---

### Step 2: Send Test Email

**Option A: Using curl (Command Line)**

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": ["delivered@resend.dev"],
    "subject": "Test Email - AI Surgeon Pilot",
    "html": "<h1>Success!</h1><p>Your email service is working perfectly.</p>"
  }'
```

**Expected Response**:
```json
{"id":"0263dfa4-cdc2-4baf-be5a-3bdcbf2be215"}
```

**Option B: Test from Application**

Visit your test page in browser:
```
http://localhost:5173/welcome-email-test
```

Click "Send Welcome Email" and check the console for success message.

---

### Step 3: Test Real Email (Your Inbox)

Replace `YOUR_EMAIL@gmail.com` with your actual email:

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": ["YOUR_EMAIL@gmail.com"],
    "subject": "AI Surgeon Pilot - Email Test",
    "html": "<h1>Email Service Working!</h1><p>This email proves your AI Surgeon Pilot email service is configured correctly.</p><p><strong>From:</strong> onboarding@resend.dev (Resend test domain)</p><p><strong>Status:</strong> Development mode</p>"
  }'
```

Check your inbox! You should receive the email within seconds.

---

## Test All Email Templates

### 1. Appointment Confirmation Email

```typescript
import { emailService } from '@/services/emailService';

await emailService.sendAppointmentConfirmation({
  tenant_id: '00000000-0000-0000-0000-000000000001',
  patient_id: 'test-patient-id',
  appointment_id: 'test-apt-id',
  patient_name: 'John Doe',
  patient_email: 'YOUR_EMAIL@gmail.com',
  appointment_date: '2025-11-20',
  appointment_time: '10:00 AM',
  doctor_name: 'Dr. Smith',
  hospital_name: 'City Hospital',
  consultation_mode: 'video',
  meeting_link: 'https://meet.google.com/abc-def-ghi'
});
```

### 2. Welcome Email

```typescript
await emailService.sendPatientWelcomeEmail({
  tenant_id: '00000000-0000-0000-0000-000000000001',
  patient_id: 'test-patient-id',
  patient_name: 'John Doe',
  patient_email: 'YOUR_EMAIL@gmail.com',
  hospital_name: 'City Hospital'
});
```

### 3. Prescription Email

```typescript
await emailService.sendPrescription({
  tenant_id: '00000000-0000-0000-0000-000000000001',
  patient_id: 'test-patient-id',
  visit_id: 'test-visit-id',
  patient_name: 'John Doe',
  patient_email: 'YOUR_EMAIL@gmail.com',
  doctor_name: 'Dr. Smith',
  hospital_name: 'City Hospital',
  prescription_date: '2025-11-17',
  medications: [
    {
      medicine_name: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '7 days',
      instructions: 'Take after meals'
    }
  ]
});
```

---

## Troubleshooting

### Issue: "Connection refused" or "Empty reply from server"

**Solution**: Proxy server is not running
```bash
# Kill any existing process
lsof -ti:3001 | xargs kill -9

# Start fresh
node email-proxy-server.mjs
```

---

### Issue: "Domain not verified"

**Solution**: You're trying to use production domain. Switch back to test domain:
```env
# In .env file
VITE_FROM_EMAIL=onboarding@resend.dev
```

---

### Issue: Email not received in inbox

**Possible causes**:
1. Check spam folder
2. Wait 1-2 minutes (sometimes delayed)
3. Use test address: `delivered@resend.dev`
4. Check proxy server logs for errors

**Check logs**:
```bash
# Proxy server should show:
✅ Email sent successfully: [email-id]
```

---

### Issue: CORS errors in browser

**Solution**: Proxy server handles CORS. Make sure it's running on port 3001.

---

## Production Deployment

When deploying to production (Vercel/Netlify):

### Option 1: Deploy Proxy Server Separately

Deploy `email-proxy-server.mjs` to a Node.js host:
- Heroku (free tier available)
- Railway.app
- Render.com
- Fly.io

Update `.env`:
```env
VITE_EMAIL_PROXY_URL=https://your-proxy-server.herokuapp.com/api/send-email
```

### Option 2: Use Resend Directly (No Proxy)

Update `emailService.ts` to call Resend API directly from backend/serverless functions.

### Option 3: Serverless Function (Recommended for Vercel)

Create `/api/send-email.ts` serverless function:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
```

---

## Email Sending Checklist

Before sending emails in production:

- [ ] Proxy server is running (dev) or serverless function deployed (prod)
- [ ] `VITE_RESEND_API_KEY` is set correctly
- [ ] `VITE_FROM_EMAIL` is set (test: `onboarding@resend.dev` / prod: `noreply@aisurgeonpilot.com`)
- [ ] Domain is verified (production only)
- [ ] Test email sent successfully
- [ ] Real email received in inbox
- [ ] All templates tested
- [ ] Error handling works
- [ ] Notifications logged to database

---

## Monitoring Emails

### Check Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com/emails)
2. View all sent emails
3. Check delivery status
4. See open/click rates (Pro plan)

### Check Database Logs

```sql
-- View all email notifications
SELECT * FROM notifications
WHERE type = 'email'
ORDER BY created_at DESC
LIMIT 10;

-- Check failed emails
SELECT * FROM notifications
WHERE type = 'email' AND status = 'failed'
ORDER BY created_at DESC;
```

---

## Success Confirmation

✅ **You should see**:
- Email ID returned: `{"id":"..."}`
- No errors in console
- Email in inbox (if using real address)
- Proxy server logs: `✅ Email sent successfully`

🎉 **Your email service is working!**

---

**Next Steps**:
1. Test emails from your application (book appointment, signup, etc.)
2. When ready for production, follow `RESEND_DOMAIN_SETUP.md`
3. Monitor email delivery in Resend dashboard

**Local Testing URL**: http://localhost:5173
**Proxy Server**: http://localhost:3001
**Health Check**: http://localhost:3001/health
