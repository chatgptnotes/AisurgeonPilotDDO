# Appointments Debugging Guide

## Problem Analysis

The doctor dashboard shows **0 appointments** even though you mentioned booking one for Priya Sharma.

## Possible Issues

### 1. Query Schema Mismatch
The appointments query is looking for:
```sql
SELECT *,
  patient:patient_id (id, first_name, last_name, phone)
FROM appointments
WHERE doctor_id = 'xxx'
  AND appointment_date = '2025-11-16'
```

**Potential Problems**:
- `patient:patient_id` syntax might be wrong
- Foreign key relationship might not exist
- Column names don't match

### 2. Data Issues
- No appointments were actually created
- Appointments exist but for different doctor_id
- Appointments exist but for different date

## Recommended Approach

### Step 1: Check if appointments exist at all

Run this SQL in Supabase SQL Editor:

```sql
-- Check all appointments
SELECT
  id,
  doctor_id,
  patient_id,
  appointment_date,
  appointment_time,
  status,
  created_at
FROM appointments
ORDER BY created_at DESC
LIMIT 10;
```

### Step 2: Check doctor's ID

Run this to find the doctor's ID:

```sql
-- Find Dr. Priya Sharma's ID
SELECT
  id,
  user_id,
  full_name,
  email
FROM doctors
WHERE email = 'priya.sharma@aisurgeonpilot.com';
```

### Step 3: Check if appointments exist for this doctor

```sql
-- Check appointments for specific doctor
SELECT
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.doctor_id,
  a.patient_id,
  p.first_name,
  p.last_name,
  p.phone
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.doctor_id = '24bef328-5116-443f-8bd2-e9c45f497d3b'
ORDER BY a.appointment_date DESC, a.appointment_time DESC;
```

### Step 4: Check today's appointments specifically

```sql
-- Check today's appointments
SELECT
  a.*,
  p.first_name,
  p.last_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.doctor_id = '24bef328-5116-443f-8bd2-e9c45f497d3b'
  AND a.appointment_date = CURRENT_DATE;
```

## Fix Based on Findings

### If No Appointments Exist
→ The booking process is broken. Need to check BookAppointment component.

### If Appointments Exist But Query Fails
→ The Supabase foreign key syntax is wrong. Need to fix the query.

### If Appointments Exist For Wrong Date
→ Date format mismatch. Need to check how dates are stored vs queried.

## Quick Test

**Open browser console** (F12) and look for:
- Red errors from Supabase queries
- 400/404 responses
- Error messages in console logs

The console will tell us exactly what's failing!

## Next Steps

1. **Open browser console** - Check for errors
2. **Run SQL queries** - Find out what data exists
3. **Fix the query** - Based on what we find
4. **Test booking** - Create a new appointment to verify

Would you like me to:
- Check the browser console errors?
- Write SQL to verify data exists?
- Fix the query based on findings?
