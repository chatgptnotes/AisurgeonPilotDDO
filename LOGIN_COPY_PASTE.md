# Login Scripts - Copy & Paste Ready ✅

**USE THESE - They actually work!**

The old scripts had `window.supabase` which doesn't exist. These use the correct import.

---

## 🩺 Doctor Logins

### Dr. Priya Sharma - Cardiology
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','priya.sharma@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

### Dr. Rajesh Kumar - Orthopedics
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','rajesh.kumar@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

### Dr. Anjali Patel - Pediatrics
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','anjali.patel@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

### Dr. Vikram Singh - Neurology
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','vikram.singh@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

### Dr. Meera Reddy - Dermatology
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','meera.reddy@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

### Dr. Arjun Mehta - General Surgery
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','arjun.mehta@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

### Dr. Kavita Desai - Gynecology
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','kavita.desai@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

### Dr. Sanjay Gupta - Ophthalmology
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','sanjay.gupta@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

### Dr. Nisha Kapoor - Psychiatry
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','nisha.kapoor@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

### Dr. Amit Shah - ENT
```javascript
(async()=>{const{supabase}=await import('/src/integrations/supabase/client.ts');const{data}=await supabase.from('doctors').select('id,full_name,email').eq('email','amit.shah@aisurgeonpilot.com').single();localStorage.setItem('doctor_id',data.id);localStorage.setItem('doctor_name',data.full_name);localStorage.setItem('doctor_email',data.email);window.location.href='/doctor/dashboard';})();
```

---

## 👨‍⚕️ Patient Login (with WhatsApp)

**Replace `+919876543210` with YOUR WhatsApp number!**

```javascript
localStorage.setItem('patient_id','test-patient-123');localStorage.setItem('patient_name','Test Patient');localStorage.setItem('patient_email','test@example.com');localStorage.setItem('patient_phone','+919876543210');window.location.href='/doctors';
```

---

## 🚪 Logout

### Logout Doctor
```javascript
localStorage.clear();window.location.href='/';
```

### Logout Patient
```javascript
localStorage.clear();window.location.href='/';
```

---

## 📋 How to Use

1. **Go to:** http://localhost:8086
2. **Open Console:** Press `F12` or `Cmd+Option+I`
3. **Copy any script above**
4. **Paste in console**
5. **Press Enter**
6. **Done!** You'll be redirected to the dashboard

---

## ⚠️ Important Notes

- Must be on http://localhost:8086 first
- Copy the ENTIRE line (it's all one line)
- Patient phone must have +91 (or your country code)
- Format: +919876543210 (no spaces)

---

**Status:** ✅ All scripts tested and working

**Updated:** November 15, 2025

**Use this file instead of `ALL_DOCTOR_CREDENTIALS.md`**
