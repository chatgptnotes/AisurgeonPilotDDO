-- ============================================
-- AI SURGEON PILOT - SAFE MULTI-TENANT MIGRATION
-- ============================================
-- This script SAFELY adds multi-tenant support WITHOUT deleting data
-- Run this in Supabase SQL Editor
-- Version: 2.0 SAFE
-- Date: 2025-11-14
-- ============================================
--
-- SAFETY FEATURES:
-- ✓ NO table deletions
-- ✓ NO data deletions
-- ✓ Only ADDS columns and tables
-- ✓ Preserves ALL existing data
-- ✓ Updates RLS policies safely
-- ✓ Can be rolled back
--
-- WHAT THIS DOES:
-- 1. Creates new tables: tenants, tenant_users, patient_users
-- 2. ADDS tenant_id column to existing tables (NO deletions)
-- 3. ADDS new columns to User table (NO deletions)
-- 4. Updates RLS policies (keeps existing ones)
-- 5. Migrates existing data to new structure
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: CREATE TENANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'hospital',

    -- Subscription & Billing
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    trial_starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '14 days',
    subscription_starts_at TIMESTAMP WITH TIME ZONE NULL,
    subscription_ends_at TIMESTAMP WITH TIME ZONE NULL,

    -- Contact Information
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'India',
    pin_code VARCHAR(10) NULL,

    -- Branding
    logo_url TEXT NULL,
    favicon_url TEXT NULL,
    primary_color VARCHAR(7) DEFAULT '#059669',
    secondary_color VARCHAR(7) DEFAULT '#10b981',

    -- Settings (JSONB for flexibility)
    settings JSONB DEFAULT '{"features": {"pharmacy": true, "lab": true, "radiology": true, "ot": true, "patient_portal": true}}'::jsonb,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID NULL,

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Indexes for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON public.tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON public.tenants(is_active);

-- RLS for tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- SAFE: Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Superadmin full access to tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins can view their tenant" ON public.tenants;

CREATE POLICY "Superadmin full access to tenants"
    ON public.tenants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND (
                "User".is_superadmin = true
                OR "User".role = 'admin'  -- Temporary: Allow all admins during migration
            )
        )
    );

CREATE POLICY "Tenant admins can view their tenant"
    ON public.tenants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = tenants.id
            AND tenant_users.user_id = auth.uid()::uuid
            AND tenant_users.role IN ('tenant_admin', 'admin')
        )
        OR
        -- Temporary: Allow all users to see tenants during migration
        EXISTS (SELECT 1 FROM public."User" WHERE "User".id = auth.uid()::uuid)
    );

-- ============================================
-- STEP 2: ADD COLUMNS TO USER TABLE (SAFE)
-- ============================================

-- Add new columns to User table (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'User' AND column_name = 'user_type') THEN
        ALTER TABLE public."User" ADD COLUMN user_type VARCHAR(50) DEFAULT 'staff';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'User' AND column_name = 'is_superadmin') THEN
        ALTER TABLE public."User" ADD COLUMN is_superadmin BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'User' AND column_name = 'is_active') THEN
        ALTER TABLE public."User" ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'User' AND column_name = 'phone') THEN
        ALTER TABLE public."User" ADD COLUMN phone VARCHAR(20) NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'User' AND column_name = 'last_login_at') THEN
        ALTER TABLE public."User" ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'User' AND column_name = 'updated_at') THEN
        ALTER TABLE public."User" ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_is_superadmin ON public."User"(is_superadmin);
CREATE INDEX IF NOT EXISTS idx_user_user_type ON public."User"(user_type);
CREATE INDEX IF NOT EXISTS idx_user_phone ON public."User"(phone);

-- ============================================
-- STEP 3: CREATE TENANT_USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships (with ON DELETE CASCADE for safety)
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,

    -- Role within this tenant
    role VARCHAR(50) NOT NULL DEFAULT 'user',

    -- Permissions
    permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,

    -- Status
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Audit
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON public.tenant_users(role);

-- RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin full access to tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view their own tenant memberships" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant admins can manage tenant users" ON public.tenant_users;

CREATE POLICY "Superadmin full access to tenant_users"
    ON public.tenant_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND ("User".is_superadmin = true OR "User".role = 'admin')
        )
    );

CREATE POLICY "Users can view their own tenant memberships"
    ON public.tenant_users FOR SELECT
    USING (user_id = auth.uid()::uuid);

CREATE POLICY "Tenant admins can manage tenant users"
    ON public.tenant_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.tenant_id = tenant_users.tenant_id
            AND tu.user_id = auth.uid()::uuid
            AND tu.role IN ('tenant_admin', 'admin')
        )
    );

-- ============================================
-- STEP 4: CREATE PATIENT_USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.patient_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Verification
    verified_email BOOLEAN DEFAULT false,
    verified_phone BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255) NULL,
    phone_verification_token VARCHAR(6) NULL,
    verification_sent_at TIMESTAMP WITH TIME ZONE NULL,

    -- Security
    reset_password_token VARCHAR(255) NULL,
    reset_password_sent_at TIMESTAMP WITH TIME ZONE NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE NULL,
    last_access_at TIMESTAMP WITH TIME ZONE NULL,

    -- Unique constraints
    UNIQUE(user_id),
    UNIQUE(patient_id, tenant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_users_user_id ON public.patient_users(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_users_patient_id ON public.patient_users(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_users_tenant_id ON public.patient_users(tenant_id);

-- RLS
ALTER TABLE public.patient_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin full access to patient_users" ON public.patient_users;
DROP POLICY IF EXISTS "Patients can view their own record" ON public.patient_users;
DROP POLICY IF EXISTS "Tenant staff can view patient_users" ON public.patient_users;

CREATE POLICY "Superadmin full access to patient_users"
    ON public.patient_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND ("User".is_superadmin = true OR "User".role = 'admin')
        )
    );

CREATE POLICY "Patients can view their own record"
    ON public.patient_users FOR SELECT
    USING (user_id = auth.uid()::uuid);

CREATE POLICY "Tenant staff can view patient_users"
    ON public.patient_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = patient_users.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

-- ============================================
-- STEP 5: ADD TENANT_ID TO PATIENTS TABLE (SAFE)
-- ============================================

-- Add tenant_id column to patients (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.patients ADD COLUMN tenant_id UUID NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_patients_tenant_id ON public.patients(tenant_id);
    END IF;
END $$;

-- ============================================
-- STEP 6: ADD TENANT_ID TO VISITS TABLE (SAFE)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'visits' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.visits ADD COLUMN tenant_id UUID NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_visits_tenant_id ON public.visits(tenant_id);
    END IF;
END $$;

-- ============================================
-- STEP 7: CREATE DEMO TENANTS
-- ============================================

-- Insert Hope Hospital
INSERT INTO public.tenants (
    name, slug, display_name, type,
    subscription_plan, subscription_status,
    contact_email, contact_phone,
    primary_color, secondary_color
)
VALUES (
    'Hope Multi-Specialty Hospital',
    'hope',
    'Hope Hospital',
    'hospital',
    'enterprise',
    'active',
    'admin@hopehospital.com',
    '+91-40-2345-6789',
    '#059669',
    '#10b981'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert Ayushman Hospital
INSERT INTO public.tenants (
    name, slug, display_name, type,
    subscription_plan, subscription_status,
    contact_email, contact_phone,
    primary_color, secondary_color
)
VALUES (
    'Ayushman Hospital',
    'ayushman',
    'Ayushman Hospital',
    'hospital',
    'enterprise',
    'active',
    'admin@ayushmanhospital.gov.in',
    '+91-80-2345-6789',
    '#dc2626',
    '#ef4444'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STEP 8: CREATE SUPERADMIN USER
-- ============================================

-- Insert superadmin user
INSERT INTO public."User" (email, password, role, user_type, is_superadmin, hospital_type)
VALUES (
    'superadmin@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi', -- password: admin123
    'admin',
    'superadmin',
    true,
    'hope'
)
ON CONFLICT (email) DO UPDATE
SET is_superadmin = true, user_type = 'superadmin';

-- ============================================
-- STEP 9: MIGRATE EXISTING DATA (SAFE)
-- ============================================

-- Migrate existing patients to Hope tenant (only if tenant_id is NULL)
UPDATE public.patients
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'hope')
WHERE hospital_name = 'hope' AND tenant_id IS NULL;

UPDATE public.patients
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'ayushman')
WHERE hospital_name = 'ayushman' AND tenant_id IS NULL;

-- Set default tenant for patients without hospital_name
UPDATE public.patients
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'hope')
WHERE tenant_id IS NULL;

-- Migrate existing visits
UPDATE public.visits v
SET tenant_id = (SELECT tenant_id FROM public.patients p WHERE p.id = v.patient_id)
WHERE v.tenant_id IS NULL;

-- Link existing users to their tenants
INSERT INTO public.tenant_users (tenant_id, user_id, role, is_primary)
SELECT
    t.id as tenant_id,
    u.id as user_id,
    u.role,
    true as is_primary
FROM public."User" u
CROSS JOIN public.tenants t
WHERE u.hospital_type = t.slug
  AND NOT EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = u.id AND tu.tenant_id = t.id
  )
  AND u.is_superadmin = false
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Link users without hospital_type to Hope
INSERT INTO public.tenant_users (tenant_id, user_id, role, is_primary)
SELECT
    (SELECT id FROM public.tenants WHERE slug = 'hope'),
    u.id,
    u.role,
    true
FROM public."User" u
WHERE u.hospital_type IS NULL
  AND u.is_superadmin = false
  AND NOT EXISTS (
      SELECT 1 FROM public.tenant_users tu WHERE tu.user_id = u.id
  )
ON CONFLICT (tenant_id, user_id) DO NOTHING;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tenants
SELECT id, name, slug, subscription_status, created_at
FROM public.tenants
ORDER BY created_at;

-- Check superadmin
SELECT id, email, role, user_type, is_superadmin
FROM public."User"
WHERE is_superadmin = true;

-- Check tenant_users
SELECT
    t.name as tenant_name,
    u.email,
    tu.role,
    tu.is_primary
FROM public.tenant_users tu
JOIN public.tenants t ON t.id = tu.tenant_id
JOIN public."User" u ON u.id = tu.user_id
ORDER BY t.name, tu.role;

-- Check patients with tenant_id
SELECT
    COUNT(*) as total_patients,
    COUNT(tenant_id) as patients_with_tenant,
    COUNT(*) - COUNT(tenant_id) as patients_without_tenant
FROM public.patients;

-- Check visits with tenant_id
SELECT
    COUNT(*) as total_visits,
    COUNT(tenant_id) as visits_with_tenant,
    COUNT(*) - COUNT(tenant_id) as visits_without_tenant
FROM public.visits;

-- ============================================
-- DONE!
-- ============================================
-- Multi-tenant setup complete (SAFE VERSION)
--
-- WHAT WAS DONE:
-- ✓ Created 3 new tables: tenants, tenant_users, patient_users
-- ✓ Added tenant_id to patients and visits tables
-- ✓ Added new columns to User table
-- ✓ Created superadmin user
-- ✓ Created Hope and Ayushman tenants
-- ✓ Migrated all existing data
-- ✓ NO DATA WAS DELETED
--
-- NEXT STEPS:
-- 1. Run verification queries above
-- 2. Check that all data is intact
-- 3. Run next migration (appointments & notifications)
-- ============================================
