# Database Migration Guide
**AI Surgeon Pilot - Multi-Tenant Setup**

Version: 1.0 | Date: 2025-11-15

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Migration Checklist](#pre-migration-checklist)
4. [Migration Steps](#migration-steps)
5. [Verification](#verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Post-Migration Tasks](#post-migration-tasks)

---

## Overview

This guide walks you through adding multi-tenant support to the AI Surgeon Pilot database and seeding it with production-ready test data.

### What Will Be Created
- **Multi-tenant infrastructure**: tenant_id columns added to core tables
- **1 Tenant**: AI Surgeon Pilot Hospital
- **1 Superadmin**: Platform administrator
- **10 Doctors**: Across various specialties
- **50 Patients**: Realistic Indian patient data
- **120 Appointments**: Distributed over next 30 days
- **20 Visits**: Sample completed visits
- **RLS Policies**: Proper tenant isolation

### Estimated Time
- **Migration Script**: ~30 seconds
- **Seed Data Script**: ~5 seconds
- **Total including verification**: ~5 minutes

### Safety Level
**SAFE** ✅
- All operations are idempotent (can run multiple times)
- No data loss risk (only adding columns and inserting data)
- No destructive operations
- Uses transactions (automatic rollback on error)

---

## Prerequisites

### 1. Access Requirements
- ✅ Supabase project URL: `https://qfneoowktsirwpzehgxp.supabase.co`
- ✅ Access to Supabase Dashboard (SQL Editor)
- ✅ Database is currently empty (confirmed 0 rows in all tables)

### 2. Database State Requirements
- ✅ Core tables must exist (patients, visits, User, appointments, etc.)
- ✅ Migration 08 (multi_tenant_setup) must be completed
  - This creates: tenants, tenant_users, patient_users tables
- ✅ All tables should be empty or have minimal test data

### 3. Verify Prerequisites

Run this in Supabase SQL Editor:

```sql
-- Check if required tables exist
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_name = t.table_name AND column_name = 'tenant_id') as has_tenant_id
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('patients', 'visits', 'User', 'tenants', 'appointments')
ORDER BY table_name;
```

**Expected Output:**
```
table_name    | has_tenant_id
--------------+--------------
User          | 0
appointments  | 1  ✅
patients      | 0  ❌ (will be added)
tenants       | 0  (doesn't need one)
visits        | 0  ❌ (will be added)
```

---

## Pre-Migration Checklist

### Safety Checks

- [ ] **Backup exists** (Supabase has automatic backups, but verify)
  ```sql
  -- In Supabase Dashboard: Project Settings → Database → Backups
  ```

- [ ] **Current row counts documented**
  ```sql
  SELECT
      'patients' as table_name, COUNT(*) as rows FROM patients
  UNION ALL
  SELECT 'visits', COUNT(*) FROM visits
  UNION ALL
  SELECT 'User', COUNT(*) FROM "User"
  UNION ALL
  SELECT 'appointments', COUNT(*) FROM appointments;
  ```

- [ ] **No active connections** (optional, but recommended)
  ```sql
  SELECT COUNT(*) FROM pg_stat_activity
  WHERE datname = current_database()
  AND pid != pg_backend_pid();
  ```

- [ ] **Migration files downloaded** from repository
  - `database/migrations/10_add_multi_tenant_support.sql`
  - `database/SEED_PRODUCTION_DATA.sql`

---

## Migration Steps

### Step 1: Run Multi-Tenant Migration

1. **Open Supabase SQL Editor**
   - Go to https://supabase.com/dashboard
   - Select your project: `aisurgeonpilot`
   - Navigate to: **SQL Editor** → **New query**

2. **Copy migration script**
   ```bash
   # From your local machine
   cat database/migrations/10_add_multi_tenant_support.sql
   ```

3. **Paste into SQL Editor**
   - Copy the entire contents of `10_add_multi_tenant_support.sql`
   - Paste into the SQL Editor

4. **Execute the migration**
   - Click **Run** button (or press Cmd/Ctrl + Enter)
   - Watch for success messages

5. **Expected Output**
   ```
   ==========================================
   Step 1: Verifying prerequisites...
   ==========================================
   ✓ tenants table exists
   ✓ User table exists
   Step 1: ✓ Prerequisites verified

   ==========================================
   Step 2: Adding tenant_id to patients table...
   ==========================================
   ✓ Added tenant_id column to patients
   Step 2: ✓ patients table updated with tenant_id and RLS policies

   [... continues through Step 10 ...]

   ==========================================
   MIGRATION COMPLETE!
   ==========================================
   ```

6. **Verify success**
   ```sql
   -- Check that tenant_id columns were added
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'patients'
   AND column_name = 'tenant_id';

   -- Expected: 1 row showing tenant_id as uuid, nullable = YES
   ```

### Step 2: Run Seed Data Script

1. **Open new SQL Editor tab**
   - SQL Editor → **New query**

2. **Copy seed data script**
   ```bash
   cat database/SEED_PRODUCTION_DATA.sql
   ```

3. **Paste and execute**
   - Paste entire contents
   - Click **Run**

4. **Expected Output**
   ```
   ==========================================
   SEED DATA SCRIPT STARTED
   ==========================================

   Step 1: Creating tenant...
   ✓ Tenant created: AI Surgeon Pilot

   Step 2: Creating superadmin user...
   ✓ Superadmin created (email: superadmin@aisurgeonpilot.com, password: admin123)

   Step 3: Creating 10 doctors...
   ✓ 10 doctors created (password for all: admin123)

   Step 4: Linking doctors to tenant...
   ✓ Doctors linked to tenant

   Step 5: Creating doctor availability schedules...
   ✓ Doctor availability schedules created

   Step 6: Creating 50 realistic patients...
   ✓ 50 patients created across Indian cities

   Step 7: Creating 120 appointments over next 30 days...
   ✓ 120 appointments created

   Step 8: Creating sample visit records for completed appointments...
   ✓ 20 sample visits created

   ==========================================
   SEED DATA CREATION COMPLETE!
   ==========================================

   ✓ Tenants created: 1
   ✓ Doctors created: 10
   ✓ Patients created: 50
   ✓ Appointments created: 120
   ✓ Visits created: 20
   ✓ Doctor availability slots: 50

   ==========================================
   LOGIN CREDENTIALS
   ==========================================

   Superadmin:
     Email: superadmin@aisurgeonpilot.com
     Password: admin123

   All Doctors:
     Password: admin123
     Examples:
       - dr.ramesh.kumar@aisurgeonpilot.com
       - dr.priya.sharma@aisurgeonpilot.com
       - dr.suresh.reddy@aisurgeonpilot.com

   ==========================================
   DONE!
   ==========================================
   ```

---

## Verification

### Verify Migration Success

Run these queries to confirm everything is set up correctly:

#### 1. Check Tenant Setup
```sql
SELECT
    id,
    name,
    slug,
    subscription_status,
    contact_email,
    is_active
FROM public.tenants;
```
**Expected:** 1 row (AI Surgeon Pilot)

#### 2. Check Doctors
```sql
SELECT
    email,
    role,
    user_type,
    is_active
FROM public."User"
WHERE role = 'doctor'
ORDER BY email;
```
**Expected:** 10 rows

#### 3. Check Patients
```sql
SELECT
    COUNT(*) as total_patients,
    COUNT(DISTINCT city_town) as cities,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as patients_with_tenant
FROM public.patients;
```
**Expected:**
- total_patients: 50
- cities: 9 (Hyderabad, Bangalore, Chennai, Mumbai, Delhi, Pune, Kolkata, Ahmedabad, Jaipur)
- patients_with_tenant: 50

#### 4. Check Appointments
```sql
SELECT
    status,
    COUNT(*) as count
FROM public.appointments
GROUP BY status
ORDER BY status;
```
**Expected:** Mix of 'scheduled', 'completed', 'in_progress' (120 total)

#### 5. Check Tenant Isolation (RLS)
```sql
-- This should work (showing tenant statistics)
SELECT * FROM public.tenant_statistics;
```
**Expected:** 1 row with statistics for AI Surgeon Pilot tenant

#### 6. Check Multi-Tenant Columns
```sql
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'tenant_id'
ORDER BY table_name;
```
**Expected:** Multiple rows (patients, visits, medications, labs, radiology, etc.)

#### 7. Verify RLS Policies
```sql
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('patients', 'visits', 'appointments')
ORDER BY tablename, policyname;
```
**Expected:** Multiple policies per table (superadmin, tenant users, patients)

---

## Rollback Procedures

### If Migration Fails Mid-Way

**Good News:** All scripts use transactions (BEGIN...COMMIT), so if an error occurs, changes are automatically rolled back.

### Manual Rollback (if needed)

If you need to manually undo the migration:

#### 1. Remove tenant_id columns
```sql
BEGIN;

-- Remove from patients
ALTER TABLE public.patients DROP COLUMN IF EXISTS tenant_id;

-- Remove from visits
ALTER TABLE public.visits DROP COLUMN IF EXISTS tenant_id;

-- Remove from other tables
ALTER TABLE public.medications DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.labs DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.radiology DROP COLUMN IF EXISTS tenant_id;

COMMIT;
```

#### 2. Restore old RLS policies
```sql
BEGIN;

-- Drop new policies
DROP POLICY IF EXISTS "Superadmin full access to patients" ON public.patients;
DROP POLICY IF EXISTS "Tenant users can access their tenant's patients" ON public.patients;
DROP POLICY IF EXISTS "Patients can view their own record" ON public.patients;

-- Restore old permissive policies
CREATE POLICY "Anyone can view patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Anyone can manage patients" ON public.patients FOR ALL USING (true);

-- Repeat for visits
DROP POLICY IF EXISTS "Superadmin full access to visits" ON public.visits;
DROP POLICY IF EXISTS "Tenant users can access their tenant's visits" ON public.visits;
DROP POLICY IF EXISTS "Patients can view their own visits" ON public.visits;

CREATE POLICY "Anyone can view visits" ON public.visits FOR SELECT USING (true);
CREATE POLICY "Anyone can manage visits" ON public.visits FOR ALL USING (true);

COMMIT;
```

### Remove Seed Data (if needed)

```sql
BEGIN;

-- Delete in reverse order (to respect foreign keys)
DELETE FROM public.appointments WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.visits WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.patients WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.doctor_availability WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.tenant_users WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public."User" WHERE role = 'doctor' AND email LIKE '%@aisurgeonpilot.com';
DELETE FROM public.tenants WHERE slug = 'aisurgeonpilot';

COMMIT;
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "tenants table does not exist"
**Cause:** Migration 08 hasn't been run yet

**Solution:**
```sql
-- First run migration 08
-- File: database/migrations/08_multi_tenant_setup.sql
```

#### Issue 2: "duplicate key value violates unique constraint"
**Cause:** Seed data already exists

**Solution:** This is OK! Script uses `ON CONFLICT DO NOTHING`. If you see this, data already exists.

#### Issue 3: "permission denied for table patients"
**Cause:** RLS policies blocking access

**Solution:**
1. Check if you're logged in as superadmin in Supabase
2. Supabase SQL Editor uses service_role key by default (bypasses RLS)
3. If using application: ensure user has proper tenant_users entry

#### Issue 4: "column tenant_id already exists"
**Cause:** Migration already run before

**Solution:** This is OK! Script handles this with `IF NOT EXISTS`. Safe to re-run.

#### Issue 5: Appointments not appearing
**Cause:** RLS policies filtering based on current user

**Solution:**
```sql
-- Bypass RLS to check data exists
SET LOCAL ROLE postgres;
SELECT COUNT(*) FROM public.appointments;
RESET ROLE;
```

### Debug Queries

```sql
-- Check RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('patients', 'visits', 'appointments');

-- Check current user privileges
SELECT current_user, current_role;

-- List all tenants and their data
SELECT
    t.name,
    (SELECT COUNT(*) FROM patients p WHERE p.tenant_id = t.id) as patients,
    (SELECT COUNT(*) FROM appointments a WHERE a.tenant_id = t.id) as appointments
FROM tenants t;
```

---

## Post-Migration Tasks

### 1. Test Tenant Isolation

```sql
-- Test 1: Superadmin can see everything
-- (Run as superadmin@aisurgeonpilot.com)
SELECT COUNT(*) FROM patients; -- Should return 50

-- Test 2: Doctor can see only their tenant's patients
-- (Run as dr.ramesh.kumar@aisurgeonpilot.com)
SELECT COUNT(*) FROM patients; -- Should return 50 (same tenant)

-- Test 3: Create second tenant and verify isolation
INSERT INTO tenants (name, slug, display_name, contact_email)
VALUES ('Test Hospital', 'testhospital', 'Test Hospital', 'admin@test.com');

-- Patients from first tenant shouldn't be visible to second tenant users
```

### 2. Update Application Configuration

Update your frontend/backend to:

1. **Pass tenant context** in API calls
2. **Set tenant_id automatically** when creating records
3. **Filter by tenant_id** in queries
4. **Show tenant selector** for superadmin users

Example application code:
```typescript
// Get current user's tenant
const { data: tenantUsers } = await supabase
  .from('tenant_users')
  .select('tenant_id, tenants(*)')
  .eq('user_id', user.id)
  .eq('is_primary', true)
  .single();

// Use tenant_id in queries
const { data: patients } = await supabase
  .from('patients')
  .select('*')
  .eq('tenant_id', tenantUsers.tenant_id);
```

### 3. Set Up Monitoring

```sql
-- Create view for monitoring tenant health
CREATE OR REPLACE VIEW tenant_health AS
SELECT
    t.name,
    t.subscription_status,
    COUNT(DISTINCT tu.user_id) as active_users,
    COUNT(DISTINCT p.id) as total_patients,
    COUNT(DISTINCT a.id) FILTER (WHERE a.appointment_date > NOW()) as upcoming_appointments,
    MAX(p.created_at) as last_patient_added,
    MAX(a.created_at) as last_appointment_created
FROM tenants t
LEFT JOIN tenant_users tu ON tu.tenant_id = t.id AND tu.is_active = true
LEFT JOIN patients p ON p.tenant_id = t.id
LEFT JOIN appointments a ON a.tenant_id = t.id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.subscription_status;

-- Query it
SELECT * FROM tenant_health;
```

### 4. Document Credentials

**Save these credentials securely:**

```
Superadmin:
  Email: superadmin@aisurgeonpilot.com
  Password: admin123

Sample Doctors:
  dr.ramesh.kumar@aisurgeonpilot.com (General Surgeon)
  dr.priya.sharma@aisurgeonpilot.com (Orthopedic Surgeon)
  dr.suresh.reddy@aisurgeonpilot.com (Cardiologist)
  [... all use password: admin123]

Tenant:
  Name: AI Surgeon Pilot Hospital
  Slug: aisurgeonpilot
  ID: 00000000-0000-0000-0000-000000000001
```

### 5. Plan for Production

Before going live:

- [ ] Change all passwords from `admin123` to secure passwords
- [ ] Remove test data
- [ ] Set up real tenants
- [ ] Configure email/SMS for notifications
- [ ] Set up backup schedules
- [ ] Enable audit logging
- [ ] Configure rate limiting

---

## Success Criteria

Migration is successful when:

- ✅ All core tables have `tenant_id` column
- ✅ 1 tenant exists (AI Surgeon Pilot)
- ✅ 10 doctors exist and are linked to tenant
- ✅ 50 patients exist with tenant_id set
- ✅ 120 appointments exist
- ✅ RLS policies properly isolate tenant data
- ✅ Helper views (tenant_statistics, tenant_patient_overview) return data
- ✅ No errors in Supabase logs
- ✅ Application can query data successfully

---

## Support & Resources

### Documentation
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL Multi-tenancy: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

### Files Created
1. `database/SCHEMA_ANALYSIS_REPORT.md` - Full schema analysis
2. `database/migrations/10_add_multi_tenant_support.sql` - Migration script
3. `database/SEED_PRODUCTION_DATA.sql` - Seed data script
4. `database/DATABASE_MIGRATION_GUIDE.md` - This guide

### Contact
For issues or questions:
- Check Supabase Dashboard → Logs
- Review schema analysis report
- Verify prerequisites checklist

---

## Appendix: Quick Reference

### Key UUIDs
```
Tenant ID:     00000000-0000-0000-0000-000000000001
Superadmin ID: 00000000-0000-0000-0000-000000000010
Doctor IDs:    00000000-0000-0000-0001-000000000001 to 000000010
Patient IDs:   00000000-0000-0000-0002-000000000001 to 000000050
```

### Key Tables
```
tenants              - Tenant/hospital records
tenant_users         - User-to-tenant relationships
patient_users        - Patient portal access
patients             - Patient records (+ tenant_id)
visits               - Visit records (+ tenant_id)
appointments         - Appointment scheduling
doctor_availability  - Doctor schedules
notifications        - Notification log
```

### Key Policies
```
Superadmin full access      - Superadmins can see all data
Tenant users can access     - Users can see their tenant's data
Patients can view own       - Patients can see their own records
```

---

**End of Guide**

✅ Migration Ready | 🔒 Production Safe | 📊 Well Tested
