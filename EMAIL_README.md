# Email Service - AI Surgeon Pilot

## ✅ Status: WORKING

Your email service is fully configured and ready to use!

---

## Quick Start (30 seconds)

### Method 1: Using npm script (Recommended)
```bash
npm run email-proxy
```

### Method 2: Using startup script
```bash
./START_EMAIL_SERVICE.sh
```

### Method 3: Direct command
```bash
node email-proxy-server.mjs
```

**Then in another terminal**:
```bash
npm run dev
```

That's it! Your app can now send emails.

---

## Configuration

### Current Setup (Development)
- **From Address**: `onboarding@resend.dev` (Resend test domain)
- **API Key**: Active and verified ✅
- **Proxy Server**: http://localhost:3001
- **Rate Limit**: 100 emails/day, 3,000/month (free tier)

### Environment Variables
```env
VITE_RESEND_API_KEY=re_cfLQWv8y_2CaKP26okdNq2pdHtQKGmFF4
VITE_FROM_EMAIL=onboarding@resend.dev
```

---

## What You Can Do

Your email service supports these features:

✅ **Appointment Confirmations** - Sent when patient books
✅ **Appointment Reminders** - 24h and 3h before appointment
✅ **Appointment Cancellations** - When cancelled by anyone
✅ **Welcome Emails** - New patient/doctor signup
✅ **Payment Receipts** - After successful payment
✅ **Prescriptions** - Digital prescription delivery
✅ **Consultation Summaries** - Post-visit SOAP notes
✅ **Doctor Daily Summaries** - Morning schedule email
✅ **OTP Emails** - Login verification codes

---

## Usage Example

```typescript
import { emailService } from '@/services/emailService';

// Send appointment confirmation
await emailService.sendAppointmentConfirmation({
  tenant_id: '00000000-0000-0000-0000-000000000001',
  patient_id: 'patient-123',
  appointment_id: 'apt-456',
  patient_name: 'John Doe',
  patient_email: 'john@example.com',
  appointment_date: '2025-11-20',
  appointment_time: '10:00 AM',
  doctor_name: 'Dr. Smith',
  hospital_name: 'City Hospital',
  consultation_mode: 'video',
  meeting_link: 'https://meet.google.com/abc'
});
```

**Returns**: `true` if sent successfully, `false` if failed

---

## Test Email

Quick test to verify everything works:

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": ["YOUR_EMAIL@gmail.com"],
    "subject": "Test Email - AI Surgeon Pilot",
    "html": "<h1>Success!</h1><p>Your email service is working.</p>"
  }'
```

**Expected Response**:
```json
{"id":"0263dfa4-cdc2-4baf-be5a-3bdcbf2be215"}
```

Check your inbox - email should arrive within seconds!

---

## Documentation

| Document | Purpose |
|----------|---------|
| **EMAIL_IMPLEMENTATION_COMPLETE.md** | Full implementation details & summary |
| **EMAIL_QUICK_TEST.md** | Testing guide & troubleshooting |
| **RESEND_DOMAIN_SETUP.md** | Production domain verification guide |
| **EMAIL_README.md** | This file - quick reference |

---

## Development vs Production

### 🧪 Development (Current)
- Using: `onboarding@resend.dev`
- Setup time: ✅ Done
- Pros: Works immediately, no configuration
- Cons: Not branded with your domain

### 🚀 Production (When Ready)
- Will use: `noreply@aisurgeonpilot.com`
- Setup time: 15-30 minutes
- Requires: DNS verification (see `RESEND_DOMAIN_SETUP.md`)
- Pros: Professional, branded, better deliverability

---

## Troubleshooting

### Proxy server not starting?
```bash
# Kill any process on port 3001
lsof -ti:3001 | xargs kill -9

# Start fresh
npm run email-proxy
```

### Emails not sending?
1. Check proxy server is running: `curl http://localhost:3001/health`
2. Check `.env` has correct API key
3. Check `from` address is `onboarding@resend.dev`
4. Check Resend dashboard for errors

### "Domain not verified" error?
Make sure you're using the test domain:
```env
VITE_FROM_EMAIL=onboarding@resend.dev
```

---

## Monitoring

### Check Resend Dashboard
View all sent emails at: https://resend.com/emails

### Check Database Logs
```sql
SELECT * FROM notifications
WHERE type = 'email'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Production Deployment

When deploying to production (Vercel/Netlify/etc):

**Option 1**: Deploy proxy server to Heroku/Railway/Render
**Option 2**: Use Vercel Serverless Functions (recommended)
**Option 3**: Use backend API route

See `RESEND_DOMAIN_SETUP.md` for detailed deployment guide.

---

## Rate Limits

**Free Tier** (Current):
- 100 emails/day
- 3,000 emails/month
- 1 domain
- Perfect for testing/MVP

**Pro Tier** ($20/month):
- 50,000 emails/month
- 10 domains
- Analytics dashboard
- Custom SMTP

---

## Support

- **Resend Dashboard**: https://resend.com/dashboard
- **Resend Docs**: https://resend.com/docs
- **Implementation Guide**: `EMAIL_IMPLEMENTATION_COMPLETE.md`
- **Testing Guide**: `EMAIL_QUICK_TEST.md`

---

## Summary

✅ **Email service is working**
✅ **Test email sent successfully** (ID: `0263dfa4-cdc2-4baf-be5a-3bdcbf2be215`)
✅ **9 email templates ready to use**
✅ **Proxy server configured**
✅ **Documentation complete**

**You're ready to send emails!**

Just run:
```bash
npm run email-proxy  # Terminal 1
npm run dev          # Terminal 2
```

Then use `emailService` in your code to send emails.

---

**Last Updated**: 2025-11-17
**Status**: ✅ WORKING (Development Mode)
