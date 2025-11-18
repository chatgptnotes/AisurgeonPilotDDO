-- ============================================
-- AI SURGEON PILOT - SAFE APPOINTMENTS & NOTIFICATIONS
-- ============================================
-- This script SAFELY adds appointment and notification features
-- Run this AFTER SAFE_08_multi_tenant_setup.sql
-- Version: 2.0 SAFE
-- Date: 2025-11-14
-- ============================================
--
-- SAFETY FEATURES:
-- ✓ NO table deletions
-- ✓ NO data deletions
-- ✓ Only CREATES new tables
-- ✓ Does NOT modify existing tables
-- ✓ Can be rolled back safely
--
-- WHAT THIS DOES:
-- 1. Creates appointments table
-- 2. Creates doctor_availability table
-- 3. Creates notifications table
-- 4. Creates prescriptions table (new version)
-- 5. Creates payment_transactions table
-- ============================================

BEGIN;

-- ============================================
-- 1. APPOINTMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NULL REFERENCES public."User"(id) ON DELETE SET NULL,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,

    -- Appointment Details
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_end_time TIMESTAMP WITH TIME ZONE NULL,
    duration_minutes INTEGER DEFAULT 30,

    -- Type & Status
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'opd',
    consultation_mode VARCHAR(50) DEFAULT 'in_person',
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',

    -- Details
    department VARCHAR(100) NULL,
    reason TEXT NULL,
    symptoms TEXT NULL,
    notes TEXT NULL,
    cancellation_reason TEXT NULL,

    -- Online Consultation
    meeting_link TEXT NULL,
    meeting_id VARCHAR(255) NULL,
    meeting_password VARCHAR(255) NULL,

    -- Payment
    payment_required BOOLEAN DEFAULT false,
    payment_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50) NULL,
    payment_id VARCHAR(255) NULL,
    payment_date TIMESTAMP WITH TIME ZONE NULL,

    -- Notifications
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE NULL,
    confirmation_sent BOOLEAN DEFAULT false,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID NULL,

    -- Booking source
    booking_source VARCHAR(50) DEFAULT 'staff',

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE NULL,
    cancelled_by UUID NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Trigger for updated_at (reuse existing function)
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin full access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Tenant staff can access appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can access their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;

CREATE POLICY "Superadmin full access to appointments"
    ON public.appointments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND ("User".is_superadmin = true OR "User".role = 'admin')
        )
    );

CREATE POLICY "Tenant staff can access appointments"
    ON public.appointments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = appointments.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Patients can access their appointments"
    ON public.appointments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = appointments.patient_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Patients can create appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = appointments.patient_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

-- ============================================
-- 2. DOCTOR AVAILABILITY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,

    -- Schedule
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Details
    is_available BOOLEAN DEFAULT true,
    max_appointments INTEGER DEFAULT 20,
    slot_duration_minutes INTEGER DEFAULT 30,

    -- Effective dates
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CHECK (day_of_week BETWEEN 0 AND 6),
    CHECK (start_time < end_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doctor_availability_tenant_id ON public.doctor_availability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);

-- RLS
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone in tenant can view doctor availability" ON public.doctor_availability;

CREATE POLICY "Anyone in tenant can view doctor availability"
    ON public.doctor_availability FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = doctor_availability.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
        OR
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.tenant_id = doctor_availability.tenant_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

-- ============================================
-- 3. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    patient_id UUID NULL REFERENCES public.patients(id) ON DELETE CASCADE,

    -- Related entities
    appointment_id UUID NULL REFERENCES public.appointments(id) ON DELETE SET NULL,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,

    -- Notification Details
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',

    -- Content
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    html_content TEXT NULL,
    data JSONB DEFAULT '{}'::jsonb,

    -- Recipient
    recipient_email VARCHAR(255) NULL,
    recipient_phone VARCHAR(20) NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,

    -- Timing
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    delivered_at TIMESTAMP WITH TIME ZONE NULL,
    read_at TIMESTAMP WITH TIME ZONE NULL,
    failed_at TIMESTAMP WITH TIME ZONE NULL,

    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- External IDs
    external_id VARCHAR(255) NULL,
    external_status VARCHAR(100) NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient_id ON public.notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin full access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Tenant staff can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Patients can view their notifications" ON public.notifications;

CREATE POLICY "Superadmin full access to notifications"
    ON public.notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND ("User".is_superadmin = true OR "User".role = 'admin')
        )
    );

CREATE POLICY "Tenant staff can view notifications"
    ON public.notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = notifications.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid()::uuid);

CREATE POLICY "Patients can view their notifications"
    ON public.notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = notifications.patient_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

-- ============================================
-- 4. PRESCRIPTIONS TABLE (NEW - won't conflict)
-- ============================================

-- NOTE: Your DB already has a 'prescriptions' table
-- We'll create 'digital_prescriptions' instead to avoid conflicts

CREATE TABLE IF NOT EXISTS public.digital_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE RESTRICT,

    -- Prescription Details
    prescription_number VARCHAR(100) UNIQUE NOT NULL,
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Diagnosis
    diagnosis TEXT NOT NULL,
    clinical_notes TEXT NULL,

    -- Medications (JSONB array)
    medications JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Instructions
    general_instructions TEXT NULL,
    dietary_advice TEXT NULL,
    precautions TEXT NULL,

    -- Follow-up
    follow_up_date DATE NULL,
    follow_up_instructions TEXT NULL,

    -- Lab Tests Advised
    lab_tests_advised TEXT[] DEFAULT '{}',

    -- Document
    pdf_url TEXT NULL,
    pdf_generated_at TIMESTAMP WITH TIME ZONE NULL,

    -- Delivery Status
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE NULL,
    whatsapp_sent BOOLEAN DEFAULT false,
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE NULL,

    -- Signature
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_digital_prescriptions_tenant_id ON public.digital_prescriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_digital_prescriptions_visit_id ON public.digital_prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_digital_prescriptions_patient_id ON public.digital_prescriptions(patient_id);

-- Trigger
DROP TRIGGER IF EXISTS update_digital_prescriptions_updated_at ON public.digital_prescriptions;
CREATE TRIGGER update_digital_prescriptions_updated_at
    BEFORE UPDATE ON public.digital_prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.digital_prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin full access to digital_prescriptions" ON public.digital_prescriptions;
DROP POLICY IF EXISTS "Tenant staff can access digital_prescriptions" ON public.digital_prescriptions;
DROP POLICY IF EXISTS "Patients can view their digital_prescriptions" ON public.digital_prescriptions;

CREATE POLICY "Superadmin full access to digital_prescriptions"
    ON public.digital_prescriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND ("User".is_superadmin = true OR "User".role = 'admin')
        )
    );

CREATE POLICY "Tenant staff can access digital_prescriptions"
    ON public.digital_prescriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = digital_prescriptions.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Patients can view their digital_prescriptions"
    ON public.digital_prescriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = digital_prescriptions.patient_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

-- ============================================
-- 5. PAYMENT TRANSACTIONS TABLE (NEW)
-- ============================================

-- NOTE: Your DB already has 'payment_transactions' table
-- We'll create 'online_payment_transactions' instead

CREATE TABLE IF NOT EXISTS public.online_payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_id UUID NULL REFERENCES public.appointments(id) ON DELETE SET NULL,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,

    -- Payment Details
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    gateway_transaction_id VARCHAR(255) NULL,
    order_id VARCHAR(255) NULL,

    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,

    -- Payment Method
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50) NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    -- Details
    description TEXT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Gateway Response
    gateway_response JSONB DEFAULT '{}'::jsonb,
    error_message TEXT NULL,

    -- Timing
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,

    -- Receipt
    receipt_number VARCHAR(100) NULL,
    receipt_url TEXT NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_online_payment_transactions_tenant_id ON public.online_payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_online_payment_transactions_patient_id ON public.online_payment_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_online_payment_transactions_status ON public.online_payment_transactions(status);

-- RLS
ALTER TABLE public.online_payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin full access to online_payment_transactions" ON public.online_payment_transactions;
DROP POLICY IF EXISTS "Tenant staff can access online_payment_transactions" ON public.online_payment_transactions;
DROP POLICY IF EXISTS "Patients can view their transactions" ON public.online_payment_transactions;

CREATE POLICY "Superadmin full access to online_payment_transactions"
    ON public.online_payment_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND ("User".is_superadmin = true OR "User".role = 'admin')
        )
    );

CREATE POLICY "Tenant staff can access online_payment_transactions"
    ON public.online_payment_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = online_payment_transactions.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Patients can view their transactions"
    ON public.online_payment_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = online_payment_transactions.patient_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check appointments table
SELECT 'Appointments table created' as status,
       COUNT(*) as count
FROM public.appointments;

-- Check notifications table
SELECT 'Notifications table created' as status,
       COUNT(*) as count
FROM public.notifications;

-- Check digital_prescriptions table
SELECT 'Digital prescriptions table created' as status,
       COUNT(*) as count
FROM public.digital_prescriptions;

-- Check online_payment_transactions table
SELECT 'Online payment transactions table created' as status,
       COUNT(*) as count
FROM public.online_payment_transactions;

-- List all new tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('appointments', 'doctor_availability', 'notifications', 'digital_prescriptions', 'online_payment_transactions')
ORDER BY table_name;

-- ============================================
-- DONE!
-- ============================================
-- Appointments & Notifications setup complete (SAFE VERSION)
--
-- WHAT WAS DONE:
-- ✓ Created 5 new tables
-- ✓ Created RLS policies
-- ✓ Created indexes
-- ✓ NO EXISTING DATA WAS MODIFIED
--
-- NOTE ON TABLE NAMES:
-- - Used 'digital_prescriptions' instead of 'prescriptions' (already exists)
-- - Used 'online_payment_transactions' instead of 'payment_transactions' (already exists)
--
-- NEXT STEPS:
-- 1. Run verification queries above
-- 2. Update frontend to use new table names
-- 3. Test appointment booking
-- ============================================
