-- ============================================
-- AI SURGEON PILOT - REALISTIC DATA SEEDING
-- ============================================
-- This script seeds the database with realistic data
-- Run this AFTER migrations 08 (multi-tenant) and 09 (appointments)
-- Version: 1.0
-- Date: 2025-11-15
-- ============================================

BEGIN;

-- ============================================
-- 1. CREATE TENANT (YOUR HOSPITAL)
-- ============================================

INSERT INTO public.tenants (
    id,
    name,
    slug,
    display_name,
    type,
    subscription_plan,
    subscription_status,
    contact_email,
    contact_phone,
    address,
    city,
    state,
    country,
    pin_code,
    logo_url,
    primary_color,
    secondary_color,
    settings,
    is_active
) VALUES (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d'::uuid, -- Fixed UUID for consistency
    'AI Surgeon Pilot Clinic',
    'aisp-clinic',
    'AI Surgeon Pilot - Advanced Healthcare',
    'hospital',
    'pro',
    'active',
    'admin@aisurgeonpilot.com',
    '+91-9876543210',
    '123 Healthcare Avenue, Medical District',
    'Mumbai',
    'Maharashtra',
    'India',
    '400001',
    'https://via.placeholder.com/200x200/059669/FFFFFF?text=AISP',
    '#059669',
    '#10b981',
    '{
        "features": {
            "pharmacy": true,
            "lab": true,
            "radiology": true,
            "ot": true,
            "patient_portal": true,
            "online_appointments": true,
            "online_consultations": true,
            "whatsapp_notifications": true,
            "email_notifications": true
        },
        "business_hours": {
            "monday": {"open": "09:00", "close": "18:00"},
            "tuesday": {"open": "09:00", "close": "18:00"},
            "wednesday": {"open": "09:00", "close": "18:00"},
            "thursday": {"open": "09:00", "close": "18:00"},
            "friday": {"open": "09:00", "close": "18:00"},
            "saturday": {"open": "09:00", "close": "14:00"},
            "sunday": {"open": "closed", "close": "closed"}
        },
        "appointment_duration": 30,
        "currency": "INR",
        "timezone": "Asia/Kolkata"
    }'::jsonb,
    true
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    contact_email = EXCLUDED.contact_email,
    updated_at = NOW();

-- ============================================
-- 2. CREATE 10 REALISTIC DOCTORS
-- ============================================

-- Dr. Murali - Orthopedic Surgeon (Primary)
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    'dr-murali-001'::uuid,
    'Dr. Murali Krishna',
    'dr.murali@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')), -- bcrypt hash
    'doctor',
    'Orthopedics',
    'MBBS, MS (Ortho), FACS',
    '15 years',
    'MH/MED/12345',
    '+91-9876543211',
    true,
    true,
    'https://randomuser.me/api/portraits/men/32.jpg',
    'Specialist in joint replacement, sports injuries, and trauma surgery. Over 2000 successful surgeries performed. Pioneer in minimally invasive orthopedic procedures.',
    1500.00,
    1000.00,
    ARRAY['English', 'Hindi', 'Telugu', 'Marathi'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Dr. Priya Sharma - Cardiologist
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    gen_random_uuid(),
    'Dr. Priya Sharma',
    'dr.priya@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')),
    'doctor',
    'Cardiology',
    'MBBS, MD (Cardiology), DM (Interventional)',
    '12 years',
    'MH/MED/23456',
    '+91-9876543212',
    true,
    true,
    'https://randomuser.me/api/portraits/women/44.jpg',
    'Expert in interventional cardiology, angioplasty, and heart failure management. Trained at AIIMS Delhi.',
    2000.00,
    1500.00,
    ARRAY['English', 'Hindi', 'Gujarati'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Dr. Rajesh Patel - Neurologist
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    gen_random_uuid(),
    'Dr. Rajesh Patel',
    'dr.rajesh@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')),
    'doctor',
    'Neurology',
    'MBBS, MD (Medicine), DM (Neurology)',
    '18 years',
    'MH/MED/34567',
    '+91-9876543213',
    true,
    true,
    'https://randomuser.me/api/portraits/men/45.jpg',
    'Specialist in stroke management, epilepsy, and movement disorders. Published 25+ research papers.',
    1800.00,
    1200.00,
    ARRAY['English', 'Hindi', 'Gujarati'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Dr. Anjali Desai - Gynecologist
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    gen_random_uuid(),
    'Dr. Anjali Desai',
    'dr.anjali@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')),
    'doctor',
    'Gynecology & Obstetrics',
    'MBBS, MS (OB/GYN), FRCOG',
    '14 years',
    'MH/MED/45678',
    '+91-9876543214',
    true,
    true,
    'https://randomuser.me/api/portraits/women/67.jpg',
    'Expert in high-risk pregnancy, infertility treatment, and minimally invasive gynecological surgery.',
    1600.00,
    1100.00,
    ARRAY['English', 'Hindi', 'Marathi'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Dr. Amit Kumar - Pediatrician
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    gen_random_uuid(),
    'Dr. Amit Kumar',
    'dr.amit@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')),
    'doctor',
    'Pediatrics',
    'MBBS, MD (Pediatrics), FIAP',
    '10 years',
    'MH/MED/56789',
    '+91-9876543215',
    true,
    true,
    'https://randomuser.me/api/portraits/men/22.jpg',
    'Specialist in newborn care, vaccination, and childhood developmental disorders.',
    1200.00,
    800.00,
    ARRAY['English', 'Hindi', 'Bengali'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Dr. Sneha Reddy - Dermatologist
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    gen_random_uuid(),
    'Dr. Sneha Reddy',
    'dr.sneha@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')),
    'doctor',
    'Dermatology',
    'MBBS, MD (Dermatology), DDV',
    '8 years',
    'MH/MED/67890',
    '+91-9876543216',
    true,
    true,
    'https://randomuser.me/api/portraits/women/33.jpg',
    'Expert in cosmetic dermatology, laser treatments, and skin cancer screening.',
    1400.00,
    900.00,
    ARRAY['English', 'Hindi', 'Telugu', 'Tamil'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Dr. Vikram Singh - General Surgeon
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    gen_random_uuid(),
    'Dr. Vikram Singh',
    'dr.vikram@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')),
    'doctor',
    'General Surgery',
    'MBBS, MS (General Surgery), FICS',
    '16 years',
    'MH/MED/78901',
    '+91-9876543217',
    true,
    true,
    'https://randomuser.me/api/portraits/men/54.jpg',
    'Specialist in laparoscopic surgery, hernia repair, and GI tract surgeries.',
    1700.00,
    1200.00,
    ARRAY['English', 'Hindi', 'Punjabi'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Dr. Meera Nair - ENT Specialist
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    gen_random_uuid(),
    'Dr. Meera Nair',
    'dr.meera@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')),
    'doctor',
    'ENT (Ear, Nose, Throat)',
    'MBBS, MS (ENT), DORL',
    '11 years',
    'MH/MED/89012',
    '+91-9876543218',
    true,
    true,
    'https://randomuser.me/api/portraits/women/55.jpg',
    'Expert in sinus surgery, hearing disorders, and throat cancer management.',
    1300.00,
    900.00,
    ARRAY['English', 'Hindi', 'Malayalam', 'Tamil'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Dr. Arjun Mehta - Ophthalmologist
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    gen_random_uuid(),
    'Dr. Arjun Mehta',
    'dr.arjun@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')),
    'doctor',
    'Ophthalmology',
    'MBBS, MS (Ophthalmology), FRCS',
    '13 years',
    'MH/MED/90123',
    '+91-9876543219',
    true,
    true,
    'https://randomuser.me/api/portraits/men/76.jpg',
    'Specialist in cataract surgery, LASIK, and retinal disorders. Performed 5000+ eye surgeries.',
    1500.00,
    1000.00,
    ARRAY['English', 'Hindi', 'Gujarati'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Dr. Kavita Iyer - Psychiatrist
INSERT INTO public."User" (
    id,
    name,
    email,
    password,
    role,
    specialty,
    qualification,
    experience_years,
    registration_number,
    phone,
    is_active,
    is_verified,
    profile_photo_url,
    bio,
    consultation_fee,
    followup_fee,
    languages,
    created_at
) VALUES (
    gen_random_uuid(),
    'Dr. Kavita Iyer',
    'dr.kavita@aisurgeonpilot.com',
    crypt('doctor123', gen_salt('bf')),
    'doctor',
    'Psychiatry',
    'MBBS, MD (Psychiatry), MRCPsych',
    '9 years',
    'MH/MED/01234',
    '+91-9876543220',
    true,
    true,
    'https://randomuser.me/api/portraits/women/88.jpg',
    'Expert in depression, anxiety disorders, and cognitive behavioral therapy.',
    1800.00,
    1300.00,
    ARRAY['English', 'Hindi', 'Tamil', 'Kannada'],
    NOW()
) ON CONFLICT (email) DO NOTHING;

RAISE NOTICE '✅ 10 doctors created successfully';

COMMIT;
