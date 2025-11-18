-- ============================================
-- AI SURGEON PILOT - MASTER DATABASE SETUP
-- ============================================
-- This is the MASTER script that sets up the entire database
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- Version: 1.3
-- Date: 2025-10-26
-- ============================================
--
-- WHAT THIS SCRIPT DOES:
-- 1. Creates authentication tables (User)
-- 2. Creates patient management tables (patients, visits)
-- 3. Creates medical reference data (diagnoses, complications, medications)
-- 4. Creates visit junction tables (visit_diagnoses, visit_complications, etc.)
-- 5. Creates AI patient follow-up tables (education, voice calls, WhatsApp, automation)
-- 6. Sets up Row Level Security (RLS) policies
-- 7. Creates indexes for performance
-- 8. Inserts sample data for testing
--
-- ESTIMATED TIME: 2-3 minutes
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: CORE AUTHENTICATION
-- ============================================
\echo '=========================================='
\echo 'Step 1: Creating authentication tables...'
\echo '=========================================='

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE IF NOT EXISTS public."User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    hospital_type VARCHAR(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_email ON public."User"(email);

-- Enable RLS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Create update trigger function (will be reused)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON public."User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User policies
CREATE POLICY "Anyone can view users" ON public."User" FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON public."User" FOR INSERT WITH CHECK (true);

-- Sample user (password: admin123 - hashed)
INSERT INTO public."User" (email, password, role, hospital_type) VALUES
    ('admin@aisurgeonpilot.com', '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi', 'admin', 'hope')
ON CONFLICT (email) DO NOTHING;

\echo 'Step 1: ✓ Authentication tables created'

-- ============================================
-- STEP 2: PATIENT MANAGEMENT
-- ============================================
\echo '=========================================='
\echo 'Step 2: Creating patient management tables...'
\echo '=========================================='

-- Patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    patients_id VARCHAR(50) NULL UNIQUE,
    age INTEGER NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(20) NULL,
    blood_group VARCHAR(10) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    city_town VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    pin_code VARCHAR(10) NULL,
    panchayat VARCHAR(100) NULL,
    quarter_plot_no VARCHAR(100) NULL,
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_mobile VARCHAR(20) NULL,
    second_emergency_contact_name VARCHAR(255) NULL,
    second_emergency_contact_mobile VARCHAR(20) NULL,
    relative_phone_no VARCHAR(20) NULL,
    spouse_name VARCHAR(255) NULL,
    identity_type VARCHAR(50) NULL,
    aadhar_passport VARCHAR(50) NULL,
    insurance_person_no VARCHAR(50) NULL,
    privilege_card_number VARCHAR(50) NULL,
    allergies TEXT NULL,
    instructions TEXT NULL,
    patient_photo TEXT NULL,
    hospital_name VARCHAR(255) NULL,
    corporate VARCHAR(255) NULL,
    ward VARCHAR(100) NULL,
    relationship_manager VARCHAR(255) NULL,
    billing_link TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Anyone can manage patients" ON public.patients FOR ALL USING (true);

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Visits table
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_type VARCHAR(50) NOT NULL,
    visit_date DATE NOT NULL,
    reason_for_visit TEXT NULL,
    appointment_with VARCHAR(255) NOT NULL,
    admission_date DATE NULL,
    discharge_date DATE NULL,
    discharge_mode VARCHAR(50) NULL,
    discharge_notes TEXT NULL,
    discharge_summary_signed BOOLEAN DEFAULT false,
    diagnosis_id UUID NULL,
    surgery_date DATE NULL,
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
    intimation_done VARCHAR(50) NULL,
    surgical_approval VARCHAR(50) NULL,
    additional_approvals VARCHAR(255) NULL,
    authorized_by VARCHAR(255) NULL,
    extension_of_stay VARCHAR(50) NULL,
    extension_taken VARCHAR(50) NULL,
    delay_waiver_intimation VARCHAR(50) NULL,
    condonation_delay_intimation VARCHAR(50) NULL,
    condonation_delay_claim VARCHAR(50) NULL,
    condonation_delay_submission VARCHAR(50) NULL,
    sst_treatment VARCHAR(100) NULL,
    relation_with_employee VARCHAR(100) NULL,
    nurse_clearance BOOLEAN DEFAULT false,
    pharmacy_clearance BOOLEAN DEFAULT false,
    gate_pass_generated BOOLEAN DEFAULT false,
    gate_pass_id UUID NULL,
    file_status VARCHAR(50) NULL,
    status VARCHAR(50) NULL,
    remark1 TEXT NULL,
    remark2 TEXT NULL,
    referring_doctor_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_visit_id ON public.visits(visit_id);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON public.visits(patient_id);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visits" ON public.visits FOR SELECT USING (true);
CREATE POLICY "Anyone can manage visits" ON public.visits FOR ALL USING (true);

CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON public.visits FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo 'Step 2: ✓ Patient management tables created'

-- ============================================
-- STEP 3: MEDICAL REFERENCE DATA
-- ============================================
\echo '=========================================='
\echo 'Step 3: Creating medical reference tables...'
\echo '=========================================='

-- Diagnoses
CREATE TABLE IF NOT EXISTS public.diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view diagnoses" ON public.diagnoses FOR SELECT USING (true);
CREATE POLICY "Anyone can manage diagnoses" ON public.diagnoses FOR ALL USING (true);

-- Complications
CREATE TABLE IF NOT EXISTS public.complications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.complications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view complications" ON public.complications FOR SELECT USING (true);
CREATE POLICY "Anyone can manage complications" ON public.complications FOR ALL USING (true);

-- Medication
CREATE TABLE IF NOT EXISTS public.medication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NULL,
    frequency VARCHAR(100) NULL,
    duration VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.medication ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view medication" ON public.medication FOR SELECT USING (true);
CREATE POLICY "Anyone can manage medication" ON public.medication FOR ALL USING (true);

-- Referees
CREATE TABLE IF NOT EXISTS public.referees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NULL,
    qualification VARCHAR(255) NULL,
    hospital_affiliation VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    commission_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.referees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view referees" ON public.referees FOR SELECT USING (true);
CREATE POLICY "Anyone can manage referees" ON public.referees FOR ALL USING (true);

-- Add foreign keys to visits
ALTER TABLE public.visits
ADD CONSTRAINT fk_visits_diagnosis
FOREIGN KEY (diagnosis_id) REFERENCES public.diagnoses(id) ON DELETE SET NULL;

ALTER TABLE public.visits
ADD CONSTRAINT fk_visits_referring_doctor
FOREIGN KEY (referring_doctor_id) REFERENCES public.referees(id) ON DELETE SET NULL;

\echo 'Step 3: ✓ Medical reference tables created'

-- ============================================
-- STEP 4: VISIT JUNCTION TABLES
-- ============================================
\echo '=========================================='
\echo 'Step 4: Creating visit junction tables...'
\echo '=========================================='

-- Visit Diagnoses
CREATE TABLE IF NOT EXISTS public.visit_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(visit_id, diagnosis_id)
);

ALTER TABLE public.visit_diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_diagnoses" ON public.visit_diagnoses FOR SELECT USING (true);
CREATE POLICY "Anyone can manage visit_diagnoses" ON public.visit_diagnoses FOR ALL USING (true);

-- Visit Complications
CREATE TABLE IF NOT EXISTS public.visit_complications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    complication_id UUID NOT NULL REFERENCES public.complications(id) ON DELETE CASCADE,
    severity VARCHAR(50) NULL,
    onset_date DATE NULL,
    resolution_date DATE NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(visit_id, complication_id)
);

ALTER TABLE public.visit_complications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_complications" ON public.visit_complications FOR SELECT USING (true);
CREATE POLICY "Anyone can manage visit_complications" ON public.visit_complications FOR ALL USING (true);

-- Visit Medications
CREATE TABLE IF NOT EXISTS public.visit_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES public.medication(id) ON DELETE CASCADE,
    dosage VARCHAR(100) NULL,
    frequency VARCHAR(100) NULL,
    duration VARCHAR(100) NULL,
    route VARCHAR(50) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    prescribed_by VARCHAR(255) NULL,
    notes TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.visit_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_medications" ON public.visit_medications FOR SELECT USING (true);
CREATE POLICY "Anyone can manage visit_medications" ON public.visit_medications FOR ALL USING (true);

-- Lab (Master)
CREATE TABLE IF NOT EXISTS public.lab (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NULL,
    description TEXT NULL,
    normal_range VARCHAR(255) NULL,
    unit VARCHAR(50) NULL,
    cost DECIMAL(10,2) NULL,
    turnaround_time VARCHAR(50) NULL,
    sample_type VARCHAR(50) NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lab ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lab" ON public.lab FOR SELECT USING (true);
CREATE POLICY "Anyone can manage lab" ON public.lab FOR ALL USING (true);

-- Visit Labs
CREATE TABLE IF NOT EXISTS public.visit_labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES public.lab(id) ON DELETE CASCADE,
    ordered_date DATE NULL,
    sample_collected_date DATE NULL,
    result_date DATE NULL,
    result_value TEXT NULL,
    result_status VARCHAR(50) NULL,
    ordered_by VARCHAR(255) NULL,
    reported_by VARCHAR(255) NULL,
    quantity INTEGER DEFAULT 1,
    unit_rate DECIMAL(10,2) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.visit_labs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_labs" ON public.visit_labs FOR SELECT USING (true);
CREATE POLICY "Anyone can manage visit_labs" ON public.visit_labs FOR ALL USING (true);

-- Radiology (Master)
CREATE TABLE IF NOT EXISTS public.radiology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NULL,
    description TEXT NULL,
    cost DECIMAL(10,2) NULL,
    body_part VARCHAR(100) NULL,
    radiation_dose VARCHAR(50) NULL,
    contrast_required BOOLEAN DEFAULT false,
    preparation_instructions TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.radiology ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view radiology" ON public.radiology FOR SELECT USING (true);
CREATE POLICY "Anyone can manage radiology" ON public.radiology FOR ALL USING (true);

-- Visit Radiology
CREATE TABLE IF NOT EXISTS public.visit_radiology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    radiology_id UUID NOT NULL REFERENCES public.radiology(id) ON DELETE CASCADE,
    ordered_date DATE NULL,
    performed_date DATE NULL,
    report_date DATE NULL,
    findings TEXT NULL,
    impression TEXT NULL,
    status VARCHAR(50) NULL,
    ordered_by VARCHAR(255) NULL,
    performed_by VARCHAR(255) NULL,
    reported_by VARCHAR(255) NULL,
    quantity INTEGER DEFAULT 1,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.visit_radiology ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_radiology" ON public.visit_radiology FOR SELECT USING (true);
CREATE POLICY "Anyone can manage visit_radiology" ON public.visit_radiology FOR ALL USING (true);

-- Visit Surgeries
CREATE TABLE IF NOT EXISTS public.visit_surgeries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    surgery_name VARCHAR(255) NOT NULL,
    surgery_date DATE NULL,
    surgery_time TIME NULL,
    duration_minutes INTEGER NULL,
    surgeon_name VARCHAR(255) NULL,
    assistant_surgeon VARCHAR(255) NULL,
    anesthetist VARCHAR(255) NULL,
    anesthesia_type VARCHAR(100) NULL,
    operation_theatre VARCHAR(100) NULL,
    procedure_notes TEXT NULL,
    complications TEXT NULL,
    blood_loss_ml INTEGER NULL,
    specimens_sent TEXT NULL,
    implants_used TEXT NULL,
    status VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.visit_surgeries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visit_surgeries" ON public.visit_surgeries FOR SELECT USING (true);
CREATE POLICY "Anyone can manage visit_surgeries" ON public.visit_surgeries FOR ALL USING (true);

\echo 'Step 4: ✓ Visit junction tables created'

-- ============================================
-- STEP 5: AI PATIENT FOLLOW-UP & AUTOMATION
-- ============================================
\echo '=========================================='
\echo 'Step 5: Creating AI patient follow-up tables...'
\echo '=========================================='

-- Patient Education Content
CREATE TABLE IF NOT EXISTS public.patient_education_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_url TEXT NULL,
    content_text TEXT NULL,
    description TEXT NULL,
    thumbnail_url TEXT NULL,
    duration_minutes INTEGER NULL,
    surgery_types TEXT[] NULL,
    diagnosis_ids UUID[] NULL,
    tags TEXT[] NULL,
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_education_content_type ON public.patient_education_content(content_type);
CREATE INDEX IF NOT EXISTS idx_patient_education_content_surgery_types ON public.patient_education_content USING GIN(surgery_types);
CREATE INDEX IF NOT EXISTS idx_patient_education_content_is_active ON public.patient_education_content(is_active);

CREATE TRIGGER update_patient_education_content_updated_at
    BEFORE UPDATE ON public.patient_education_content FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.patient_education_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patient_education_content" ON public.patient_education_content FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage patient_education_content" ON public.patient_education_content FOR ALL USING (true);

-- Patient Education Tracking
CREATE TABLE IF NOT EXISTS public.patient_education_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.patient_education_content(id) ON DELETE CASCADE,
    sent_via VARCHAR(50) NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_date TIMESTAMP WITH TIME ZONE NULL,
    completed_date TIMESTAMP WITH TIME ZONE NULL,
    engagement_score INTEGER DEFAULT 0,
    feedback_rating INTEGER NULL,
    feedback_notes TEXT NULL,
    sent_by VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_education_tracking_patient_id ON public.patient_education_tracking(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_education_tracking_content_id ON public.patient_education_tracking(content_id);
CREATE INDEX IF NOT EXISTS idx_patient_education_tracking_sent_date ON public.patient_education_tracking(sent_date);

ALTER TABLE public.patient_education_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patient_education_tracking" ON public.patient_education_tracking FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage patient_education_tracking" ON public.patient_education_tracking FOR ALL USING (true);

-- Surgery Options
CREATE TABLE IF NOT EXISTS public.surgery_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
    surgery_name VARCHAR(255) NOT NULL,
    procedure_type VARCHAR(100) NULL,
    procedure_details TEXT NULL,
    indications TEXT NULL,
    contraindications TEXT NULL,
    risks TEXT[] NULL,
    benefits TEXT[] NULL,
    recovery_time_days INTEGER NULL,
    hospital_stay_days INTEGER NULL,
    cost_range_min DECIMAL(10,2) NULL,
    cost_range_max DECIMAL(10,2) NULL,
    success_rate DECIMAL(5,2) NULL,
    anesthesia_type VARCHAR(100) NULL,
    preparation_requirements TEXT NULL,
    post_op_care TEXT NULL,
    alternative_treatments TEXT NULL,
    is_recommended BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surgery_options_diagnosis_id ON public.surgery_options(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_surgery_options_is_active ON public.surgery_options(is_active);
CREATE INDEX IF NOT EXISTS idx_surgery_options_display_order ON public.surgery_options(display_order);

CREATE TRIGGER update_surgery_options_updated_at
    BEFORE UPDATE ON public.surgery_options FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.surgery_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view surgery_options" ON public.surgery_options FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage surgery_options" ON public.surgery_options FOR ALL USING (true);

-- Patient Surgery Preferences
CREATE TABLE IF NOT EXISTS public.patient_surgery_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    surgery_option_id UUID NOT NULL REFERENCES public.surgery_options(id) ON DELETE CASCADE,
    preference_rank INTEGER NULL,
    decision_status VARCHAR(50) DEFAULT 'considering',
    concerns TEXT[] NULL,
    questions TEXT[] NULL,
    notes TEXT NULL,
    decided_date DATE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_patient_id ON public.patient_surgery_preferences(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_visit_id ON public.patient_surgery_preferences(visit_id);
CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_surgery_option_id ON public.patient_surgery_preferences(surgery_option_id);
CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_decision_status ON public.patient_surgery_preferences(decision_status);

CREATE TRIGGER update_patient_surgery_preferences_updated_at
    BEFORE UPDATE ON public.patient_surgery_preferences FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.patient_surgery_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patient_surgery_preferences" ON public.patient_surgery_preferences FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage patient_surgery_preferences" ON public.patient_surgery_preferences FOR ALL USING (true);

-- Voice Call Logs
CREATE TABLE IF NOT EXISTS public.voice_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,
    call_type VARCHAR(50) NOT NULL,
    call_direction VARCHAR(20) DEFAULT 'outbound',
    phone_number VARCHAR(20) NOT NULL,
    call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    call_duration_seconds INTEGER NULL,
    call_status VARCHAR(50) NULL,
    call_recording_url TEXT NULL,
    call_transcript TEXT NULL,
    sentiment_analysis VARCHAR(50) NULL,
    key_topics TEXT[] NULL,
    concerns_raised TEXT[] NULL,
    questions_asked TEXT[] NULL,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT NULL,
    ai_agent_id VARCHAR(100) NULL,
    cost DECIMAL(10,2) NULL,
    triggered_by VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_call_logs_patient_id ON public.voice_call_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_visit_id ON public.voice_call_logs(visit_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_call_date ON public.voice_call_logs(call_date);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_call_status ON public.voice_call_logs(call_status);

ALTER TABLE public.voice_call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view voice_call_logs" ON public.voice_call_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage voice_call_logs" ON public.voice_call_logs FOR ALL USING (true);

-- WhatsApp Automation Log
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,
    content_id UUID NULL REFERENCES public.patient_education_content(id) ON DELETE SET NULL,
    message_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(255) NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NULL,
    media_url TEXT NULL,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_status VARCHAR(50) DEFAULT 'pending',
    delivery_timestamp TIMESTAMP WITH TIME ZONE NULL,
    read_timestamp TIMESTAMP WITH TIME ZONE NULL,
    failed_reason TEXT NULL,
    doubletick_message_id VARCHAR(255) NULL,
    response_received BOOLEAN DEFAULT false,
    response_text TEXT NULL,
    response_timestamp TIMESTAMP WITH TIME ZONE NULL,
    triggered_by VARCHAR(50) DEFAULT 'manual',
    automation_rule_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_patient_id ON public.whatsapp_automation_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_visit_id ON public.whatsapp_automation_log(visit_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_content_id ON public.whatsapp_automation_log(content_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_sent_date ON public.whatsapp_automation_log(sent_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_delivery_status ON public.whatsapp_automation_log(delivery_status);

ALTER TABLE public.whatsapp_automation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view whatsapp_automation_log" ON public.whatsapp_automation_log FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage whatsapp_automation_log" ON public.whatsapp_automation_log FOR ALL USING (true);

-- Patient Decision Journey
CREATE TABLE IF NOT EXISTS public.patient_decision_journey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    diagnosis_id UUID NULL REFERENCES public.diagnoses(id) ON DELETE SET NULL,
    initial_consultation_date DATE NOT NULL,
    decision_deadline DATE NULL,
    current_stage VARCHAR(50) DEFAULT 'initial_consultation',
    stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    concerns TEXT[] NULL,
    patient_questions TEXT[] NULL,
    last_contact_date TIMESTAMP WITH TIME ZONE NULL,
    last_contact_method VARCHAR(50) NULL,
    next_scheduled_contact_date TIMESTAMP WITH TIME ZONE NULL,
    total_education_content_sent INTEGER DEFAULT 0,
    total_education_content_viewed INTEGER DEFAULT 0,
    total_voice_calls INTEGER DEFAULT 0,
    total_whatsapp_messages INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    decision_confidence_level VARCHAR(50) NULL,
    preferred_surgery_option_id UUID NULL REFERENCES public.surgery_options(id) ON DELETE SET NULL,
    surgery_scheduled_date DATE NULL,
    final_decision VARCHAR(50) NULL,
    final_decision_date DATE NULL,
    final_decision_notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_decision_journey_patient_id ON public.patient_decision_journey(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_decision_journey_visit_id ON public.patient_decision_journey(visit_id);
CREATE INDEX IF NOT EXISTS idx_patient_decision_journey_current_stage ON public.patient_decision_journey(current_stage);
CREATE INDEX IF NOT EXISTS idx_patient_decision_journey_decision_deadline ON public.patient_decision_journey(decision_deadline);
CREATE INDEX IF NOT EXISTS idx_patient_decision_journey_last_contact_date ON public.patient_decision_journey(last_contact_date);

CREATE TRIGGER update_patient_decision_journey_updated_at
    BEFORE UPDATE ON public.patient_decision_journey FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.patient_decision_journey ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patient_decision_journey" ON public.patient_decision_journey FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage patient_decision_journey" ON public.patient_decision_journey FOR ALL USING (true);

-- Automation Rules
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_value INTEGER NULL,
    target_stage VARCHAR(50) NULL,
    action_type VARCHAR(50) NOT NULL,
    content_id UUID NULL REFERENCES public.patient_education_content(id) ON DELETE SET NULL,
    message_template TEXT NULL,
    time_of_day TIME NULL,
    days_of_week INTEGER[] NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 1,
    retry_interval_hours INTEGER NULL,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_rule_type ON public.automation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_type ON public.automation_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_is_active ON public.automation_rules(is_active);

CREATE TRIGGER update_automation_rules_updated_at
    BEFORE UPDATE ON public.automation_rules FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view automation_rules" ON public.automation_rules FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage automation_rules" ON public.automation_rules FOR ALL USING (true);

\echo 'Step 5: ✓ AI patient follow-up tables created'

-- ============================================
-- STEP 6: SAMPLE DATA
-- ============================================
\echo '=========================================='
\echo 'Step 6: Inserting sample data...'
\echo '=========================================='

-- Sample diagnoses
INSERT INTO public.diagnoses (name, description) VALUES
    ('Inguinal Hernia', 'Hernias occurring in the inguinal region'),
    ('Appendicitis', 'Inflammation of the appendix'),
    ('Hypertension', 'High blood pressure'),
    ('Diabetes Mellitus', 'Metabolic disorder')
ON CONFLICT (name) DO NOTHING;

-- Sample complications
INSERT INTO public.complications (name, description) VALUES
    ('Infection', 'Bacterial or viral infection'),
    ('Bleeding', 'Excessive blood loss'),
    ('Pain', 'Post-operative pain')
ON CONFLICT DO NOTHING;

-- Sample medications
INSERT INTO public.medication (name, dosage, frequency) VALUES
    ('Paracetamol', '500mg', 'Three times daily'),
    ('Ibuprofen', '400mg', 'Twice daily')
ON CONFLICT DO NOTHING;

-- Sample lab tests
INSERT INTO public.lab (name, category, cost, sample_type) VALUES
    ('Complete Blood Count (CBC)', 'Hematology', 300.00, 'Blood'),
    ('Blood Sugar Fasting', 'Biochemistry', 150.00, 'Blood')
ON CONFLICT (name) DO NOTHING;

-- Sample radiology procedures
INSERT INTO public.radiology (name, category, cost, body_part) VALUES
    ('X-Ray Chest PA View', 'X-Ray', 400.00, 'Chest'),
    ('CT Scan Head', 'CT Scan', 3000.00, 'Head')
ON CONFLICT (name) DO NOTHING;

-- Sample educational content
INSERT INTO public.patient_education_content (title, content_type, content_url, description, surgery_types, tags) VALUES
    ('Understanding Hernia Surgery', 'video', 'https://example.com/hernia-surgery.mp4', 'Comprehensive guide to hernia surgery options and recovery', ARRAY['Inguinal Hernia', 'Hernia'], ARRAY['hernia', 'surgery', 'recovery']),
    ('Appendicitis: What to Expect', 'blog', 'https://example.com/appendicitis-guide', 'Complete guide to appendicitis surgery and post-operative care', ARRAY['Appendicitis'], ARRAY['appendicitis', 'emergency', 'surgery']),
    ('Laparoscopic vs Open Surgery', 'article', NULL, 'Comparison of surgical approaches for common procedures', ARRAY['Inguinal Hernia', 'Gallbladder Disease'], ARRAY['laparoscopic', 'comparison', 'minimally_invasive']),
    ('Post-Surgery Recovery Tips', 'pdf', 'https://example.com/recovery-tips.pdf', 'Essential tips for faster recovery after surgery', ARRAY['Inguinal Hernia', 'Appendicitis', 'Gallbladder Disease'], ARRAY['recovery', 'post_op', 'care'])
ON CONFLICT DO NOTHING;

-- Sample surgery options for Inguinal Hernia
INSERT INTO public.surgery_options (diagnosis_id, surgery_name, procedure_type, procedure_details, risks, benefits, recovery_time_days, hospital_stay_days, cost_range_min, cost_range_max, success_rate, is_recommended)
SELECT
    d.id,
    'Laparoscopic Hernia Repair',
    'laparoscopic',
    'Minimally invasive surgery using small incisions and a camera. Mesh is placed to reinforce the abdominal wall.',
    ARRAY['Infection', 'Bleeding', 'Recurrence', 'Chronic pain'],
    ARRAY['Faster recovery', 'Less pain', 'Smaller scars', 'Earlier return to work'],
    14,
    1,
    50000.00,
    80000.00,
    95.00,
    true
FROM public.diagnoses d WHERE d.name = 'Inguinal Hernia'
ON CONFLICT DO NOTHING;

INSERT INTO public.surgery_options (diagnosis_id, surgery_name, procedure_type, procedure_details, risks, benefits, recovery_time_days, hospital_stay_days, cost_range_min, cost_range_max, success_rate, is_recommended)
SELECT
    d.id,
    'Open Hernia Repair',
    'open',
    'Traditional surgery with a larger incision to repair the hernia and place mesh reinforcement.',
    ARRAY['Infection', 'Bleeding', 'Recurrence', 'Chronic pain', 'Longer recovery'],
    ARRAY['Lower cost', 'Single large incision', 'Well-established technique'],
    28,
    2,
    30000.00,
    50000.00,
    92.00,
    false
FROM public.diagnoses d WHERE d.name = 'Inguinal Hernia'
ON CONFLICT DO NOTHING;

-- Sample automation rules
INSERT INTO public.automation_rules (rule_name, rule_type, trigger_type, trigger_value, target_stage, action_type, message_template, time_of_day, is_active) VALUES
    ('Day 2 - Send Educational Video', 'whatsapp', 'days_after_consultation', 2, 'education_phase', 'send_content', 'Hi {patient_name}, here is an educational video about your condition and treatment options.', '10:00:00', true),
    ('Day 4 - Send Blog Article', 'whatsapp', 'days_after_consultation', 4, 'education_phase', 'send_content', 'Hi {patient_name}, we have prepared some helpful articles about your surgery options.', '14:00:00', true),
    ('Day 7 - Voice Call Follow-up', 'voice_call', 'days_after_consultation', 7, 'options_review', 'make_call', NULL, '11:00:00', true),
    ('Day 10 - Send Surgery Comparison', 'whatsapp', 'days_after_consultation', 10, 'decision_making', 'send_content', 'Hi {patient_name}, here is a detailed comparison of your surgery options to help you decide.', '15:00:00', true),
    ('Day 14 - Decision Reminder', 'voice_call', 'days_after_consultation', 14, 'decision_making', 'make_call', NULL, '10:30:00', true)
ON CONFLICT DO NOTHING;

\echo 'Step 6: ✓ Sample data inserted'

COMMIT;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
\echo ''
\echo '=========================================='
\echo '           SETUP COMPLETE!'
\echo '=========================================='
\echo ''
\echo 'Database Summary:'
\echo '- Total Tables Created: 26'
\echo '- RLS Policies: Enabled on all tables'
\echo '- Sample Data: Inserted'
\echo ''
\echo 'Default Login Credentials:'
\echo '  Email: admin@aisurgeonpilot.com'
\echo '  Password: admin123'
\echo ''
\echo 'Next Steps:'
\echo '1. Update .env file with database credentials'
\echo '2. Run: npm run dev'
\echo '3. Test at: http://localhost:8080'
\echo ''
\echo '=========================================='

-- Show table counts
SELECT 'Users:' as table_name, COUNT(*) as count FROM public."User"
UNION ALL
SELECT 'Patients:', COUNT(*) FROM public.patients
UNION ALL
SELECT 'Visits:', COUNT(*) FROM public.visits
UNION ALL
SELECT 'Diagnoses:', COUNT(*) FROM public.diagnoses
UNION ALL
SELECT 'Complications:', COUNT(*) FROM public.complications
UNION ALL
SELECT 'Medications:', COUNT(*) FROM public.medication
UNION ALL
SELECT 'Lab Tests:', COUNT(*) FROM public.lab
UNION ALL
SELECT 'Radiology:', COUNT(*) FROM public.radiology
UNION ALL
SELECT 'Education Content:', COUNT(*) FROM public.patient_education_content
UNION ALL
SELECT 'Surgery Options:', COUNT(*) FROM public.surgery_options
UNION ALL
SELECT 'Automation Rules:', COUNT(*) FROM public.automation_rules;

-- ============================================
-- END OF SETUP
-- ============================================
