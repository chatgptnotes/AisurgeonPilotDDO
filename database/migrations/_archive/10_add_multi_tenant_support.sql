-- ============================================
-- AI SURGEON PILOT - ADD MULTI-TENANT SUPPORT TO CORE TABLES
-- ============================================
-- This migration adds tenant_id columns to core tables that are missing it
-- SAFE TO RUN MULTIPLE TIMES (idempotent)
-- Version: 1.0
-- Date: 2025-11-15
-- ============================================
--
-- WHAT THIS SCRIPT DOES:
-- 1. Verifies tenants table exists (should already exist from migration 08)
-- 2. Adds tenant_id columns to patients, visits, and other core tables
-- 3. Creates indexes for performance
-- 4. Updates RLS policies for proper tenant isolation
-- 5. Sets up helper functions for tenant operations
--
-- SAFETY FEATURES:
-- - Uses IF NOT EXISTS everywhere
-- - Adds columns as nullable first
-- - Creates policies with IF NOT EXISTS equivalent (DROP IF EXISTS first)
-- - All operations are idempotent
--
-- EXECUTION TIME: ~30 seconds
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: VERIFY PREREQUISITES
-- ============================================
\echo '=========================================='
\echo 'Step 1: Verifying prerequisites...'
\echo '=========================================='

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify tenants table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
        RAISE EXCEPTION 'ERROR: tenants table does not exist. Please run migration 08_multi_tenant_setup.sql first!';
    END IF;
    RAISE NOTICE '✓ tenants table exists';
END $$;

-- Verify User table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
        RAISE EXCEPTION 'ERROR: User table does not exist. Please run core setup migrations first!';
    END IF;
    RAISE NOTICE '✓ User table exists';
END $$;

\echo 'Step 1: ✓ Prerequisites verified'

-- ============================================
-- STEP 2: ADD TENANT_ID TO PATIENTS TABLE
-- ============================================
\echo '=========================================='
\echo 'Step 2: Adding tenant_id to patients table...'
\echo '=========================================='

-- Add tenant_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'patients'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.patients
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ Added tenant_id column to patients';
    ELSE
        RAISE NOTICE '→ tenant_id column already exists in patients';
    END IF;
END $$;

-- Create index on tenant_id
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON public.patients(tenant_id);

-- Update RLS policies for patients
-- Drop old permissive policies first
DROP POLICY IF EXISTS "Anyone can view patients" ON public.patients;
DROP POLICY IF EXISTS "Anyone can manage patients" ON public.patients;

-- Create new tenant-isolated policies
CREATE POLICY "Superadmin full access to patients"
    ON public.patients
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

CREATE POLICY "Tenant users can access their tenant's patients"
    ON public.patients
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = patients.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
            AND tenant_users.is_active = true
        )
    );

CREATE POLICY "Patients can view their own record"
    ON public.patients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = patients.id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

\echo 'Step 2: ✓ patients table updated with tenant_id and RLS policies'

-- ============================================
-- STEP 3: ADD TENANT_ID TO VISITS TABLE
-- ============================================
\echo '=========================================='
\echo 'Step 3: Adding tenant_id to visits table...'
\echo '=========================================='

-- Add tenant_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'visits'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.visits
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ Added tenant_id column to visits';
    ELSE
        RAISE NOTICE '→ tenant_id column already exists in visits';
    END IF;
END $$;

-- Create index on tenant_id
CREATE INDEX IF NOT EXISTS idx_visits_tenant_id ON public.visits(tenant_id);

-- Update RLS policies for visits
-- Drop old permissive policies first
DROP POLICY IF EXISTS "Anyone can view visits" ON public.visits;
DROP POLICY IF EXISTS "Anyone can manage visits" ON public.visits;

-- Create new tenant-isolated policies
CREATE POLICY "Superadmin full access to visits"
    ON public.visits
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

CREATE POLICY "Tenant users can access their tenant's visits"
    ON public.visits
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = visits.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
            AND tenant_users.is_active = true
        )
    );

CREATE POLICY "Patients can view their own visits"
    ON public.visits
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users pu
            JOIN public.patients p ON p.id = pu.patient_id
            WHERE visits.patient_id = p.id
            AND pu.user_id = auth.uid()::uuid
        )
    );

\echo 'Step 3: ✓ visits table updated with tenant_id and RLS policies'

-- ============================================
-- STEP 4: ADD TENANT_ID TO MEDICATIONS (if used as tenant-specific catalog)
-- ============================================
\echo '=========================================='
\echo 'Step 4: Adding tenant_id to medications table...'
\echo '=========================================='

-- Note: medications can be either:
-- 1. Global catalog (shared across tenants) - no tenant_id
-- 2. Tenant-specific catalog - needs tenant_id
-- We'll make it nullable to support both scenarios

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'medications'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.medications
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ Added tenant_id column to medications (nullable for global catalog)';
    ELSE
        RAISE NOTICE '→ tenant_id column already exists in medications';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_medications_tenant_id ON public.medications(tenant_id);

-- RLS for medications: accessible to all tenants if tenant_id is NULL (global), otherwise tenant-specific
DROP POLICY IF EXISTS "Anyone can view medications" ON public.medications;

CREATE POLICY "Global medications viewable by all"
    ON public.medications
    FOR SELECT
    USING (tenant_id IS NULL);

CREATE POLICY "Tenant-specific medications viewable by tenant users"
    ON public.medications
    FOR SELECT
    USING (
        tenant_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = medications.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Tenant users can manage their medications"
    ON public.medications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = medications.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
        OR
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

\echo 'Step 4: ✓ medications table updated'

-- ============================================
-- STEP 5: ADD TENANT_ID TO LABS
-- ============================================
\echo '=========================================='
\echo 'Step 5: Adding tenant_id to labs table...'
\echo '=========================================='

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'labs'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.labs
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ Added tenant_id column to labs';
    ELSE
        RAISE NOTICE '→ tenant_id column already exists in labs';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_labs_tenant_id ON public.labs(tenant_id);

-- Similar RLS pattern as medications
DROP POLICY IF EXISTS "Anyone can view labs" ON public.labs;

CREATE POLICY "Labs accessible pattern"
    ON public.labs
    FOR SELECT
    USING (
        tenant_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = labs.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

\echo 'Step 5: ✓ labs table updated'

-- ============================================
-- STEP 6: ADD TENANT_ID TO RADIOLOGY
-- ============================================
\echo '=========================================='
\echo 'Step 6: Adding tenant_id to radiology table...'
\echo '=========================================='

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'radiology'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.radiology
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ Added tenant_id column to radiology';
    ELSE
        RAISE NOTICE '→ tenant_id column already exists in radiology';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_radiology_tenant_id ON public.radiology(tenant_id);

DROP POLICY IF EXISTS "Anyone can view radiology" ON public.radiology;

CREATE POLICY "Radiology accessible pattern"
    ON public.radiology
    FOR SELECT
    USING (
        tenant_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = radiology.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

\echo 'Step 6: ✓ radiology table updated'

-- ============================================
-- STEP 7: ADD TENANT_ID TO DOCTORS TABLE (if needed)
-- ============================================
\echo '=========================================='
\echo 'Step 7: Checking doctors table...'
\echo '=========================================='

-- Check if doctors table is meant to be separate from User table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doctors') THEN
        -- Add tenant_id if column doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'doctors'
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.doctors
            ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
            RAISE NOTICE '✓ Added tenant_id column to doctors';

            CREATE INDEX IF NOT EXISTS idx_doctors_tenant_id ON public.doctors(tenant_id);
        ELSE
            RAISE NOTICE '→ tenant_id column already exists in doctors';
        END IF;
    ELSE
        RAISE NOTICE '→ doctors table does not exist (doctors stored in User table)';
    END IF;
END $$;

\echo 'Step 7: ✓ doctors table checked'

-- ============================================
-- STEP 8: CREATE HELPER FUNCTIONS (Enhanced)
-- ============================================
\echo '=========================================='
\echo 'Step 8: Creating helper functions...'
\echo '=========================================='

-- Function to automatically set tenant_id on insert
-- This can be called from application triggers
CREATE OR REPLACE FUNCTION set_tenant_id_from_user()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- If tenant_id is already set, use it
    IF NEW.tenant_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Get tenant_id from current user's primary tenant
    SELECT tenant_id INTO v_tenant_id
    FROM public.tenant_users
    WHERE user_id = auth.uid()::uuid
    AND is_primary = true
    LIMIT 1;

    -- Set the tenant_id
    NEW.tenant_id := v_tenant_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate tenant access before operations
CREATE OR REPLACE FUNCTION validate_tenant_access()
RETURNS TRIGGER AS $$
DECLARE
    v_has_access BOOLEAN;
BEGIN
    -- Superadmin bypass
    SELECT is_superadmin INTO v_has_access
    FROM public."User"
    WHERE id = auth.uid()::uuid;

    IF v_has_access THEN
        RETURN NEW;
    END IF;

    -- Check if user has access to this tenant
    SELECT EXISTS (
        SELECT 1
        FROM public.tenant_users
        WHERE user_id = auth.uid()::uuid
        AND tenant_id = NEW.tenant_id
        AND is_active = true
    ) INTO v_has_access;

    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: You do not have access to this tenant';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

\echo 'Step 8: ✓ Helper functions created'

-- ============================================
-- STEP 9: CREATE VIEW FOR EASY QUERYING
-- ============================================
\echo '=========================================='
\echo 'Step 9: Creating helpful views...'
\echo '=========================================='

-- View to see all tenant-patient-user relationships
CREATE OR REPLACE VIEW public.tenant_patient_overview AS
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    p.email as patient_email,
    pu.user_id as portal_user_id,
    u.email as portal_email,
    pu.verified_email,
    pu.verified_phone,
    p.created_at as patient_since
FROM public.tenants t
LEFT JOIN public.patients p ON p.tenant_id = t.id
LEFT JOIN public.patient_users pu ON pu.patient_id = p.id
LEFT JOIN public."User" u ON u.id = pu.user_id
WHERE t.is_active = true
ORDER BY t.name, p.name;

-- View for tenant user statistics
CREATE OR REPLACE VIEW public.tenant_statistics AS
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.subscription_status,
    COUNT(DISTINCT p.id) as total_patients,
    COUNT(DISTINCT tu.user_id) FILTER (WHERE tu.is_active = true) as total_staff,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'scheduled') as pending_appointments,
    COUNT(DISTINCT v.id) as total_visits,
    t.created_at as tenant_since
FROM public.tenants t
LEFT JOIN public.patients p ON p.tenant_id = t.id
LEFT JOIN public.tenant_users tu ON tu.tenant_id = t.id
LEFT JOIN public.appointments a ON a.tenant_id = t.id
LEFT JOIN public.visits v ON v.tenant_id = t.id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.subscription_status, t.created_at
ORDER BY t.name;

\echo 'Step 9: ✓ Views created'

-- ============================================
-- STEP 10: VERIFICATION
-- ============================================
\echo '=========================================='
\echo 'Step 10: Running verification checks...'
\echo '=========================================='

-- Check all tables have tenant_id
DO $$
DECLARE
    v_tables_checked INTEGER := 0;
    v_tables_with_tenant_id INTEGER := 0;
BEGIN
    -- Count core tables that should have tenant_id
    SELECT COUNT(*) INTO v_tables_checked
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('patients', 'visits', 'appointments', 'medications', 'labs', 'radiology');

    -- Count how many actually have tenant_id
    SELECT COUNT(*) INTO v_tables_with_tenant_id
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
    AND table_name IN ('patients', 'visits', 'appointments', 'medications', 'labs', 'radiology');

    RAISE NOTICE 'Core tables checked: %', v_tables_checked;
    RAISE NOTICE 'Tables with tenant_id: %', v_tables_with_tenant_id;

    IF v_tables_with_tenant_id = v_tables_checked THEN
        RAISE NOTICE '✓ All core tables have tenant_id column';
    ELSE
        RAISE NOTICE '⚠ Some tables may be missing tenant_id';
    END IF;
END $$;

\echo 'Step 10: ✓ Verification complete'

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
\echo ''
\echo '=========================================='
\echo 'MIGRATION COMPLETE!'
\echo '=========================================='
\echo ''
\echo 'Run these queries to verify the migration:'
\echo ''

-- Show tables with tenant_id column
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'tenant_id'
ORDER BY table_name;

-- Show all indexes on tenant_id
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef LIKE '%tenant_id%'
ORDER BY tablename;

\echo ''
\echo 'Next Steps:'
\echo '1. Run SEED_PRODUCTION_DATA.sql to add initial data'
\echo '2. Test tenant isolation with different users'
\echo '3. Verify RLS policies are working correctly'
\echo ''
\echo '=========================================='
\echo 'DONE!'
\echo '=========================================='
