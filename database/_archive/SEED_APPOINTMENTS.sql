-- ============================================
-- AI SURGEON PILOT - APPOINTMENT SEED DATA
-- ============================================
-- This script seeds comprehensive appointment data
-- Run this AFTER SEED_PATIENTS_APPOINTMENTS.sql
-- Version: 1.0
-- Date: 2025-11-15
-- ============================================

BEGIN;

-- ============================================
-- VARIABLES & SETUP
-- ============================================

DO $$
DECLARE
    v_tenant_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d'::uuid;

    -- Arrays for doctor information
    doctor_ids UUID[];
    doctor_specialties TEXT[];
    doctor_fees DECIMAL[];

    -- Arrays for patient IDs (we'll fetch these)
    patient_ids UUID[];

    -- Arrays for realistic data
    symptoms_orthopedics TEXT[] := ARRAY[
        'Knee pain and swelling',
        'Lower back pain radiating to leg',
        'Shoulder stiffness and limited movement',
        'Ankle sprain from sports injury',
        'Hip joint pain while walking',
        'Wrist fracture post-fall',
        'Chronic arthritis pain'
    ];

    symptoms_cardiology TEXT[] := ARRAY[
        'Chest pain and discomfort',
        'Irregular heartbeat',
        'High blood pressure',
        'Shortness of breath on exertion',
        'Palpitations and dizziness',
        'Fatigue and chest tightness',
        'Follow-up post angioplasty'
    ];

    symptoms_neurology TEXT[] := ARRAY[
        'Severe headache with aura',
        'Numbness in left arm',
        'Memory loss and confusion',
        'Tremors in hands',
        'Chronic migraine episodes',
        'Seizure disorder follow-up',
        'Vertigo and balance issues'
    ];

    symptoms_gynecology TEXT[] := ARRAY[
        'Pregnancy checkup - 28 weeks',
        'Irregular menstrual cycles',
        'Abdominal pain and cramping',
        'Prenatal care visit',
        'PCOS management',
        'Post-delivery follow-up',
        'Menopause symptoms'
    ];

    symptoms_pediatrics TEXT[] := ARRAY[
        'Fever and cough for 3 days',
        'Vaccination - MMR booster',
        'Asthma review and medication adjustment',
        'Growth and development checkup',
        'Ear infection symptoms',
        'Allergic reaction to food',
        'Well-child examination'
    ];

    symptoms_dermatology TEXT[] := ARRAY[
        'Persistent acne on face and back',
        'Skin rash and itching',
        'Hair loss and thinning',
        'Pigmentation and dark spots',
        'Eczema flare-up',
        'Mole examination',
        'Laser treatment follow-up'
    ];

    symptoms_surgery TEXT[] := ARRAY[
        'Inguinal hernia requiring surgery',
        'Gallbladder stones - surgical consult',
        'Post-operative wound check',
        'Appendicitis symptoms',
        'Abdominal pain assessment',
        'Pre-operative evaluation',
        'Hernia repair follow-up'
    ];

    symptoms_ent TEXT[] := ARRAY[
        'Chronic sinusitis and nasal congestion',
        'Ear pain and hearing loss',
        'Tonsillitis and sore throat',
        'Nosebleed episodes',
        'Vertigo and ear infection',
        'Vocal cord issues',
        'Sinus surgery follow-up'
    ];

    symptoms_ophthalmology TEXT[] := ARRAY[
        'Blurred vision in right eye',
        'Cataract evaluation',
        'Eye redness and irritation',
        'Diabetic retinopathy screening',
        'LASIK consultation',
        'Post-cataract surgery check',
        'Glaucoma monitoring'
    ];

    symptoms_psychiatry TEXT[] := ARRAY[
        'Depression and low mood',
        'Anxiety and panic attacks',
        'Sleep disturbances',
        'Medication review and adjustment',
        'Therapy session follow-up',
        'Stress management counseling',
        'Bipolar disorder management'
    ];

    cancellation_reasons TEXT[] := ARRAY[
        'Patient fell sick',
        'Emergency at work',
        'Transportation issues',
        'Rescheduled to different time',
        'Doctor unavailable',
        'Personal emergency',
        'Weather conditions',
        'Feeling better - not needed',
        'Financial constraints',
        'Found alternative treatment'
    ];

    payment_methods TEXT[] := ARRAY['cash', 'card', 'upi', 'online'];
    booking_sources TEXT[] := ARRAY['staff', 'patient_portal', 'whatsapp', 'phone'];

    -- Loop variables
    i INTEGER;
    j INTEGER;
    random_patient_id UUID;
    random_doctor_idx INTEGER;
    random_date TIMESTAMP WITH TIME ZONE;
    random_duration INTEGER;
    random_type TEXT;
    random_mode TEXT;
    random_status TEXT;
    random_symptoms TEXT;
    random_payment_method TEXT;
    random_booking_source TEXT;
    random_cancellation TEXT;
    appointment_amount DECIMAL(10,2);

BEGIN

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting Appointment Seed Data Creation';
    RAISE NOTICE '========================================';

    -- ============================================
    -- 1. FETCH DOCTOR IDs AND METADATA
    -- ============================================

    RAISE NOTICE 'Step 1: Fetching doctor information...';

    SELECT ARRAY_AGG(id ORDER BY email),
           ARRAY_AGG(specialty ORDER BY email),
           ARRAY_AGG(consultation_fee ORDER BY email)
    INTO doctor_ids, doctor_specialties, doctor_fees
    FROM public."User"
    WHERE role = 'doctor' AND is_active = true
    LIMIT 10;

    RAISE NOTICE 'Found % doctors', array_length(doctor_ids, 1);

    -- ============================================
    -- 2. FETCH PATIENT IDs
    -- ============================================

    RAISE NOTICE 'Step 2: Fetching patient information...';

    SELECT ARRAY_AGG(id ORDER BY created_at)
    INTO patient_ids
    FROM public.patients
    LIMIT 50;

    RAISE NOTICE 'Found % patients', array_length(patient_ids, 1);

    -- ============================================
    -- 3. CREATE 100 PAST APPOINTMENTS
    -- ============================================

    RAISE NOTICE 'Step 3: Creating 100 past appointments...';

    FOR i IN 1..100 LOOP
        -- Random patient
        random_patient_id := patient_ids[1 + floor(random() * array_length(patient_ids, 1))::int];

        -- Random doctor
        random_doctor_idx := 1 + floor(random() * array_length(doctor_ids, 1))::int;

        -- Random date in last 6 months (not today)
        random_date := NOW() - INTERVAL '1 day' - (random() * INTERVAL '6 months');

        -- Random duration (30, 45, or 60 minutes)
        random_duration := (ARRAY[30, 45, 60])[1 + floor(random() * 3)::int];

        -- Appointment type distribution: 60% opd, 30% online, 10% followup
        IF random() < 0.60 THEN
            random_type := 'opd';
            random_mode := 'in_person';
        ELSIF random() < 0.90 THEN
            random_type := 'online';
            random_mode := (ARRAY['video', 'phone'])[1 + floor(random() * 2)::int];
        ELSE
            random_type := 'followup';
            random_mode := (ARRAY['in_person', 'video'])[1 + floor(random() * 2)::int];
        END IF;

        -- Status distribution: 70% completed, 20% cancelled, 10% no_show
        IF i <= 70 THEN
            random_status := 'completed';
        ELSIF i <= 90 THEN
            random_status := 'cancelled';
        ELSE
            random_status := 'no_show';
        END IF;

        -- Get symptoms based on specialty
        CASE doctor_specialties[random_doctor_idx]
            WHEN 'Orthopedics' THEN
                random_symptoms := symptoms_orthopedics[1 + floor(random() * array_length(symptoms_orthopedics, 1))::int];
            WHEN 'Cardiology' THEN
                random_symptoms := symptoms_cardiology[1 + floor(random() * array_length(symptoms_cardiology, 1))::int];
            WHEN 'Neurology' THEN
                random_symptoms := symptoms_neurology[1 + floor(random() * array_length(symptoms_neurology, 1))::int];
            WHEN 'Gynecology & Obstetrics' THEN
                random_symptoms := symptoms_gynecology[1 + floor(random() * array_length(symptoms_gynecology, 1))::int];
            WHEN 'Pediatrics' THEN
                random_symptoms := symptoms_pediatrics[1 + floor(random() * array_length(symptoms_pediatrics, 1))::int];
            WHEN 'Dermatology' THEN
                random_symptoms := symptoms_dermatology[1 + floor(random() * array_length(symptoms_dermatology, 1))::int];
            WHEN 'General Surgery' THEN
                random_symptoms := symptoms_surgery[1 + floor(random() * array_length(symptoms_surgery, 1))::int];
            WHEN 'ENT (Ear, Nose, Throat)' THEN
                random_symptoms := symptoms_ent[1 + floor(random() * array_length(symptoms_ent, 1))::int];
            WHEN 'Ophthalmology' THEN
                random_symptoms := symptoms_ophthalmology[1 + floor(random() * array_length(symptoms_ophthalmology, 1))::int];
            WHEN 'Psychiatry' THEN
                random_symptoms := symptoms_psychiatry[1 + floor(random() * array_length(symptoms_psychiatry, 1))::int];
            ELSE
                random_symptoms := 'General consultation';
        END CASE;

        -- Payment method and booking source
        random_payment_method := payment_methods[1 + floor(random() * array_length(payment_methods, 1))::int];
        random_booking_source := booking_sources[1 + floor(random() * array_length(booking_sources, 1))::int];

        -- Appointment amount
        IF random_type = 'followup' THEN
            appointment_amount := doctor_fees[random_doctor_idx] * 0.67; -- 2/3 of consultation fee
        ELSE
            appointment_amount := doctor_fees[random_doctor_idx];
        END IF;

        -- Cancellation reason (only for cancelled appointments)
        IF random_status = 'cancelled' THEN
            random_cancellation := cancellation_reasons[1 + floor(random() * array_length(cancellation_reasons, 1))::int];
        ELSE
            random_cancellation := NULL;
        END IF;

        -- Insert appointment
        INSERT INTO public.appointments (
            id,
            tenant_id,
            patient_id,
            doctor_id,
            appointment_date,
            appointment_end_time,
            duration_minutes,
            appointment_type,
            consultation_mode,
            status,
            department,
            reason,
            symptoms,
            notes,
            cancellation_reason,
            meeting_link,
            meeting_id,
            payment_required,
            payment_amount,
            payment_status,
            payment_method,
            payment_date,
            reminder_sent,
            reminder_sent_at,
            confirmation_sent,
            confirmation_sent_at,
            booking_source,
            created_at,
            updated_at,
            cancelled_at
        ) VALUES (
            gen_random_uuid(),
            v_tenant_id,
            random_patient_id,
            doctor_ids[random_doctor_idx],
            random_date,
            random_date + (random_duration || ' minutes')::INTERVAL,
            random_duration,
            random_type,
            random_mode,
            random_status,
            doctor_specialties[random_doctor_idx],
            'Consultation for ' || doctor_specialties[random_doctor_idx],
            random_symptoms,
            CASE
                WHEN random_status = 'completed' THEN 'Patient consulted successfully. Treatment prescribed.'
                WHEN random_status = 'no_show' THEN 'Patient did not show up for appointment.'
                ELSE NULL
            END,
            random_cancellation,
            CASE
                WHEN random_mode IN ('video', 'phone') THEN 'https://meet.google.com/abc-' || SUBSTRING(MD5(random()::text), 1, 10)
                ELSE NULL
            END,
            CASE
                WHEN random_mode IN ('video', 'phone') THEN SUBSTRING(MD5(random()::text), 1, 12)
                ELSE NULL
            END,
            true,
            appointment_amount,
            CASE
                WHEN random_status = 'completed' THEN 'paid'
                WHEN random_status = 'cancelled' AND random() < 0.3 THEN 'refunded'
                WHEN random_status = 'cancelled' THEN 'pending'
                ELSE 'pending'
            END,
            CASE
                WHEN random_status = 'completed' THEN random_payment_method
                ELSE NULL
            END,
            CASE
                WHEN random_status = 'completed' THEN random_date + INTERVAL '1 hour'
                ELSE NULL
            END,
            true,
            random_date - INTERVAL '1 day',
            true,
            random_date - INTERVAL '2 days',
            random_booking_source,
            random_date - INTERVAL '7 days',
            random_date,
            CASE
                WHEN random_status = 'cancelled' THEN random_date - INTERVAL '1 day'
                ELSE NULL
            END
        );

        -- Progress indicator every 20 records
        IF i % 20 = 0 THEN
            RAISE NOTICE '  Created % past appointments...', i;
        END IF;

    END LOOP;

    RAISE NOTICE 'Completed: 100 past appointments created';
    RAISE NOTICE '  - 70 completed appointments';
    RAISE NOTICE '  - 20 cancelled appointments';
    RAISE NOTICE '  - 10 no-show appointments';

    -- ============================================
    -- 4. CREATE 20 UPCOMING APPOINTMENTS
    -- ============================================

    RAISE NOTICE 'Step 4: Creating 20 upcoming appointments...';

    FOR i IN 1..20 LOOP
        -- Random patient
        random_patient_id := patient_ids[1 + floor(random() * array_length(patient_ids, 1))::int];

        -- Random doctor
        random_doctor_idx := 1 + floor(random() * array_length(doctor_ids, 1))::int;

        -- Random date in next 30 days (not today)
        random_date := NOW() + INTERVAL '1 day' + (random() * INTERVAL '30 days');

        -- Random duration (30, 45, or 60 minutes)
        random_duration := (ARRAY[30, 45, 60])[1 + floor(random() * 3)::int];

        -- Appointment type distribution
        IF random() < 0.50 THEN
            random_type := 'opd';
            random_mode := 'in_person';
        ELSIF random() < 0.80 THEN
            random_type := 'online';
            random_mode := (ARRAY['video', 'phone'])[1 + floor(random() * 2)::int];
        ELSE
            random_type := 'followup';
            random_mode := (ARRAY['in_person', 'video'])[1 + floor(random() * 2)::int];
        END IF;

        -- Status: 50% scheduled, 50% confirmed
        IF i <= 10 THEN
            random_status := 'scheduled';
        ELSE
            random_status := 'confirmed';
        END IF;

        -- Get symptoms based on specialty
        CASE doctor_specialties[random_doctor_idx]
            WHEN 'Orthopedics' THEN
                random_symptoms := symptoms_orthopedics[1 + floor(random() * array_length(symptoms_orthopedics, 1))::int];
            WHEN 'Cardiology' THEN
                random_symptoms := symptoms_cardiology[1 + floor(random() * array_length(symptoms_cardiology, 1))::int];
            WHEN 'Neurology' THEN
                random_symptoms := symptoms_neurology[1 + floor(random() * array_length(symptoms_neurology, 1))::int];
            WHEN 'Gynecology & Obstetrics' THEN
                random_symptoms := symptoms_gynecology[1 + floor(random() * array_length(symptoms_gynecology, 1))::int];
            WHEN 'Pediatrics' THEN
                random_symptoms := symptoms_pediatrics[1 + floor(random() * array_length(symptoms_pediatrics, 1))::int];
            WHEN 'Dermatology' THEN
                random_symptoms := symptoms_dermatology[1 + floor(random() * array_length(symptoms_dermatology, 1))::int];
            WHEN 'General Surgery' THEN
                random_symptoms := symptoms_surgery[1 + floor(random() * array_length(symptoms_surgery, 1))::int];
            WHEN 'ENT (Ear, Nose, Throat)' THEN
                random_symptoms := symptoms_ent[1 + floor(random() * array_length(symptoms_ent, 1))::int];
            WHEN 'Ophthalmology' THEN
                random_symptoms := symptoms_ophthalmology[1 + floor(random() * array_length(symptoms_ophthalmology, 1))::int];
            WHEN 'Psychiatry' THEN
                random_symptoms := symptoms_psychiatry[1 + floor(random() * array_length(symptoms_psychiatry, 1))::int];
            ELSE
                random_symptoms := 'General consultation';
        END CASE;

        random_booking_source := booking_sources[1 + floor(random() * array_length(booking_sources, 1))::int];

        -- Appointment amount
        IF random_type = 'followup' THEN
            appointment_amount := doctor_fees[random_doctor_idx] * 0.67;
        ELSE
            appointment_amount := doctor_fees[random_doctor_idx];
        END IF;

        -- Insert appointment
        INSERT INTO public.appointments (
            id,
            tenant_id,
            patient_id,
            doctor_id,
            appointment_date,
            appointment_end_time,
            duration_minutes,
            appointment_type,
            consultation_mode,
            status,
            department,
            reason,
            symptoms,
            notes,
            meeting_link,
            meeting_id,
            payment_required,
            payment_amount,
            payment_status,
            reminder_sent,
            reminder_sent_at,
            confirmation_sent,
            confirmation_sent_at,
            booking_source,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_tenant_id,
            random_patient_id,
            doctor_ids[random_doctor_idx],
            random_date,
            random_date + (random_duration || ' minutes')::INTERVAL,
            random_duration,
            random_type,
            random_mode,
            random_status,
            doctor_specialties[random_doctor_idx],
            'Consultation for ' || doctor_specialties[random_doctor_idx],
            random_symptoms,
            NULL,
            CASE
                WHEN random_mode IN ('video', 'phone') THEN 'https://meet.google.com/xyz-' || SUBSTRING(MD5(random()::text), 1, 10)
                ELSE NULL
            END,
            CASE
                WHEN random_mode IN ('video', 'phone') THEN SUBSTRING(MD5(random()::text), 1, 12)
                ELSE NULL
            END,
            true,
            appointment_amount,
            'pending',
            CASE WHEN random_status = 'confirmed' THEN true ELSE false END,
            CASE WHEN random_status = 'confirmed' THEN random_date - INTERVAL '1 day' ELSE NULL END,
            CASE WHEN random_status = 'confirmed' THEN true ELSE false END,
            CASE WHEN random_status = 'confirmed' THEN NOW() - INTERVAL '2 hours' ELSE NULL END,
            random_booking_source,
            NOW() - INTERVAL '3 days',
            NOW()
        );

        -- Progress indicator every 10 records
        IF i % 10 = 0 THEN
            RAISE NOTICE '  Created % upcoming appointments...', i;
        END IF;

    END LOOP;

    RAISE NOTICE 'Completed: 20 upcoming appointments created';
    RAISE NOTICE '  - 10 scheduled appointments';
    RAISE NOTICE '  - 10 confirmed appointments';

    -- ============================================
    -- 5. SUMMARY STATISTICS
    -- ============================================

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'APPOINTMENT SEED DATA SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Appointments Created: 120';
    RAISE NOTICE '';
    RAISE NOTICE 'Past Appointments (100):';
    RAISE NOTICE '  - Completed: 70 (with payment data)';
    RAISE NOTICE '  - Cancelled: 20 (with cancellation reasons)';
    RAISE NOTICE '  - No-Show: 10';
    RAISE NOTICE '';
    RAISE NOTICE 'Upcoming Appointments (20):';
    RAISE NOTICE '  - Scheduled: 10';
    RAISE NOTICE '  - Confirmed: 10';
    RAISE NOTICE '';
    RAISE NOTICE 'Appointment Types:';
    RAISE NOTICE '  - OPD: ~60%';
    RAISE NOTICE '  - Online: ~30%';
    RAISE NOTICE '  - Follow-up: ~10%';
    RAISE NOTICE '';
    RAISE NOTICE 'Consultation Modes:';
    RAISE NOTICE '  - In-person';
    RAISE NOTICE '  - Video';
    RAISE NOTICE '  - Phone';
    RAISE NOTICE '';
    RAISE NOTICE 'Distribution across:';
    RAISE NOTICE '  - 10 Doctors (all specialties)';
    RAISE NOTICE '  - 50 Patients';
    RAISE NOTICE '  - Date Range: Last 6 months to next 30 days';
    RAISE NOTICE '========================================';

END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View appointment summary by status
SELECT
    status,
    COUNT(*) as count,
    ROUND(AVG(payment_amount), 2) as avg_payment
FROM public.appointments
GROUP BY status
ORDER BY count DESC;

-- View appointment summary by type
SELECT
    appointment_type,
    COUNT(*) as count,
    consultation_mode,
    COUNT(*) as mode_count
FROM public.appointments
GROUP BY appointment_type, consultation_mode
ORDER BY appointment_type, mode_count DESC;

-- View appointment summary by doctor specialty
SELECT
    u.specialty,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled,
    COUNT(CASE WHEN a.status = 'scheduled' THEN 1 END) as scheduled,
    COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed
FROM public.appointments a
JOIN public."User" u ON a.doctor_id = u.id
GROUP BY u.specialty
ORDER BY total_appointments DESC;

-- View payment summary
SELECT
    payment_status,
    COUNT(*) as count,
    ROUND(SUM(payment_amount), 2) as total_amount,
    ROUND(AVG(payment_amount), 2) as avg_amount
FROM public.appointments
WHERE payment_required = true
GROUP BY payment_status
ORDER BY count DESC;

RAISE NOTICE '';
RAISE NOTICE 'Seed data script completed successfully!';
RAISE NOTICE 'Run the verification queries above to check the data.';
