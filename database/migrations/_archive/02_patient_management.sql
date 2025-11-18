-- ============================================
-- AI SURGEON PILOT - PATIENT MANAGEMENT SETUP
-- ============================================
-- This script creates the core patient and visit tables
-- Run this AFTER 01_core_authentication.sql
-- Version: 1.1
-- Date: 2025-10-26
-- ============================================

-- ============================================
-- 1. PATIENTS TABLE
-- ============================================
-- Core patient demographic and contact information

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Information
    name VARCHAR(255) NOT NULL,
    patients_id VARCHAR(50) NULL UNIQUE, -- Custom patient ID

    -- Demographics
    age INTEGER NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(20) NULL,
    blood_group VARCHAR(10) NULL,

    -- Contact Information
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    city_town VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    pin_code VARCHAR(10) NULL,
    panchayat VARCHAR(100) NULL,
    quarter_plot_no VARCHAR(100) NULL,

    -- Emergency Contacts
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_mobile VARCHAR(20) NULL,
    second_emergency_contact_name VARCHAR(255) NULL,
    second_emergency_contact_mobile VARCHAR(20) NULL,
    relative_phone_no VARCHAR(20) NULL,
    spouse_name VARCHAR(255) NULL,

    -- Identity & Insurance
    identity_type VARCHAR(50) NULL,
    aadhar_passport VARCHAR(50) NULL,
    insurance_person_no VARCHAR(50) NULL,
    privilege_card_number VARCHAR(50) NULL,

    -- Medical Information
    allergies TEXT NULL,
    instructions TEXT NULL,
    patient_photo TEXT NULL, -- URL to photo

    -- Hospital & Corporate
    hospital_name VARCHAR(255) NULL,
    corporate VARCHAR(255) NULL,
    ward VARCHAR(100) NULL,

    -- Management
    relationship_manager VARCHAR(255) NULL,
    billing_link TEXT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_patients_id ON public.patients(patients_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_name ON public.patients(hospital_name);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at DESC);

-- ============================================
-- 2. VISITS TABLE
-- ============================================
-- Patient visits, admissions, and appointments

CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Visit Identification
    visit_id VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,

    -- Visit Details
    visit_type VARCHAR(50) NOT NULL, -- OPD, IPD, Emergency
    visit_date DATE NOT NULL,
    reason_for_visit TEXT NULL,
    appointment_with VARCHAR(255) NOT NULL, -- Doctor name

    -- Admission & Discharge
    admission_date DATE NULL,
    discharge_date DATE NULL,
    discharge_mode VARCHAR(50) NULL,
    discharge_notes TEXT NULL,
    discharge_summary_signed BOOLEAN DEFAULT false,

    -- Medical
    diagnosis_id UUID NULL, -- Will be foreign key after diagnoses table created
    surgery_date DATE NULL,

    -- Billing & Claims
    billing_status VARCHAR(50) NULL,
    billing_sub_status VARCHAR(50) NULL,
    billing_executive VARCHAR(255) NULL,
    bill_paid BOOLEAN DEFAULT false,
    final_bill_printed BOOLEAN DEFAULT false,
    claim_id VARCHAR(50) NULL,
    esic_uh_id VARCHAR(50) NULL,
    cghs_code VARCHAR(50) NULL,
    bunch_no VARCHAR(50) NULL,
    sr_no VARCHAR(50) NULL,
    package_amount VARCHAR(50) NULL,

    -- Approvals & Documentation
    intimation_done VARCHAR(50) NULL,
    surgical_approval VARCHAR(50) NULL,
    additional_approvals VARCHAR(255) NULL,
    authorized_by VARCHAR(255) NULL,

    -- Extensions & Delays
    extension_of_stay VARCHAR(50) NULL,
    extension_taken VARCHAR(50) NULL,
    delay_waiver_intimation VARCHAR(50) NULL,
    condonation_delay_intimation VARCHAR(50) NULL,
    condonation_delay_claim VARCHAR(50) NULL,
    condonation_delay_submission VARCHAR(50) NULL,

    -- SST Treatment
    sst_treatment VARCHAR(100) NULL,
    relation_with_employee VARCHAR(100) NULL,

    -- Clearances
    nurse_clearance BOOLEAN DEFAULT false,
    pharmacy_clearance BOOLEAN DEFAULT false,

    -- Gate Pass
    gate_pass_generated BOOLEAN DEFAULT false,
    gate_pass_id UUID NULL,

    -- File Management
    file_status VARCHAR(50) NULL,

    -- Status & Remarks
    status VARCHAR(50) NULL,
    remark1 TEXT NULL,
    remark2 TEXT NULL,

    -- Referring Doctor
    referring_doctor_id UUID NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_visit_id ON public.visits(visit_id);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON public.visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_visit_type ON public.visits(visit_type);
CREATE INDEX IF NOT EXISTS idx_visits_billing_status ON public.visits(billing_status);
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_admission_date ON public.visits(admission_date);
CREATE INDEX IF NOT EXISTS idx_visits_discharge_date ON public.visits(discharge_date);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on patients table
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Patients policies
CREATE POLICY "Anyone can view patients"
    ON public.patients FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert patients"
    ON public.patients FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
    ON public.patients FOR UPDATE USING (true);

CREATE POLICY "Only admins can delete patients"
    ON public.patients FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE id = auth.uid()::uuid AND role = 'admin'
        )
    );

-- Enable RLS on visits table
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Visits policies
CREATE POLICY "Anyone can view visits"
    ON public.visits FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert visits"
    ON public.visits FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update visits"
    ON public.visits FOR UPDATE USING (true);

CREATE POLICY "Only admins can delete visits"
    ON public.visits FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public."User"
            WHERE id = auth.uid()::uuid AND role = 'admin'
        )
    );

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Auto-update updated_at for patients
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for visits
CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON public.visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample patient
INSERT INTO public.patients (
    name, patients_id, age, gender, phone, email, hospital_name
) VALUES (
    'John Doe', 'PT001', 45, 'Male', '+91-9876543210', 'john.doe@example.com', 'Hope Hospital'
) ON CONFLICT (patients_id) DO NOTHING;

-- Insert sample visit for the patient
INSERT INTO public.visits (
    visit_id, patient_id, visit_type, visit_date, appointment_with, status
) VALUES (
    'VST001',
    (SELECT id FROM public.patients WHERE patients_id = 'PT001' LIMIT 1),
    'OPD',
    CURRENT_DATE,
    'Dr. Smith',
    'active'
) ON CONFLICT (visit_id) DO NOTHING;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Verify patients table
SELECT
    'Patients table created' as status,
    COUNT(*) as patient_count
FROM public.patients;

-- Verify visits table
SELECT
    'Visits table created' as status,
    COUNT(*) as visit_count
FROM public.visits;

-- Show patients table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'patients'
ORDER BY ordinal_position;

-- ============================================
-- DONE!
-- ============================================
-- Patient management tables created successfully
-- ============================================
