/**
 * AI SURGEON PILOT - ENHANCED SAMPLE DATA
 * ========================================
 * Version: 1.0
 * Date: 2025-10-26
 *
 * PURPOSE:
 * Add realistic sample data for better demos and testing
 *
 * INCLUDES:
 * - 5 more patients (total 6+ patients)
 * - 8 visits
 * - 8 patient decision journeys (various stages)
 * - 5 more educational content items
 * - 8 surgery options across diagnoses
 * - 10 WhatsApp message logs
 * - 5 voice call logs
 *
 * RUN AFTER: MISSING_AI_TABLES.sql
 */

BEGIN;

-- ============================================
-- 1. ADD MORE PATIENTS
-- ============================================

INSERT INTO public.patients (name, phone, email, age, gender, blood_group, address, city_town, state)
VALUES
  ('Rajesh Kumar', '+919876543210', 'rajesh.kumar@gmail.com', 45, 'Male', 'B+', 'MG Road, Sector 14', 'Delhi', 'Delhi'),
  ('Priya Sharma', '+919876543211', 'priya.sharma@gmail.com', 38, 'Female', 'A+', 'Koramangala 4th Block', 'Bangalore', 'Karnataka'),
  ('Amit Patel', '+919876543212', 'amit.patel@gmail.com', 52, 'Male', 'O+', 'CG Road, Navrangpura', 'Ahmedabad', 'Gujarat'),
  ('Sneha Reddy', '+919876543213', 'sneha.reddy@gmail.com', 34, 'Female', 'AB+', 'Banjara Hills', 'Hyderabad', 'Telangana'),
  ('Vikram Singh', '+919876543214', 'vikram.singh@gmail.com', 41, 'Male', 'B+', 'Sector 62', 'Noida', 'Uttar Pradesh')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. ADD MORE VISITS
-- ============================================

INSERT INTO public.visits (
  visit_id, patient_id, visit_type, visit_date, reason_for_visit,
  appointment_with, admission_date, diagnosis_id
)
SELECT
  'VIP' || LPAD((ROW_NUMBER() OVER())::text, 5, '0'),
  p.id,
  CASE
    WHEN ROW_NUMBER() OVER() % 3 = 0 THEN 'IPD'
    ELSE 'OPD'
  END,
  CURRENT_DATE - (ROW_NUMBER() OVER() * 3 || ' days')::INTERVAL,
  CASE ROW_NUMBER() OVER() % 4
    WHEN 0 THEN 'Abdominal pain consultation'
    WHEN 1 THEN 'Follow-up for surgical evaluation'
    WHEN 2 THEN 'Pre-operative assessment'
    ELSE 'Post-operative check-up'
  END,
  CASE ROW_NUMBER() OVER() % 3
    WHEN 0 THEN 'Dr. Ramesh Kumar'
    WHEN 1 THEN 'Dr. Anjali Mehta'
    ELSE 'Dr. Suresh Patel'
  END,
  CASE
    WHEN ROW_NUMBER() OVER() % 3 = 0 THEN CURRENT_DATE - (ROW_NUMBER() OVER() * 3 || ' days')::INTERVAL
    ELSE NULL
  END,
  (SELECT id FROM public.diagnoses ORDER BY RANDOM() LIMIT 1)
FROM public.patients p
WHERE p.name IN ('Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh')
LIMIT 5
ON CONFLICT (visit_id) DO NOTHING;

-- ============================================
-- 3. ADD PATIENT DECISION JOURNEYS
-- ============================================

INSERT INTO public.patient_decision_journey (
  patient_id,
  visit_id,
  diagnosis_id,
  initial_consultation_date,
  decision_deadline,
  current_stage,
  last_contact_date,
  last_contact_method,
  concerns,
  patient_questions,
  total_education_content_sent,
  total_education_content_viewed,
  total_whatsapp_messages,
  total_voice_calls,
  engagement_score,
  decision_confidence_level
)
SELECT
  v.patient_id,
  v.id,
  v.diagnosis_id,
  v.visit_date,
  v.visit_date + INTERVAL '30 days',
  CASE (ROW_NUMBER() OVER()) % 5
    WHEN 0 THEN 'initial_consultation'
    WHEN 1 THEN 'education_phase'
    WHEN 2 THEN 'options_review'
    WHEN 3 THEN 'decision_making'
    ELSE 'completed'
  END,
  CURRENT_TIMESTAMP - (ROW_NUMBER() OVER() || ' days')::INTERVAL,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 'whatsapp'
    WHEN 1 THEN 'voice_call'
    ELSE 'in_person'
  END,
  ARRAY['Cost of surgery', 'Recovery time', 'Success rate'],
  ARRAY['What are the risks?', 'How long will I be hospitalized?', 'When can I return to work?'],
  CASE (ROW_NUMBER() OVER()) % 3 WHEN 0 THEN 5 WHEN 1 THEN 3 ELSE 7 END,
  CASE (ROW_NUMBER() OVER()) % 3 WHEN 0 THEN 3 WHEN 1 THEN 2 ELSE 5 END,
  CASE (ROW_NUMBER() OVER()) % 3 WHEN 0 THEN 8 WHEN 1 THEN 5 ELSE 12 END,
  CASE (ROW_NUMBER() OVER()) % 3 WHEN 0 THEN 2 WHEN 1 THEN 1 ELSE 3 END,
  CASE (ROW_NUMBER() OVER()) % 4 WHEN 0 THEN 45 WHEN 1 THEN 65 WHEN 2 THEN 80 ELSE 92 END,
  CASE (ROW_NUMBER() OVER()) % 4 WHEN 0 THEN 'low' WHEN 1 THEN 'medium' WHEN 2 THEN 'high' ELSE 'very_high' END
FROM public.visits v
WHERE v.visit_id LIKE 'VIP%'
LIMIT 5
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. ADD MORE EDUCATIONAL CONTENT
-- ============================================

INSERT INTO public.patient_education_content (
  title, content_type, content_url, description, duration_minutes, surgery_types, tags, view_count, is_active
)
VALUES
  (
    'Preparing for Your Surgery: Complete Guide',
    'article',
    'https://example.com/surgery-prep-guide',
    'Comprehensive guide on how to prepare physically and mentally for surgery. Includes diet recommendations, medication guidelines, and what to bring to the hospital.',
    NULL,
    ARRAY['General', 'All Types'],
    ARRAY['preparation', 'pre-surgery', 'guidelines'],
    142,
    true
  ),
  (
    'What to Expect During Recovery',
    'video',
    'https://youtube.com/watch?v=example2',
    'A 15-minute video showing the typical recovery process, common challenges, and how to manage pain and discomfort at home.',
    15,
    ARRAY['Laparoscopic', 'General'],
    ARRAY['recovery', 'post-surgery', 'pain-management'],
    89,
    true
  ),
  (
    'Understanding Anesthesia Options',
    'pdf',
    'https://example.com/anesthesia-guide.pdf',
    'Detailed PDF explaining different types of anesthesia, their risks and benefits, and what questions to ask your anesthesiologist.',
    NULL,
    ARRAY['All Types'],
    ARRAY['anesthesia', 'safety', 'options'],
    67,
    true
  ),
  (
    'Post-Surgery Diet and Nutrition',
    'infographic',
    'https://example.com/diet-infographic.jpg',
    'Visual guide showing what foods to eat and avoid after surgery, meal planning tips, and hydration recommendations.',
    NULL,
    ARRAY['General', 'Laparoscopic'],
    ARRAY['diet', 'nutrition', 'recovery'],
    103,
    true
  ),
  (
    'Successful Surgery Stories',
    'video',
    'https://youtube.com/watch?v=example3',
    'Inspiring patient testimonials and success stories from people who have undergone similar surgeries. Real experiences and outcomes.',
    12,
    ARRAY['Appendectomy', 'Cholecystectomy', 'Hernia'],
    ARRAY['testimonials', 'success-stories', 'patient-experience'],
    178,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. ADD SURGERY OPTIONS
-- ============================================

-- Appendicitis Surgery Options
INSERT INTO public.surgery_options (
  diagnosis_id, surgery_name, procedure_type, procedure_details,
  indications, contraindications, risks, benefits,
  recovery_time_days, hospital_stay_days, cost_range_min, cost_range_max,
  success_rate, anesthesia_type, is_recommended, display_order
)
SELECT
  d.id,
  'Open Appendectomy',
  'open',
  'Traditional surgical approach with a single larger incision to remove the inflamed appendix. Allows direct visualization and is preferred in complicated cases.',
  'Severe appendicitis, perforated appendix, abscess formation, pregnancy (second/third trimester)',
  'Severe cardiovascular disease, unstable patient vitals',
  ARRAY['Infection', 'Bleeding', 'Organ injury', 'Adhesions'],
  ARRAY['Direct visualization', 'Faster procedure time', 'Lower equipment cost', 'Suitable for complex cases'],
  10,
  3,
  30000.00,
  50000.00,
  96.5,
  'General anesthesia',
  false,
  2
FROM public.diagnoses d WHERE d.code = 'D001'
ON CONFLICT DO NOTHING;

INSERT INTO public.surgery_options (
  diagnosis_id, surgery_name, procedure_type, procedure_details,
  recovery_time_days, hospital_stay_days, cost_range_min, cost_range_max,
  success_rate, is_recommended, display_order
)
SELECT
  d.id,
  'Laparoscopic Appendectomy',
  'laparoscopic',
  'Minimally invasive approach using 3-4 small incisions. Camera and specialized instruments remove the appendix with minimal tissue trauma.',
  7,
  2,
  40000.00,
  70000.00,
  98.2,
  true,
  1
FROM public.diagnoses d WHERE d.code = 'D001'
ON CONFLICT DO NOTHING;

-- Cholecystitis Surgery Options
INSERT INTO public.surgery_options (
  diagnosis_id, surgery_name, procedure_type, procedure_details,
  recovery_time_days, hospital_stay_days, cost_range_min, cost_range_max,
  success_rate, is_recommended, display_order
)
SELECT
  d.id,
  'Laparoscopic Cholecystectomy',
  'laparoscopic',
  'Gold standard for gallbladder removal. Uses 4 small incisions, camera, and specialized instruments. Minimal scarring and faster recovery.',
  10,
  2,
  50000.00,
  85000.00,
  97.8,
  true,
  1
FROM public.diagnoses d WHERE d.code = 'D002'
ON CONFLICT DO NOTHING;

-- Hernia Surgery Options
INSERT INTO public.surgery_options (
  diagnosis_id, surgery_name, procedure_type, procedure_details,
  recovery_time_days, hospital_stay_days, cost_range_min, cost_range_max,
  success_rate, is_recommended, display_order
)
SELECT
  d.id,
  'Laparoscopic Hernia Repair with Mesh',
  'laparoscopic',
  'Minimally invasive hernia repair using surgical mesh to reinforce the weakened abdominal wall. Reduces recurrence risk significantly.',
  14,
  1,
  45000.00,
  75000.00,
  96.5,
  true,
  1
FROM public.diagnoses d WHERE d.code = 'D003'
ON CONFLICT DO NOTHING;

-- Kidney Stones Options
INSERT INTO public.surgery_options (
  diagnosis_id, surgery_name, procedure_type, procedure_details,
  recovery_time_days, hospital_stay_days, cost_range_min, cost_range_max,
  success_rate, is_recommended, display_order
)
SELECT
  d.id,
  'Ureteroscopy with Laser Lithotripsy',
  'minimally_invasive',
  'Non-invasive procedure using a thin scope passed through urethra. Laser breaks up stones which are then removed or pass naturally.',
  3,
  1,
  60000.00,
  95000.00,
  94.0,
  true,
  1
FROM public.diagnoses d WHERE d.code = 'D004'
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. ADD WHATSAPP MESSAGE LOGS
-- ============================================

INSERT INTO public.whatsapp_automation_log (
  patient_id, visit_id, phone_number, message_type, message_text,
  sent_date, delivery_status, delivery_timestamp, read_timestamp, triggered_by
)
SELECT
  p.id,
  (SELECT v.id FROM public.visits v WHERE v.patient_id = p.id LIMIT 1),
  p.phone,
  'text',
  CASE (ROW_NUMBER() OVER()) % 4
    WHEN 0 THEN 'Hi ' || SPLIT_PART(p.name, ' ', 1) || ', this is Dr. Kumar. I wanted to follow up on your recent consultation about surgery options. Do you have any questions?'
    WHEN 1 THEN 'Hello ' || SPLIT_PART(p.name, ' ', 1) || ', hope you''re doing well. I''ve shared an educational video about the laparoscopic procedure we discussed. Please watch it when you have time.'
    WHEN 2 THEN 'Dear ' || SPLIT_PART(p.name, ' ', 1) || ', just checking in on your decision. The surgery date we discussed is approaching. Please let me know if you''d like to proceed.'
    ELSE 'Hi ' || SPLIT_PART(p.name, ' ', 1) || ', wanted to remind you about your follow-up appointment tomorrow at 10 AM. Please arrive 15 minutes early.'
  END,
  CURRENT_TIMESTAMP - ((ROW_NUMBER() OVER()) || ' days')::INTERVAL,
  CASE (ROW_NUMBER() OVER()) % 4
    WHEN 0 THEN 'delivered'
    WHEN 1 THEN 'read'
    WHEN 2 THEN 'sent'
    ELSE 'delivered'
  END,
  CURRENT_TIMESTAMP - ((ROW_NUMBER() OVER()) || ' days')::INTERVAL + INTERVAL '2 minutes',
  CASE (ROW_NUMBER() OVER()) % 4
    WHEN 1 THEN CURRENT_TIMESTAMP - ((ROW_NUMBER() OVER()) || ' days')::INTERVAL + INTERVAL '15 minutes'
    ELSE NULL
  END,
  'automation_rule'
FROM public.patients p
WHERE p.phone IS NOT NULL AND p.phone LIKE '+91%'
LIMIT 10
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. ADD VOICE CALL LOGS
-- ============================================

INSERT INTO public.voice_call_logs (
  patient_id, visit_id, phone_number, call_type, call_purpose,
  call_duration_seconds, call_status, call_start_time, call_end_time,
  notes, follow_up_required, called_by
)
SELECT
  p.id,
  (SELECT v.id FROM public.visits v WHERE v.patient_id = p.id LIMIT 1),
  p.phone,
  'outbound',
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 'follow_up'
    WHEN 1 THEN 'education'
    ELSE 'decision_support'
  END,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 180
    WHEN 1 THEN 420
    ELSE 300
  END,
  'connected',
  CURRENT_TIMESTAMP - ((ROW_NUMBER() OVER()) * 2 || ' days')::INTERVAL,
  CURRENT_TIMESTAMP - ((ROW_NUMBER() OVER()) * 2 || ' days')::INTERVAL +
    (CASE (ROW_NUMBER() OVER()) % 3 WHEN 0 THEN 180 WHEN 1 THEN 420 ELSE 300 END || ' seconds')::INTERVAL,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 'Patient has concerns about recovery time. Explained typical timeline. Patient feeling more confident now.'
    WHEN 1 THEN 'Discussed surgery options in detail. Patient prefers laparoscopic approach. Scheduling pre-op assessment.'
    ELSE 'Patient asking about costs and insurance coverage. Provided cost breakdown. Follow-up needed with billing team.'
  END,
  CASE (ROW_NUMBER() OVER()) % 3 WHEN 2 THEN true ELSE false END,
  'Dr. Ramesh Kumar'
FROM public.patients p
WHERE p.phone IS NOT NULL AND p.phone LIKE '+91%'
LIMIT 5
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show summary of data added
SELECT
  'Enhanced sample data added successfully!' as status,
  (SELECT COUNT(*) FROM public.patients WHERE phone LIKE '+91%') as total_patients,
  (SELECT COUNT(*) FROM public.visits) as total_visits,
  (SELECT COUNT(*) FROM public.patient_decision_journey) as total_journeys,
  (SELECT COUNT(*) FROM public.patient_education_content) as total_education_items,
  (SELECT COUNT(*) FROM public.surgery_options) as total_surgery_options,
  (SELECT COUNT(*) FROM public.whatsapp_automation_log) as total_whatsapp_messages,
  (SELECT COUNT(*) FROM public.voice_call_logs) as total_voice_calls;

COMMIT;

/**
 * ============================================
 * NEXT STEPS
 * ============================================
 *
 * After running this script, your system will have:
 * - 6+ patients with realistic Indian names and phone numbers
 * - 8+ visits across different types (OPD, IPD)
 * - 8+ patient journeys in various stages
 * - 8+ educational content items
 * - 6+ surgery options with detailed information
 * - 10+ simulated WhatsApp messages
 * - 5+ simulated voice call logs
 *
 * This makes all dashboards look much better for demos!
 *
 * Test the features now:
 * 1. Patient Follow-Up Dashboard - Should show multiple journeys
 * 2. Patient Education Manager - Should show 8 content items
 * 3. Surgery Options - Should show multiple options per diagnosis
 */
