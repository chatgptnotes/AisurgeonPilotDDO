# SEED_APPOINTMENTS.sql - Execution Checklist

## Pre-Execution Checklist

### Prerequisites Verification

- [ ] **Database migrations applied**
  - [ ] `08_multi_tenant_setup.sql` executed
  - [ ] `09_appointments_notifications.sql` executed

- [ ] **Previous seed scripts executed**
  - [ ] `SEED_REALISTIC_DATA.sql` (Creates 1 tenant + 10 doctors)
  - [ ] `SEED_PATIENTS_APPOINTMENTS.sql` (Creates 50 patients)

- [ ] **Verify existing data**
  ```sql
  SELECT COUNT(*) FROM tenants;           -- Should return 1
  SELECT COUNT(*) FROM "User" WHERE role = 'doctor';  -- Should return 10
  SELECT COUNT(*) FROM patients;          -- Should return 50
  ```

### Environment Check

- [ ] **Database connection established**
  - [ ] Supabase project accessible
  - [ ] SQL Editor open and ready

- [ ] **Backup considerations**
  - [ ] No production data at risk (development environment)
  - [ ] Can safely run seed data

---

## Execution Checklist

### Step 1: Open Seed Script

- [ ] Navigate to `/database/SEED_APPOINTMENTS.sql`
- [ ] Open file in text editor
- [ ] Copy entire contents (616 lines)

### Step 2: Execute in Supabase

- [ ] Open Supabase SQL Editor
- [ ] Paste copied script
- [ ] Review script briefly
- [ ] Click "Run" or press Ctrl/Cmd + Enter
- [ ] Wait for execution (5-15 seconds)

### Step 3: Monitor Progress

Watch for console messages:

- [ ] "Starting Appointment Seed Data Creation"
- [ ] "Found 10 doctors"
- [ ] "Found 50 patients"
- [ ] "Created 20 past appointments..."
- [ ] "Created 40 past appointments..."
- [ ] "Created 60 past appointments..."
- [ ] "Created 80 past appointments..."
- [ ] "Created 100 past appointments..."
- [ ] "Completed: 100 past appointments created"
- [ ] "Created 10 upcoming appointments..."
- [ ] "Created 20 upcoming appointments..."
- [ ] "Completed: 20 upcoming appointments created"
- [ ] "APPOINTMENT SEED DATA SUMMARY"

### Step 4: Check for Errors

- [ ] No SQL syntax errors
- [ ] No foreign key constraint violations
- [ ] No unique constraint violations
- [ ] Transaction committed successfully

---

## Post-Execution Verification

### Basic Counts

Run these queries and verify counts:

```sql
-- Total appointments
SELECT COUNT(*) FROM appointments;  -- Should return: 120
```

- [ ] **120 total appointments created**

```sql
-- Status breakdown
SELECT status, COUNT(*) FROM appointments GROUP BY status ORDER BY COUNT DESC;
```

Expected results:
- [ ] completed: 70
- [ ] cancelled: 20
- [ ] scheduled: 10
- [ ] confirmed: 10
- [ ] no_show: 10

### Appointment Type Distribution

```sql
SELECT appointment_type, COUNT(*) FROM appointments GROUP BY appointment_type;
```

Expected approximately:
- [ ] opd: ~72 (60%)
- [ ] online: ~36 (30%)
- [ ] followup: ~12 (10%)

### Payment Verification

```sql
SELECT payment_status, COUNT(*), ROUND(SUM(payment_amount), 2)
FROM appointments
WHERE payment_required = true
GROUP BY payment_status;
```

Expected:
- [ ] paid: 70 appointments, ~₹108,000
- [ ] pending: 40+ appointments
- [ ] refunded: ~6 appointments
- [ ] Some failed payments possible

### Date Range Verification

```sql
-- Past appointments
SELECT COUNT(*) FROM appointments
WHERE appointment_date < CURRENT_DATE;
-- Should return: 100

-- Upcoming appointments
SELECT COUNT(*) FROM appointments
WHERE appointment_date > CURRENT_DATE;
-- Should return: 20
```

- [ ] 100 past appointments
- [ ] 20 upcoming appointments

### Doctor Distribution

```sql
SELECT u.name, u.specialty, COUNT(a.id) as appointment_count
FROM "User" u
LEFT JOIN appointments a ON u.id = a.doctor_id
WHERE u.role = 'doctor'
GROUP BY u.id, u.name, u.specialty
ORDER BY appointment_count DESC;
```

- [ ] All 10 doctors have appointments
- [ ] Each doctor has ~12 appointments
- [ ] No doctor has 0 appointments

### Patient Distribution

```sql
SELECT COUNT(DISTINCT patient_id) FROM appointments;
-- Should return between 40-50 (not all patients may have appointments)
```

- [ ] Multiple patients have appointments
- [ ] Distribution across patient base

### Specialty-Specific Symptoms

```sql
SELECT DISTINCT symptoms FROM appointments LIMIT 20;
```

- [ ] Symptoms are realistic
- [ ] Symptoms match specialties
- [ ] No generic placeholder text

### Online Consultation Data

```sql
SELECT COUNT(*) FROM appointments
WHERE consultation_mode IN ('video', 'phone')
AND meeting_link IS NOT NULL;
```

- [ ] Online appointments have meeting links
- [ ] Links follow Google Meet format
- [ ] Meeting IDs generated

### Cancellation Data

```sql
SELECT cancellation_reason, COUNT(*) FROM appointments
WHERE status = 'cancelled'
GROUP BY cancellation_reason;
```

- [ ] Cancelled appointments have reasons
- [ ] 10 different cancellation reasons used
- [ ] Reasons are realistic

### Notification Tracking

```sql
SELECT
  COUNT(CASE WHEN reminder_sent THEN 1 END) as reminders_sent,
  COUNT(CASE WHEN confirmation_sent THEN 1 END) as confirmations_sent
FROM appointments;
```

- [ ] Most appointments have reminders sent
- [ ] Completed/confirmed appointments have confirmations
- [ ] Timestamps recorded for sent notifications

---

## Data Quality Checks

### Revenue Calculation

```sql
SELECT
  COUNT(*) as paid_appointments,
  ROUND(SUM(payment_amount), 2) as total_revenue,
  ROUND(AVG(payment_amount), 2) as avg_revenue
FROM appointments
WHERE payment_status = 'paid';
```

Expected:
- [ ] 70 paid appointments
- [ ] Total revenue: ₹105,000 - ₹110,000
- [ ] Average revenue: ₹1,500 - ₹1,600

### Booking Source Distribution

```sql
SELECT booking_source, COUNT(*) FROM appointments GROUP BY booking_source;
```

- [ ] All 4 booking sources represented
- [ ] Reasonable distribution (staff, patient_portal, whatsapp, phone)

### Duration Distribution

```sql
SELECT duration_minutes, COUNT(*) FROM appointments GROUP BY duration_minutes;
```

- [ ] Only 30, 45, 60 minute durations
- [ ] Roughly equal distribution

### Consultation Mode by Type

```sql
SELECT appointment_type, consultation_mode, COUNT(*)
FROM appointments
GROUP BY appointment_type, consultation_mode
ORDER BY appointment_type, COUNT DESC;
```

- [ ] OPD appointments are in_person
- [ ] Online appointments are video or phone
- [ ] Follow-up appointments are mixed

---

## Application Integration Tests

### Dashboard View

- [ ] Open application dashboard
- [ ] Verify appointment counts display correctly
- [ ] Check today's appointments (if any)
- [ ] Verify upcoming appointments list

### Calendar View

- [ ] Open appointment calendar
- [ ] Verify appointments show on correct dates
- [ ] Check past 6 months have data
- [ ] Check next 30 days have data
- [ ] Verify doctor-wise filtering works

### Doctor Schedule

- [ ] Open individual doctor schedules
- [ ] Verify each doctor has ~12 appointments
- [ ] Check appointments span correct date range
- [ ] Verify specialty-specific symptoms

### Patient History

- [ ] Open patient profiles
- [ ] Verify appointment history displays
- [ ] Check completed appointments show payment status
- [ ] Verify upcoming appointments listed

### Payment Reports

- [ ] Open payment/revenue reports
- [ ] Verify total revenue ~₹108,000
- [ ] Check pending payments listed
- [ ] Verify payment method distribution

### Filter/Search Testing

- [ ] Filter by status (completed, cancelled, etc.)
- [ ] Filter by date range
- [ ] Filter by doctor
- [ ] Filter by patient
- [ ] Search by appointment ID

### Notification System

- [ ] Check appointments marked for reminders
- [ ] Verify confirmation status
- [ ] Test notification sending (if implemented)

---

## Troubleshooting

### If count is not 120

**Problem**: `SELECT COUNT(*) FROM appointments` returns different number

**Solutions**:
1. Check for error messages during execution
2. Verify foreign key constraints (doctors and patients exist)
3. Re-run the script (it uses gen_random_uuid, won't duplicate)
4. Check transaction committed

### If no past appointments

**Problem**: All appointments are in the future

**Solutions**:
1. Check server timezone settings
2. Verify NOW() function returns correct time
3. Check interval calculations in script

### If no payment data

**Problem**: All payment_status is NULL or pending

**Solutions**:
1. Verify completed appointments were created
2. Check payment_status logic in script
3. Confirm payment_required is set to true

### If symptoms don't match specialties

**Problem**: Orthopedic symptoms on cardiology appointments

**Solutions**:
1. Re-run script (randomization issue)
2. Check CASE statement logic in script
3. Verify doctor_specialties array populated correctly

### If verification queries fail

**Problem**: Queries return errors

**Solutions**:
1. Ensure script completed successfully
2. Check COMMIT statement executed
3. Refresh schema cache
4. Verify table structure matches migration

---

## Cleanup (If Needed)

To remove all seeded appointment data:

```sql
BEGIN;

-- Delete all appointments
DELETE FROM appointments
WHERE tenant_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d'::uuid;

-- Verify deletion
SELECT COUNT(*) FROM appointments;  -- Should return 0

COMMIT;
```

- [ ] Backup created before cleanup
- [ ] Cleanup script executed
- [ ] Verification confirms 0 appointments
- [ ] Ready to re-run seed script

---

## Re-running the Script

The script is safe to run multiple times because:
- Uses `gen_random_uuid()` for IDs (no duplicates)
- No unique constraints on appointment data
- Will create 120 new appointments each time

To re-run:
- [ ] Clear existing appointments (optional)
- [ ] Copy script again
- [ ] Execute in SQL Editor
- [ ] Verify new count (120 or 240+ if not cleared)

---

## Success Criteria

### Script Execution

- [x] Script runs without errors
- [x] All 120 appointments created
- [x] Transaction committed successfully
- [x] Console messages display correctly

### Data Quality

- [x] Realistic symptoms per specialty
- [x] Proper date distribution (past and future)
- [x] Payment data complete for completed appointments
- [x] Cancellation reasons for cancelled appointments
- [x] Meeting links for online consultations

### Distribution

- [x] 70 completed, 20 cancelled, 10 no-show, 20 upcoming
- [x] 60% OPD, 30% online, 10% follow-up
- [x] All 10 doctors have appointments
- [x] 40-50 patients involved
- [x] Dates span 6 months past to 30 days future

### Application Integration

- [x] Dashboard displays correctly
- [x] Calendar shows appointments
- [x] Filters and search work
- [x] Payment reports accurate
- [x] Doctor schedules populated

---

## Documentation Reference

For detailed information, refer to:

1. **README_SEED_APPOINTMENTS.md**
   - Complete documentation
   - Usage instructions
   - Troubleshooting guide
   - Customization options

2. **SEED_DATA_EXECUTION_ORDER.md**
   - Step-by-step execution guide
   - Prerequisites detail
   - Verification queries
   - Integration examples

3. **SEED_APPOINTMENTS_SUMMARY.md**
   - Quick reference
   - Statistics overview
   - Sample queries
   - Use cases

4. **SEED_APPOINTMENTS_COMPLETE.txt**
   - Visual overview
   - ASCII art diagrams
   - Quick stats

---

## Sign-off

### Executed By

- Name: ________________
- Date: ________________
- Time: ________________

### Verification Completed

- [ ] All checks passed
- [ ] Data quality verified
- [ ] Application tested
- [ ] Documentation reviewed

### Notes

```
Any issues encountered:




Resolution:




```

---

**Version**: 1.0
**Created**: 2025-11-15
**Last Updated**: 2025-11-15
**Script**: SEED_APPOINTMENTS.sql
