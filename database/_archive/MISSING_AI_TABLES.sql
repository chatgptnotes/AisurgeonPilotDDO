/**
 * AI SURGEON PILOT - MISSING AI FEATURE TABLES
 * ==============================================
 * Version: 1.0
 * Date: 2025-10-26
 *
 * PURPOSE:
 * Creates the MISSING tables needed for Patient Follow-Up Dashboard
 *
 * PREREQUISITES:
 * - You must have already run AI_FEATURES_SETUP.sql
 *
 * INSTRUCTIONS:
 * 1. Go to Supabase Dashboard: https://qfneoowktsirwpzehgxp.supabase.co
 * 2. Navigate to SQL Editor
 * 3. Copy and paste this ENTIRE file
 * 4. Click "Run"
 * 5. Wait for "Success" message
 *
 * ESTIMATED TIME: 30 seconds
 */

BEGIN;

-- ============================================
-- 1. VISITS TABLE (Required by patient_decision_journey)
-- ============================================

CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_type VARCHAR(50) NOT NULL, -- OPD, IPD, Emergency
    visit_date DATE NOT NULL,
    reason_for_visit TEXT NULL,
    appointment_with VARCHAR(255) NOT NULL,
    admission_date DATE NULL,
    discharge_date DATE NULL,
    discharge_mode VARCHAR(50) NULL,
    discharge_notes TEXT NULL,
    diagnosis_id UUID NULL REFERENCES public.diagnoses(id) ON DELETE SET NULL,
    surgery_date DATE NULL,
    billing_status VARCHAR(50) NULL,
    bill_paid BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_visit_id ON public.visits(visit_id);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON public.visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_diagnosis_id ON public.visits(diagnosis_id);

-- Enable RLS
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view visits"
    ON public.visits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage visits"
    ON public.visits FOR ALL TO authenticated USING (true);

-- ============================================
-- 2. PATIENT DECISION JOURNEY
-- ============================================

CREATE TABLE IF NOT EXISTS public.patient_decision_journey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    diagnosis_id UUID NULL REFERENCES public.diagnoses(id) ON DELETE SET NULL,
    initial_consultation_date DATE NOT NULL,
    decision_deadline DATE NULL,
    current_stage VARCHAR(50) DEFAULT 'initial_consultation',
    -- Stages: initial_consultation, education_phase, options_review, decision_making, surgery_scheduled, completed, declined
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

-- Enable RLS
ALTER TABLE public.patient_decision_journey ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view decision journey"
    ON public.patient_decision_journey FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage decision journey"
    ON public.patient_decision_journey FOR ALL TO authenticated USING (true);

-- ============================================
-- 3. VOICE CALL LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.voice_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    call_type VARCHAR(50) NOT NULL, -- outbound, inbound
    call_purpose VARCHAR(100) NULL, -- follow_up, consultation, education, decision_support
    call_duration_seconds INTEGER NULL,
    call_status VARCHAR(50) DEFAULT 'pending', -- pending, connected, no_answer, busy, failed
    call_start_time TIMESTAMP WITH TIME ZONE NULL,
    call_end_time TIMESTAMP WITH TIME ZONE NULL,
    notes TEXT NULL,
    patient_concerns TEXT[] NULL,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE NULL,
    called_by VARCHAR(255) NULL,
    decision_journey_id UUID NULL REFERENCES public.patient_decision_journey(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_call_logs_patient_id ON public.voice_call_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_visit_id ON public.voice_call_logs(visit_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_call_start_time ON public.voice_call_logs(call_start_time DESC);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_call_status ON public.voice_call_logs(call_status);

-- Enable RLS
ALTER TABLE public.voice_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view call logs"
    ON public.voice_call_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage call logs"
    ON public.voice_call_logs FOR ALL TO authenticated USING (true);

-- ============================================
-- 4. WHATSAPP AUTOMATION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_automation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID NULL REFERENCES public.visits(id) ON DELETE SET NULL,
    content_id UUID NULL REFERENCES public.patient_education_content(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- text, image, video, document, link
    message_text TEXT NOT NULL,
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

-- Enable RLS
ALTER TABLE public.whatsapp_automation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view whatsapp log"
    ON public.whatsapp_automation_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage whatsapp log"
    ON public.whatsapp_automation_log FOR ALL TO authenticated USING (true);

-- ============================================
-- 5. AUTOMATION RULES
-- ============================================

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

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view automation rules"
    ON public.automation_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage automation rules"
    ON public.automation_rules FOR ALL TO authenticated USING (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON public.visits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_decision_journey_updated_at
    BEFORE UPDATE ON public.patient_decision_journey
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
    BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample visits
INSERT INTO public.visits (visit_id, patient_id, visit_type, visit_date, reason_for_visit, appointment_with, admission_date)
SELECT
    'V' || LPAD(generate_series::text, 5, '0'),
    p.id,
    'OPD',
    CURRENT_DATE - (generate_series || ' days')::INTERVAL,
    'Follow-up consultation',
    'Dr. Smith',
    NULL
FROM generate_series(1, 3) AS generate_series
CROSS JOIN (SELECT id FROM public.patients LIMIT 1) p
ON CONFLICT (visit_id) DO NOTHING;

-- Insert sample patient decision journey
INSERT INTO public.patient_decision_journey (
    patient_id,
    visit_id,
    diagnosis_id,
    initial_consultation_date,
    decision_deadline,
    current_stage,
    last_contact_date,
    last_contact_method,
    engagement_score
)
SELECT
    v.patient_id,
    v.id,
    (SELECT id FROM public.diagnoses LIMIT 1),
    v.visit_date,
    v.visit_date + INTERVAL '30 days',
    'education_phase',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'whatsapp',
    65
FROM public.visits v
LIMIT 2
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT
    'Missing AI tables created successfully!' as status,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'visits',
    'patient_decision_journey',
    'voice_call_logs',
    'whatsapp_automation_log',
    'automation_rules'
);

COMMIT;

/**
 * ============================================
 * NEXT STEPS
 * ============================================
 *
 * After running this script:
 *
 * 1. ✅ Go to: https://aisurgeonpilot-lmdae3kms-chatgptnotes-6366s-projects.vercel.app/login
 * 2. ✅ Log in with: admin@aisurgeonpilot.com / Admin@123
 * 3. ✅ Click "Patient Follow-Up" in the AI features section
 * 4. ✅ You should now see sample patient journeys!
 *
 * The Patient Follow-Up Dashboard is now fully functional!
 */
