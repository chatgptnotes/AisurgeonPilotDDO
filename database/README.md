# Database Setup Guide

**AI Surgeon Pilot - Multi-Tenant Healthcare Platform**

---

## 📁 Folder Structure

```
database/
├── README.md                              ← You are here
├── CORRECT_EXECUTION_GUIDE.md             ← Detailed setup instructions
├── SCHEMA_FIX_GUIDE.md                    ← Schema fix documentation
├── SCHEMA_FIX_SUMMARY.md                  ← What was fixed summary
├── QUICK_FIX_REFERENCE.md                 ← Quick reference card
├── migrations/
│   ├── CORRECT_01_create_missing_tables.sql   ← Step 1: Create tables
│   ├── CORRECT_02_seed_data.sql               ← Step 2: Add data
│   ├── CORRECT_03_fix_doctors_columns.sql     ← Step 3: Fix doctors table
│   └── CORRECT_04_fix_appointments_columns.sql← Step 4: Fix appointments table
├── verify-schema.sql                      ← Verify schema is correct
├── check-schema.js                        ← Utility to inspect database
├── inspect-schema.js                      ← Alternative schema inspector
└── _archive/                              ← Old/outdated files (ignore)
```

---

## 🚀 Quick Setup (4 Steps)

### Prerequisites:
- Supabase project: `qfneoowktsirwpzehgxp`
- SQL Editor access: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp/sql/new

### Step 1: Create Tables (5 seconds)
1. Open SQL Editor
2. Copy contents of: `migrations/CORRECT_01_create_missing_tables.sql`
3. Paste and click **RUN**
4. ✅ Wait for "MIGRATION COMPLETE!" message

### Step 2: Fix Doctors Table Schema (5 seconds)
1. Open new SQL Editor tab
2. Copy contents of: `migrations/CORRECT_03_fix_doctors_columns.sql`
3. Paste and click **RUN**
4. ✅ Wait for "DOCTORS TABLE FIX COMPLETE!" message

### Step 3: Fix Appointments Table Schema (5 seconds)
1. Open new SQL Editor tab
2. Copy contents of: `migrations/CORRECT_04_fix_appointments_columns.sql`
3. Paste and click **RUN**
4. ✅ Wait for "APPOINTMENTS TABLE FIX COMPLETE!" message

### Step 4: Add Data (5 seconds)
1. Open new SQL Editor tab
2. Copy contents of: `migrations/CORRECT_02_seed_data.sql`
3. Paste and click **RUN**
4. ✅ Wait for "SEED DATA COMPLETE!" message

---

## ✅ What Gets Created

### Tables:
- `tenants` - Hospital/clinic organizations
- `doctors` - Doctor profiles with specialties
- `appointments` - Patient appointments
- `doctor_availability` - Doctor schedules

### Data:
- 1 Tenant: AI Surgeon Pilot Hospital
- 10 Doctors: Various specialties
- 50 Patients: Realistic Indian data
- 120 Appointments: Next 30 days
- 50 Availability slots: Doctor schedules

### Updates:
- Adds `tenant_id` to existing `patients` table
- Adds `tenant_id` to existing `visits` table
- Adds `tenant_id` to existing `users` table

---

## 🔑 Test Credentials

```
Superadmin:
  Email: superadmin@aisurgeonpilot.com
  Password: admin123

Sample Doctor:
  Email: dr.ramesh.kumar@aisurgeonpilot.com
  Password: admin123

⚠️ CHANGE PASSWORDS IN PRODUCTION!
```

---

## 🔍 Verify Setup

### Quick Verification:
Run this query in SQL Editor:

```sql
SELECT
    'tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'patients', COUNT(*) FROM patients WHERE tenant_id IS NOT NULL
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments;
```

**Expected:**
- tenants: 1
- doctors: 10
- patients: 50
- appointments: 120

### Complete Schema Verification:
For automated verification of all schema changes:
```bash
psql "YOUR_DATABASE_URL" -f database/verify-schema.sql
```

Or paste contents of `verify-schema.sql` into SQL Editor.

---

## 📖 Detailed Documentation

**For complete setup instructions:**
- 👉 **CORRECT_EXECUTION_GUIDE.md** - Full setup guide
- 👉 **SCHEMA_FIX_GUIDE.md** - Schema fix documentation
- 👉 **SCHEMA_FIX_SUMMARY.md** - What was fixed
- 👉 **QUICK_FIX_REFERENCE.md** - Quick reference card

---

## 🛠️ Utility Scripts

### Check Database Schema
```bash
node database/check-schema.js
```
Shows all tables and their structures.

### Inspect Schema
```bash
node database/inspect-schema.js
```
Alternative schema inspection tool.

---

## ⚠️ Important Notes

1. **Safe to Re-run**: All scripts are idempotent (can run multiple times)
2. **Preserves Data**: Won't delete existing patients/visits
3. **Transactional**: All-or-nothing execution
4. **Based on Actual Schema**: Uses correct column names from your database

---

## 🔄 Rollback (If Needed)

See `CORRECT_EXECUTION_GUIDE.md` → Rollback section

Quick rollback:
```sql
DELETE FROM appointments WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM doctors WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
UPDATE patients SET tenant_id = NULL;
UPDATE visits SET tenant_id = NULL;
UPDATE users SET tenant_id = NULL;
```

---

## 📦 Archive Folder

The `_archive/` folder contains old/incorrect migration attempts.
**You can safely ignore or delete this folder.**

---

## ✅ Status

**Last Updated:** 2025-11-15
**Status:** ✅ WORKING & TESTED
**Database:** Verified against actual Supabase schema
**Safety:** 100% safe to execute

---

**Ready to use!** 🎉

Run the 2 migration scripts and your database will be fully set up with multi-tenant support and realistic test data.
