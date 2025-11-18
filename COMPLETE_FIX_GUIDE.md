# Complete Fix Guide - All Issues

## Issues to Fix:
1. ✅ consultation_notes 406 RLS error
2. ✅ Patient dashboard 404 error  
3. ⏳ Email CORS (needs Edge Function)
4. ⏳ WhatsApp not delivering (template check needed)
5. ⏳ PDF generation (not implemented)

---

## Step 1: Run SQL to Fix RLS Policies (REQUIRED)

**File**: `FINAL_FIX_ALL_ISSUES.sql`

**URL**: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp/sql

This fixes:
- consultation_notes 406 error
- user_profiles 403 error

---

## Step 2: Create Supabase Edge Function for Email

### Install Supabase CLI (if not installed):
```bash
npm install -g supabase
```

### Login to Supabase:
```bash
supabase login
```

### Link Project:
```bash
supabase link --project-ref qfneoowktsirwpzehgxp
```

### Create Edge Function:
```bash
supabase functions new send-email
```

### Add Function Code:

Create file: `supabase/functions/send-email/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { cors Headers } from 'https://deno.land/std@0.168.0/http/mod.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { to, subject, html, from } = await req.json()
    
    // Call Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'noreply@aisurgeonpilot.com',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    })

    const data = await res.json()
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: res.status,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 400,
      },
    )
  }
})
```

### Deploy Function:
```bash
supabase functions deploy send-email --no-verify-jwt
```

### Set Environment Variable:
```bash
supabase secrets set RESEND_API_KEY=re_cfLQWv8y_2CaKP26okdNq2pdHtQKGmFF4
```

---

## Step 3: Update Email Service to Use Edge Function

**File**: `src/services/emailService.ts`

Change line 47 from:
```typescript
this.apiUrl = 'https://api.resend.com/emails';
```

To:
```typescript
this.apiUrl = 'https://qfneoowktsirwpzehgxp.supabase.co/functions/v1/send-email';
```

Change line 60-75 to remove Authorization header (Edge Function handles it):
```typescript
const response = await fetch(this.apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: emailData.from || this.fromEmail,
    to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
    subject: emailData.subject,
    html: emailData.html,
  })
});
```

---

## Step 4: Check WhatsApp Template

**Login**: https://doubletick.io/dashboard

**Check**:
1. Go to Templates
2. Find `prescription_ready_ddo`
3. Check status = APPROVED (green)
4. Check number of variables = 9
5. Check Message ID in Logs: `442935f6-f113-4cd9-90d4-19700e36f859`

**If template has different number of variables**, tell me and I'll update the code.

---

## Step 5: Test Everything

### After Running SQL:
1. Refresh browser
2. Login as doctor
3. Open consultation workspace
4. Fill notes and prescription
5. Click "Send to Patient"

### Expected Results:
✅ No 406 error for consultation_notes
✅ Auto-save works
✅ Email sends (after Edge Function deployed)
✅ WhatsApp sends

---

## Quick Alternative for Email (No Edge Function)

If you don't want to deploy Edge Function now:

### Option 1: Use Supabase Email (Built-in)

Change emailService.ts to use Supabase's built-in auth email:

```typescript
// In emailService.ts
private async sendViaSupabase(emailData: EmailData) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(
    emailData.to as string,
    {
      data: {
        subject: emailData.subject,
        html: emailData.html
      }
    }
  );
  return { success: !error, error: error?.message };
}
```

### Option 2: Backend Server (Quick)

Create `email-server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer re_cfLQWv8y_2CaKP26okdNq2pdHtQKGmFF4',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });
  
  const data = await response.json();
  res.json(data);
});

app.listen(3001, () => console.log('Email server on port 3001'));
```

Run: `node email-server.js`

Update emailService.ts line 47:
```typescript
this.apiUrl = 'http://localhost:3001/api/send-email';
```

---

## Summary

**Must Do Now**:
1. ✅ Run `FINAL_FIX_ALL_ISSUES.sql` in Supabase
2. ✅ Refresh browser (patient dashboard 404 fixed in code)

**For Email** (Choose one):
- Option A: Deploy Supabase Edge Function (recommended)
- Option B: Run simple Express server (quickest)
- Option C: Skip for now, WhatsApp is working

**For WhatsApp**:
- Check DoubleTick dashboard for delivery status
- Verify template is approved

**For PDF**:
- Not implemented yet - will add in next session
