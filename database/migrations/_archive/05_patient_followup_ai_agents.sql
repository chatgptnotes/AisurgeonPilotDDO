-- ============================================
-- AI SURGEON PILOT - PATIENT FOLLOW-UP & AI AGENTS
-- ============================================
-- This script creates tables for AI-powered patient follow-up system
-- Run this AFTER 04_visit_junctions.sql
-- Version: 1.3
-- Date: 2025-10-26
-- ============================================

-- ============================================
-- 1. PATIENT_EDUCATION_CONTENT
-- ============================================
-- Store educational materials (videos, blogs, PDFs, infographics)

CREATE TABLE IF NOT EXISTS public.patient_education_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- video, blog, pdf, infographic, article
    content_url TEXT NULL,
    content_text TEXT NULL, -- For blog articles/text content
    description TEXT NULL,
    thumbnail_url TEXT NULL,
    duration_minutes INTEGER NULL, -- For videos
    surgery_types TEXT[] NULL, -- Array of surgery types this content applies to
    diagnosis_ids UUID[] NULL, -- Array of diagnosis IDs
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

-- ============================================
-- 2. PATIENT_EDUCATION_TRACKING
-- ============================================
-- Track what content was sent to which patient and engagement

CREATE TABLE IF NOT EXISTS public.patient_education_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.patient_education_content(id) ON DELETE CASCADE,
    sent_via VARCHAR(50) NOT NULL, -- whatsapp, email, sms, voice_call
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_date TIMESTAMP WITH TIME ZONE NULL,
    completed_date TIMESTAMP WITH TIME ZONE NULL, -- For videos: watched fully
    engagement_score INTEGER DEFAULT 0, -- 0-100 score
    feedback_rating INTEGER NULL, -- 1-5 stars
    feedback_notes TEXT NULL,
    sent_by VARCHAR(255) NULL, -- User who triggered the send or 'system_automation'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_education_tracking_patient_id ON public.patient_education_tracking(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_education_tracking_content_id ON public.patient_education_tracking(content_id);
CREATE INDEX IF NOT EXISTS idx_patient_education_tracking_sent_date ON public.patient_education_tracking(sent_date);

-- ============================================
-- 3. SURGERY_OPTIONS
-- ============================================
-- Multiple surgery options for each diagnosis

CREATE TABLE IF NOT EXISTS public.surgery_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
    surgery_name VARCHAR(255) NOT NULL,
    procedure_type VARCHAR(100) NULL, -- laparoscopic, open, robotic, minimally_invasive
    procedure_details TEXT NULL,
    indications TEXT NULL,
    contraindications TEXT NULL,
    risks TEXT[] NULL, -- Array of risk factors
    benefits TEXT[] NULL, -- Array of benefits
    recovery_time_days INTEGER NULL,
    hospital_stay_days INTEGER NULL,
    cost_range_min DECIMAL(10,2) NULL,
    cost_range_max DECIMAL(10,2) NULL,
    success_rate DECIMAL(5,2) NULL, -- Percentage
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

-- ============================================
-- 4. PATIENT_SURGERY_PREFERENCES
-- ============================================
-- Track patient's chosen surgery options and preferences

CREATE TABLE IF NOT EXISTS public.patient_surgery_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    surgery_option_id UUID NOT NULL REFERENCES public.surgery_options(id) ON DELETE CASCADE,
    preference_rank INTEGER NULL, -- 1 = first choice, 2 = second choice, etc
    decision_status VARCHAR(50) DEFAULT 'considering', -- considering, preferred, selected, rejected
    concerns TEXT[] NULL, -- Patient's concerns about this option
    questions TEXT[] NULL, -- Questions patient has
    notes TEXT NULL,
    decided_date DATE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_patient_id ON public.patient_surgery_preferences(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_visit_id ON public.patient_surgery_preferences(visit_id);
CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_surgery_option_id ON public.patient_surgery_preferences(surgery_option_id);
CREATE INDEX IF NOT EXISTS idx_patient_surgery_preferences_decision_status ON public.patient_surgery_preferences(decision_status);

-- ============================================
-- 5. VOICE_CALL_LOGS
-- ============================================
-- Track AI voice agent calls to patients

CREATE TABLE IF NOT EXISTS public.voice_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,
    call_type VARCHAR(50) NOT NULL, -- follow_up, education, reminder, survey
    call_direction VARCHAR(20) DEFAULT 'outbound', -- outbound, inbound
    phone_number VARCHAR(20) NOT NULL,
    call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    call_duration_seconds INTEGER NULL,
    call_status VARCHAR(50) NULL, -- completed, no_answer, busy, failed, voicemail
    call_recording_url TEXT NULL,
    call_transcript TEXT NULL,
    sentiment_analysis VARCHAR(50) NULL, -- positive, neutral, negative, mixed
    key_topics TEXT[] NULL, -- Topics discussed during call
    concerns_raised TEXT[] NULL,
    questions_asked TEXT[] NULL,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT NULL,
    ai_agent_id VARCHAR(100) NULL,
    cost DECIMAL(10,2) NULL,
    triggered_by VARCHAR(50) DEFAULT 'manual', -- manual, automation_rule, scheduled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_call_logs_patient_id ON public.voice_call_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_visit_id ON public.voice_call_logs(visit_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_call_date ON public.voice_call_logs(call_date);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_call_status ON public.voice_call_logs(call_status);

-- ============================================
-- 6. WHATSAPP_AUTOMATION_LOG
-- ============================================
-- Track all WhatsApp messages sent via automation

CREATE TABLE IF NOT EXISTS public.whatsapp_automation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,
    content_id UUID NULL REFERENCES public.patient_education_content(id) ON DELETE SET NULL,
    message_type VARCHAR(50) NOT NULL, -- educational_content, reminder, follow_up, survey
    template_name VARCHAR(255) NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NULL,
    media_url TEXT NULL,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, read, failed
    delivery_timestamp TIMESTAMP WITH TIME ZONE NULL,
    read_timestamp TIMESTAMP WITH TIME ZONE NULL,
    failed_reason TEXT NULL,
    doubletick_message_id VARCHAR(255) NULL,
    response_received BOOLEAN DEFAULT false,
    response_text TEXT NULL,
    response_timestamp TIMESTAMP WITH TIME ZONE NULL,
    triggered_by VARCHAR(50) DEFAULT 'manual', -- manual, automation_rule, scheduled
    automation_rule_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_patient_id ON public.whatsapp_automation_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_visit_id ON public.whatsapp_automation_log(visit_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_content_id ON public.whatsapp_automation_log(content_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_sent_date ON public.whatsapp_automation_log(sent_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_log_delivery_status ON public.whatsapp_automation_log(delivery_status);

-- ============================================
-- 7. PATIENT_DECISION_JOURNEY
-- ============================================
-- Track the decision-making timeline for each patient

CREATE TABLE IF NOT EXISTS public.patient_decision_journey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    diagnosis_id UUID NULL REFERENCES public.diagnoses(id) ON DELETE SET NULL,
    initial_consultation_date DATE NOT NULL,
    decision_deadline DATE NULL,
    current_stage VARCHAR(50) DEFAULT 'initial_consultation', -- initial_consultation, education_phase, options_review, decision_making, surgery_scheduled, completed, declined
    stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    concerns TEXT[] NULL,
    patient_questions TEXT[] NULL,
    last_contact_date TIMESTAMP WITH TIME ZONE NULL,
    last_contact_method VARCHAR(50) NULL, -- whatsapp, voice_call, in_person, email
    next_scheduled_contact_date TIMESTAMP WITH TIME ZONE NULL,
    total_education_content_sent INTEGER DEFAULT 0,
    total_education_content_viewed INTEGER DEFAULT 0,
    total_voice_calls INTEGER DEFAULT 0,
    total_whatsapp_messages INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0, -- 0-100 overall engagement
    decision_confidence_level VARCHAR(50) NULL, -- very_low, low, medium, high, very_high
    preferred_surgery_option_id UUID NULL REFERENCES public.surgery_options(id) ON DELETE SET NULL,
    surgery_scheduled_date DATE NULL,
    final_decision VARCHAR(50) NULL, -- agreed, declined, deferred, transferred
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

-- ============================================
-- 8. AUTOMATION_RULES
-- ============================================
-- Define automation rules for patient follow-up

CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- whatsapp, voice_call, email
    trigger_type VARCHAR(50) NOT NULL, -- days_after_consultation, stage_change, no_engagement, scheduled
    trigger_value INTEGER NULL, -- Number of days or other numeric trigger
    target_stage VARCHAR(50) NULL, -- Which patient journey stage to target
    action_type VARCHAR(50) NOT NULL, -- send_content, make_call, send_reminder
    content_id UUID NULL REFERENCES public.patient_education_content(id) ON DELETE SET NULL,
    message_template TEXT NULL,
    time_of_day TIME NULL, -- Preferred time to execute
    days_of_week INTEGER[] NULL, -- 0=Sunday, 1=Monday, etc
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

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Patient Education Content
ALTER TABLE public.patient_education_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patient_education_content" ON public.patient_education_content FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage patient_education_content" ON public.patient_education_content FOR ALL USING (true);

-- Patient Education Tracking
ALTER TABLE public.patient_education_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patient_education_tracking" ON public.patient_education_tracking FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage patient_education_tracking" ON public.patient_education_tracking FOR ALL USING (true);

-- Surgery Options
ALTER TABLE public.surgery_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view surgery_options" ON public.surgery_options FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage surgery_options" ON public.surgery_options FOR ALL USING (true);

-- Patient Surgery Preferences
ALTER TABLE public.patient_surgery_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patient_surgery_preferences" ON public.patient_surgery_preferences FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage patient_surgery_preferences" ON public.patient_surgery_preferences FOR ALL USING (true);

-- Voice Call Logs
ALTER TABLE public.voice_call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view voice_call_logs" ON public.voice_call_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage voice_call_logs" ON public.voice_call_logs FOR ALL USING (true);

-- WhatsApp Automation Log
ALTER TABLE public.whatsapp_automation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view whatsapp_automation_log" ON public.whatsapp_automation_log FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage whatsapp_automation_log" ON public.whatsapp_automation_log FOR ALL USING (true);

-- Patient Decision Journey
ALTER TABLE public.patient_decision_journey ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patient_decision_journey" ON public.patient_decision_journey FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage patient_decision_journey" ON public.patient_decision_journey FOR ALL USING (true);

-- Automation Rules
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view automation_rules" ON public.automation_rules FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage automation_rules" ON public.automation_rules FOR ALL USING (true);

-- ============================================
-- 10. TRIGGERS
-- ============================================

CREATE TRIGGER update_patient_education_content_updated_at
    BEFORE UPDATE ON public.patient_education_content FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surgery_options_updated_at
    BEFORE UPDATE ON public.surgery_options FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_surgery_preferences_updated_at
    BEFORE UPDATE ON public.patient_surgery_preferences FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_decision_journey_updated_at
    BEFORE UPDATE ON public.patient_decision_journey FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
    BEFORE UPDATE ON public.automation_rules FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. SAMPLE DATA
-- ============================================

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

-- ============================================
-- 12. VERIFICATION QUERIES
-- ============================================

SELECT 'Patient follow-up AI agent tables created' as status;
SELECT 'Education content count:' as info, COUNT(*) as count FROM public.patient_education_content;
SELECT 'Surgery options count:' as info, COUNT(*) as count FROM public.surgery_options;
SELECT 'Automation rules count:' as info, COUNT(*) as count FROM public.automation_rules;

-- ============================================
-- DONE!
-- ============================================
-- Patient follow-up and AI agent tables created successfully
-- ============================================
