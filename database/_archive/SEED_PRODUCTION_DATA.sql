-- ============================================
-- AI SURGEON PILOT - PRODUCTION SEED DATA
-- ============================================
-- This script creates realistic test data for development and testing
-- SAFE TO RUN MULTIPLE TIMES (uses ON CONFLICT DO NOTHING)
-- Version: 1.0
-- Date: 2025-11-15
-- ============================================
--
-- WHAT THIS SCRIPT CREATES:
-- 1. One tenant (AI Surgeon Pilot)
-- 2. 10 realistic doctors in User table
-- 3. 50 realistic patients with Indian names and addresses
-- 4. 120 appointments across next 30 days
-- 5. Doctor availability schedules
--
-- EXECUTION TIME: ~5 seconds
-- ============================================

BEGIN;

\echo '=========================================='
\echo 'SEED DATA SCRIPT STARTED'
\echo '=========================================='

-- ============================================
-- STEP 1: CREATE TENANT
-- ============================================
\echo ''
\echo 'Step 1: Creating tenant...'

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
    primary_color,
    secondary_color,
    settings,
    is_active
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'AI Surgeon Pilot Hospital',
    'aisurgeonpilot',
    'AI Surgeon Pilot',
    'hospital',
    'enterprise',
    'active',
    'admin@aisurgeonpilot.com',
    '+91-40-4567-8900',
    '123, Medical Complex, Banjara Hills',
    'Hyderabad',
    'Telangana',
    'India',
    '500034',
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
            "monday": {"open": "09:00", "close": "20:00"},
            "tuesday": {"open": "09:00", "close": "20:00"},
            "wednesday": {"open": "09:00", "close": "20:00"},
            "thursday": {"open": "09:00", "close": "20:00"},
            "friday": {"open": "09:00", "close": "20:00"},
            "saturday": {"open": "09:00", "close": "18:00"},
            "sunday": {"open": "10:00", "close": "14:00"}
        },
        "appointment_duration": 30,
        "currency": "INR",
        "timezone": "Asia/Kolkata"
    }'::jsonb,
    true
)
ON CONFLICT (slug) DO NOTHING;

\echo '✓ Tenant created: AI Surgeon Pilot'

-- ============================================
-- STEP 2: CREATE SUPERADMIN USER
-- ============================================
\echo ''
\echo 'Step 2: Creating superadmin user...'

INSERT INTO public."User" (
    id,
    email,
    password,
    role,
    user_type,
    is_superadmin,
    is_active,
    phone
)
VALUES (
    '00000000-0000-0000-0000-000000000010'::uuid,
    'superadmin@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi', -- password: admin123
    'admin',
    'superadmin',
    true,
    true,
    '+91-98765-43210'
)
ON CONFLICT (email) DO UPDATE
SET is_superadmin = true, user_type = 'superadmin';

\echo '✓ Superadmin created (email: superadmin@aisurgeonpilot.com, password: admin123)'

-- ============================================
-- STEP 3: CREATE 10 DOCTORS
-- ============================================
\echo ''
\echo 'Step 3: Creating 10 doctors...'

-- Doctor 1: General Surgeon
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000001'::uuid,
    'dr.ramesh.kumar@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00001'
) ON CONFLICT (email) DO NOTHING;

-- Doctor 2: Orthopedic Surgeon
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000002'::uuid,
    'dr.priya.sharma@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00002'
) ON CONFLICT (email) DO NOTHING;

-- Doctor 3: Cardiologist
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000003'::uuid,
    'dr.suresh.reddy@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00003'
) ON CONFLICT (email) DO NOTHING;

-- Doctor 4: Neurologist
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000004'::uuid,
    'dr.anjali.mehta@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00004'
) ON CONFLICT (email) DO NOTHING;

-- Doctor 5: Pediatrician
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000005'::uuid,
    'dr.vikram.singh@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00005'
) ON CONFLICT (email) DO NOTHING;

-- Doctor 6: Gynecologist
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000006'::uuid,
    'dr.kavita.nair@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00006'
) ON CONFLICT (email) DO NOTHING;

-- Doctor 7: Dermatologist
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000007'::uuid,
    'dr.amit.patel@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00007'
) ON CONFLICT (email) DO NOTHING;

-- Doctor 8: ENT Specialist
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000008'::uuid,
    'dr.lakshmi.venkat@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00008'
) ON CONFLICT (email) DO NOTHING;

-- Doctor 9: Ophthalmologist
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000009'::uuid,
    'dr.rajesh.gupta@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00009'
) ON CONFLICT (email) DO NOTHING;

-- Doctor 10: Dentist
INSERT INTO public."User" (id, email, password, role, user_type, is_superadmin, is_active, phone)
VALUES (
    '00000000-0000-0000-0001-000000000010'::uuid,
    'dr.sneha.desai@aisurgeonpilot.com',
    '$2a$10$rOYz3YZKe6qHLqN3n8F7Z.xLV5QYJ2YqxJzDxHmT8V0xY6Z9K0Xqi',
    'doctor',
    'staff',
    false,
    true,
    '+91-98765-00010'
) ON CONFLICT (email) DO NOTHING;

\echo '✓ 10 doctors created (password for all: admin123)'

-- ============================================
-- STEP 4: LINK DOCTORS TO TENANT
-- ============================================
\echo ''
\echo 'Step 4: Linking doctors to tenant...'

-- Link all doctors to the AI Surgeon Pilot tenant
INSERT INTO public.tenant_users (tenant_id, user_id, role, is_primary, is_active)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    id,
    'doctor',
    true,
    true
FROM public."User"
WHERE role = 'doctor'
ON CONFLICT (tenant_id, user_id) DO NOTHING;

\echo '✓ Doctors linked to tenant'

-- ============================================
-- STEP 5: CREATE DOCTOR AVAILABILITY
-- ============================================
\echo ''
\echo 'Step 5: Creating doctor availability schedules...'

-- All doctors available Monday to Friday, 9 AM to 5 PM
INSERT INTO public.doctor_availability (tenant_id, doctor_id, day_of_week, start_time, end_time, is_available, max_appointments, slot_duration_minutes)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    d.day_num,
    '09:00'::time,
    '17:00'::time,
    true,
    16, -- 16 slots of 30 mins = 8 hours
    30
FROM public."User" u
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(day_num) -- Monday to Friday
WHERE u.role = 'doctor'
ON CONFLICT DO NOTHING;

-- Some doctors also available on Saturday mornings
INSERT INTO public.doctor_availability (tenant_id, doctor_id, day_of_week, start_time, end_time, is_available, max_appointments, slot_duration_minutes)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    6, -- Saturday
    '09:00'::time,
    '13:00'::time,
    true,
    8,
    30
FROM public."User" u
WHERE u.role = 'doctor'
AND u.email IN (
    'dr.ramesh.kumar@aisurgeonpilot.com',
    'dr.priya.sharma@aisurgeonpilot.com',
    'dr.suresh.reddy@aisurgeonpilot.com',
    'dr.anjali.mehta@aisurgeonpilot.com',
    'dr.vikram.singh@aisurgeonpilot.com'
)
ON CONFLICT DO NOTHING;

\echo '✓ Doctor availability schedules created'

-- ============================================
-- STEP 6: CREATE 50 REALISTIC PATIENTS
-- ============================================
\echo ''
\echo 'Step 6: Creating 50 realistic patients...'

-- We'll create patients with realistic Indian names, cities, and medical data
INSERT INTO public.patients (id, name, patients_id, age, date_of_birth, gender, blood_group, phone, email, address, city_town, state, pin_code, allergies, tenant_id)
VALUES
-- Batch 1: Hyderabad patients
('00000000-0000-0000-0002-000000000001'::uuid, 'Ramakrishna Rao', 'P-HYD-001', 45, '1979-03-15', 'Male', 'O+', '+91-99999-11111', 'ramakrishna.rao@email.com', 'Plot 123, Jubilee Hills', 'Hyderabad', 'Telangana', '500033', 'Penicillin', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000002'::uuid, 'Lakshmi Devi', 'P-HYD-002', 38, '1986-07-22', 'Female', 'A+', '+91-99999-11112', 'lakshmi.devi@email.com', 'House 45, Banjara Hills', 'Hyderabad', 'Telangana', '500034', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000003'::uuid, 'Venkatesh Reddy', 'P-HYD-003', 52, '1972-11-08', 'Male', 'B+', '+91-99999-11113', 'venkatesh.reddy@email.com', 'Road 12, Madhapur', 'Hyderabad', 'Telangana', '500081', 'Sulfa drugs', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000004'::uuid, 'Padma Kumari', 'P-HYD-004', 29, '1995-01-18', 'Female', 'AB+', '+91-99999-11114', 'padma.kumari@email.com', 'Flat 301, Gachibowli', 'Hyderabad', 'Telangana', '500032', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000005'::uuid, 'Srinivas Murthy', 'P-HYD-005', 67, '1957-05-25', 'Male', 'O-', '+91-99999-11115', 'srinivas.murthy@email.com', 'Colony Road 5, Kukatpally', 'Hyderabad', 'Telangana', '500072', 'Aspirin', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000006'::uuid, 'Annapurna Sastry', 'P-HYD-006', 34, '1990-09-12', 'Female', 'A-', '+91-99999-11116', 'annapurna.sastry@email.com', 'Lane 4, Kondapur', 'Hyderabad', 'Telangana', '500084', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000007'::uuid, 'Krishna Prasad', 'P-HYD-007', 41, '1983-12-30', 'Male', 'B-', '+91-99999-11117', 'krishna.prasad@email.com', 'Block B, Miyapur', 'Hyderabad', 'Telangana', '500049', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000008'::uuid, 'Manjula Devi', 'P-HYD-008', 55, '1969-04-07', 'Female', 'O+', '+91-99999-11118', 'manjula.devi@email.com', 'Villa 12, Kompally', 'Hyderabad', 'Telangana', '500014', 'Iodine', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000009'::uuid, 'Narayana Swamy', 'P-HYD-009', 48, '1976-08-19', 'Male', 'AB-', '+91-99999-11119', 'narayana.swamy@email.com', 'Street 7, Secunderabad', 'Hyderabad', 'Telangana', '500003', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000010'::uuid, 'Vasundhara Rani', 'P-HYD-010', 26, '1998-02-14', 'Female', 'A+', '+91-99999-11120', 'vasundhara.rani@email.com', 'Apartment 5A, Ameerpet', 'Hyderabad', 'Telangana', '500016', NULL, '00000000-0000-0000-0000-000000000001'::uuid),

-- Batch 2: Bangalore patients
('00000000-0000-0000-0002-000000000011'::uuid, 'Rajesh Kumar', 'P-BLR-001', 36, '1988-06-10', 'Male', 'O+', '+91-99999-11121', 'rajesh.kumar@email.com', 'Koramangala 4th Block', 'Bangalore', 'Karnataka', '560034', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000012'::uuid, 'Sowmya Ramesh', 'P-BLR-002', 31, '1993-10-05', 'Female', 'B+', '+91-99999-11122', 'sowmya.ramesh@email.com', 'Indiranagar 2nd Stage', 'Bangalore', 'Karnataka', '560038', 'Latex', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000013'::uuid, 'Mohan Gowda', 'P-BLR-003', 59, '1965-03-28', 'Male', 'A-', '+91-99999-11123', 'mohan.gowda@email.com', 'Jayanagar 4th Block', 'Bangalore', 'Karnataka', '560041', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000014'::uuid, 'Deepa Shetty', 'P-BLR-004', 42, '1982-11-17', 'Female', 'O-', '+91-99999-11124', 'deepa.shetty@email.com', 'Whitefield Main Road', 'Bangalore', 'Karnataka', '560066', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000015'::uuid, 'Harish Bhat', 'P-BLR-005', 28, '1996-07-23', 'Male', 'AB+', '+91-99999-11125', 'harish.bhat@email.com', 'Electronic City Phase 1', 'Bangalore', 'Karnataka', '560100', 'Penicillin', '00000000-0000-0000-0000-000000000001'::uuid),

-- Batch 3: Chennai patients
('00000000-0000-0000-0002-000000000016'::uuid, 'Vijay Anand', 'P-CHE-001', 50, '1974-01-12', 'Male', 'B+', '+91-99999-11126', 'vijay.anand@email.com', 'Anna Nagar West', 'Chennai', 'Tamil Nadu', '600040', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000017'::uuid, 'Meenakshi Sundaram', 'P-CHE-002', 44, '1980-05-20', 'Female', 'O+', '+91-99999-11127', 'meenakshi.sundaram@email.com', 'T Nagar Main Road', 'Chennai', 'Tamil Nadu', '600017', 'Aspirin', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000018'::uuid, 'Subramanian Iyer', 'P-CHE-003', 63, '1961-09-08', 'Male', 'A+', '+91-99999-11128', 'subramanian.iyer@email.com', 'Adyar 2nd Street', 'Chennai', 'Tamil Nadu', '600020', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000019'::uuid, 'Priya Krishnan', 'P-CHE-004', 33, '1991-12-03', 'Female', 'B-', '+91-99999-11129', 'priya.krishnan@email.com', 'Velachery Main Road', 'Chennai', 'Tamil Nadu', '600042', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000020'::uuid, 'Karthik Raja', 'P-CHE-005', 37, '1987-04-16', 'Male', 'AB-', '+91-99999-11130', 'karthik.raja@email.com', 'Porur Junction', 'Chennai', 'Tamil Nadu', '600116', NULL, '00000000-0000-0000-0000-000000000001'::uuid),

-- Batch 4: Mumbai patients
('00000000-0000-0000-0002-000000000021'::uuid, 'Anil Mehta', 'P-MUM-001', 46, '1978-08-25', 'Male', 'O+', '+91-99999-11131', 'anil.mehta@email.com', 'Andheri West', 'Mumbai', 'Maharashtra', '400053', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000022'::uuid, 'Sunita Deshmukh', 'P-MUM-002', 39, '1985-02-11', 'Female', 'A+', '+91-99999-11132', 'sunita.deshmukh@email.com', 'Bandra Linking Road', 'Mumbai', 'Maharashtra', '400050', 'Sulfa drugs', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000023'::uuid, 'Prakash Joshi', 'P-MUM-003', 54, '1970-06-30', 'Male', 'B+', '+91-99999-11133', 'prakash.joshi@email.com', 'Powai Lake Road', 'Mumbai', 'Maharashtra', '400076', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000024'::uuid, 'Kavita Patil', 'P-MUM-004', 27, '1997-11-09', 'Female', 'O-', '+91-99999-11134', 'kavita.patil@email.com', 'Malad West Station Road', 'Mumbai', 'Maharashtra', '400064', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000025'::uuid, 'Ramesh Kulkarni', 'P-MUM-005', 61, '1963-03-22', 'Male', 'AB+', '+91-99999-11135', 'ramesh.kulkarni@email.com', 'Dadar Shivaji Park', 'Mumbai', 'Maharashtra', '400028', 'Iodine', '00000000-0000-0000-0000-000000000001'::uuid),

-- Batch 5: Delhi patients
('00000000-0000-0000-0002-000000000026'::uuid, 'Suresh Sharma', 'P-DEL-001', 49, '1975-07-18', 'Male', 'O+', '+91-99999-11136', 'suresh.sharma@email.com', 'Karol Bagh Main Road', 'New Delhi', 'Delhi', '110005', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000027'::uuid, 'Neha Verma', 'P-DEL-002', 32, '1992-09-27', 'Female', 'A-', '+91-99999-11137', 'neha.verma@email.com', 'Rajouri Garden', 'New Delhi', 'Delhi', '110027', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000028'::uuid, 'Dinesh Gupta', 'P-DEL-003', 58, '1966-12-05', 'Male', 'B-', '+91-99999-11138', 'dinesh.gupta@email.com', 'Dwarka Sector 10', 'New Delhi', 'Delhi', '110075', 'Penicillin', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000029'::uuid, 'Anjali Singh', 'P-DEL-004', 35, '1989-04-14', 'Female', 'O-', '+91-99999-11139', 'anjali.singh@email.com', 'Lajpat Nagar Central Market', 'New Delhi', 'Delhi', '110024', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000030'::uuid, 'Vikrant Malhotra', 'P-DEL-005', 43, '1981-10-31', 'Male', 'AB-', '+91-99999-11140', 'vikrant.malhotra@email.com', 'Rohini Sector 7', 'New Delhi', 'Delhi', '110085', NULL, '00000000-0000-0000-0000-000000000001'::uuid),

-- Batch 6: Pune patients
('00000000-0000-0000-0002-000000000031'::uuid, 'Madhav Joshi', 'P-PUN-001', 40, '1984-01-28', 'Male', 'O+', '+91-99999-11141', 'madhav.joshi@email.com', 'Koregaon Park', 'Pune', 'Maharashtra', '411001', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000032'::uuid, 'Pooja Desai', 'P-PUN-002', 30, '1994-06-19', 'Female', 'A+', '+91-99999-11142', 'pooja.desai@email.com', 'Viman Nagar', 'Pune', 'Maharashtra', '411014', 'Aspirin', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000033'::uuid, 'Ganesh Bhosale', 'P-PUN-003', 56, '1968-03-11', 'Male', 'B+', '+91-99999-11143', 'ganesh.bhosale@email.com', 'Shivaji Nagar Main Road', 'Pune', 'Maharashtra', '411005', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000034'::uuid, 'Shweta Pawar', 'P-PUN-004', 25, '1999-11-02', 'Female', 'O-', '+91-99999-11144', 'shweta.pawar@email.com', 'Hinjewadi Phase 2', 'Pune', 'Maharashtra', '411057', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000035'::uuid, 'Nitin Kulkarni', 'P-PUN-005', 47, '1977-08-07', 'Male', 'AB+', '+91-99999-11145', 'nitin.kulkarni@email.com', 'Deccan Gymkhana', 'Pune', 'Maharashtra', '411004', NULL, '00000000-0000-0000-0000-000000000001'::uuid),

-- Batch 7: Kolkata patients
('00000000-0000-0000-0002-000000000036'::uuid, 'Amit Banerjee', 'P-KOL-001', 51, '1973-05-16', 'Male', 'O+', '+91-99999-11146', 'amit.banerjee@email.com', 'Salt Lake Sector V', 'Kolkata', 'West Bengal', '700091', 'Sulfa drugs', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000037'::uuid, 'Rina Chatterjee', 'P-KOL-002', 38, '1986-09-23', 'Female', 'A-', '+91-99999-11147', 'rina.chatterjee@email.com', 'Park Street Area', 'Kolkata', 'West Bengal', '700016', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000038'::uuid, 'Somnath Ghosh', 'P-KOL-003', 64, '1960-02-09', 'Male', 'B+', '+91-99999-11148', 'somnath.ghosh@email.com', 'Howrah Station Road', 'Kolkata', 'West Bengal', '711101', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000039'::uuid, 'Tanushree Das', 'P-KOL-004', 29, '1995-12-26', 'Female', 'O-', '+91-99999-11149', 'tanushree.das@email.com', 'New Town Action Area 1', 'Kolkata', 'West Bengal', '700156', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000040'::uuid, 'Partha Sarkar', 'P-KOL-005', 44, '1980-07-04', 'Male', 'AB-', '+91-99999-11150', 'partha.sarkar@email.com', 'Ballygunge Circular Road', 'Kolkata', 'West Bengal', '700019', 'Iodine', '00000000-0000-0000-0000-000000000001'::uuid),

-- Batch 8: Ahmedabad patients
('00000000-0000-0000-0002-000000000041'::uuid, 'Kiran Patel', 'P-AMD-001', 42, '1982-04-21', 'Male', 'O+', '+91-99999-11151', 'kiran.patel@email.com', 'Satellite Road', 'Ahmedabad', 'Gujarat', '380015', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000042'::uuid, 'Hetal Shah', 'P-AMD-002', 34, '1990-10-13', 'Female', 'A+', '+91-99999-11152', 'hetal.shah@email.com', 'Vastrapur Lake Area', 'Ahmedabad', 'Gujarat', '380015', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000043'::uuid, 'Bharat Desai', 'P-AMD-003', 57, '1967-01-07', 'Male', 'B-', '+91-99999-11153', 'bharat.desai@email.com', 'Paldi Main Road', 'Ahmedabad', 'Gujarat', '380007', 'Penicillin', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000044'::uuid, 'Nisha Mehta', 'P-AMD-004', 31, '1993-08-29', 'Female', 'O-', '+91-99999-11154', 'nisha.mehta@email.com', 'Navrangpura Circle', 'Ahmedabad', 'Gujarat', '380009', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000045'::uuid, 'Jayesh Bhatt', 'P-AMD-005', 48, '1976-12-18', 'Male', 'AB+', '+91-99999-11155', 'jayesh.bhatt@email.com', 'Prahlad Nagar', 'Ahmedabad', 'Gujarat', '380015', NULL, '00000000-0000-0000-0000-000000000001'::uuid),

-- Batch 9: Jaipur patients
('00000000-0000-0000-0002-000000000046'::uuid, 'Mahesh Rathore', 'P-JAI-001', 53, '1971-03-06', 'Male', 'O+', '+91-99999-11156', 'mahesh.rathore@email.com', 'MI Road', 'Jaipur', 'Rajasthan', '302001', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000047'::uuid, 'Geeta Sharma', 'P-JAI-002', 36, '1988-11-24', 'Female', 'A-', '+91-99999-11157', 'geeta.sharma@email.com', 'Malviya Nagar', 'Jaipur', 'Rajasthan', '302017', 'Aspirin', '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000048'::uuid, 'Ravi Chouhan', 'P-JAI-003', 60, '1964-07-11', 'Male', 'B+', '+91-99999-11158', 'ravi.chouhan@email.com', 'Vaishali Nagar', 'Jaipur', 'Rajasthan', '302021', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000049'::uuid, 'Sneha Jain', 'P-JAI-004', 28, '1996-05-03', 'Female', 'O-', '+91-99999-11159', 'sneha.jain@email.com', 'Mansarovar Sector 1', 'Jaipur', 'Rajasthan', '302020', NULL, '00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0002-000000000050'::uuid, 'Lokesh Meena', 'P-JAI-005', 45, '1979-09-15', 'Male', 'AB-', '+91-99999-11160', 'lokesh.meena@email.com', 'Tonk Road', 'Jaipur', 'Rajasthan', '302015', 'Latex', '00000000-0000-0000-0000-000000000001'::uuid)

ON CONFLICT (id) DO NOTHING;

\echo '✓ 50 patients created across Indian cities'

-- ============================================
-- STEP 7: CREATE 120 APPOINTMENTS
-- ============================================
\echo ''
\echo 'Step 7: Creating 120 appointments over next 30 days...'

-- Helper: Generate appointments across the next 30 days
-- We'll distribute them across 10 doctors and different time slots

-- This creates 12 appointments per doctor = 120 total
INSERT INTO public.appointments (
    tenant_id,
    patient_id,
    doctor_id,
    appointment_date,
    duration_minutes,
    appointment_type,
    consultation_mode,
    status,
    department,
    reason,
    booking_source
)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    patients.id,
    doctors.id,
    (CURRENT_DATE + ((patient_seq - 1) / 4) * INTERVAL '1 day' + (hour_offset * INTERVAL '1 hour'))::timestamp,
    30,
    CASE (patient_seq % 3)
        WHEN 0 THEN 'followup'
        WHEN 1 THEN 'opd'
        ELSE 'online'
    END,
    CASE (patient_seq % 3)
        WHEN 2 THEN 'video'
        ELSE 'in_person'
    END,
    CASE
        WHEN (CURRENT_DATE + ((patient_seq - 1) / 4) * INTERVAL '1 day') < CURRENT_DATE THEN 'completed'
        WHEN (CURRENT_DATE + ((patient_seq - 1) / 4) * INTERVAL '1 day') = CURRENT_DATE THEN 'in_progress'
        ELSE 'scheduled'
    END,
    CASE doctor_num
        WHEN 1 THEN 'General Surgery'
        WHEN 2 THEN 'Orthopedics'
        WHEN 3 THEN 'Cardiology'
        WHEN 4 THEN 'Neurology'
        WHEN 5 THEN 'Pediatrics'
        WHEN 6 THEN 'Gynecology'
        WHEN 7 THEN 'Dermatology'
        WHEN 8 THEN 'ENT'
        WHEN 9 THEN 'Ophthalmology'
        ELSE 'Dentistry'
    END,
    CASE (patient_seq % 10)
        WHEN 0 THEN 'Routine checkup'
        WHEN 1 THEN 'Follow-up consultation'
        WHEN 2 THEN 'New patient consultation'
        WHEN 3 THEN 'Lab report review'
        WHEN 4 THEN 'Post-operative follow-up'
        WHEN 5 THEN 'Prescription renewal'
        WHEN 6 THEN 'Chronic condition management'
        WHEN 7 THEN 'Preventive health screening'
        WHEN 8 THEN 'Second opinion'
        ELSE 'Specialist referral consultation'
    END,
    CASE (patient_seq % 4)
        WHEN 0 THEN 'staff'
        WHEN 1 THEN 'patient_portal'
        WHEN 2 THEN 'whatsapp'
        ELSE 'phone'
    END
FROM
    (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as patient_num FROM public.patients WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 50) as patients,
    (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as doctor_num FROM public."User" WHERE role = 'doctor' LIMIT 10) as doctors,
    (SELECT generate_series(1, 12) as patient_seq) as sequences,
    (SELECT (9 + (FLOOR(RANDOM() * 8))::int) as hour_offset) as hours
WHERE
    doctors.doctor_num = CEIL(patients.patient_num / 5.0)::int
    AND patient_seq <= 12
LIMIT 120
ON CONFLICT DO NOTHING;

\echo '✓ 120 appointments created'

-- ============================================
-- STEP 8: CREATE SOME SAMPLE VISIT RECORDS
-- ============================================
\echo ''
\echo 'Step 8: Creating sample visit records for completed appointments...'

-- Create visits for a subset of patients (let's say 20 recent visits)
INSERT INTO public.visits (
    visit_id,
    patient_id,
    visit_type,
    visit_date,
    reason_for_visit,
    appointment_with,
    status,
    tenant_id
)
SELECT
    'V-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY p.id)::text, 4, '0'),
    p.id,
    'opd',
    CURRENT_DATE - (ROW_NUMBER() OVER (ORDER BY p.id) % 30) * INTERVAL '1 day',
    'General consultation',
    'Dr. Ramesh Kumar',
    'completed',
    '00000000-0000-0000-0000-000000000001'::uuid
FROM (SELECT id FROM public.patients LIMIT 20) p
ON CONFLICT DO NOTHING;

\echo '✓ 20 sample visits created'

-- ============================================
-- FINAL SUMMARY
-- ============================================
\echo ''
\echo '=========================================='
\echo 'SEED DATA CREATION COMPLETE!'
\echo '=========================================='
\echo ''

-- Count and display what was created
DO $$
DECLARE
    v_tenants INTEGER;
    v_doctors INTEGER;
    v_patients INTEGER;
    v_appointments INTEGER;
    v_visits INTEGER;
    v_availability INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tenants FROM public.tenants;
    SELECT COUNT(*) INTO v_doctors FROM public."User" WHERE role = 'doctor';
    SELECT COUNT(*) INTO v_patients FROM public.patients;
    SELECT COUNT(*) INTO v_appointments FROM public.appointments;
    SELECT COUNT(*) INTO v_visits FROM public.visits;
    SELECT COUNT(*) INTO v_availability FROM public.doctor_availability;

    RAISE NOTICE '';
    RAISE NOTICE '✓ Tenants created: %', v_tenants;
    RAISE NOTICE '✓ Doctors created: %', v_doctors;
    RAISE NOTICE '✓ Patients created: %', v_patients;
    RAISE NOTICE '✓ Appointments created: %', v_appointments;
    RAISE NOTICE '✓ Visits created: %', v_visits;
    RAISE NOTICE '✓ Doctor availability slots: %', v_availability;
    RAISE NOTICE '';
END $$;

COMMIT;

\echo ''
\echo '=========================================='
\echo 'LOGIN CREDENTIALS'
\echo '=========================================='
\echo ''
\echo 'Superadmin:'
\echo '  Email: superadmin@aisurgeonpilot.com'
\echo '  Password: admin123'
\echo ''
\echo 'All Doctors:'
\echo '  Password: admin123'
\echo '  Examples:'
\echo '    - dr.ramesh.kumar@aisurgeonpilot.com'
\echo '    - dr.priya.sharma@aisurgeonpilot.com'
\echo '    - dr.suresh.reddy@aisurgeonpilot.com'
\echo ''
\echo '=========================================='
\echo 'DONE!'
\echo '=========================================='
