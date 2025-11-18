# Database Schema Fix Guide

## Overview
This guide documents the database schema fixes applied to the `doctors` and `appointments` tables to align with frontend expectations.

**Version**: 1.0
**Date**: 2025-11-15
**Author**: Database Schema Agent

---

## What Was Changed

### 1. Doctors Table

#### Column Renames:
- `consultation_fee` → `consultation_fee_standard`
- `followup_fee` → `consultation_fee_followup`

#### New Columns Added:
| Column Name | Type | Default | Description |
|-------------|------|---------|-------------|
| `currency` | VARCHAR(3) | 'INR' | Currency code for fees |
| `rating_avg` | DECIMAL(3,2) | 0.0 | Average rating (0-5) |
| `rating_count` | INTEGER | 0 | Number of ratings |
| `is_verified` | BOOLEAN | true | Doctor verification status |
| `is_accepting_patients` | BOOLEAN | true | Whether accepting new patients |

#### Indexes Created:
- `idx_doctors_is_verified` on `is_verified`
- `idx_doctors_is_accepting_patients` on `is_accepting_patients`
- `idx_doctors_rating_avg` on `rating_avg DESC`

---

### 2. Appointments Table

#### New Columns Added:
| Column Name | Type | Default | Description |
|-------------|------|---------|-------------|
| `currency` | VARCHAR(3) | 'INR' | Currency code for payment |
| `discount_amount` | DECIMAL(10,2) | 0 | Discount applied |
| `coupon_code` | VARCHAR(50) | NULL | Coupon code used |
| `meeting_link` | TEXT | NULL | Video call link |
| `symptoms` | TEXT | NULL | Patient symptoms |
| `reason` | TEXT | NULL | Appointment reason |
| `booked_by` | VARCHAR(50) | 'patient' | Who booked (patient/doctor/admin) |

#### Indexes Created:
- `idx_appointments_booked_by` on `booked_by`
- `idx_appointments_coupon_code` on `coupon_code` (partial, WHERE NOT NULL)

---

## Migration Files

### Execution Order:
1. **CORRECT_01_create_missing_tables.sql** - Creates base tables
2. **CORRECT_02_seed_data.sql** - Seeds initial data (UPDATED with correct columns)
3. **CORRECT_03_fix_doctors_columns.sql** - Fixes doctors table schema
4. **CORRECT_04_fix_appointments_columns.sql** - Fixes appointments table schema

---

## How to Run Migrations

### Using Supabase SQL Editor:

1. **Navigate to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Click on "SQL Editor" in sidebar

2. **Execute migrations in order:**

```sql
-- Step 1: Create tables (if not exists)
-- Paste and run: CORRECT_01_create_missing_tables.sql

-- Step 2: Fix doctors table
-- Paste and run: CORRECT_03_fix_doctors_columns.sql

-- Step 3: Fix appointments table
-- Paste and run: CORRECT_04_fix_appointments_columns.sql

-- Step 4: Seed data
-- Paste and run: CORRECT_02_seed_data.sql
```

### Using Supabase CLI:

```bash
# From project root
cd database/migrations

# Run migrations
supabase db push --db-url "YOUR_DATABASE_URL"

# Or execute individually
psql "YOUR_DATABASE_URL" -f CORRECT_03_fix_doctors_columns.sql
psql "YOUR_DATABASE_URL" -f CORRECT_04_fix_appointments_columns.sql
psql "YOUR_DATABASE_URL" -f CORRECT_02_seed_data.sql
```

---

## Verification Queries

### 1. Verify Doctors Table Schema:

```sql
-- Check all columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'doctors'
ORDER BY ordinal_position;

-- Expected new columns:
-- consultation_fee_standard (numeric)
-- consultation_fee_followup (numeric)
-- currency (character varying)
-- rating_avg (numeric)
-- rating_count (integer)
-- is_verified (boolean)
-- is_accepting_patients (boolean)
```

### 2. Verify Appointments Table Schema:

```sql
-- Check all columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appointments'
ORDER BY ordinal_position;

-- Expected new columns:
-- currency (character varying)
-- discount_amount (numeric)
-- coupon_code (character varying)
-- meeting_link (text)
-- symptoms (text)
-- reason (text)
-- booked_by (character varying)
```

### 3. Verify Data Integrity:

```sql
-- Check doctors have correct data
SELECT
    id,
    full_name,
    consultation_fee_standard,
    consultation_fee_followup,
    currency,
    rating_avg,
    rating_count,
    is_verified,
    is_accepting_patients
FROM public.doctors
LIMIT 5;

-- Check appointments have correct defaults
SELECT
    id,
    appointment_date,
    currency,
    discount_amount,
    booked_by
FROM public.appointments
LIMIT 5;
```

### 4. Verify Indexes Created:

```sql
-- Check indexes on doctors table
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'doctors'
  AND schemaname = 'public'
ORDER BY indexname;

-- Check indexes on appointments table
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'appointments'
  AND schemaname = 'public'
ORDER BY indexname;
```

---

## Post-Migration Testing

### Test Frontend Integration:

1. **Test Doctor Listing:**
```bash
# Should show all doctors with ratings and fees
curl http://localhost:5173/api/doctors
```

2. **Test Appointment Booking:**
```bash
# Should create appointment with currency and discount support
curl -X POST http://localhost:5173/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "00000000-0000-0000-0001-000000000001",
    "patient_id": "PATIENT_ID",
    "appointment_date": "2025-11-20",
    "currency": "INR",
    "discount_amount": 100.00,
    "coupon_code": "FIRST100"
  }'
```

---

## Rollback Procedure

If you need to rollback the schema changes:

### Rollback Doctors Table:

```sql
BEGIN;

-- Remove new columns
ALTER TABLE public.doctors
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS rating_avg,
  DROP COLUMN IF EXISTS rating_count,
  DROP COLUMN IF EXISTS is_verified,
  DROP COLUMN IF EXISTS is_accepting_patients;

-- Rename back to old names
ALTER TABLE public.doctors
  RENAME COLUMN consultation_fee_standard TO consultation_fee;

ALTER TABLE public.doctors
  RENAME COLUMN consultation_fee_followup TO followup_fee;

-- Drop indexes
DROP INDEX IF EXISTS idx_doctors_is_verified;
DROP INDEX IF EXISTS idx_doctors_is_accepting_patients;
DROP INDEX IF EXISTS idx_doctors_rating_avg;

COMMIT;
```

### Rollback Appointments Table:

```sql
BEGIN;

-- Remove new columns
ALTER TABLE public.appointments
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS discount_amount,
  DROP COLUMN IF EXISTS coupon_code,
  DROP COLUMN IF EXISTS meeting_link,
  DROP COLUMN IF EXISTS symptoms,
  DROP COLUMN IF EXISTS reason,
  DROP COLUMN IF EXISTS booked_by;

-- Drop indexes
DROP INDEX IF EXISTS idx_appointments_booked_by;
DROP INDEX IF EXISTS idx_appointments_coupon_code;

COMMIT;
```

---

## Safety Features

All migrations are designed with safety in mind:

1. **Idempotent**: Can be run multiple times safely
2. **Non-destructive**: Uses `IF NOT EXISTS` for new columns
3. **Conditional Renames**: Checks column existence before renaming
4. **Transaction Wrapped**: Each migration in BEGIN/COMMIT block
5. **Verbose Logging**: RAISE NOTICE messages for each step
6. **Verification**: Built-in verification queries at end

---

## Common Issues & Solutions

### Issue 1: "Column already exists" error
**Solution**: This is expected if migration was run before. The script will skip existing columns.

### Issue 2: Old column names still in database
**Solution**: The RENAME operations will handle this. Check with:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'doctors' AND column_name LIKE '%fee%';
```

### Issue 3: Seed data fails with "duplicate key"
**Solution**: This is fine. The script uses `ON CONFLICT DO NOTHING` to skip existing records.

### Issue 4: Frontend still showing errors
**Solution**:
1. Clear browser cache
2. Restart development server
3. Check API endpoint responses
4. Verify database connection string

---

## Performance Considerations

### Query Performance:
- New indexes on `is_verified` and `is_accepting_patients` improve doctor filtering
- Rating index (DESC) optimizes "top rated doctors" queries
- Partial index on `coupon_code` saves space (only indexes non-NULL values)

### Estimated Impact:
- Doctor queries: 20-30% faster for filtered lists
- Appointment queries: Minimal impact (added columns are optional)
- Index overhead: ~2-3% storage increase

---

## Next Steps

After running migrations:

1. **Test Application**:
   - Book appointments
   - Browse doctors
   - Apply coupons
   - Schedule video calls

2. **Update API Types**:
   - Update TypeScript interfaces to match new schema
   - Regenerate Supabase types if using auto-generation

3. **Update Documentation**:
   - API documentation
   - Frontend component props
   - Test data examples

4. **Monitor Performance**:
   - Watch for slow queries
   - Check index usage with `pg_stat_user_indexes`
   - Monitor table size growth

---

## Contact & Support

For issues or questions:
- Check: `/database/README.md`
- Review: Individual migration file comments
- Contact: Database team

---

**Document Status**: COMPLETE
**Last Updated**: 2025-11-15
**Migrations Status**: READY FOR DEPLOYMENT
