-- ============================================
-- AI SURGEON PILOT - MULTI-TENANT SETUP
-- ============================================
-- This script converts the database to multi-tenant architecture
-- Run this in Supabase SQL Editor AFTER existing migrations
-- Version: 2.0
-- Date: 2025-11-14
-- ============================================

BEGIN;

-- ============================================
-- 1. CREATE TENANTS TABLE
-- ============================================
-- Each hospital/clinic is a tenant

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    display_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'hospital', -- hospital, clinic, diagnostic_center

    -- Subscription & Billing
    subscription_plan VARCHAR(50) DEFAULT 'trial', -- free, trial, basic, pro, enterprise
    subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, suspended, cancelled
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
    primary_color VARCHAR(7) DEFAULT '#059669', -- hex color
    secondary_color VARCHAR(7) DEFAULT '#10b981',

    -- Settings (JSONB for flexibility)
    settings JSONB DEFAULT '{}'::jsonb,
    /*
    Example settings structure:
    {
        "features": {
            "pharmacy": true,
            "lab": true,
            "radiology": true,
            "ot": true,
            "patient_portal": true,
            "online_appointments": true,
            "online_consultations": true,
            "whatsapp_notifications": true,
            "email_notifications": true
        },
        "business_hours": {
            "monday": {"open": "09:00", "close": "18:00"},
            "tuesday": {"open": "09:00", "close": "18:00"},
            ...
        },
        "appointment_duration": 30,
        "currency": "INR",
        "timezone": "Asia/Kolkata"
    }
    */

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NULL REFERENCES public."User"(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID NULL REFERENCES public."User"(id),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Indexes for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON public.tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON public.tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON public.tenants(created_at DESC);

-- RLS for tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Superadmin can see all tenants
CREATE POLICY "Superadmin full access to tenants"
    ON public.tenants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

-- Tenant admins can see their own tenant
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
    );

-- ============================================
-- 2. UPDATE USERS TABLE
-- ============================================
-- Add new fields for multi-tenancy

ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'staff';
-- user_type options: superadmin, staff, patient

ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false;

ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_is_superadmin ON public."User"(is_superadmin);
CREATE INDEX IF NOT EXISTS idx_user_user_type ON public."User"(user_type);
CREATE INDEX IF NOT EXISTS idx_user_phone ON public."User"(phone);

-- ============================================
-- 3. CREATE TENANT_USERS JUNCTION TABLE
-- ============================================
-- Many-to-many relationship between users and tenants

CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,

    -- Role within this tenant
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    -- Roles: tenant_admin, admin, doctor, nurse, receptionist, accountant, pharmacist, lab_tech, radiologist

    -- Permissions (JSONB for fine-grained control)
    permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,

    -- Status
    is_primary BOOLEAN DEFAULT false, -- Is this the user's primary tenant?
    is_active BOOLEAN DEFAULT true,

    -- Audit
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_by UUID NULL REFERENCES public."User"(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON public.tenant_users(role);

-- RLS for tenant_users
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Superadmin can see all
CREATE POLICY "Superadmin full access to tenant_users"
    ON public.tenant_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

-- Users can see their own tenant memberships
CREATE POLICY "Users can view their own tenant memberships"
    ON public.tenant_users
    FOR SELECT
    USING (user_id = auth.uid()::uuid);

-- Tenant admins can manage users in their tenant
CREATE POLICY "Tenant admins can manage tenant users"
    ON public.tenant_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.tenant_id = tenant_users.tenant_id
            AND tu.user_id = auth.uid()::uuid
            AND tu.role IN ('tenant_admin', 'admin')
        )
    );

-- ============================================
-- 4. CREATE PATIENT_USERS TABLE
-- ============================================
-- Links patients to user accounts for patient portal access

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

    -- Unique constraint
    UNIQUE(user_id),
    UNIQUE(patient_id, tenant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_users_user_id ON public.patient_users(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_users_patient_id ON public.patient_users(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_users_tenant_id ON public.patient_users(tenant_id);

-- RLS for patient_users
ALTER TABLE public.patient_users ENABLE ROW LEVEL SECURITY;

-- Superadmin can see all
CREATE POLICY "Superadmin full access to patient_users"
    ON public.patient_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

-- Patients can see their own record
CREATE POLICY "Patients can view their own record"
    ON public.patient_users
    FOR SELECT
    USING (user_id = auth.uid()::uuid);

-- Tenant staff can see patient_users in their tenant
CREATE POLICY "Tenant staff can view patient_users"
    ON public.patient_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = patient_users.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

-- ============================================
-- 5. ADD TENANT_ID TO EXISTING TABLES
-- ============================================

-- Patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON public.patients(tenant_id);

-- Visits
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_visits_tenant_id ON public.visits(tenant_id);

-- Add to other tables (run similar commands for all major tables)
-- bills, diagnoses, medications, labs, radiology_tests, surgeries, etc.

-- Update RLS policies for patients (example)
DROP POLICY IF EXISTS "Anyone can view patients" ON public.patients;
DROP POLICY IF EXISTS "Anyone can manage patients" ON public.patients;

-- New RLS for patients with tenant isolation
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

-- ============================================
-- 6. CREATE SUPERADMIN USER
-- ============================================
-- Create the platform superadmin

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
-- 7. CREATE DEMO TENANTS (Optional)
-- ============================================
-- Create Hope Hospital as first tenant

INSERT INTO public.tenants (
    name,
    slug,
    display_name,
    type,
    subscription_plan,
    subscription_status,
    contact_email,
    contact_phone,
    primary_color,
    secondary_color,
    settings
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
    '#10b981',
    '{"features": {"pharmacy": true, "lab": true, "radiology": true, "ot": true, "patient_portal": true}}'::jsonb
),
(
    'Ayushman Hospital',
    'ayushman',
    'Ayushman Hospital',
    'hospital',
    'enterprise',
    'active',
    'admin@ayushmanhospital.gov.in',
    '+91-80-2345-6789',
    '#dc2626',
    '#ef4444',
    '{"features": {"pharmacy": true, "lab": true, "radiology": true, "ot": true, "patient_portal": true}}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 8. MIGRATE EXISTING DATA (if needed)
-- ============================================
-- Update existing patients to belong to Hope tenant

UPDATE public.patients
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'hope')
WHERE hospital_name = 'hope' AND tenant_id IS NULL;

UPDATE public.patients
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'ayushman')
WHERE hospital_name = 'ayushman' AND tenant_id IS NULL;

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
  AND u.is_superadmin = false;

-- ============================================
-- 9. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Check if superadmin
    SELECT is_superadmin INTO v_tenant_id
    FROM public."User"
    WHERE id = auth.uid()::uuid;

    IF v_tenant_id THEN
        -- Superadmin: return from session variable or first tenant
        RETURN current_setting('app.current_tenant_id', TRUE)::UUID;
    END IF;

    -- Get user's primary tenant
    SELECT tenant_id INTO v_tenant_id
    FROM public.tenant_users
    WHERE user_id = auth.uid()::uuid
    AND is_primary = true
    LIMIT 1;

    RETURN v_tenant_id;
END;
$$;

-- Function to check if user has access to a tenant
CREATE OR REPLACE FUNCTION has_tenant_access(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_access BOOLEAN;
BEGIN
    -- Check if superadmin
    SELECT is_superadmin INTO v_has_access
    FROM public."User"
    WHERE id = auth.uid()::uuid;

    IF v_has_access THEN
        RETURN TRUE;
    END IF;

    -- Check tenant_users membership
    SELECT EXISTS (
        SELECT 1
        FROM public.tenant_users
        WHERE user_id = auth.uid()::uuid
        AND tenant_id = p_tenant_id
        AND is_active = true
    ) INTO v_has_access;

    RETURN v_has_access;
END;
$$;

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

-- ============================================
-- DONE!
-- ============================================
-- Multi-tenant setup complete!
-- Next steps:
-- 1. Update frontend to use tenant context
-- 2. Add tenant selector for superadmin
-- 3. Implement patient portal
-- ============================================
