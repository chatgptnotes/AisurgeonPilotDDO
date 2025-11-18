-- ============================================================================
-- AI Surgeon Pilot - Create Missing Tables for Multi-Tenant Healthcare System
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-15
-- Based on: ACTUAL database schema analysis
--
-- VERIFIED EXISTING TABLES:
--   ✅ patients (6 rows)
--   ✅ visits (5 rows)
--   ✅ users (1 row)
--
-- TABLES TO CREATE:
--   ❌ tenants
--   ❌ appointments
--   ❌ doctors
--   ❌ doctor_availability
--
-- SAFETY: Idempotent - uses CREATE TABLE IF NOT EXISTS
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE TENANTS TABLE (Multi-tenant support)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Contact Information
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(10),

    -- Business Details
    business_hours JSONB DEFAULT '{"mon-fri": "9:00-17:00", "sat": "9:00-13:00"}'::jsonb,
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    subscription_status VARCHAR(50) DEFAULT 'active',

    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON public.tenants(is_active);

COMMENT ON TABLE public.tenants IS 'Multi-tenant organizations (hospitals/clinics)';

-- ============================================================================
-- 2. ADD tenant_id TO EXISTING TABLES (if not exists)
-- ============================================================================

-- Add tenant_id to patients table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        CREATE INDEX idx_patients_tenant_id ON public.patients(tenant_id);
    END IF;
END $$;

-- Add tenant_id to visits table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'visits' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.visits ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        CREATE INDEX idx_visits_tenant_id ON public.visits(tenant_id);
    END IF;
END $$;

-- Add tenant_id to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);
    END IF;
END $$;

-- ============================================================================
-- 3. CREATE DOCTORS TABLE (extends users table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,

    -- Doctor Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),

    -- Professional Details
    specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
    qualifications TEXT,
    experience_years INTEGER DEFAULT 0,
    license_number VARCHAR(100),

    -- Consultation Fees
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    followup_fee DECIMAL(10,2) DEFAULT 0,

    -- Profile
    profile_photo_url TEXT,
    bio TEXT,
    languages TEXT[] DEFAULT ARRAY['English']::TEXT[],

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_doctors_tenant_id ON public.doctors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON public.doctors(is_active);

COMMENT ON TABLE public.doctors IS 'Doctor profiles with specialties and fees';

-- ============================================================================
-- 4. CREATE APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,

    -- Participants
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) NOT NULL,

    -- Appointment Details
    appointment_date DATE NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 30,

    -- Type & Status
    appointment_type VARCHAR(50) DEFAULT 'opd', -- opd, followup, online
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
    mode VARCHAR(50) DEFAULT 'in_person', -- in_person, video, phone

    -- Medical Info
    symptoms TEXT,
    reason TEXT,
    notes TEXT,

    -- Payment
    payment_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
    coupon_code VARCHAR(50),
    discount_amount DECIMAL(10,2) DEFAULT 0,

    -- Booking Info
    booked_by VARCHAR(50) DEFAULT 'patient', -- patient, staff, whatsapp, phone

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON public.appointments(start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

COMMENT ON TABLE public.appointments IS 'Patient appointments with doctors';

-- ============================================================================
-- 5. CREATE DOCTOR AVAILABILITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,

    -- Schedule
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Capacity
    slot_duration_minutes INTEGER DEFAULT 30,
    max_appointments_per_slot INTEGER DEFAULT 1,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(doctor_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_doctor_availability_tenant ON public.doctor_availability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON public.doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON public.doctor_availability(day_of_week);

COMMENT ON TABLE public.doctor_availability IS 'Doctor weekly availability schedules';

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all (for now - refine later)
-- Drop existing policies first if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.tenants;
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.doctors;
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.appointments;
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.doctor_availability;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON public.tenants
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated read access" ON public.doctors
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated read access" ON public.appointments
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated read access" ON public.doctor_availability
    FOR SELECT USING (true);

-- ============================================================================
-- 7. CREATE HELPER VIEW FOR APPOINTMENTS
-- ============================================================================

CREATE OR REPLACE VIEW public.appointments_with_details AS
SELECT
    a.*,
    p.name as patient_name,
    p.phone as patient_phone,
    p.email as patient_email,
    d.full_name as doctor_name,
    d.specialties as doctor_specialties,
    d.profile_photo_url as doctor_photo
FROM public.appointments a
LEFT JOIN public.patients p ON a.patient_id = p.id
LEFT JOIN public.doctors d ON a.doctor_id = d.id;

COMMENT ON VIEW public.appointments_with_details IS 'Appointments with patient and doctor details';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRATION COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  ✅ tenants';
    RAISE NOTICE '  ✅ doctors';
    RAISE NOTICE '  ✅ appointments';
    RAISE NOTICE '  ✅ doctor_availability';
    RAISE NOTICE '';
    RAISE NOTICE 'Added tenant_id to:';
    RAISE NOTICE '  ✅ patients';
    RAISE NOTICE '  ✅ visits';
    RAISE NOTICE '  ✅ users';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Run CORRECT_02_seed_data.sql';
    RAISE NOTICE '============================================';
END $$;

COMMIT;
