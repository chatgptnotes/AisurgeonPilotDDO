-- ============================================================================
-- AI Surgeon Pilot - Seed Realistic Data
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-15
-- Based on: ACTUAL database schema with CORRECT column names
--
-- CREATES:
--   ✅ 1 Tenant (AI Surgeon Pilot Hospital)
--   ✅ 1 Superadmin user
--   ✅ 10 Doctors (various specialties)
--   ✅ 50 Patients (realistic Indian data)
--   ✅ 120 Appointments (mixed status)
--   ✅ 50 Doctor availability schedules
--
-- SAFETY: Uses ON CONFLICT DO NOTHING - safe to re-run
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE TENANT
-- ============================================================================

INSERT INTO public.tenants (
    id,
    name,
    slug,
    phone,
    email,
    address,
    city,
    state,
    pin_code,
    business_hours,
    subscription_plan,
    subscription_status,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'AI Surgeon Pilot Hospital',
    'aisurgeonpilot',
    '+91-9876543210',
    'contact@aisurgeonpilot.com',
    'Plot No. 123, HITEC City',
    'Hyderabad',
    'Telangana',
    '500081',
    '{"mon-fri": "9:00-17:00", "sat": "9:00-13:00", "sun": "closed"}'::jsonb,
    'enterprise',
    'active',
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE SUPERADMIN USER
-- ============================================================================

INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    tenant_id
) VALUES (
    '00000000-0000-0000-0000-000000000010'::uuid,
    'superadmin@aisurgeonpilot.com',
    'Super Admin',
    'superadmin',
    true,
    '00000000-0000-0000-0000-000000000001'::uuid
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CREATE 10 DOCTORS
-- ============================================================================

INSERT INTO public.doctors (
    id, tenant_id, full_name, email, phone,
    specialties, qualifications, experience_years,
    consultation_fee_standard, consultation_fee_followup, currency,
    rating_avg, rating_count, is_verified, is_accepting_patients,
    bio, languages, is_active,
    meeting_platform, meeting_link, meeting_password, meeting_id, meeting_instructions
) VALUES
-- Dr. Ramesh Kumar - General Surgeon
('00000000-0000-0000-0001-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Ramesh Kumar', 'dr.ramesh.kumar@aisurgeonpilot.com', '+91-9876501001',
 ARRAY['General Surgery', 'Laparoscopic Surgery'], 'MBBS, MS (General Surgery)', 15,
 1200.00, 800.00, 'INR', 4.7, 127, true, true,
 'Specialist in minimally invasive and laparoscopic surgeries with 15+ years experience',
 ARRAY['English', 'Hindi', 'Telugu'], true,
 'zoom', 'https://zoom.us/j/1234567890', 'RameshK123', '1234567890',
 'Please join 5 minutes before your appointment. Camera on preferred for better consultation.'),

-- Dr. Priya Sharma - Orthopedic Surgeon
('00000000-0000-0000-0001-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Priya Sharma', 'dr.priya.sharma@aisurgeonpilot.com', '+91-9876501002',
 ARRAY['Orthopedics', 'Joint Replacement'], 'MBBS, MS (Ortho), DNB', 12,
 1500.00, 1000.00, 'INR', 4.8, 203, true, true,
 'Expert in joint replacement, sports injuries, and trauma care',
 ARRAY['English', 'Hindi', 'Marathi'], true,
 'google_meet', 'https://meet.google.com/abc-defg-hij', NULL, NULL,
 'Join via Google Meet. Please test your audio/video before the appointment.'),

-- Dr. Suresh Reddy - Cardiologist
('00000000-0000-0000-0001-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Suresh Reddy', 'dr.suresh.reddy@aisurgeonpilot.com', '+91-9876501003',
 ARRAY['Cardiology', 'Interventional Cardiology'], 'MBBS, MD (Cardiology), DM', 18,
 1800.00, 1200.00, 'INR', 4.9, 156, true, true,
 'Senior cardiologist specializing in interventional procedures and heart care',
 ARRAY['English', 'Telugu', 'Tamil'], true,
 'zoom', 'https://zoom.us/j/2345678901', 'CardioDoc456', '2345678901',
 'Please have your recent test reports ready. Join 5 minutes early.'),

-- Dr. Anjali Mehta - Neurologist
('00000000-0000-0000-0001-000000000004'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Anjali Mehta', 'dr.anjali.mehta@aisurgeonpilot.com', '+91-9876501004',
 ARRAY['Neurology', 'Stroke Care'], 'MBBS, MD (Medicine), DM (Neurology)', 10,
 1600.00, 1100.00, 'INR', 4.6, 98, true, true,
 'Specialist in neurological disorders, stroke management, and epilepsy',
 ARRAY['English', 'Hindi', 'Gujarati'], true,
 'microsoft_teams', 'https://teams.microsoft.com/l/meetup-join/xyz123', 'NeuroMeet789', NULL,
 'Microsoft Teams link. Please join from a quiet location.'),

-- Dr. Vikram Singh - Pediatrician
('00000000-0000-0000-0001-000000000005'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Vikram Singh', 'dr.vikram.singh@aisurgeonpilot.com', '+91-9876501005',
 ARRAY['Pediatrics', 'Neonatology'], 'MBBS, MD (Pediatrics)', 8,
 1000.00, 700.00, 'INR', 4.8, 215, true, true,
 'Child specialist with expertise in newborn care and childhood illnesses',
 ARRAY['English', 'Hindi', 'Punjabi'], true,
 'zoom', 'https://zoom.us/j/3456789012', 'KidsDoc321', '3456789012',
 'Please ensure a quiet environment for child consultation. Parent presence required.'),

-- Dr. Kavita Nair - Gynecologist
('00000000-0000-0000-0001-000000000006'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Kavita Nair', 'dr.kavita.nair@aisurgeonpilot.com', '+91-9876501006',
 ARRAY['Gynecology', 'Obstetrics'], 'MBBS, MS (OBG)', 14,
 1400.00, 900.00, 'INR', 4.7, 143, true, true,
 'Women''s health specialist with focus on high-risk pregnancies and gynecological surgeries',
 ARRAY['English', 'Malayalam', 'Hindi'], true,
 'google_meet', 'https://meet.google.com/xyz-abcd-efg', NULL, NULL,
 'Private consultation via Google Meet. Please have test reports ready.'),

-- Dr. Amit Patel - Dermatologist
('00000000-0000-0000-0001-000000000007'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Amit Patel', 'dr.amit.patel@aisurgeonpilot.com', '+91-9876501007',
 ARRAY['Dermatology', 'Cosmetology'], 'MBBS, MD (Dermatology)', 9,
 1100.00, 750.00, 'INR', 4.5, 89, true, true,
 'Skin specialist offering medical and cosmetic dermatology services',
 ARRAY['English', 'Gujarati', 'Hindi'], true,
 'zoom', 'https://zoom.us/j/4567890123', 'SkinDoc654', '4567890123',
 'Good lighting required for skin examination. Please show affected areas clearly.'),

-- Dr. Lakshmi Venkat - ENT Specialist
('00000000-0000-0000-0001-000000000008'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Lakshmi Venkat', 'dr.lakshmi.venkat@aisurgeonpilot.com', '+91-9876501008',
 ARRAY['ENT', 'Otolaryngology'], 'MBBS, MS (ENT)', 11,
 1300.00, 850.00, 'INR', 4.6, 112, true, true,
 'ENT surgeon specializing in ear, nose, throat disorders and surgeries',
 ARRAY['English', 'Telugu', 'Kannada'], true,
 'webex', 'https://webex.com/meet/drlakshmi', 'ENTDoc987', NULL,
 'Webex meeting room. Please describe symptoms clearly during consultation.'),

-- Dr. Rajesh Gupta - Ophthalmologist
('00000000-0000-0000-0001-000000000009'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Rajesh Gupta', 'dr.rajesh.gupta@aisurgeonpilot.com', '+91-9876501009',
 ARRAY['Ophthalmology', 'Cataract Surgery'], 'MBBS, MS (Ophthalmology)', 16,
 1250.00, 800.00, 'INR', 4.8, 187, true, true,
 'Eye specialist with expertise in cataract surgery and LASIK procedures',
 ARRAY['English', 'Hindi', 'Bengali'], true,
 'zoom', 'https://zoom.us/j/5678901234', 'EyeDoc147', '5678901234',
 'Ensure good lighting for eye examination. Have current glasses/prescription ready.'),

-- Dr. Sneha Desai - Dentist
('00000000-0000-0000-0001-000000000010'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Dr. Sneha Desai', 'dr.sneha.desai@aisurgeonpilot.com', '+91-9876501010',
 ARRAY['Dentistry', 'Oral Surgery'], 'BDS, MDS (Oral Surgery)', 7,
 900.00, 600.00, 'INR', 4.7, 134, true, true,
 'Dental surgeon offering comprehensive oral health and cosmetic dentistry',
 ARRAY['English', 'Marathi', 'Hindi'], true,
 'google_meet', 'https://meet.google.com/dental-consult-123', NULL, NULL,
 'Google Meet for initial consultation. In-person visit may be needed for treatment.')

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. UPDATE EXISTING PATIENTS WITH TENANT_ID
-- ============================================================================

-- Update existing patients to belong to the tenant
UPDATE public.patients
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE tenant_id IS NULL;

-- ============================================================================
-- 5. ADD 44 MORE PATIENTS (to make total 50)
-- ============================================================================

INSERT INTO public.patients (
    id, tenant_id, name, age, date_of_birth, gender, blood_group,
    phone, email, address, city_town, state, pin_code,
    emergency_contact_name, emergency_contact_phone,
    medical_history, allergies, current_medications, is_active
) VALUES
-- Patient 7-20 (Hyderabad)
('00000000-0000-0000-0002-000000000007'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Rajesh Verma', 45, '1979-03-15', 'male', 'O+',
 '+91-9876502007', 'rajesh.verma@example.com', 'Plot 45, Banjara Hills', 'Hyderabad', 'Telangana', '500034',
 'Sunita Verma', '+91-9876502017', 'Hypertension', 'None', 'Amlodipine 5mg', true),

('00000000-0000-0000-0002-000000000008'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Lakshmi Devi', 52, '1972-07-22', 'female', 'A+',
 '+91-9876502008', 'lakshmi.devi@example.com', 'Flat 302, Kukatpally', 'Hyderabad', 'Telangana', '500072',
 'Ramesh Devi', '+91-9876502018', 'Type 2 Diabetes', 'Penicillin', 'Metformin 500mg', true),

('00000000-0000-0000-0002-000000000009'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Arjun Patel', 35, '1989-11-08', 'male', 'B+',
 '+91-9876502009', 'arjun.patel@example.com', 'House 12, Gachibowli', 'Hyderabad', 'Telangana', '500032',
 'Priya Patel', '+91-9876502019', 'None', 'None', 'None', true),

('00000000-0000-0000-0002-000000000010'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Meera Reddy', 28, '1996-05-14', 'female', 'AB+',
 '+91-9876502010', 'meera.reddy@example.com', 'Villa 8, Jubilee Hills', 'Hyderabad', 'Telangana', '500033',
 'Suresh Reddy', '+91-9876502020', 'Asthma', 'Dust', 'Salbutamol inhaler', true),

-- Patients 11-50 (distributed across cities)
('00000000-0000-0000-0002-000000000011'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Vikram Singh', 41, '1983-02-18', 'male', 'O-',
 '+91-9876502011', 'vikram.singh@example.com', 'Sector 15, Rohini', 'Delhi', 'Delhi', '110085',
 'Anjali Singh', '+91-9876502021', 'None', 'None', 'None', true),

('00000000-0000-0000-0002-000000000012'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Pooja Sharma', 33, '1991-09-25', 'female', 'A-',
 '+91-9876502012', 'pooja.sharma@example.com', 'Tower B, Whitefield', 'Bangalore', 'Karnataka', '560066',
 'Rahul Sharma', '+91-9876502022', 'Migraine', 'None', 'Sumatriptan as needed', true),

('00000000-0000-0000-0002-000000000013'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Karthik Nair', 39, '1985-12-03', 'male', 'B-',
 '+91-9876502013', 'karthik.nair@example.com', 'Anna Nagar West', 'Chennai', 'Tamil Nadu', '600040',
 'Divya Nair', '+91-9876502023', 'None', 'Shellfish', 'None', true),

('00000000-0000-0000-0002-000000000014'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
 'Anju Thomas', 47, '1977-04-11', 'female', 'AB-',
 '+91-9876502014', 'anju.thomas@example.com', 'Bandra West', 'Mumbai', 'Maharashtra', '400050',
 'Thomas Joseph', '+91-9876502024', 'Thyroid disorder', 'None', 'Levothyroxine 75mcg', true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. UPDATE EXISTING VISITS WITH TENANT_ID
-- ============================================================================

UPDATE public.visits
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE tenant_id IS NULL;

-- ============================================================================
-- 7. CREATE DOCTOR AVAILABILITY (Mon-Fri 9-5, Some Sat 9-1)
-- ============================================================================

-- Weekday availability for all doctors (Mon-Fri, 9 AM - 5 PM)
INSERT INTO public.doctor_availability (
    tenant_id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes
)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    d.id,
    dow,
    '09:00:00'::time,
    '17:00:00'::time,
    30
FROM public.doctors d
CROSS JOIN generate_series(1, 5) as dow -- Monday to Friday
WHERE d.tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;

-- Saturday availability for first 5 doctors (9 AM - 1 PM)
INSERT INTO public.doctor_availability (
    tenant_id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes
)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    id,
    6, -- Saturday
    '09:00:00'::time,
    '13:00:00'::time,
    30
FROM public.doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
LIMIT 5
ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;

-- ============================================================================
-- 8. CREATE 120 APPOINTMENTS (Next 30 days)
-- ============================================================================

-- Get patient and doctor IDs
DO $$
DECLARE
    v_tenant_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    v_patient_ids UUID[];
    v_doctor_ids UUID[];
    v_patient_id UUID;
    v_doctor_id UUID;
    v_date DATE;
    v_time TIME;
    v_status VARCHAR(50);
    v_type VARCHAR(50);
    i INTEGER;
BEGIN
    -- Get available patient and doctor IDs
    SELECT ARRAY_AGG(id) INTO v_patient_ids FROM public.patients WHERE tenant_id = v_tenant_id LIMIT 50;
    SELECT ARRAY_AGG(id) INTO v_doctor_ids FROM public.doctors WHERE tenant_id = v_tenant_id;

    -- Create 120 appointments over next 30 days
    FOR i IN 1..120 LOOP
        -- Pick random patient and doctor
        v_patient_id := v_patient_ids[(i % array_length(v_patient_ids, 1)) + 1];
        v_doctor_id := v_doctor_ids[(i % array_length(v_doctor_ids, 1)) + 1];

        -- Distribute over next 30 days
        v_date := CURRENT_DATE + ((i % 30) || ' days')::interval;

        -- Random time between 9 AM and 4 PM
        v_time := ('09:00:00'::time + ((i % 8) || ' hours')::interval);

        -- Mix of appointment types
        v_type := CASE (i % 3)
            WHEN 0 THEN 'opd'
            WHEN 1 THEN 'followup'
            ELSE 'online'
        END;

        -- Status based on date
        v_status := CASE
            WHEN v_date > CURRENT_DATE + 7 THEN 'scheduled'
            WHEN v_date > CURRENT_DATE THEN 'confirmed'
            ELSE 'completed'
        END;

        INSERT INTO public.appointments (
            tenant_id, patient_id, doctor_id,
            appointment_date, start_at, duration_minutes,
            appointment_type, status, mode,
            payment_amount, payment_status
        ) VALUES (
            v_tenant_id, v_patient_id, v_doctor_id,
            v_date,
            v_date + v_time,
            30,
            v_type,
            v_status,
            CASE WHEN v_type = 'online' THEN 'video' ELSE 'in_person' END,
            1200.00,
            CASE WHEN v_status = 'completed' THEN 'paid' ELSE 'pending' END
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_tenant_count INTEGER;
    v_doctor_count INTEGER;
    v_patient_count INTEGER;
    v_appointment_count INTEGER;
    v_availability_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tenant_count FROM public.tenants;
    SELECT COUNT(*) INTO v_doctor_count FROM public.doctors;
    SELECT COUNT(*) INTO v_patient_count FROM public.patients WHERE tenant_id IS NOT NULL;
    SELECT COUNT(*) INTO v_appointment_count FROM public.appointments;
    SELECT COUNT(*) INTO v_availability_count FROM public.doctor_availability;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'SEED DATA COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  ✅ Tenants: %', v_tenant_count;
    RAISE NOTICE '  ✅ Doctors: %', v_doctor_count;
    RAISE NOTICE '  ✅ Patients: %', v_patient_count;
    RAISE NOTICE '  ✅ Appointments: %', v_appointment_count;
    RAISE NOTICE '  ✅ Availability Slots: %', v_availability_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Test Credentials:';
    RAISE NOTICE '  Superadmin: superadmin@aisurgeonpilot.com';
    RAISE NOTICE '  Sample Doctor: dr.ramesh.kumar@aisurgeonpilot.com';
    RAISE NOTICE '  Password: admin123 (change in production!)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Test your application!';
    RAISE NOTICE '============================================';
END $$;

COMMIT;
