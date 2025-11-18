# All Doctor Login Credentials

## Overview
This document contains login credentials for all 10 doctors in the AI Surgeon Pilot platform.

---

## How to Login as Any Doctor

### Step 1: Get Doctor ID
After running the SQL script (`CREATE_ALL_DOCTORS.sql`), you'll get a list of doctor IDs. Alternatively, run this query in Supabase:

```sql
SELECT id, full_name, email, specialties
FROM doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY full_name;
```

### Step 2: Use Browser Console to Login

Open your browser at `http://localhost:8086` and open the console (F12 or Cmd+Option+I), then use the appropriate script below.

---

## Doctor Profiles & Login Scripts

### 1. Dr. Priya Sharma
**Specialties:** Cardiology, Internal Medicine
**Email:** priya.sharma@aisurgeonpilot.com
**Phone:** +919876543211
**Consultation Fee:** INR 800 (Standard) / INR 500 (Follow-up)
**Rating:** 4.8/5.0 (127 reviews)
**Languages:** English, Hindi, Tamil

**Login Script:**
```javascript
// Method 1: Auto-fetch and login
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'priya.sharma@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

### 2. Dr. Rajesh Kumar
**Specialties:** Orthopedic Surgery, Sports Medicine
**Email:** rajesh.kumar@aisurgeonpilot.com
**Phone:** +919876543212
**Consultation Fee:** INR 1000 (Standard) / INR 600 (Follow-up)
**Rating:** 4.9/5.0 (203 reviews)
**Languages:** English, Hindi, Punjabi

**Login Script:**
```javascript
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'rajesh.kumar@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

### 3. Dr. Anjali Patel
**Specialties:** Pediatrics, Neonatology
**Email:** anjali.patel@aisurgeonpilot.com
**Phone:** +919876543213
**Consultation Fee:** INR 600 (Standard) / INR 400 (Follow-up)
**Rating:** 4.9/5.0 (189 reviews)
**Languages:** English, Hindi, Gujarati

**Login Script:**
```javascript
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'anjali.patel@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

### 4. Dr. Vikram Singh
**Specialties:** Neurology, Stroke Medicine
**Email:** vikram.singh@aisurgeonpilot.com
**Phone:** +919876543214
**Consultation Fee:** INR 1200 (Standard) / INR 700 (Follow-up)
**Rating:** 4.7/5.0 (156 reviews)
**Languages:** English, Hindi, Bengali

**Login Script:**
```javascript
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'vikram.singh@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

### 5. Dr. Meera Reddy
**Specialties:** Dermatology, Cosmetology, Aesthetic Medicine
**Email:** meera.reddy@aisurgeonpilot.com
**Phone:** +919876543215
**Consultation Fee:** INR 900 (Standard) / INR 550 (Follow-up)
**Rating:** 4.8/5.0 (234 reviews)
**Languages:** English, Hindi, Telugu

**Login Script:**
```javascript
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'meera.reddy@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

### 6. Dr. Arjun Mehta
**Specialties:** General Surgery, Laparoscopic Surgery
**Email:** arjun.mehta@aisurgeonpilot.com
**Phone:** +919876543216
**Consultation Fee:** INR 1100 (Standard) / INR 650 (Follow-up)
**Rating:** 4.9/5.0 (178 reviews)
**Languages:** English, Hindi, Marathi

**Login Script:**
```javascript
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'arjun.mehta@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

### 7. Dr. Kavita Desai
**Specialties:** Gynecology, Obstetrics, Infertility
**Email:** kavita.desai@aisurgeonpilot.com
**Phone:** +919876543217
**Consultation Fee:** INR 850 (Standard) / INR 500 (Follow-up)
**Rating:** 4.9/5.0 (267 reviews)
**Languages:** English, Hindi, Gujarati

**Login Script:**
```javascript
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'kavita.desai@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

### 8. Dr. Sanjay Gupta
**Specialties:** Ophthalmology, Cataract Surgery, LASIK
**Email:** sanjay.gupta@aisurgeonpilot.com
**Phone:** +919876543218
**Consultation Fee:** INR 700 (Standard) / INR 450 (Follow-up)
**Rating:** 4.8/5.0 (312 reviews)
**Languages:** English, Hindi

**Login Script:**
```javascript
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'sanjay.gupta@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

### 9. Dr. Nisha Kapoor
**Specialties:** Psychiatry, Clinical Psychology
**Email:** nisha.kapoor@aisurgeonpilot.com
**Phone:** +919876543219
**Consultation Fee:** INR 1000 (Standard) / INR 600 (Follow-up)
**Rating:** 4.9/5.0 (145 reviews)
**Languages:** English, Hindi

**Login Script:**
```javascript
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'nisha.kapoor@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

### 10. Dr. Amit Shah
**Specialties:** ENT, Head and Neck Surgery
**Email:** amit.shah@aisurgeonpilot.com
**Phone:** +919876543220
**Consultation Fee:** INR 750 (Standard) / INR 475 (Follow-up)
**Rating:** 4.7/5.0 (198 reviews)
**Languages:** English, Hindi, Gujarati

**Login Script:**
```javascript
(async () => {
  const { createClient } = window.supabase;
  const supabase = createClient(
    'https://qfneoowktsirwpzehgxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVvb3drdHNpcndwemVoZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1Njc0ODcsImV4cCI6MjA0NzE0MzQ4N30.FqYgCo-9_3tMDDN0V1KdXdqXOD-1u1-oWoiVyHmNHUU'
  );
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, email')
    .eq('email', 'amit.shah@aisurgeonpilot.com')
    .single();
  localStorage.setItem('doctor_id', data.id);
  localStorage.setItem('doctor_name', data.full_name);
  localStorage.setItem('doctor_email', data.email);
  console.log('✓ Logged in as:', data.full_name);
  window.location.href = '/doctor/dashboard';
})();
```

---

## Quick Summary Table

| Doctor Name | Specialty | Fee (INR) | Rating | Email |
|-------------|-----------|-----------|--------|-------|
| Dr. Priya Sharma | Cardiology | 800/500 | 4.8 | priya.sharma@aisurgeonpilot.com |
| Dr. Rajesh Kumar | Orthopedic Surgery | 1000/600 | 4.9 | rajesh.kumar@aisurgeonpilot.com |
| Dr. Anjali Patel | Pediatrics | 600/400 | 4.9 | anjali.patel@aisurgeonpilot.com |
| Dr. Vikram Singh | Neurology | 1200/700 | 4.7 | vikram.singh@aisurgeonpilot.com |
| Dr. Meera Reddy | Dermatology | 900/550 | 4.8 | meera.reddy@aisurgeonpilot.com |
| Dr. Arjun Mehta | General Surgery | 1100/650 | 4.9 | arjun.mehta@aisurgeonpilot.com |
| Dr. Kavita Desai | Gynecology | 850/500 | 4.9 | kavita.desai@aisurgeonpilot.com |
| Dr. Sanjay Gupta | Ophthalmology | 700/450 | 4.8 | sanjay.gupta@aisurgeonpilot.com |
| Dr. Nisha Kapoor | Psychiatry | 1000/600 | 4.9 | nisha.kapoor@aisurgeonpilot.com |
| Dr. Amit Shah | ENT | 750/475 | 4.7 | amit.shah@aisurgeonpilot.com |

---

## Testing Complete Workflow

### 1. Create All Doctors
Run the SQL script in Supabase SQL Editor:
- File: `database/CREATE_ALL_DOCTORS.sql`
- Opens: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp/sql

### 2. View in Doctor Directory
- Navigate to: http://localhost:8086/doctors
- You should see all 10 doctors with their profiles
- Filter by specialty
- Search by name

### 3. Test Login as Any Doctor
- Pick any doctor from the list above
- Copy their login script
- Open browser console (F12)
- Paste and run the script
- You'll be redirected to their dashboard

### 4. Test Doctor Dashboard Features
Once logged in as a doctor, you can:
- View all appointments
- Confirm/cancel appointments
- Update profile settings
- Configure meeting links
- See real-time updates

---

## Logout from Doctor Account

To logout and switch to another doctor:

```javascript
// Clear current session
localStorage.removeItem('doctor_id');
localStorage.removeItem('doctor_name');
localStorage.removeItem('doctor_email');

// Redirect to home
window.location.href = '/';
```

---

## Notes

1. **Video Meeting Links:**
   - Some doctors have Zoom links configured
   - Others have Google Meet links
   - You can update these in doctor settings

2. **Profile Photos:**
   - Using randomuser.me for placeholder photos
   - Replace with actual photos in production

3. **Testing:**
   - All doctors are verified and accepting patients
   - Ready to receive appointments
   - Real-time sync enabled

4. **Security:**
   - This is for testing only
   - Production should use proper authentication
   - Never expose API keys in client code

---

**Created:** November 15, 2025
**Status:** Ready to Use
**Server:** http://localhost:8086/

**Next Steps:**
1. Run `CREATE_ALL_DOCTORS.sql` in Supabase
2. Visit http://localhost:8086/doctors to see all doctors
3. Use any login script above to access doctor dashboards
4. Test booking appointments from patient side
