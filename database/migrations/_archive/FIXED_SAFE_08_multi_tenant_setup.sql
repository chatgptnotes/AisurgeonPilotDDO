-- ============================================
-- AI SURGEON PILOT - SAFE MULTI-TENANT MIGRATION (FIXED)
-- ============================================
-- This version works with Supabase Auth (auth.users)
-- Run this in Supabase SQL Editor
-- Version: 2.1 FIXED
-- Date: 2025-11-14
-- ============================================
--
-- SAFETY FEATURES:
-- ✓ NO table deletions
-- ✓ NO data deletions
-- ✓ Only ADDS columns and tables
-- ✓ Works with both auth.users and public.User
-- ✓ Can be rolled back
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: CREATE USER PROFILES TABLE (if needed)
-- ============================================
-- Supabase uses auth.users for authentication
-- We need a public.user_profiles table for additional data

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Additional user data
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,

    -- Role & Type
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    user_type VARCHAR(50) DEFAULT 'staff',
    hospital_type VARCHAR(100) NULL,

    -- Superadmin flag
    is_superadmin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Audit
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_superadmin ON public.user_profiles(is_superadmin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON public.user_profiles;

CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Superadmin can view all profiles"
    ON public.user_profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.is_superadmin = true
        )
    );

-- ============================================
-- STEP 2: CREATE TENANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'hospital',

    -- Subscription
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '14 days',

    -- Contact
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NULL,
    address TEXT NULL,

    -- Branding
    logo_url TEXT NULL,
    primary_color VARCHAR(7) DEFAULT '#059669',
    secondary_color VARCHAR(7) DEFAULT '#10b981',

    -- Settings
    settings JSONB DEFAULT '{"features": {"pharmacy": true, "lab": true, "radiology": true}}'::jsonb,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON public.tenants(is_active);

-- RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tenants" ON public.tenants;
DROP POLICY IF EXISTS "Superadmin can manage tenants" ON public.tenants;

-- Temporary: Allow everyone to view tenants during migration
CREATE POLICY "Anyone can view tenants"
    ON public.tenants FOR SELECT
    USING (true);

CREATE POLICY "Superadmin can manage tenants"
    ON public.tenants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_superadmin = true
        )
    );

-- ============================================
-- STEP 3: CREATE TENANT_USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Role within tenant
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '{"read": true, "write": false}'::jsonb,

    -- Status
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Audit
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);

-- RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their memberships" ON public.tenant_users;
DROP POLICY IF EXISTS "Admins can manage" ON public.tenant_users;

CREATE POLICY "Users can view their memberships"
    ON public.tenant_users FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage"
    ON public.tenant_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND (user_profiles.is_superadmin = true OR user_profiles.role = 'admin')
        )
    );

-- ============================================
-- STEP 4: CREATE PATIENT_USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.patient_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Verification
    verified_email BOOLEAN DEFAULT false,
    verified_phone BOOLEAN DEFAULT false,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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

DROP POLICY IF EXISTS "Patients can view own" ON public.patient_users;
DROP POLICY IF EXISTS "Staff can view" ON public.patient_users;

CREATE POLICY "Patients can view own"
    ON public.patient_users FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Staff can view"
    ON public.patient_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = patient_users.tenant_id
            AND tenant_users.user_id = auth.uid()
        )
    );

-- ============================================
-- STEP 5: ADD TENANT_ID TO PATIENTS (SAFE)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN tenant_id UUID NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_patients_tenant_id ON public.patients(tenant_id);
    END IF;
END $$;

-- ============================================
-- STEP 6: ADD TENANT_ID TO VISITS (SAFE)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'visits' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.visits ADD COLUMN tenant_id UUID NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_visits_tenant_id ON public.visits(tenant_id);
    END IF;
END $$;

-- ============================================
-- STEP 7: CREATE DEMO TENANTS
-- ============================================

INSERT INTO public.tenants (name, slug, display_name, contact_email, primary_color, secondary_color)
VALUES
    ('Hope Multi-Specialty Hospital', 'hope', 'Hope Hospital', 'admin@hopehospital.com', '#059669', '#10b981'),
    ('Ayushman Hospital', 'ayushman', 'Ayushman Hospital', 'admin@ayushmanhospital.gov.in', '#dc2626', '#ef4444')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STEP 8: MIGRATE EXISTING DATA
-- ============================================

-- Migrate patients to tenants based on hospital_name
UPDATE public.patients
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'hope')
WHERE (hospital_name = 'hope' OR hospital_name IS NULL)
AND tenant_id IS NULL;

UPDATE public.patients
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'ayushman')
WHERE hospital_name = 'ayushman'
AND tenant_id IS NULL;

-- Migrate visits
UPDATE public.visits v
SET tenant_id = (SELECT tenant_id FROM public.patients p WHERE p.id = v.patient_id)
WHERE v.tenant_id IS NULL;

-- ============================================
-- STEP 9: CREATE HELPER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get user's primary tenant
    SELECT tenant_id INTO v_tenant_id
    FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND is_primary = true
    LIMIT 1;

    RETURN v_tenant_id;
END;
$$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tenants
SELECT id, name, slug, created_at FROM public.tenants;

-- Check user_profiles
SELECT COUNT(*) as profile_count FROM public.user_profiles;

-- Check patients with tenant
SELECT
    COUNT(*) as total,
    COUNT(tenant_id) as with_tenant
FROM public.patients;

-- Check visits with tenant
SELECT
    COUNT(*) as total,
    COUNT(tenant_id) as with_tenant
FROM public.visits;

-- ============================================
-- IMPORTANT NOTES
-- ============================================
--
-- 1. This creates user_profiles table instead of modifying User
-- 2. Links to auth.users (Supabase's authentication)
-- 3. All existing data is preserved
-- 4. No deletions were made
--
-- NEXT STEPS:
-- 1. Create superadmin user in Supabase Auth dashboard
-- 2. Add entry to user_profiles with is_superadmin = true
-- 3. Run next migration for appointments
-- ============================================
