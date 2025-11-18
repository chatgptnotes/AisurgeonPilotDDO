# SEED_APPOINTMENTS.sql - Comprehensive Appointment Data

## Overview

This SQL script generates 120 realistic appointment records for the AI Surgeon Pilot platform, including both past and upcoming appointments with complete payment and consultation data.

## Features

### Data Generated

#### 100 Past Appointments (Last 6 months to yesterday)
- **70 Completed** - Full payment data, consultation records
- **20 Cancelled** - Cancellation reasons, potential refunds
- **10 No-Show** - Marked as no-show with notes

#### 20 Upcoming Appointments (Tomorrow to next 30 days)
- **10 Scheduled** - Pending confirmation
- **10 Confirmed** - Confirmed with reminders sent

### Appointment Distribution

#### By Type
- **OPD (60%)** - In-person consultations
- **Online (30%)** - Video/Phone consultations
- **Follow-up (10%)** - Follow-up visits

#### By Consultation Mode
- **In-person** - Traditional clinic visits
- **Video** - Online video consultations (with Google Meet links)
- **Phone** - Phone consultations

#### By Specialty
Distributed across all 10 doctors:
- Orthopedics
- Cardiology
- Neurology
- Gynecology & Obstetrics
- Pediatrics
- Dermatology
- General Surgery
- ENT (Ear, Nose, Throat)
- Ophthalmology
- Psychiatry

### Realistic Data Included

#### For Each Appointment
- Patient ID (from 50 seeded patients)
- Doctor ID (from 10 seeded doctors)
- Appointment date and time
- Duration (30, 45, or 60 minutes)
- Department matching doctor specialty
- Realistic symptoms/reason for visit
- Consultation notes (for completed)
- Meeting links (for online consultations)

#### Payment Data (for completed appointments)
- Payment amount based on doctor fees
- Payment method (cash, card, UPI, online)
- Payment status (paid, pending, refunded)
- Payment date and transaction tracking
- Follow-up fee discount (67% of consultation fee)

#### Cancellation Data (for cancelled appointments)
- Cancellation reason from realistic list:
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
- Cancellation timestamp
- Refund status where applicable

#### Booking & Communication
- Booking source (staff, patient_portal, whatsapp, phone)
- Reminder sent status and timestamp
- Confirmation sent status and timestamp

## Prerequisites

Before running this script, ensure you have:

1. **Database Setup** - Run migrations in order:
   ```
   08_multi_tenant_setup.sql
   09_appointments_notifications.sql
   ```

2. **Seed Data** - Run these seed scripts first:
   ```
   SEED_REALISTIC_DATA.sql      (Creates tenant and 10 doctors)
   SEED_PATIENTS_APPOINTMENTS.sql (Creates 50 patients)
   ```

## How to Run

### Option 1: Supabase SQL Editor

1. Open your Supabase project
2. Go to SQL Editor
3. Create a new query
4. Copy the entire contents of `SEED_APPOINTMENTS.sql`
5. Click "Run" or press Ctrl/Cmd + Enter
6. Wait for completion messages

### Option 2: PostgreSQL Command Line

```bash
psql -h <your-host> -U <your-user> -d <your-database> -f database/SEED_APPOINTMENTS.sql
```

### Option 3: pgAdmin

1. Open pgAdmin
2. Connect to your database
3. Tools > Query Tool
4. Open File > Select `SEED_APPOINTMENTS.sql`
5. Execute (F5)

## Execution Time

- Expected runtime: 5-15 seconds
- Creates 120 appointment records
- Performs data validation and linking

## Output & Verification

### Console Messages

The script provides detailed progress output:

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
...
```

### Verification Queries

The script includes 4 verification queries that automatically run:

#### 1. Appointment Summary by Status
```sql
SELECT status, COUNT(*) as count, ROUND(AVG(payment_amount), 2) as avg_payment
FROM public.appointments
GROUP BY status
ORDER BY count DESC;
```

Expected output:
```
   status    | count | avg_payment
-------------+-------+-------------
 completed   |    70 |     1542.86
 cancelled   |    20 |     1475.00
 scheduled   |    10 |     1583.33
 confirmed   |    10 |     1608.50
 no_show     |    10 |     1525.00
```

#### 2. Appointment Summary by Type and Mode
```sql
SELECT appointment_type, COUNT(*) as count, consultation_mode, COUNT(*) as mode_count
FROM public.appointments
GROUP BY appointment_type, consultation_mode
ORDER BY appointment_type, mode_count DESC;
```

#### 3. Appointment Summary by Doctor Specialty
Shows distribution of appointments across all specialties with status breakdown.

#### 4. Payment Summary
```sql
SELECT payment_status, COUNT(*) as count, ROUND(SUM(payment_amount), 2) as total_amount
FROM public.appointments
WHERE payment_required = true
GROUP BY payment_status
ORDER BY count DESC;
```

## Data Quality Features

### Realistic Symptoms by Specialty

Each appointment includes specialty-specific symptoms:

- **Orthopedics**: Knee pain, back pain, joint issues
- **Cardiology**: Chest pain, palpitations, blood pressure
- **Neurology**: Headaches, numbness, seizures
- **Gynecology**: Pregnancy care, menstrual issues, PCOS
- **Pediatrics**: Fever, vaccinations, asthma
- **Dermatology**: Acne, rashes, pigmentation
- **Surgery**: Hernia, gallstones, post-op checks
- **ENT**: Sinusitis, ear infections, tonsillitis
- **Ophthalmology**: Vision problems, cataract, glaucoma
- **Psychiatry**: Depression, anxiety, sleep disorders

### Smart Date Distribution

- Past appointments: Evenly distributed over last 6 months
- Upcoming appointments: Spread across next 30 days
- No appointments on current day
- Realistic appointment times

### Payment Logic

- Completed appointments marked as "paid"
- 30% of cancelled appointments get refunds
- Follow-up appointments have reduced fees (67% of regular)
- Payment methods randomly assigned
- Transaction IDs for tracking

### Online Consultation Data

- Video/phone consultations include meeting links
- Google Meet style URLs generated
- Meeting IDs for reference
- Appropriate for telemedicine features

## Database Schema Reference

### appointments Table Key Fields

```sql
- id: UUID (Primary Key)
- tenant_id: UUID (References tenants)
- patient_id: UUID (References patients)
- doctor_id: UUID (References User)
- appointment_date: TIMESTAMP WITH TIME ZONE
- appointment_end_time: TIMESTAMP WITH TIME ZONE
- duration_minutes: INTEGER
- appointment_type: VARCHAR(50) [opd, online, followup, emergency]
- consultation_mode: VARCHAR(50) [in_person, video, phone]
- status: VARCHAR(50) [scheduled, confirmed, in_progress, completed, cancelled, no_show]
- department: VARCHAR(100)
- reason: TEXT
- symptoms: TEXT
- notes: TEXT
- cancellation_reason: TEXT
- meeting_link: TEXT
- payment_required: BOOLEAN
- payment_amount: DECIMAL(10,2)
- payment_status: VARCHAR(50) [pending, paid, failed, refunded]
- payment_method: VARCHAR(50) [cash, card, upi, online]
- booking_source: VARCHAR(50) [staff, patient_portal, whatsapp, phone]
- reminder_sent: BOOLEAN
- confirmation_sent: BOOLEAN
```

## Troubleshooting

### Error: "relation appointments does not exist"
**Solution**: Run migration `09_appointments_notifications.sql` first

### Error: "insert or update on table appointments violates foreign key constraint"
**Solution**: Ensure you've run:
1. `SEED_REALISTIC_DATA.sql` (for doctors)
2. `SEED_PATIENTS_APPOINTMENTS.sql` (for patients)

### Error: "Found 0 doctors" or "Found 0 patients"
**Solution**: The prerequisite seed scripts weren't run. Execute them in order.

### No data appears in verification queries
**Solution**: Check for transaction rollback. Ensure script commits successfully.

## Customization

### Adjust Number of Appointments

In the script, modify these loops:

```sql
-- Change 100 to desired number of past appointments
FOR i IN 1..100 LOOP

-- Change 20 to desired number of upcoming appointments
FOR i IN 1..20 LOOP
```

### Adjust Status Distribution

Modify the conditional logic:

```sql
-- Current: 70% completed, 20% cancelled, 10% no_show
IF i <= 70 THEN
    random_status := 'completed';
ELSIF i <= 90 THEN
    random_status := 'cancelled';
ELSE
    random_status := 'no_show';
END IF;
```

### Adjust Date Range

Change the interval calculations:

```sql
-- Past appointments: last 6 months
random_date := NOW() - INTERVAL '1 day' - (random() * INTERVAL '6 months');

-- Upcoming: next 30 days
random_date := NOW() + INTERVAL '1 day' + (random() * INTERVAL '30 days');
```

### Add More Symptoms

Add to the symptom arrays at the top of the script:

```sql
symptoms_orthopedics TEXT[] := ARRAY[
    'Knee pain and swelling',
    'Lower back pain radiating to leg',
    'Your new symptom here'
];
```

## Integration with Application

### Fetching Appointments in Your App

```typescript
// Fetch upcoming appointments
const { data: upcomingAppointments } = await supabase
  .from('appointments')
  .select(`
    *,
    patient:patients(*),
    doctor:User(*)
  `)
  .gte('appointment_date', new Date().toISOString())
  .eq('status', 'confirmed')
  .order('appointment_date', { ascending: true });

// Fetch completed appointments
const { data: completedAppointments } = await supabase
  .from('appointments')
  .select('*')
  .eq('status', 'completed')
  .eq('payment_status', 'paid')
  .order('appointment_date', { ascending: false });
```

### Dashboard Statistics

```sql
-- Today's appointments
SELECT COUNT(*) FROM appointments
WHERE DATE(appointment_date) = CURRENT_DATE
AND status IN ('scheduled', 'confirmed');

-- Revenue this month
SELECT SUM(payment_amount) FROM appointments
WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
AND payment_status = 'paid';

-- Cancellation rate
SELECT
  ROUND(
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*), 2
  ) as cancellation_rate
FROM appointments
WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days';
```

## Next Steps

After running this script:

1. **Verify Data**: Run the included verification queries
2. **Test UI**: Check appointment listings in your application
3. **Test Filters**: Verify filtering by status, date, doctor works
4. **Test Payments**: Check payment tracking and reports
5. **Test Reminders**: Verify reminder system with seeded data

## Related Scripts

- `SEED_REALISTIC_DATA.sql` - Creates tenant and doctors
- `SEED_PATIENTS_APPOINTMENTS.sql` - Creates patients
- `09_appointments_notifications.sql` - Appointments table migration

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check Supabase logs for detailed error messages
4. Review the verification queries output

## Version History

- **v1.0** (2025-11-15)
  - Initial release
  - 120 appointments (100 past, 20 upcoming)
  - Complete payment and cancellation data
  - All 10 specialties covered
  - Realistic symptoms and consultation data

---

**Tenant ID Used**: `a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d`

**Total Records**: 120 appointments
**Total Lines**: 616
**Execution Time**: ~5-15 seconds
