# Automated Appointment Reminders - Implementation Specification

## Overview

This document outlines the requirements and implementation plan for automated appointment reminders via Email and WhatsApp.

---

## Requirements

### 1. 24-Hour Reminder
**Trigger**: 24 hours before appointment
**Channels**: Email + WhatsApp
**Sent To**: Patients
**Template**: Reminder with appointment details, location, and instructions

### 2. 3-Hour Reminder
**Trigger**: 3 hours before appointment
**Channels**: Email + WhatsApp
**Sent To**: Patients
**Template**: Urgent reminder with location and meeting link

### 3. Cancellation Notification
**Trigger**: When doctor cancels appointment
**Channels**: Email + WhatsApp
**Sent To**: Patients
**Template**: Cancellation notice with reason
**Status**: ✅ ALREADY IMPLEMENTED (sends on doctor cancel action)

---

## Implementation Options

### Option 1: Supabase Edge Functions + Cron (RECOMMENDED)

**Pros**:
- Integrated with existing Supabase setup
- Built-in cron trigger support
- Same TypeScript codebase
- Free tier includes 500,000 function invocations/month

**Cons**:
- Requires Supabase Pro plan for reliable cron ($25/month)
- Limited to 1-minute cron interval minimum

**Implementation**:
```typescript
// supabase/functions/send-24h-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const supabase = createClient(...)

  // Find appointments 24h from now
  const tomorrow = new Date()
  tomorrow.setHours(tomorrow.getHours() + 24)

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      patients!patient_id (first_name, last_name, email, phone),
      doctors!doctor_id (full_name)
    `)
    .eq('status', 'confirmed')
    .gte('start_at', tomorrow)
    .lte('start_at', new Date(tomorrow.getTime() + 3600000))

  // Send reminders
  for (const apt of appointments) {
    await sendEmailReminder(apt)
    await sendWhatsAppReminder(apt)
  }

  return new Response(JSON.stringify({ sent: appointments.length }))
})
```

**Cron Setup**:
```bash
# In Supabase Dashboard → Edge Functions → Cron Triggers
# 24h reminder: Run daily at 9:00 AM
0 9 * * *

# 3h reminder: Run every hour
0 * * * *
```

---

### Option 2: Node.js Cron Job on Server

**Pros**:
- Full control over scheduling
- Can run more frequently
- No additional costs if server already exists

**Cons**:
- Requires separate server/VM
- More infrastructure to maintain
- Need to ensure server uptime

**Implementation**:
```javascript
// server/cron/reminder-24h.js
const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')

// Run daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running 24h reminder job')

  const supabase = createClient(...)

  // Same logic as Supabase function
  const appointments = await fetch24HourAppointments()
  await sendReminders(appointments)
})
```

---

### Option 3: External Cron Service (EasyCron, Zapier, etc.)

**Pros**:
- No server maintenance
- Reliable scheduling
- Simple HTTP endpoint calls

**Cons**:
- Additional monthly cost
- Requires public API endpoint
- Less control

**Implementation**:
```javascript
// api/send-reminders.ts (Vercel serverless function)
export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Send reminders
  const sent = await sendDueReminders()
  res.json({ success: true, sent })
}
```

---

## Recommended Solution: Supabase Edge Functions

### Setup Steps

#### 1. Install Supabase CLI
```bash
npm install -g supabase
supabase login
```

#### 2. Initialize Functions
```bash
cd /path/to/project
supabase functions new send-24h-reminders
supabase functions new send-3h-reminders
```

#### 3. Implement 24-Hour Reminder Function
**File**: `supabase/functions/send-24h-reminders/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calculate time window: 24 hours from now ± 30 minutes
    const now = new Date()
    const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000)
    const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000)

    // Fetch appointments
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_at,
        mode,
        meeting_link,
        patients!patient_id (
          first_name,
          last_name,
          email,
          phone
        ),
        doctors!doctor_id (
          full_name
        )
      `)
      .eq('status', 'confirmed')
      .gte('start_at', windowStart.toISOString())
      .lte('start_at', windowEnd.toISOString())

    if (error) throw error

    let sent = 0

    for (const apt of appointments || []) {
      const patient = apt.patients
      const doctor = apt.doctors

      if (!patient || !doctor) continue

      // Send Email
      if (patient.email) {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            type: '24h_reminder',
            to: patient.email,
            patientName: `${patient.first_name} ${patient.last_name}`,
            doctorName: doctor.full_name,
            appointmentDate: new Date(apt.start_at).toLocaleDateString(),
            appointmentTime: new Date(apt.start_at).toLocaleTimeString(),
            meetingLink: apt.meeting_link
          })
        })
      }

      // Send WhatsApp
      if (patient.phone) {
        await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            type: '24h_reminder',
            phone: patient.phone,
            patientName: `${patient.first_name} ${patient.last_name}`,
            doctorName: doctor.full_name,
            appointmentDate: new Date(apt.start_at).toLocaleDateString(),
            appointmentTime: new Date(apt.start_at).toLocaleTimeString()
          })
        })
      }

      sent++
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### 4. Implement 3-Hour Reminder Function
**File**: `supabase/functions/send-3h-reminders/index.ts`

```typescript
// Similar to 24h, but:
// const targetTime = new Date(now.getTime() + 3 * 60 * 60 * 1000)
// const windowStart = new Date(targetTime.getTime() - 15 * 60 * 1000)
// const windowEnd = new Date(targetTime.getTime() + 15 * 60 * 1000)
```

#### 5. Deploy Functions
```bash
supabase functions deploy send-24h-reminders
supabase functions deploy send-3h-reminders
```

#### 6. Set Up Cron Triggers

In Supabase Dashboard → Edge Functions → Cron Triggers:

**24-Hour Reminder**:
- Function: `send-24h-reminders`
- Schedule: `0 9 * * *` (Every day at 9:00 AM)
- Description: "Send 24h appointment reminders"

**3-Hour Reminder**:
- Function: `send-3h-reminders`
- Schedule: `0 * * * *` (Every hour)
- Description: "Send 3h appointment reminders"

---

## WhatsApp Templates Required

### Template 1: 24-Hour Reminder
**Template Name**: `24hour_reminder_ddo`
**Variables**: 8
```
Greetings from {{1}}! Reminder: Your appointment with Dr. {{2}} is tomorrow at {{3}}.
📝 Instructions: {{4}}
📍 Location: {{5}}
🔗 {{6}}
{{7}}
For queries, call {{8}}.
```

**Already exists in whatsappService.ts**: ✅ Yes (line 856-883)

### Template 2: 3-Hour Reminder
**Template Name**: `3hour_reminder_ddo`
**Variables**: 5
```
Greetings from {{1}}! Your appointment with Dr. {{2}} is in 3 hours at {{3}}.
📍 {{4}}
For queries, call {{5}}.
```

**Already exists in whatsappService.ts**: ✅ Yes (line 894-915)

---

## Testing Plan

### Local Testing
```bash
# Test function locally
supabase functions serve send-24h-reminders

# Trigger manually
curl -X POST http://localhost:54321/functions/v1/send-24h-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Production Testing
1. Create test appointment 24h in future
2. Wait for cron to run (or trigger manually)
3. Verify patient receives:
   - Email reminder
   - WhatsApp reminder
4. Check function logs in Supabase Dashboard

---

## Monitoring & Logging

### What to Log:
- Number of reminders sent
- Any failed sends
- Appointment IDs processed
- Timestamp of execution

### Where to Monitor:
- Supabase Dashboard → Edge Functions → Logs
- Set up email alerts for failures
- Track reminder delivery rates

---

## Cost Estimate

### Supabase Edge Functions:
- **Free Tier**: 500,000 invocations/month
- **Pro Plan**: $25/month (includes 2M invocations)

### Expected Usage:
- 24h reminder: 1 run/day = ~30 runs/month
- 3h reminder: 24 runs/day = ~720 runs/month
- **Total**: ~750 runs/month (well within free tier)

### WhatsApp/Email Costs:
- Depends on number of appointments
- Estimate: 100 appointments/day = 3000/month
- Email: Free (via emailService)
- WhatsApp: Check DoubleTick pricing

---

## Implementation Timeline

| Task | Duration | Priority |
|------|----------|----------|
| Set up Supabase CLI | 30 min | High |
| Create reminder functions | 2 hours | High |
| Test locally | 1 hour | High |
| Deploy to production | 30 min | High |
| Set up cron triggers | 30 min | High |
| Monitor for 1 week | Ongoing | High |
| Optimize based on logs | 1 hour | Medium |

**Total Estimated Time**: ~5 hours

---

## Security Considerations

1. **Service Role Key**: Never expose in client code
2. **Cron Authentication**: Functions must verify they're called by Supabase cron
3. **Rate Limiting**: Implement to prevent spam
4. **Error Handling**: Graceful failures, don't crash on one error
5. **Patient Data**: Only fetch necessary fields

---

## Fallback Strategy

If Edge Functions fail:
1. Manual reminders via dashboard (temporary)
2. External cron service as backup
3. Alert system admin on failures
4. Queue failed sends for retry

---

## Success Metrics

- **Delivery Rate**: >95% of reminders sent successfully
- **Timing Accuracy**: ±15 minutes of target time
- **No-Show Reduction**: Track before/after reminder implementation
- **Patient Satisfaction**: Survey patients about reminder usefulness

---

## Next Steps

1. ✅ Document requirements (this document)
2. ⏳ Get approval for Supabase Pro plan (if needed)
3. ⏳ Implement 24h reminder function
4. ⏳ Implement 3h reminder function
5. ⏳ Test in staging environment
6. ⏳ Deploy to production
7. ⏳ Monitor for 1 week
8. ⏳ Optimize based on feedback

---

**Status**: 📝 Specification Complete - Ready for Implementation
**Priority**: Medium (core features working, this is enhancement)
**Estimated ROI**: High (reduces no-shows significantly)

