-- ============================================
-- AI SURGEON PILOT - APPOINTMENTS & NOTIFICATIONS
-- ============================================
-- This script creates tables for patient portal features
-- Run this AFTER 08_multi_tenant_setup.sql
-- Version: 2.0
-- Date: 2025-11-14
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
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL, -- Linked after visit is created

    -- Appointment Details
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_end_time TIMESTAMP WITH TIME ZONE NULL,
    duration_minutes INTEGER DEFAULT 30,

    -- Type & Status
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'opd', -- opd, online, followup, emergency
    consultation_mode VARCHAR(50) DEFAULT 'in_person', -- in_person, video, phone
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    -- Status flow: scheduled → confirmed → in_progress → completed / cancelled / no_show

    -- Details
    department VARCHAR(100) NULL,
    reason TEXT NULL,
    symptoms TEXT NULL,
    notes TEXT NULL,
    cancellation_reason TEXT NULL,

    -- Online Consultation
    meeting_link TEXT NULL, -- Zoom/Google Meet link
    meeting_id VARCHAR(255) NULL,
    meeting_password VARCHAR(255) NULL,

    -- Payment
    payment_required BOOLEAN DEFAULT false,
    payment_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_method VARCHAR(50) NULL, -- cash, card, upi, online
    payment_id VARCHAR(255) NULL, -- Payment gateway transaction ID
    payment_date TIMESTAMP WITH TIME ZONE NULL,

    -- Notifications
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE NULL,
    confirmation_sent BOOLEAN DEFAULT false,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NULL REFERENCES public."User"(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID NULL REFERENCES public."User"(id),

    -- Booking source
    booking_source VARCHAR(50) DEFAULT 'staff', -- staff, patient_portal, whatsapp, phone

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE NULL,
    cancelled_by UUID NULL REFERENCES public."User"(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Superadmin can see all
CREATE POLICY "Superadmin full access to appointments"
    ON public.appointments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

-- Tenant staff can access their tenant's appointments
CREATE POLICY "Tenant staff can access appointments"
    ON public.appointments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = appointments.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

-- Patients can view and create their own appointments
CREATE POLICY "Patients can access their appointments"
    ON public.appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = appointments.patient_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Patients can create appointments"
    ON public.appointments
    FOR INSERT
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
    day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Details
    is_available BOOLEAN DEFAULT true,
    max_appointments INTEGER DEFAULT 20, -- Max appointments per slot
    slot_duration_minutes INTEGER DEFAULT 30,

    -- Effective dates
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE NULL, -- NULL means indefinite

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CHECK (day_of_week BETWEEN 0 AND 6),
    CHECK (start_time < end_time),
    CHECK (effective_from <= COALESCE(effective_until, effective_from))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doctor_availability_tenant_id ON public.doctor_availability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day_of_week ON public.doctor_availability(day_of_week);

-- RLS for doctor_availability
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone in tenant can view doctor availability"
    ON public.doctor_availability
    FOR SELECT
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
    type VARCHAR(50) NOT NULL, -- email, whatsapp, sms, push, in_app
    channel VARCHAR(50) NOT NULL, -- appointment, prescription, billing, general, emergency
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

    -- Content
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    html_content TEXT NULL, -- For email
    data JSONB DEFAULT '{}'::jsonb, -- Additional structured data

    -- Recipient
    recipient_email VARCHAR(255) NULL,
    recipient_phone VARCHAR(20) NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, delivered, failed, read
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

    -- External IDs (from email/SMS services)
    external_id VARCHAR(255) NULL,
    external_status VARCHAR(100) NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NULL REFERENCES public."User"(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient_id ON public.notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Superadmin can see all
CREATE POLICY "Superadmin full access to notifications"
    ON public.notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

-- Tenant staff can see their tenant's notifications
CREATE POLICY "Tenant staff can view notifications"
    ON public.notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = notifications.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

-- Users can see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid()::uuid);

-- Patients can see their own notifications
CREATE POLICY "Patients can view their notifications"
    ON public.notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = notifications.patient_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

-- ============================================
-- 4. PRESCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.prescriptions (
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
    /*
    Example structure:
    [
        {
            "medicine_name": "Paracetamol 500mg",
            "dosage": "1 tablet",
            "frequency": "Three times daily",
            "duration": "5 days",
            "instructions": "After meals",
            "quantity": 15
        }
    ]
    */

    -- Instructions
    general_instructions TEXT NULL,
    dietary_advice TEXT NULL,
    precautions TEXT NULL,

    -- Follow-up
    follow_up_date DATE NULL,
    follow_up_instructions TEXT NULL,

    -- Lab Tests Advised
    lab_tests_advised TEXT[] DEFAULT '{}', -- Array of test names

    -- Document
    pdf_url TEXT NULL, -- URL to generated PDF
    pdf_generated_at TIMESTAMP WITH TIME ZONE NULL,

    -- Delivery Status
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE NULL,
    whatsapp_sent BOOLEAN DEFAULT false,
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE NULL,
    sms_sent BOOLEAN DEFAULT false,
    sms_sent_at TIMESTAMP WITH TIME ZONE NULL,

    -- Signature & Verification
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE NULL,
    digital_signature TEXT NULL,

    -- Validity
    valid_until DATE NULL,
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant_id ON public.prescriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_id ON public.prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_date ON public.prescriptions(prescription_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for prescriptions
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Superadmin can see all
CREATE POLICY "Superadmin full access to prescriptions"
    ON public.prescriptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

-- Tenant staff can access their tenant's prescriptions
CREATE POLICY "Tenant staff can access prescriptions"
    ON public.prescriptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = prescriptions.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

-- Patients can view their own prescriptions
CREATE POLICY "Patients can view their prescriptions"
    ON public.prescriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = prescriptions.patient_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

-- ============================================
-- 5. PAYMENT TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_id UUID NULL REFERENCES public.appointments(id) ON DELETE SET NULL,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,

    -- Payment Details
    transaction_id VARCHAR(255) UNIQUE NOT NULL, -- Our internal ID
    gateway_transaction_id VARCHAR(255) NULL, -- Razorpay/Stripe ID
    order_id VARCHAR(255) NULL,

    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,

    -- Payment Method
    payment_method VARCHAR(50) NOT NULL, -- card, upi, netbanking, wallet, cash
    payment_gateway VARCHAR(50) NULL, -- razorpay, stripe, paytm, etc.

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, processing, completed, failed, refunded, cancelled

    -- Details
    description TEXT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Card/Bank Details (masked)
    card_last4 VARCHAR(4) NULL,
    card_brand VARCHAR(50) NULL,
    bank_name VARCHAR(100) NULL,

    -- Gateway Response
    gateway_response JSONB DEFAULT '{}'::jsonb,
    error_code VARCHAR(50) NULL,
    error_message TEXT NULL,

    -- Refund
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_reason TEXT NULL,
    refunded_at TIMESTAMP WITH TIME ZONE NULL,
    refund_transaction_id VARCHAR(255) NULL,

    -- Timing
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    failed_at TIMESTAMP WITH TIME ZONE NULL,

    -- Receipt
    receipt_number VARCHAR(100) NULL,
    receipt_url TEXT NULL,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NULL REFERENCES public."User"(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON public.payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient_id ON public.payment_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_appointment_id ON public.payment_transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- RLS for payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Superadmin can see all
CREATE POLICY "Superadmin full access to payment_transactions"
    ON public.payment_transactions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE "User".id = auth.uid()::uuid
            AND "User".is_superadmin = true
        )
    );

-- Tenant staff can access their tenant's transactions
CREATE POLICY "Tenant staff can access payment_transactions"
    ON public.payment_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_users.tenant_id = payment_transactions.tenant_id
            AND tenant_users.user_id = auth.uid()::uuid
        )
    );

-- Patients can view their own transactions
CREATE POLICY "Patients can view their transactions"
    ON public.payment_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_users
            WHERE patient_users.patient_id = payment_transactions.patient_id
            AND patient_users.user_id = auth.uid()::uuid
        )
    );

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

SELECT 'Appointments table created' as status,
       COUNT(*) as count
FROM public.appointments;

SELECT 'Notifications table created' as status,
       COUNT(*) as count
FROM public.notifications;

SELECT 'Prescriptions table created' as status,
       COUNT(*) as count
FROM public.prescriptions;

SELECT 'Payment transactions table created' as status,
       COUNT(*) as count
FROM public.payment_transactions;

-- ============================================
-- DONE!
-- ============================================
