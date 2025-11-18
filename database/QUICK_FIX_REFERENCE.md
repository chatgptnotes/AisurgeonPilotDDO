# Quick Reference: Database Schema Fix

## TL;DR - Just Run These:

### Using Supabase SQL Editor:
1. Go to: https://supabase.com/dashboard → SQL Editor
2. Copy/paste and run in order:

```sql
-- Step 1: Fix doctors table
-- Paste contents of: database/migrations/CORRECT_03_fix_doctors_columns.sql

-- Step 2: Fix appointments table
-- Paste contents of: database/migrations/CORRECT_04_fix_appointments_columns.sql

-- Step 3: Seed data (if tables empty)
-- Paste contents of: database/migrations/CORRECT_02_seed_data.sql
```

### Using Command Line:
```bash
cd /Users/murali/Desktop/Project/aisurgeonapp/aisurgeonpilot.com

# Replace YOUR_DB_URL with actual Supabase connection string
export DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Run migrations
psql "$DB_URL" -f database/migrations/CORRECT_03_fix_doctors_columns.sql
psql "$DB_URL" -f database/migrations/CORRECT_04_fix_appointments_columns.sql
psql "$DB_URL" -f database/migrations/CORRECT_02_seed_data.sql

# Verify
psql "$DB_URL" -f database/verify-schema.sql
```

---

## What Gets Fixed:

### Doctors Table:
- ✅ Rename: `consultation_fee` → `consultation_fee_standard`
- ✅ Rename: `followup_fee` → `consultation_fee_followup`
- ✅ Add: `currency`, `rating_avg`, `rating_count`, `is_verified`, `is_accepting_patients`

### Appointments Table:
- ✅ Add: `currency`, `discount_amount`, `coupon_code`, `meeting_link`, `symptoms`, `reason`, `booked_by`

---

## Quick Verification:

```sql
-- Check if migration needed
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors'
        AND column_name = 'consultation_fee'
    )
    THEN 'NEED TO RUN MIGRATIONS'
    ELSE 'ALREADY FIXED'
    END as status;
```

---

## Files You Have:

| File | Purpose |
|------|---------|
| `CORRECT_03_fix_doctors_columns.sql` | Fix doctors table |
| `CORRECT_04_fix_appointments_columns.sql` | Fix appointments table |
| `CORRECT_02_seed_data.sql` | Seed 10 doctors, 50 patients, 120 appointments |
| `verify-schema.sql` | Verify everything worked |
| `SCHEMA_FIX_GUIDE.md` | Complete documentation |
| `SCHEMA_FIX_SUMMARY.md` | This fix summary |

---

## One-Line Test:

After running migrations, test with:
```sql
SELECT full_name, consultation_fee_standard, currency, rating_avg
FROM doctors LIMIT 3;
```

Should see:
```
      full_name       | consultation_fee_standard | currency | rating_avg
----------------------|---------------------------|----------|------------
 Dr. Ramesh Kumar     |                   1200.00 | INR      |       4.70
 Dr. Priya Sharma     |                   1500.00 | INR      |       4.80
 Dr. Suresh Reddy     |                   1800.00 | INR      |       4.90
```

---

## Rollback (If Needed):

```sql
-- Revert doctors table
ALTER TABLE doctors
  DROP COLUMN currency, DROP COLUMN rating_avg,
  DROP COLUMN rating_count, DROP COLUMN is_verified,
  DROP COLUMN is_accepting_patients;

ALTER TABLE doctors
  RENAME COLUMN consultation_fee_standard TO consultation_fee;

ALTER TABLE doctors
  RENAME COLUMN consultation_fee_followup TO followup_fee;

-- Revert appointments table
ALTER TABLE appointments
  DROP COLUMN currency, DROP COLUMN discount_amount,
  DROP COLUMN coupon_code, DROP COLUMN meeting_link,
  DROP COLUMN symptoms, DROP COLUMN reason, DROP COLUMN booked_by;
```

---

## Support:

- **Stuck?** Read: `/database/SCHEMA_FIX_GUIDE.md`
- **Need details?** Read: `/database/SCHEMA_FIX_SUMMARY.md`
- **Want to verify?** Run: `/database/verify-schema.sql`

---

**Status**: Ready to deploy
**Safe to run**: Multiple times (idempotent)
**Data loss risk**: None
**Estimated time**: 2-3 minutes
