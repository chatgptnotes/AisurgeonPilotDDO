-- ============================================
-- AI PATIENT FOLLOW-UP SYSTEM - SAMPLE DATA
-- ============================================
-- Run this script to populate sample data for testing
-- Version: 1.3
-- Date: 2025-10-26
-- ============================================

-- IMPORTANT: This script assumes you have already run MASTER_CORE_SETUP.sql
-- and have existing diagnoses, patients, and visits in your database

-- ============================================
-- 1. SAMPLE EDUCATIONAL CONTENT
-- ============================================

-- Sample Videos
INSERT INTO public.patient_education_content (title, content_type, content_url, description, duration_minutes, surgery_types, tags, is_active, created_by) VALUES
    ('Understanding Hernia Surgery - Complete Guide', 'video', 'https://www.youtube.com/watch?v=sample1', 'A comprehensive 15-minute video explaining hernia surgery, what to expect, and recovery process', 15, ARRAY['Inguinal Hernia', 'Hernia'], ARRAY['hernia', 'surgery', 'recovery', 'education'], true, 'Dr. Admin'),
    ('Laparoscopic Surgery Explained', 'video', 'https://www.youtube.com/watch?v=sample2', 'Learn about minimally invasive laparoscopic surgery techniques and benefits', 12, ARRAY['Inguinal Hernia', 'Gallbladder Disease'], ARRAY['laparoscopic', 'minimally-invasive', 'surgery'], true, 'Dr. Admin'),
    ('Post-Surgery Recovery: What You Need to Know', 'video', 'https://www.youtube.com/watch?v=sample3', 'Essential tips for faster recovery after surgery including diet, exercise, and wound care', 10, ARRAY['Inguinal Hernia', 'Appendicitis', 'Gallbladder Disease'], ARRAY['recovery', 'post-op', 'tips'], true, 'Dr. Admin'),
    ('Appendicitis: Symptoms and Treatment', 'video', 'https://www.youtube.com/watch?v=sample4', 'Understanding appendicitis symptoms, when to seek emergency care, and surgical treatment options', 8, ARRAY['Appendicitis'], ARRAY['appendicitis', 'emergency', 'symptoms'], true, 'Dr. Admin')
ON CONFLICT DO NOTHING;

-- Sample Blog Articles
INSERT INTO public.patient_education_content (title, content_type, content_text, description, surgery_types, tags, is_active, created_by) VALUES
    ('10 Questions to Ask Your Surgeon Before Hernia Surgery', 'blog', 'When preparing for hernia surgery, it''s important to have a clear conversation with your surgeon. Here are 10 essential questions: 1. What type of hernia do I have? 2. What surgical approach do you recommend? 3. Will you use mesh? 4. How long is the recovery time? 5. What are the risks? 6. When can I return to work? 7. What restrictions will I have? 8. How much pain should I expect? 9. What is your success rate? 10. What should I do if complications arise?', 'Essential questions every patient should ask their surgeon before undergoing hernia repair surgery', ARRAY['Inguinal Hernia', 'Hernia'], ARRAY['hernia', 'questions', 'preparation'], true, 'Dr. Admin'),
    ('Preparing for Surgery: A Complete Checklist', 'blog', 'Proper preparation can make your surgery and recovery smoother. This checklist covers everything you need to know: Pre-surgery tests, medications to avoid, fasting requirements, what to bring to hospital, arranging help at home, preparing your recovery space, and more. Follow this guide to ensure you''re fully prepared for your surgical procedure.', 'Complete checklist to help patients prepare for their upcoming surgery', ARRAY['Inguinal Hernia', 'Appendicitis', 'Gallbladder Disease', 'Thyroid Disorders'], ARRAY['preparation', 'checklist', 'surgery'], true, 'Dr. Admin'),
    ('Diet After Surgery: Foods to Eat and Avoid', 'article', 'Your diet plays a crucial role in recovery. Here''s what to eat: High-protein foods (chicken, fish, eggs), Vitamin C-rich fruits (oranges, strawberries), Whole grains, Plenty of water. Foods to avoid: Heavy, greasy foods, Spicy dishes, Carbonated drinks, Alcohol. Start with light meals and gradually return to normal diet as tolerated.', 'Comprehensive guide to post-operative nutrition for faster healing', ARRAY['Inguinal Hernia', 'Appendicitis', 'Gallbladder Disease'], ARRAY['diet', 'nutrition', 'recovery'], true, 'Dr. Admin')
ON CONFLICT DO NOTHING;

-- Sample PDFs
INSERT INTO public.patient_education_content (title, content_type, content_url, description, surgery_types, tags, is_active, created_by) VALUES
    ('Post-Operative Care Instructions', 'pdf', 'https://example.com/pdfs/post-op-care.pdf', 'Detailed instructions for caring for your surgical wound, managing pain, and recognizing warning signs', ARRAY['Inguinal Hernia', 'Appendicitis', 'Gallbladder Disease'], ARRAY['post-op', 'care', 'instructions'], true, 'Dr. Admin'),
    ('Exercise Guidelines After Hernia Surgery', 'pdf', 'https://example.com/pdfs/exercise-guide.pdf', 'Safe exercises and activity guidelines for each week of recovery after hernia surgery', ARRAY['Inguinal Hernia', 'Hernia'], ARRAY['exercise', 'recovery', 'hernia'], true, 'Dr. Admin')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. ADDITIONAL SURGERY OPTIONS
-- ============================================

-- Get diagnosis IDs
DO $$
DECLARE
    hernia_id UUID;
    appendicitis_id UUID;
    gallbladder_id UUID;
BEGIN
    -- Get diagnosis IDs
    SELECT id INTO hernia_id FROM public.diagnoses WHERE name = 'Inguinal Hernia' LIMIT 1;
    SELECT id INTO appendicitis_id FROM public.diagnoses WHERE name = 'Appendicitis' LIMIT 1;
    SELECT id INTO gallbladder_id FROM public.diagnoses WHERE name = 'Gallbladder Disease' LIMIT 1;

    -- Surgery options for Inguinal Hernia (if not already exist)
    IF hernia_id IS NOT NULL THEN
        INSERT INTO public.surgery_options (
            diagnosis_id, surgery_name, procedure_type, procedure_details,
            risks, benefits, recovery_time_days, hospital_stay_days,
            cost_range_min, cost_range_max, success_rate, anesthesia_type,
            is_recommended, display_order, is_active
        ) VALUES
        (
            hernia_id,
            'Robotic Hernia Repair',
            'robotic',
            'Advanced robotic-assisted surgery using the da Vinci system for precise hernia repair with minimal invasion.',
            ARRAY['Infection', 'Bleeding', 'Recurrence', 'Seroma formation'],
            ARRAY['Highest precision', 'Minimal scarring', 'Faster recovery', '3D visualization', 'Enhanced dexterity'],
            10,
            1,
            80000.00,
            120000.00,
            96.50,
            'General',
            false,
            3,
            true
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- Surgery options for Appendicitis
    IF appendicitis_id IS NOT NULL THEN
        INSERT INTO public.surgery_options (
            diagnosis_id, surgery_name, procedure_type, procedure_details,
            risks, benefits, recovery_time_days, hospital_stay_days,
            cost_range_min, cost_range_max, success_rate, anesthesia_type,
            is_recommended, display_order, is_active
        ) VALUES
        (
            appendicitis_id,
            'Laparoscopic Appendectomy',
            'laparoscopic',
            'Minimally invasive removal of the appendix through small incisions using a laparoscope.',
            ARRAY['Infection', 'Bleeding', 'Abscess formation', 'Bowel injury'],
            ARRAY['Faster recovery', 'Less pain', 'Smaller scars', 'Lower infection risk', 'Earlier return to activities'],
            7,
            1,
            40000.00,
            60000.00,
            98.00,
            'General',
            true,
            1,
            true
        ),
        (
            appendicitis_id,
            'Open Appendectomy',
            'open',
            'Traditional surgical removal of the appendix through a larger incision in the lower right abdomen.',
            ARRAY['Infection', 'Bleeding', 'Abscess formation', 'Wound complications', 'Longer recovery'],
            ARRAY['Lower cost', 'Suitable for complicated cases', 'Better visualization in difficult cases'],
            14,
            2,
            25000.00,
            40000.00,
            96.00,
            'General',
            false,
            2,
            true
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- Surgery options for Gallbladder Disease
    IF gallbladder_id IS NOT NULL THEN
        INSERT INTO public.surgery_options (
            diagnosis_id, surgery_name, procedure_type, procedure_details,
            risks, benefits, recovery_time_days, hospital_stay_days,
            cost_range_min, cost_range_max, success_rate, anesthesia_type,
            is_recommended, display_order, is_active
        ) VALUES
        (
            gallbladder_id,
            'Laparoscopic Cholecystectomy',
            'laparoscopic',
            'Minimally invasive removal of the gallbladder using small incisions and a camera.',
            ARRAY['Bile duct injury', 'Bleeding', 'Infection', 'Bile leak', 'Conversion to open surgery'],
            ARRAY['Faster recovery', 'Less pain', 'Smaller scars', 'Shorter hospital stay', 'Quick return to work'],
            14,
            1,
            50000.00,
            75000.00,
            97.00,
            'General',
            true,
            1,
            true
        ),
        (
            gallbladder_id,
            'Open Cholecystectomy',
            'open',
            'Traditional gallbladder removal through a larger abdominal incision.',
            ARRAY['Bile duct injury', 'Bleeding', 'Infection', 'Wound complications', 'Longer recovery'],
            ARRAY['Better for complicated cases', 'Direct visualization', 'Suitable for inflammation'],
            28,
            3,
            30000.00,
            50000.00,
            94.00,
            'General',
            false,
            2,
            true
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 3. SAMPLE PATIENTS WITH DECISION JOURNEYS
-- ============================================

-- Insert sample test patients
INSERT INTO public.patients (name, patients_id, age, gender, phone, email, blood_group) VALUES
    ('Rajesh Kumar', 'PT-2025-001', 45, 'Male', '+919876543210', 'rajesh.kumar@email.com', 'B+'),
    ('Priya Sharma', 'PT-2025-002', 38, 'Female', '+919876543211', 'priya.sharma@email.com', 'A+'),
    ('Amit Patel', 'PT-2025-003', 52, 'Male', '+919876543212', 'amit.patel@email.com', 'O+'),
    ('Sneha Reddy', 'PT-2025-004', 29, 'Female', '+919876543213', 'sneha.reddy@email.com', 'AB+'),
    ('Vikram Singh', 'PT-2025-005', 41, 'Male', '+919876543214', 'vikram.singh@email.com', 'B-')
ON CONFLICT (patients_id) DO NOTHING;

-- Insert sample visits for these patients
DO $$
DECLARE
    patient1_id UUID;
    patient2_id UUID;
    patient3_id UUID;
    patient4_id UUID;
    patient5_id UUID;
    hernia_diagnosis_id UUID;
    appendicitis_diagnosis_id UUID;
    gallbladder_diagnosis_id UUID;
    visit1_id UUID;
    visit2_id UUID;
    visit3_id UUID;
    visit4_id UUID;
    visit5_id UUID;
BEGIN
    -- Get patient IDs
    SELECT id INTO patient1_id FROM public.patients WHERE patients_id = 'PT-2025-001' LIMIT 1;
    SELECT id INTO patient2_id FROM public.patients WHERE patients_id = 'PT-2025-002' LIMIT 1;
    SELECT id INTO patient3_id FROM public.patients WHERE patients_id = 'PT-2025-003' LIMIT 1;
    SELECT id INTO patient4_id FROM public.patients WHERE patients_id = 'PT-2025-004' LIMIT 1;
    SELECT id INTO patient5_id FROM public.patients WHERE patients_id = 'PT-2025-005' LIMIT 1;

    -- Get diagnosis IDs
    SELECT id INTO hernia_diagnosis_id FROM public.diagnoses WHERE name = 'Inguinal Hernia' LIMIT 1;
    SELECT id INTO appendicitis_diagnosis_id FROM public.diagnoses WHERE name = 'Appendicitis' LIMIT 1;
    SELECT id INTO gallbladder_diagnosis_id FROM public.diagnoses WHERE name = 'Gallbladder Disease' LIMIT 1;

    -- Create visits if patients exist
    IF patient1_id IS NOT NULL THEN
        INSERT INTO public.visits (visit_id, patient_id, visit_type, visit_date, diagnosis_id, appointment_with, status)
        VALUES ('VST-2025-001', patient1_id, 'OPD', CURRENT_DATE - INTERVAL '10 days', hernia_diagnosis_id, 'Dr. Admin', 'consultation')
        ON CONFLICT (visit_id) DO NOTHING
        RETURNING id INTO visit1_id;
    END IF;

    IF patient2_id IS NOT NULL THEN
        INSERT INTO public.visits (visit_id, patient_id, visit_type, visit_date, diagnosis_id, appointment_with, status)
        VALUES ('VST-2025-002', patient2_id, 'OPD', CURRENT_DATE - INTERVAL '7 days', appendicitis_diagnosis_id, 'Dr. Admin', 'consultation')
        ON CONFLICT (visit_id) DO NOTHING
        RETURNING id INTO visit2_id;
    END IF;

    IF patient3_id IS NOT NULL THEN
        INSERT INTO public.visits (visit_id, patient_id, visit_type, visit_date, diagnosis_id, appointment_with, status)
        VALUES ('VST-2025-003', patient3_id, 'OPD', CURRENT_DATE - INTERVAL '14 days', gallbladder_diagnosis_id, 'Dr. Admin', 'consultation')
        ON CONFLICT (visit_id) DO NOTHING
        RETURNING id INTO visit3_id;
    END IF;

    IF patient4_id IS NOT NULL THEN
        INSERT INTO public.visits (visit_id, patient_id, visit_type, visit_date, diagnosis_id, appointment_with, status)
        VALUES ('VST-2025-004', patient4_id, 'OPD', CURRENT_DATE - INTERVAL '5 days', hernia_diagnosis_id, 'Dr. Admin', 'consultation')
        ON CONFLICT (visit_id) DO NOTHING
        RETURNING id INTO visit4_id;
    END IF;

    IF patient5_id IS NOT NULL THEN
        INSERT INTO public.visits (visit_id, patient_id, visit_type, visit_date, diagnosis_id, appointment_with, status)
        VALUES ('VST-2025-005', patient5_id, 'OPD', CURRENT_DATE - INTERVAL '20 days', hernia_diagnosis_id, 'Dr. Admin', 'consultation')
        ON CONFLICT (visit_id) DO NOTHING
        RETURNING id INTO visit5_id;
    END IF;

    -- Create patient decision journeys
    IF visit1_id IS NOT NULL THEN
        INSERT INTO public.patient_decision_journey (
            patient_id, visit_id, diagnosis_id, initial_consultation_date, decision_deadline,
            current_stage, concerns, patient_questions, last_contact_date, last_contact_method,
            total_education_content_sent, total_education_content_viewed, total_voice_calls, total_whatsapp_messages,
            engagement_score, decision_confidence_level
        ) VALUES (
            patient1_id, visit1_id, hernia_diagnosis_id, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days',
            'options_review',
            ARRAY['Cost of surgery', 'Recovery time', 'Risk of recurrence'],
            ARRAY['Will I need to take time off work?', 'Is mesh safe?', 'What is success rate?'],
            CURRENT_DATE - INTERVAL '2 days', 'whatsapp',
            4, 3, 1, 3,
            65, 'medium'
        ) ON CONFLICT DO NOTHING;
    END IF;

    IF visit2_id IS NOT NULL THEN
        INSERT INTO public.patient_decision_journey (
            patient_id, visit_id, diagnosis_id, initial_consultation_date, decision_deadline,
            current_stage, concerns, patient_questions, last_contact_date, last_contact_method,
            total_education_content_sent, total_education_content_viewed, total_voice_calls, total_whatsapp_messages,
            engagement_score, decision_confidence_level
        ) VALUES (
            patient2_id, visit2_id, appendicitis_diagnosis_id, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days',
            'education_phase',
            ARRAY['Surgery urgency', 'Complications'],
            ARRAY['How urgent is this?', 'Can I wait?'],
            CURRENT_DATE - INTERVAL '1 day', 'whatsapp',
            2, 2, 0, 2,
            80, 'high'
        ) ON CONFLICT DO NOTHING;
    END IF;

    IF visit3_id IS NOT NULL THEN
        INSERT INTO public.patient_decision_journey (
            patient_id, visit_id, diagnosis_id, initial_consultation_date, decision_deadline,
            current_stage, concerns, patient_questions, last_contact_date, last_contact_method,
            total_education_content_sent, total_education_content_viewed, total_voice_calls, total_whatsapp_messages,
            engagement_score, decision_confidence_level
        ) VALUES (
            patient3_id, visit3_id, gallbladder_diagnosis_id, CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '16 days',
            'decision_making',
            ARRAY['Surgery cost', 'Dietary restrictions after surgery', 'Pain management'],
            ARRAY['Will I have dietary restrictions?', 'How long is recovery?', 'Alternative treatments?'],
            CURRENT_DATE - INTERVAL '5 days', 'voice_call',
            5, 2, 2, 4,
            45, 'low'
        ) ON CONFLICT DO NOTHING;
    END IF;

    IF visit4_id IS NOT NULL THEN
        INSERT INTO public.patient_decision_journey (
            patient_id, visit_id, diagnosis_id, initial_consultation_date, decision_deadline,
            current_stage, concerns, patient_questions, last_contact_date, last_contact_method,
            total_education_content_sent, total_education_content_viewed, total_voice_calls, total_whatsapp_messages,
            engagement_score, decision_confidence_level
        ) VALUES (
            patient4_id, visit4_id, hernia_diagnosis_id, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days',
            'initial_consultation',
            ARRAY['Never had surgery before', 'Afraid of anesthesia'],
            ARRAY['Will it hurt?', 'What if something goes wrong?'],
            CURRENT_DATE - INTERVAL '5 days', 'in_person',
            1, 0, 0, 0,
            20, 'very_low'
        ) ON CONFLICT DO NOTHING;
    END IF;

    IF visit5_id IS NOT NULL THEN
        INSERT INTO public.patient_decision_journey (
            patient_id, visit_id, diagnosis_id, initial_consultation_date, decision_deadline,
            current_stage, concerns, patient_questions, last_contact_date, last_contact_method,
            total_education_content_sent, total_education_content_viewed, total_voice_calls, total_whatsapp_messages,
            engagement_score, decision_confidence_level
        ) VALUES (
            patient5_id, visit5_id, hernia_diagnosis_id, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE,
            'decision_making',
            ARRAY['Financial constraints', 'Family responsibilities'],
            ARRAY['Payment options?', 'Can I do installments?'],
            CURRENT_DATE - INTERVAL '8 days', 'whatsapp',
            6, 4, 1, 5,
            55, 'medium'
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 4. SAMPLE EDUCATION TRACKING
-- ============================================

-- Sample education content sent to patients
DO $$
DECLARE
    patient1_id UUID;
    patient2_id UUID;
    patient3_id UUID;
    content1_id UUID;
    content2_id UUID;
    content3_id UUID;
BEGIN
    SELECT id INTO patient1_id FROM public.patients WHERE patients_id = 'PT-2025-001' LIMIT 1;
    SELECT id INTO patient2_id FROM public.patients WHERE patients_id = 'PT-2025-002' LIMIT 1;
    SELECT id INTO patient3_id FROM public.patients WHERE patients_id = 'PT-2025-003' LIMIT 1;

    SELECT id INTO content1_id FROM public.patient_education_content WHERE title LIKE '%Hernia Surgery%' LIMIT 1;
    SELECT id INTO content2_id FROM public.patient_education_content WHERE title LIKE '%Laparoscopic Surgery%' LIMIT 1;
    SELECT id INTO content3_id FROM public.patient_education_content WHERE title LIKE '%Post-Surgery Recovery%' LIMIT 1;

    IF patient1_id IS NOT NULL AND content1_id IS NOT NULL THEN
        INSERT INTO public.patient_education_tracking (patient_id, content_id, sent_via, sent_date, opened_date, engagement_score, sent_by)
        VALUES
            (patient1_id, content1_id, 'whatsapp', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '8 days', 85, 'system'),
            (patient1_id, content2_id, 'whatsapp', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 70, 'system'),
            (patient1_id, content3_id, 'whatsapp', CURRENT_TIMESTAMP - INTERVAL '3 days', NULL, 0, 'system')
        ON CONFLICT DO NOTHING;
    END IF;

    IF patient2_id IS NOT NULL AND content1_id IS NOT NULL THEN
        INSERT INTO public.patient_education_tracking (patient_id, content_id, sent_via, sent_date, opened_date, engagement_score, sent_by)
        VALUES
            (patient2_id, content1_id, 'whatsapp', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 90, 'system')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 5. SAMPLE WHATSAPP LOGS
-- ============================================

DO $$
DECLARE
    patient1_id UUID;
    patient2_id UUID;
    visit1_id UUID;
    visit2_id UUID;
BEGIN
    SELECT id INTO patient1_id FROM public.patients WHERE patients_id = 'PT-2025-001' LIMIT 1;
    SELECT id INTO patient2_id FROM public.patients WHERE patients_id = 'PT-2025-002' LIMIT 1;
    SELECT id INTO visit1_id FROM public.visits WHERE visit_id = 'VST-2025-001' LIMIT 1;
    SELECT id INTO visit2_id FROM public.visits WHERE visit_id = 'VST-2025-002' LIMIT 1;

    IF patient1_id IS NOT NULL THEN
        INSERT INTO public.whatsapp_automation_log (
            patient_id, visit_id, message_type, phone_number, message_text,
            sent_date, delivery_status, delivery_timestamp, triggered_by
        ) VALUES
            (patient1_id, visit1_id, 'educational_content', '+919876543210',
             'Hi Rajesh Kumar, here is an educational video about hernia surgery: Understanding Hernia Surgery - Complete Guide',
             CURRENT_TIMESTAMP - INTERVAL '8 days', 'read', CURRENT_TIMESTAMP - INTERVAL '8 days', 'automation_rule'),
            (patient1_id, visit1_id, 'reminder', '+919876543210',
             'Hi Rajesh Kumar, this is a reminder about your upcoming surgery consultation. Please let us know if you have any questions.',
             CURRENT_TIMESTAMP - INTERVAL '2 days', 'delivered', CURRENT_TIMESTAMP - INTERVAL '2 days', 'manual')
        ON CONFLICT DO NOTHING;
    END IF;

    IF patient2_id IS NOT NULL THEN
        INSERT INTO public.whatsapp_automation_log (
            patient_id, visit_id, message_type, phone_number, message_text,
            sent_date, delivery_status, delivery_timestamp, read_timestamp, triggered_by
        ) VALUES
            (patient2_id, visit2_id, 'educational_content', '+919876543211',
             'Hi Priya Sharma, here is important information about appendicitis surgery.',
             CURRENT_TIMESTAMP - INTERVAL '5 days', 'read', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 'automation_rule')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 6. SAMPLE VOICE CALL LOGS
-- ============================================

DO $$
DECLARE
    patient1_id UUID;
    patient3_id UUID;
    visit1_id UUID;
    visit3_id UUID;
BEGIN
    SELECT id INTO patient1_id FROM public.patients WHERE patients_id = 'PT-2025-001' LIMIT 1;
    SELECT id INTO patient3_id FROM public.patients WHERE patients_id = 'PT-2025-003' LIMIT 1;
    SELECT id INTO visit1_id FROM public.visits WHERE visit_id = 'VST-2025-001' LIMIT 1;
    SELECT id INTO visit3_id FROM public.visits WHERE visit_id = 'VST-2025-003' LIMIT 1;

    IF patient1_id IS NOT NULL THEN
        INSERT INTO public.voice_call_logs (
            patient_id, visit_id, call_type, phone_number, call_date,
            call_duration_seconds, call_status, call_transcript, sentiment_analysis,
            key_topics, concerns_raised, follow_up_required, triggered_by
        ) VALUES (
            patient1_id, visit1_id, 'follow_up', '+919876543210', CURRENT_TIMESTAMP - INTERVAL '4 days',
            240, 'completed',
            'Agent: Hello Mr. Rajesh, this is a follow-up call regarding your hernia surgery. How are you feeling about the procedure?
Patient: Hi, I am still thinking about it. I am concerned about the cost and recovery time.
Agent: I understand your concerns. Let me address them...
Patient: That helps, thank you.',
            'neutral',
            ARRAY['Cost concerns', 'Recovery time', 'Surgery options'],
            ARRAY['Cost of surgery', 'Time off work'],
            true,
            'automation_rule'
        ) ON CONFLICT DO NOTHING;
    END IF;

    IF patient3_id IS NOT NULL THEN
        INSERT INTO public.voice_call_logs (
            patient_id, visit_id, call_type, phone_number, call_date,
            call_duration_seconds, call_status, call_transcript, sentiment_analysis,
            key_topics, follow_up_required, triggered_by
        ) VALUES (
            patient3_id, visit3_id, 'education', '+919876543212', CURRENT_TIMESTAMP - INTERVAL '5 days',
            180, 'completed',
            'Agent: Hello Mr. Amit, calling to provide information about gallbladder surgery options.
Patient: Yes, please tell me more.
Agent: There are two main options - laparoscopic and open surgery...',
            'positive',
            ARRAY['Surgery options', 'Recovery information'],
            false,
            'manual'
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 7. VERIFICATION
-- ============================================

SELECT 'Sample data created successfully!' as status;

-- Show counts
SELECT 'Educational Content:' as info, COUNT(*) as count FROM public.patient_education_content WHERE created_by = 'Dr. Admin';
SELECT 'Surgery Options:' as info, COUNT(*) as count FROM public.surgery_options;
SELECT 'Sample Patients:' as info, COUNT(*) as count FROM public.patients WHERE patients_id LIKE 'PT-2025-%';
SELECT 'Decision Journeys:' as info, COUNT(*) as count FROM public.patient_decision_journey;
SELECT 'WhatsApp Logs:' as info, COUNT(*) as count FROM public.whatsapp_automation_log;
SELECT 'Voice Call Logs:' as info, COUNT(*) as count FROM public.voice_call_logs;

-- ============================================
-- DONE!
-- ============================================
-- Sample data created for testing AI Patient Follow-Up System
-- ============================================
