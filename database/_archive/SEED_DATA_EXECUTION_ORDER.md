# Database Seed Data - Execution Order Guide

## Quick Start

Run these scripts in order to populate your database with realistic test data:

```bash
# 1. Run migrations first (if not already done)
# 2. Then run seed scripts in this exact order:

1. SEED_REALISTIC_DATA.sql          # Tenant + 10 Doctors
2. SEED_PATIENTS_APPOINTMENTS.sql   # 50 Patients
3. SEED_APPOINTMENTS.sql            # 120 Appointments
```

## Detailed Execution Steps

### Prerequisites: Database Migrations

Before running any seed data, ensure these migrations are applied:

```
migrations/08_multi_tenant_setup.sql        # Tenants, users, patients tables
migrations/09_appointments_notifications.sql # Appointments table
```

### Step 1: Create Tenant and Doctors

**File**: `SEED_REALISTIC_DATA.sql`

**What it creates**:
- 1 Tenant (AI Surgeon Pilot Clinic)
- 10 Doctors across specialties
  - Dr. Murali Krishna (Orthopedics)
  - Dr. Priya Sharma (Cardiology)
  - Dr. Rajesh Patel (Neurology)
  - Dr. Anjali Desai (Gynecology & Obstetrics)
  - Dr. Amit Kumar (Pediatrics)
  - Dr. Sneha Reddy (Dermatology)
  - Dr. Vikram Singh (General Surgery)
  - Dr. Meera Nair (ENT)
  - Dr. Arjun Mehta (Ophthalmology)
  - Dr. Kavita Iyer (Psychiatry)

**Run in Supabase**:
```sql
-- Copy and paste contents of SEED_REALISTIC_DATA.sql
-- Execute
```

**Verification**:
```sql
SELECT COUNT(*) FROM tenants;        -- Should return 1
SELECT COUNT(*) FROM "User" WHERE role = 'doctor'; -- Should return 10
```

---

### Step 2: Create Patients

**File**: `SEED_PATIENTS_APPOINTMENTS.sql`

**What it creates**:
- 50 Patients with realistic medical history
  - First 10 patients have detailed profiles
  - Next 40 patients have basic profiles
  - Diverse ages, genders, blood groups
  - Medical histories and conditions
  - Emergency contacts

**Run in Supabase**:
```sql
-- Copy and paste contents of SEED_PATIENTS_APPOINTMENTS.sql
-- Execute
```

**Verification**:
```sql
SELECT COUNT(*) FROM patients;       -- Should return 50
SELECT name, email, phone_number FROM patients LIMIT 10;
```

---

### Step 3: Create Appointments

**File**: `SEED_APPOINTMENTS.sql`

**What it creates**:
- 120 Appointments total

**Past Appointments (100)**:
- 70 Completed (with payment data)
- 20 Cancelled (with cancellation reasons)
- 10 No-Show

**Upcoming Appointments (20)**:
- 10 Scheduled
- 10 Confirmed

**Features**:
- Realistic symptoms per specialty
- Payment tracking
- Meeting links for online consultations
- Booking sources
- Reminder/confirmation tracking

**Run in Supabase**:
```sql
-- Copy and paste contents of SEED_APPOINTMENTS.sql
-- Execute
```

**Verification**:
```sql
SELECT COUNT(*) FROM appointments;   -- Should return 120

-- Status breakdown
SELECT status, COUNT(*) FROM appointments GROUP BY status;

-- Payment summary
SELECT payment_status, COUNT(*), SUM(payment_amount)
FROM appointments
WHERE payment_required = true
GROUP BY payment_status;
```

---

## Complete Database State After All Seeds

### Data Summary

| Table | Records | Details |
|-------|---------|---------|
| tenants | 1 | AI Surgeon Pilot Clinic |
| User (doctors) | 10 | All specialties covered |
| patients | 50 | With medical histories |
| appointments | 120 | 100 past + 20 upcoming |

### Tenant Information

```
ID: a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d
Name: AI Surgeon Pilot Clinic
Slug: aisp-clinic
Plan: Pro (Active)
```

### Doctor Credentials

All doctors use the same password for testing:
```
Password: doctor123
```

Login emails:
```
dr.murali@aisurgeonpilot.com
dr.priya@aisurgeonpilot.com
dr.rajesh@aisurgeonpilot.com
dr.anjali@aisurgeonpilot.com
dr.amit@aisurgeonpilot.com
dr.sneha@aisurgeonpilot.com
dr.vikram@aisurgeonpilot.com
dr.meera@aisurgeonpilot.com
dr.arjun@aisurgeonpilot.com
dr.kavita@aisurgeonpilot.com
```

### Appointment Distribution

**By Specialty**:
- Each doctor has ~12 appointments
- Distributed across all 10 specialties

**By Type**:
- OPD: ~72 appointments (60%)
- Online: ~36 appointments (30%)
- Follow-up: ~12 appointments (10%)

**By Status**:
- Completed: 70
- Cancelled: 20
- No-Show: 10
- Scheduled: 10
- Confirmed: 10

**By Date Range**:
- Past: Last 6 months to yesterday
- Future: Tomorrow to next 30 days

---

## Verification Script

Run this after all seeds to verify everything:

```sql
-- ============================================
-- COMPLETE DATABASE VERIFICATION
-- ============================================

-- 1. Tenant
SELECT 'Tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
-- 2. Doctors
SELECT 'Doctors', COUNT(*) FROM "User" WHERE role = 'doctor'
UNION ALL
-- 3. Patients
SELECT 'Patients', COUNT(*) FROM patients
UNION ALL
-- 4. Appointments
SELECT 'Appointments', COUNT(*) FROM appointments;

-- Appointment status breakdown
SELECT
    'Appointment Status Breakdown' as report,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM appointments
GROUP BY status
ORDER BY count DESC;

-- Payment status breakdown
SELECT
    'Payment Status Breakdown' as report,
    payment_status,
    COUNT(*) as count,
    ROUND(SUM(payment_amount), 2) as total_amount
FROM appointments
WHERE payment_required = true
GROUP BY payment_status
ORDER BY count DESC;

-- Appointment type distribution
SELECT
    'Appointment Type Distribution' as report,
    appointment_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM appointments
GROUP BY appointment_type
ORDER BY count DESC;

-- Doctor appointment load
SELECT
    'Doctor Appointment Load' as report,
    u.name as doctor_name,
    u.specialty,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN a.appointment_date > NOW() THEN 1 END) as upcoming
FROM "User" u
LEFT JOIN appointments a ON u.id = a.doctor_id
WHERE u.role = 'doctor'
GROUP BY u.id, u.name, u.specialty
ORDER BY total_appointments DESC;

-- Revenue summary
SELECT
    'Revenue Summary' as report,
    COUNT(*) as total_paid_appointments,
    ROUND(SUM(payment_amount), 2) as total_revenue,
    ROUND(AVG(payment_amount), 2) as avg_revenue_per_appointment,
    ROUND(MIN(payment_amount), 2) as min_payment,
    ROUND(MAX(payment_amount), 2) as max_payment
FROM appointments
WHERE payment_status = 'paid';

-- Patient appointment history
SELECT
    'Top 10 Patients by Appointments' as report,
    p.name,
    p.phone_number,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN a.appointment_date > NOW() THEN 1 END) as upcoming
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
GROUP BY p.id, p.name, p.phone_number
ORDER BY total_appointments DESC
LIMIT 10;
```

Expected output summary:
```
Tenants:      1
Doctors:      10
Patients:     50
Appointments: 120

Completed:    70 (58.33%)
Cancelled:    20 (16.67%)
Scheduled:    10 (8.33%)
Confirmed:    10 (8.33%)
No-Show:      10 (8.33%)

OPD:          72 (60%)
Online:       36 (30%)
Follow-up:    12 (10%)

Total Revenue: ~₹108,000
Avg per appointment: ~₹1,543
```

---

## Troubleshooting

### Issue: Foreign Key Constraint Violation

**Error**:
```
ERROR: insert or update on table "appointments" violates foreign key constraint
```

**Solution**:
You skipped a seed script. Run them in order:
1. SEED_REALISTIC_DATA.sql (creates doctors)
2. SEED_PATIENTS_APPOINTMENTS.sql (creates patients)
3. SEED_APPOINTMENTS.sql (creates appointments)

---

### Issue: Duplicate Key Error

**Error**:
```
ERROR: duplicate key value violates unique constraint
```

**Solution**:
Data already exists. Either:
- Clear existing data: `DELETE FROM appointments; DELETE FROM patients; DELETE FROM "User" WHERE role='doctor';`
- Or skip re-running that seed script

---

### Issue: Table Does Not Exist

**Error**:
```
ERROR: relation "appointments" does not exist
```

**Solution**:
Run migrations first:
1. migrations/08_multi_tenant_setup.sql
2. migrations/09_appointments_notifications.sql

---

### Issue: No Verification Results

**Problem**: Queries return 0 rows

**Solution**:
Check if transaction committed:
- Ensure `COMMIT;` at end of script executed
- Check for any rollback messages
- Re-run the seed script

---

## Cleaning Up Data

To remove all seeded data and start fresh:

```sql
BEGIN;

-- Delete in reverse order (respects foreign keys)
DELETE FROM appointments;
DELETE FROM patients;
DELETE FROM "User" WHERE role = 'doctor' AND email LIKE '%@aisurgeonpilot.com';
DELETE FROM tenants WHERE slug = 'aisp-clinic';

COMMIT;
```

Then re-run seed scripts in order.

---

## Using Seeded Data in Development

### Frontend Integration

```typescript
// Fetch doctors for dropdown
const { data: doctors } = await supabase
  .from('User')
  .select('id, name, specialty, consultation_fee')
  .eq('role', 'doctor')
  .eq('is_active', true);

// Fetch today's appointments
const { data: todayAppointments } = await supabase
  .from('appointments')
  .select(`
    *,
    patient:patients(name, phone_number),
    doctor:User(name, specialty)
  `)
  .gte('appointment_date', new Date().setHours(0,0,0,0))
  .lte('appointment_date', new Date().setHours(23,59,59,999))
  .order('appointment_date', { ascending: true });

// Fetch pending payments
const { data: pendingPayments } = await supabase
  .from('appointments')
  .select('*, patient:patients(name)')
  .eq('payment_status', 'pending')
  .eq('status', 'completed');
```

### Testing Scenarios

1. **Dashboard**: Should show mix of past and upcoming appointments
2. **Calendar**: Should display appointments across next 30 days
3. **Payment Reports**: Should show ~70 paid appointments with total revenue
4. **Doctor Schedule**: Each doctor should have ~12 appointments
5. **Patient History**: Patients should have 1-5 appointments each
6. **Cancellation Reports**: 20 cancelled with various reasons
7. **No-Show Tracking**: 10 no-show appointments to analyze

---

## Next Steps

After seeding data:

1. **Test Application UI**
   - Dashboard statistics
   - Appointment calendar
   - Patient list
   - Doctor schedule

2. **Test Search/Filter**
   - By status
   - By date range
   - By doctor
   - By patient

3. **Test Payment System**
   - Payment tracking
   - Revenue reports
   - Pending payments list

4. **Test Notifications**
   - Reminder system
   - Confirmation system
   - WhatsApp integration

5. **Add More Seed Data** (Optional)
   - More appointments
   - Medical records
   - Prescriptions
   - Lab reports

---

## File Locations

```
database/
├── migrations/
│   ├── 08_multi_tenant_setup.sql
│   └── 09_appointments_notifications.sql
├── SEED_REALISTIC_DATA.sql
├── SEED_PATIENTS_APPOINTMENTS.sql
├── SEED_APPOINTMENTS.sql
├── README_SEED_APPOINTMENTS.md
└── SEED_DATA_EXECUTION_ORDER.md (this file)
```

---

**Last Updated**: 2025-11-15
**Version**: 1.0
**Total Seed Time**: ~20-30 seconds for all scripts
