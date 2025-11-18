# Database Schema Analysis Report
**Generated:** 2025-11-15
**Database:** AI Surgeon Pilot - Supabase Instance
**URL:** https://qfneoowktsirwpzehgxp.supabase.co

---

## Executive Summary

### Current State
- **Total Tables Found:** 16
- **Multi-Tenant Ready:** 8 tables (tenants, tenant_users, patient_users, etc.)
- **Requires Migration:** 8 core tables (patients, visits, User, appointments, doctors, medications, etc.)
- **Data Status:** All tables are currently empty (0 rows)

### Key Findings
1. ✅ Multi-tenant infrastructure already exists (tenants, tenant_users, patient_users)
2. ❌ Core data tables (patients, visits) are missing `tenant_id` foreign keys
3. ✅ Appointments and notifications infrastructure already in place
4. ✅ RLS (Row Level Security) is enabled on all tables
5. ⚠️  No seed data exists - database is completely empty

---

## Table Inventory

### Core Authentication & User Management
| Table | Status | Rows | Multi-Tenant Ready | Notes |
|-------|--------|------|-------------------|-------|
| `User` | ✅ EXISTS | 0 | ❌ Partial | Has user_type, is_superadmin fields |
| `tenant_users` | ✅ EXISTS | 0 | ✅ Yes | Junction table for user-tenant relationships |
| `patient_users` | ✅ EXISTS | 0 | ✅ Yes | Links patients to portal user accounts |

### Patient Management
| Table | Status | Rows | Multi-Tenant Ready | Notes |
|-------|--------|------|-------------------|-------|
| `patients` | ✅ EXISTS | 0 | ❌ NO | **NEEDS tenant_id column** |
| `visits` | ✅ EXISTS | 0 | ❌ NO | **NEEDS tenant_id column** |
| `appointments` | ✅ EXISTS | 0 | ✅ Yes | Already has tenant_id |

### Medical Reference Data
| Table | Status | Rows | Multi-Tenant Ready | Notes |
|-------|--------|------|-------------------|-------|
| `medications` | ✅ EXISTS | 0 | ⚠️  Unknown | Likely needs tenant_id |
| `labs` | ✅ EXISTS | 0 | ⚠️  Unknown | Likely needs tenant_id |
| `radiology` | ✅ EXISTS | 0 | ⚠️  Unknown | Likely needs tenant_id |

### Junction Tables
| Table | Status | Rows | Multi-Tenant Ready | Notes |
|-------|--------|------|-------------------|-------|
| `visit_medications` | ✅ EXISTS | 0 | ⚠️  Unknown | References visits table |
| `visit_labs` | ✅ EXISTS | 0 | ⚠️  Unknown | References visits table |
| `visit_radiology` | ✅ EXISTS | 0 | ⚠️  Unknown | References visits table |

### Multi-Tenant Infrastructure
| Table | Status | Rows | Multi-Tenant Ready | Notes |
|-------|--------|------|-------------------|-------|
| `tenants` | ✅ EXISTS | 0 | ✅ Yes | Core tenant table |
| `notifications` | ✅ EXISTS | 0 | ✅ Yes | Already has tenant_id |
| `doctor_availability` | ✅ EXISTS | 0 | ✅ Yes | Already has tenant_id |

### Special Tables
| Table | Status | Rows | Multi-Tenant Ready | Notes |
|-------|--------|------|-------------------|-------|
| `doctors` | ✅ EXISTS | 0 | ⚠️  Unknown | Unclear schema - may be reference data |

---

## Schema Structure Inference

Since all tables are empty, schema structure was inferred from migration files:

### User Table (Confirmed Structure)
```sql
CREATE TABLE public."User" (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    hospital_type VARCHAR(100),
    user_type VARCHAR(50) DEFAULT 'staff',
    is_superadmin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    phone VARCHAR(20),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Points:**
- Doctors are stored in `User` table with `role = 'doctor'`
- `hospital_type` field exists but not used in multi-tenant design
- `user_type` can be: 'superadmin', 'staff', 'patient'

### Patients Table (Confirmed Structure)
```sql
CREATE TABLE public.patients (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    patients_id VARCHAR(50) UNIQUE,
    age INTEGER,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    -- [50+ more fields for comprehensive patient data]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- MISSING: tenant_id UUID REFERENCES tenants(id)
);
```

### Visits Table (Confirmed Structure)
```sql
CREATE TABLE public.visits (
    id UUID PRIMARY KEY,
    visit_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    visit_type VARCHAR(50) NOT NULL,
    visit_date DATE NOT NULL,
    appointment_with VARCHAR(255) NOT NULL,
    -- [50+ more fields]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- MISSING: tenant_id UUID REFERENCES tenants(id)
);
```

### Tenants Table (Already Exists)
```sql
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'hospital',
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    contact_email VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Appointments Table (Already Multi-Tenant)
```sql
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id), -- ✅ Already has this
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES "User"(id),
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type VARCHAR(50) DEFAULT 'opd',
    status VARCHAR(50) DEFAULT 'scheduled',
    -- [many more fields]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Migration Requirements

### Critical Changes Needed

#### 1. Add tenant_id to Core Tables
**PRIORITY: HIGH**

The following tables MUST have `tenant_id` added:
- ✅ `patients` - Main patient records
- ✅ `visits` - Patient visit records
- ⚠️  `medications` (if used as tenant-specific catalog)
- ⚠️  `labs` (if used as tenant-specific catalog)
- ⚠️  `radiology` (if used as tenant-specific catalog)

**Migration Strategy:**
```sql
-- Add column as nullable first (safe for existing data)
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS tenant_id UUID
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id
ON public.patients(tenant_id);
```

#### 2. Update RLS Policies
**PRIORITY: HIGH**

Current RLS policies allow "Anyone can view/manage" which is NOT multi-tenant safe.

**Required Changes:**
- Remove permissive policies
- Add tenant isolation policies
- Maintain superadmin access
- Allow patient portal access for own records

#### 3. Doctors Table Clarification
**PRIORITY: MEDIUM**

The `doctors` table exists but its purpose is unclear:
- Option A: It's a reference table (like medications)
- Option B: It's redundant with User table where role='doctor'

**Recommendation:** Check schema and determine if we should:
- Use `User` table exclusively for doctors
- Or maintain `doctors` as separate reference data

---

## Row Level Security (RLS) Analysis

### Current State
- RLS is ENABLED on all tables ✅
- Many tables have overly permissive policies ❌
  - Example: "Anyone can view patients"
  - Example: "Anyone can manage visits"

### Required RLS Pattern (Multi-Tenant)

For each table with `tenant_id`:

```sql
-- 1. Superadmin can access everything
CREATE POLICY "Superadmin full access"
ON public.{table_name}
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."User"
        WHERE "User".id = auth.uid()::uuid
        AND "User".is_superadmin = true
    )
);

-- 2. Tenant users can access their tenant's data
CREATE POLICY "Tenant users can access their data"
ON public.{table_name}
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.tenant_users
        WHERE tenant_users.tenant_id = {table_name}.tenant_id
        AND tenant_users.user_id = auth.uid()::uuid
        AND tenant_users.is_active = true
    )
);

-- 3. Patients can view their own records (for portal)
CREATE POLICY "Patients can view own records"
ON public.{table_name}
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.patient_users
        WHERE patient_users.patient_id = {table_name}.patient_id
        AND patient_users.user_id = auth.uid()::uuid
    )
);
```

---

## Data Migration Plan

### Phase 1: Infrastructure (SAFE - No data loss risk)
1. ✅ Create tenants table (already done)
2. ✅ Create tenant_users table (already done)
3. ✅ Create patient_users table (already done)

### Phase 2: Add tenant_id Columns (SAFE - Nullable columns)
1. Add `tenant_id` to `patients` (nullable)
2. Add `tenant_id` to `visits` (nullable)
3. Add indexes on `tenant_id` columns
4. Add foreign key constraints

### Phase 3: Seed Initial Data (SAFE - Insert only)
1. Insert 1 tenant (AI Surgeon Pilot)
2. Insert 10 doctors in User table
3. Insert 50 realistic patients with tenant_id
4. Insert 120 appointments across doctors

### Phase 4: Update RLS Policies (REQUIRES TESTING)
1. Drop old permissive policies
2. Create new tenant-isolated policies
3. Test with different user roles

---

## Recommendations

### Immediate Actions
1. ✅ Run migration to add `tenant_id` to core tables
2. ✅ Create seed data for testing
3. ⚠️  Update RLS policies (test thoroughly first)
4. ⚠️  Clarify doctors table usage

### Best Practices
1. **Always use IF NOT EXISTS** for safety
2. **Make columns nullable first** before requiring them
3. **Test RLS changes in staging** before production
4. **Backup data** before any schema changes
5. **Use transactions** (BEGIN...COMMIT) for atomic changes

### Future Considerations
1. Add `tenant_id` to all remaining tables
2. Implement soft deletes where needed (deleted_at columns)
3. Add audit trail (created_by, updated_by) consistently
4. Consider partitioning by tenant_id for large datasets
5. Set up automated backups

---

## Risk Assessment

### Low Risk ✅
- Adding nullable columns
- Creating indexes
- Inserting seed data (if tables are empty)

### Medium Risk ⚠️
- Updating RLS policies (could lock out users)
- Adding NOT NULL constraints (if data exists)

### High Risk 🚨
- Dropping tables
- Dropping columns
- Changing column types
- **NONE PLANNED IN THIS MIGRATION**

---

## Next Steps

1. Review this analysis
2. Execute `01_add_multi_tenant_support.sql` (to be created)
3. Execute `SEED_PRODUCTION_DATA.sql` (to be created)
4. Verify tenant isolation is working
5. Test with different user roles
6. Deploy to production

---

## Appendix: Full Table List

```
✅ patients (0 rows) - Core patient records
✅ visits (0 rows) - Patient visits
✅ User (0 rows) - Authentication & doctors
✅ appointments (0 rows) - Appointment scheduling
✅ doctors (0 rows) - Doctor reference data (?)
✅ medications (0 rows) - Medication catalog
✅ visit_medications (0 rows) - Prescribed medications
✅ labs (0 rows) - Lab test catalog
✅ radiology (0 rows) - Radiology test catalog
✅ visit_labs (0 rows) - Ordered lab tests
✅ visit_radiology (0 rows) - Ordered radiology tests
✅ tenants (0 rows) - Multi-tenant infrastructure
✅ tenant_users (0 rows) - User-tenant relationships
✅ patient_users (0 rows) - Patient portal access
✅ notifications (0 rows) - Notification system
✅ doctor_availability (0 rows) - Doctor schedules
```

---

**End of Report**
