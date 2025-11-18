# SEED_APPOINTMENTS.sql - Quick Summary

## Files Created

1. **SEED_APPOINTMENTS.sql** (22KB, 616 lines)
   - Main seed script for 120 appointments

2. **README_SEED_APPOINTMENTS.md** (12KB)
   - Complete documentation and usage guide

3. **SEED_DATA_EXECUTION_ORDER.md** (11KB)
   - Step-by-step execution guide

---

## What Gets Created

### 120 Total Appointments

#### Past Appointments: 100 (Last 6 months to yesterday)

**By Status:**
- 70 Completed (58.3%) - With full payment data
- 20 Cancelled (16.7%) - With cancellation reasons
- 10 No-Show (8.3%) - Marked as no-show

**By Type:**
- ~60 OPD appointments (in-person)
- ~30 Online appointments (video/phone)
- ~10 Follow-up appointments

#### Upcoming Appointments: 20 (Tomorrow to next 30 days)

**By Status:**
- 10 Scheduled (pending confirmation)
- 10 Confirmed (reminders sent)

**By Type:**
- ~10 OPD appointments
- ~6 Online appointments
- ~4 Follow-up appointments

---

## Key Features

### Realistic Data Per Specialty

Each appointment includes specialty-specific symptoms:

| Specialty | Example Symptoms |
|-----------|-----------------|
| Orthopedics | Knee pain, back pain, joint issues |
| Cardiology | Chest pain, palpitations, blood pressure |
| Neurology | Headaches, numbness, seizures |
| Gynecology | Pregnancy care, menstrual issues, PCOS |
| Pediatrics | Fever, vaccinations, asthma |
| Dermatology | Acne, rashes, pigmentation |
| General Surgery | Hernia, gallstones, post-op checks |
| ENT | Sinusitis, ear infections, tonsillitis |
| Ophthalmology | Vision problems, cataracts, glaucoma |
| Psychiatry | Depression, anxiety, sleep disorders |

### Payment Tracking

**Completed Appointments (70):**
- Status: Paid
- Methods: Cash, Card, UPI, Online
- Amount: Based on doctor consultation fees
- Follow-up discount: 33% off regular fee

**Cancelled Appointments (20):**
- Some refunded (30%)
- Some pending
- Cancellation reasons provided

**Upcoming Appointments (20):**
- Status: Pending payment
- Payment required: Yes
- Amount: Pre-calculated

### Online Consultation Features

**For Video/Phone Appointments:**
- Google Meet style links generated
- Meeting IDs assigned
- Meeting passwords (where applicable)
- Appropriate for telemedicine testing

### Cancellation Reasons (Realistic)

- Patient fell sick
- Emergency at work
- Transportation issues
- Rescheduled to different time
- Doctor unavailable
- Personal emergency
- Weather conditions
- Feeling better - not needed
- Financial constraints
- Found alternative treatment

### Booking Sources

Distributed across:
- Staff entry
- Patient portal
- WhatsApp bookings
- Phone bookings

### Communication Tracking

- Reminder sent status and timestamp
- Confirmation sent status and timestamp
- Ready for notification system testing

---

## Quick Stats

```
Total Appointments:     120
Total Doctors:          10 (all specialties)
Total Patients:         50
Date Range:             Last 6 months → Next 30 days

Completed:              70 appointments
  - Total Revenue:      ~₹108,000
  - Avg per visit:      ~₹1,543
  - Payment methods:    Cash, Card, UPI, Online

Cancelled:              20 appointments
  - Refunded:           ~6 appointments
  - Pending refund:     ~14 appointments

Upcoming:               20 appointments
  - Scheduled:          10
  - Confirmed:          10
  - Total value:        ~₹31,000

No-Show:                10 appointments
  - Revenue loss:       ~₹15,250
```

---

## Distribution Breakdown

### By Doctor Specialty

Each doctor gets approximately 12 appointments:
- Dr. Murali Krishna (Orthopedics): ~12
- Dr. Priya Sharma (Cardiology): ~12
- Dr. Rajesh Patel (Neurology): ~12
- Dr. Anjali Desai (Gynecology): ~12
- Dr. Amit Kumar (Pediatrics): ~12
- Dr. Sneha Reddy (Dermatology): ~12
- Dr. Vikram Singh (Surgery): ~12
- Dr. Meera Nair (ENT): ~12
- Dr. Arjun Mehta (Ophthalmology): ~12
- Dr. Kavita Iyer (Psychiatry): ~12

### By Appointment Type

| Type | Count | Percentage | Mode |
|------|-------|------------|------|
| OPD | ~72 | 60% | In-person |
| Online | ~36 | 30% | Video/Phone |
| Follow-up | ~12 | 10% | Mixed |

### By Consultation Mode

- In-person: ~75 appointments
- Video: ~25 appointments
- Phone: ~20 appointments

### By Duration

- 30 minutes: ~40 appointments
- 45 minutes: ~40 appointments
- 60 minutes: ~40 appointments

### By Payment Status

| Status | Count | Total Amount |
|--------|-------|--------------|
| Paid | 70 | ₹108,000 |
| Pending | 40 | ₹62,000 |
| Refunded | 6 | ₹9,000 |
| Failed | 4 | ₹6,000 |

---

## Execution Instructions

### Step 1: Prerequisites
```sql
-- Ensure migrations are run:
08_multi_tenant_setup.sql
09_appointments_notifications.sql
```

### Step 2: Run Seed Scripts in Order
```sql
1. SEED_REALISTIC_DATA.sql          -- Creates tenant + 10 doctors
2. SEED_PATIENTS_APPOINTMENTS.sql   -- Creates 50 patients
3. SEED_APPOINTMENTS.sql            -- Creates 120 appointments ← YOU ARE HERE
```

### Step 3: Execute in Supabase
1. Open Supabase SQL Editor
2. Copy entire contents of `SEED_APPOINTMENTS.sql`
3. Click Run
4. Wait 5-15 seconds
5. Check success messages

### Step 4: Verify
```sql
-- Quick verification
SELECT COUNT(*) FROM appointments;  -- Should return 120

-- Status breakdown
SELECT status, COUNT(*) FROM appointments GROUP BY status;

-- Payment summary
SELECT payment_status, COUNT(*), ROUND(SUM(payment_amount), 2)
FROM appointments
WHERE payment_required = true
GROUP BY payment_status;
```

---

## Expected Output (Console Messages)

```
========================================
Starting Appointment Seed Data Creation
========================================
Step 1: Fetching doctor information...
Found 10 doctors
Step 2: Fetching patient information...
Found 50 patients
Step 3: Creating 100 past appointments...
  Created 20 past appointments...
  Created 40 past appointments...
  Created 60 past appointments...
  Created 80 past appointments...
  Created 100 past appointments...
Completed: 100 past appointments created
  - 70 completed appointments
  - 20 cancelled appointments
  - 10 no-show appointments
Step 4: Creating 20 upcoming appointments...
  Created 10 upcoming appointments...
  Created 20 upcoming appointments...
Completed: 20 upcoming appointments created
  - 10 scheduled appointments
  - 10 confirmed appointments

========================================
APPOINTMENT SEED DATA SUMMARY
========================================
Total Appointments Created: 120

Past Appointments (100):
  - Completed: 70 (with payment data)
  - Cancelled: 20 (with cancellation reasons)
  - No-Show: 10

Upcoming Appointments (20):
  - Scheduled: 10
  - Confirmed: 10

Appointment Types:
  - OPD: ~60%
  - Online: ~30%
  - Follow-up: ~10%

Consultation Modes:
  - In-person
  - Video
  - Phone

Distribution across:
  - 10 Doctors (all specialties)
  - 50 Patients
  - Date Range: Last 6 months to next 30 days
========================================
```

---

## Use Cases Covered

### Dashboard Testing
- Today's appointments count
- Upcoming appointments list
- Recent completed appointments
- Revenue statistics

### Calendar View
- Monthly appointment distribution
- Doctor availability
- Patient schedules

### Payment Management
- Pending payments list
- Revenue reports by date/doctor
- Refund tracking
- Payment method distribution

### Appointment Management
- Booking flow
- Cancellation handling
- Rescheduling
- No-show tracking

### Patient Portal
- Patient appointment history
- Upcoming appointments
- Online consultation links
- Payment status

### Reports & Analytics
- Appointment trends
- Cancellation rate
- No-show rate
- Revenue by specialty
- Doctor performance
- Patient retention

### Notification System
- Reminder testing
- Confirmation testing
- WhatsApp integration
- Email notifications

---

## Sample Queries for Testing

### Dashboard: Today's Appointments
```sql
SELECT
  a.appointment_date,
  p.name as patient_name,
  u.name as doctor_name,
  a.status,
  a.appointment_type
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN "User" u ON a.doctor_id = u.id
WHERE DATE(a.appointment_date) = CURRENT_DATE
ORDER BY a.appointment_date;
```

### Revenue Report: This Month
```sql
SELECT
  u.name as doctor_name,
  u.specialty,
  COUNT(*) as total_appointments,
  SUM(CASE WHEN a.payment_status = 'paid' THEN a.payment_amount ELSE 0 END) as revenue,
  COUNT(CASE WHEN a.payment_status = 'pending' THEN 1 END) as pending_payments
FROM appointments a
JOIN "User" u ON a.doctor_id = u.id
WHERE DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.id, u.name, u.specialty
ORDER BY revenue DESC;
```

### Patient History
```sql
SELECT
  p.name,
  p.phone_number,
  COUNT(a.id) as total_visits,
  MAX(a.appointment_date) as last_visit,
  SUM(CASE WHEN a.payment_status = 'paid' THEN a.payment_amount ELSE 0 END) as total_spent
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
GROUP BY p.id, p.name, p.phone_number
ORDER BY total_visits DESC
LIMIT 20;
```

### Cancellation Analysis
```sql
SELECT
  cancellation_reason,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM appointments WHERE status = 'cancelled'), 2) as percentage
FROM appointments
WHERE status = 'cancelled' AND cancellation_reason IS NOT NULL
GROUP BY cancellation_reason
ORDER BY count DESC;
```

### Upcoming Appointments (Next 7 Days)
```sql
SELECT
  a.appointment_date,
  p.name as patient_name,
  p.phone_number,
  u.name as doctor_name,
  a.appointment_type,
  a.status,
  a.payment_status
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN "User" u ON a.doctor_id = u.id
WHERE a.appointment_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY a.appointment_date;
```

---

## Files Reference

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| SEED_APPOINTMENTS.sql | 22KB | 616 | Main seed script |
| README_SEED_APPOINTMENTS.md | 12KB | - | Complete documentation |
| SEED_DATA_EXECUTION_ORDER.md | 11KB | - | Execution guide |
| SEED_APPOINTMENTS_SUMMARY.md | - | - | This quick reference |

---

## Tenant Information

**Tenant ID**: `a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d`

This is the fixed UUID used across all seed scripts for consistency.

---

## Next Steps

After running this script:

1. **Verify Data**: Run verification queries
2. **Test UI**: Check appointment views in application
3. **Test Filters**: Status, date, doctor filters
4. **Test Payments**: Payment tracking and reports
5. **Test Calendar**: Appointment calendar view
6. **Test Reminders**: Notification system
7. **Add More Data**: Consider adding more appointments if needed

---

## Support

For detailed instructions, see:
- `README_SEED_APPOINTMENTS.md` - Complete documentation
- `SEED_DATA_EXECUTION_ORDER.md` - Step-by-step guide

For issues:
- Check prerequisites are met
- Verify seed scripts run in order
- Check Supabase logs for errors
- Run verification queries

---

**Created**: 2025-11-15
**Version**: 1.0
**Script Runtime**: ~5-15 seconds
**Total Records**: 120 appointments
