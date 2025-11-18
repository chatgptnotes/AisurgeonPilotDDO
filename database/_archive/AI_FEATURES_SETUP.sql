/**
 * AI SURGEON PILOT - AI FEATURES SETUP
 * =====================================
 * Version: 1.0
 * Date: 2025-10-26
 *
 * PURPOSE:
 * Creates ONLY the tables needed for AI features to work
 * (Patient Follow-Up, Patient Education, Surgery Options)
 *
 * PREREQUISITES:
 * - You must have already run SIMPLE_SETUP_FOR_AUTH.sql
 * - You must have already run 07_create_admin_user.sql
 *
 * INSTRUCTIONS:
 * 1. Go to Supabase Dashboard: https://qfneoowktsirwpzehgxp.supabase.co
 * 2. Navigate to SQL Editor
 * 3. Copy and paste this ENTIRE file
 * 4. Click "Run"
 * 5. Wait for "Success" message
 *
 * ESTIMATED TIME: 1 minute
 */

BEGIN;

-- ============================================
-- EXTENSION SETUP
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PATIENTS TABLE (Required for AI features)
-- ============================================

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
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    medical_history TEXT NULL,
    allergies TEXT NULL,
    current_medications TEXT NULL,
    notes TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view patients"
    ON public.patients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert patients"
    ON public.patients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update patients"
    ON public.patients FOR UPDATE TO authenticated USING (true);

-- ============================================
-- 2. DIAGNOSES TABLE (Required for Surgery Options)
-- ============================================

CREATE TABLE IF NOT EXISTS public.diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    severity VARCHAR(50) NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_code ON public.diagnoses(code);
CREATE INDEX IF NOT EXISTS idx_diagnoses_name ON public.diagnoses(name);
CREATE INDEX IF NOT EXISTS idx_diagnoses_category ON public.diagnoses(category);

-- Enable RLS
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view diagnoses"
    ON public.diagnoses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert diagnoses"
    ON public.diagnoses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update diagnoses"
    ON public.diagnoses FOR UPDATE TO authenticated USING (true);

-- ============================================
-- 3. PATIENT EDUCATION CONTENT
-- ============================================

CREATE TABLE IF NOT EXISTS public.patient_education_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- video, blog, pdf, infographic, article
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

-- Enable RLS
ALTER TABLE public.patient_education_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view education content"
    ON public.patient_education_content FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage education content"
    ON public.patient_education_content FOR ALL TO authenticated USING (true);

-- ============================================
-- 4. PATIENT EDUCATION TRACKING
-- ============================================

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

-- Enable RLS
ALTER TABLE public.patient_education_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view tracking"
    ON public.patient_education_tracking FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage tracking"
    ON public.patient_education_tracking FOR ALL TO authenticated USING (true);

-- ============================================
-- 5. SURGERY OPTIONS
-- ============================================

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

-- Enable RLS
ALTER TABLE public.surgery_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view surgery options"
    ON public.surgery_options FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage surgery options"
    ON public.surgery_options FOR ALL TO authenticated USING (true);

-- ============================================
-- 6. PATIENT SURGERY PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS public.patient_surgery_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    surgery_option_id UUID NOT NULL REFERENCES public.surgery_options(id) ON DELETE CASCADE,
    preference_level VARCHAR(50) DEFAULT 'interested',
    selected_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT NULL,
    whatsapp_consent BOOLEAN DEFAULT false,
    email_consent BOOLEAN DEFAULT false,
    voice_call_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_patient_id ON public.patient_surgery_preferences(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_surgery_option_id ON public.patient_surgery_preferences(surgery_option_id);

-- Enable RLS
ALTER TABLE public.patient_surgery_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view preferences"
    ON public.patient_surgery_preferences FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage preferences"
    ON public.patient_surgery_preferences FOR ALL TO authenticated USING (true);

-- ============================================
-- 7. WHATSAPP AUTOMATION CAMPAIGNS
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_automation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(100) NOT NULL,
    target_surgery_types TEXT[] NULL,
    target_diagnosis_ids UUID[] NULL,
    message_template TEXT NOT NULL,
    schedule_type VARCHAR(50) DEFAULT 'immediate',
    schedule_time TIME NULL,
    schedule_days_after_surgery INTEGER NULL,
    is_active BOOLEAN DEFAULT true,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_read INTEGER DEFAULT 0,
    total_replied INTEGER DEFAULT 0,
    created_by VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_campaigns_is_active ON public.whatsapp_automation_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_campaigns_campaign_type ON public.whatsapp_automation_campaigns(campaign_type);

-- Enable RLS
ALTER TABLE public.whatsapp_automation_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view campaigns"
    ON public.whatsapp_automation_campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage campaigns"
    ON public.whatsapp_automation_campaigns FOR ALL TO authenticated USING (true);

-- ============================================
-- 8. WHATSAPP MESSAGE LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_message_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    campaign_id UUID NULL REFERENCES public.whatsapp_automation_campaigns(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    delivered_at TIMESTAMP WITH TIME ZONE NULL,
    read_at TIMESTAMP WITH TIME ZONE NULL,
    replied_at TIMESTAMP WITH TIME ZONE NULL,
    reply_text TEXT NULL,
    error_message TEXT NULL,
    api_response JSON NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_patient_id ON public.whatsapp_message_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_campaign_id ON public.whatsapp_message_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_status ON public.whatsapp_message_log(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_sent_at ON public.whatsapp_message_log(sent_at);

-- Enable RLS
ALTER TABLE public.whatsapp_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view message log"
    ON public.whatsapp_message_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert message log"
    ON public.whatsapp_message_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample diagnoses
INSERT INTO public.diagnoses (code, name, description, category, severity) VALUES
    ('D001', 'Appendicitis', 'Inflammation of the appendix', 'Emergency', 'High'),
    ('D002', 'Cholecystitis', 'Inflammation of the gallbladder', 'General Surgery', 'Medium'),
    ('D003', 'Hernia', 'Protrusion of organ through tissue', 'General Surgery', 'Medium'),
    ('D004', 'Kidney Stones', 'Crystalline formations in kidney', 'Urology', 'Medium')
ON CONFLICT (code) DO NOTHING;

-- Insert sample patient education content
INSERT INTO public.patient_education_content (title, content_type, description, surgery_types, is_active) VALUES
    ('Understanding Appendectomy Surgery', 'video', 'Complete guide to appendectomy procedure, recovery, and what to expect', ARRAY['Appendectomy'], true),
    ('Post-Surgery Recovery Tips', 'blog', 'Essential tips for faster recovery after surgery', ARRAY['General'], true),
    ('Laparoscopic Surgery Benefits', 'article', 'Why laparoscopic surgery is preferred for many procedures', ARRAY['Laparoscopic'], true)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify tables were created
SELECT
    'AI Features tables created successfully!' as status,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'patients',
    'diagnoses',
    'patient_education_content',
    'patient_education_tracking',
    'surgery_options',
    'patient_surgery_preferences',
    'whatsapp_automation_campaigns',
    'whatsapp_message_log'
);

COMMIT;

/**
 * ============================================
 * NEXT STEPS
 * ============================================
 *
 * After running this script successfully:
 *
 * 1. ✅ Go to https://aisurgeonpilot-lmdae3kms-chatgptnotes-6366s-projects.vercel.app/login
 * 2. ✅ Log in with: admin@aisurgeonpilot.com / Admin@123
 * 3. ✅ Click on "AI Surgeon Pilot Features" section in sidebar
 * 4. ✅ Test the three AI features:
 *    - Patient Follow-Up Dashboard
 *    - Patient Education Manager
 *    - Surgery Options Configurator
 *
 * All AI features should now be fully functional!
 */
