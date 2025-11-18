-- Create Complete Doctor Profiles
-- Run this in Supabase SQL Editor to create all doctor profiles

-- First, let's set the tenant_id (using the default tenant)
DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

-- Clear existing doctors (optional - remove if you want to keep existing data)
-- DELETE FROM doctors WHERE tenant_id = v_tenant_id;

-- 1. Dr. Priya Sharma - Cardiology & Internal Medicine
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients,
  zoom_meeting_link,
  zoom_password,
  zoom_meeting_id,
  zoom_instructions
) VALUES (
  v_tenant_id,
  'Dr. Priya Sharma',
  'priya.sharma@aisurgeonpilot.com',
  '+919876543211',
  ARRAY['Cardiology', 'Internal Medicine'],
  ARRAY['English', 'Hindi', 'Tamil'],
  'Board-certified cardiologist with 15+ years of experience in treating heart conditions, hypertension, and preventive cardiology. Specialized in non-invasive cardiac procedures and lifestyle medicine.',
  800,
  500,
  'INR',
  'https://randomuser.me/api/portraits/women/1.jpg',
  4.8,
  127,
  true,
  true,
  'https://us05web.zoom.us/j/1234567890',
  'heart123',
  '123 456 7890',
  'Please join 5 minutes early. Have your medical reports ready for review.'
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  specialties = EXCLUDED.specialties,
  languages = EXCLUDED.languages,
  bio = EXCLUDED.bio;

-- 2. Dr. Rajesh Kumar - Orthopedic Surgery
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients,
  zoom_meeting_link,
  zoom_password,
  zoom_meeting_id
) VALUES (
  v_tenant_id,
  'Dr. Rajesh Kumar',
  'rajesh.kumar@aisurgeonpilot.com',
  '+919876543212',
  ARRAY['Orthopedic Surgery', 'Sports Medicine'],
  ARRAY['English', 'Hindi', 'Punjabi'],
  'Expert orthopedic surgeon specializing in joint replacements, sports injuries, and trauma care. 20+ years experience with over 5000 successful surgeries.',
  1000,
  600,
  'INR',
  'https://randomuser.me/api/portraits/men/2.jpg',
  4.9,
  203,
  true,
  true,
  'https://us05web.zoom.us/j/2345678901',
  'ortho456',
  '234 567 8901'
) ON CONFLICT (email) DO NOTHING;

-- 3. Dr. Anjali Patel - Pediatrics
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients,
  zoom_meeting_link,
  zoom_password
) VALUES (
  v_tenant_id,
  'Dr. Anjali Patel',
  'anjali.patel@aisurgeonpilot.com',
  '+919876543213',
  ARRAY['Pediatrics', 'Neonatology'],
  ARRAY['English', 'Hindi', 'Gujarati'],
  'Compassionate pediatrician with expertise in child development, vaccinations, and newborn care. Special interest in childhood nutrition and preventive healthcare.',
  600,
  400,
  'INR',
  'https://randomuser.me/api/portraits/women/3.jpg',
  4.9,
  189,
  true,
  true,
  'https://us05web.zoom.us/j/3456789012',
  'kids789'
) ON CONFLICT (email) DO NOTHING;

-- 4. Dr. Vikram Singh - Neurology
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients,
  zoom_meeting_link
) VALUES (
  v_tenant_id,
  'Dr. Vikram Singh',
  'vikram.singh@aisurgeonpilot.com',
  '+919876543214',
  ARRAY['Neurology', 'Stroke Medicine'],
  ARRAY['English', 'Hindi', 'Bengali'],
  'Leading neurologist with specialization in stroke care, epilepsy, and movement disorders. 18 years of experience in treating complex neurological conditions.',
  1200,
  700,
  'INR',
  'https://randomuser.me/api/portraits/men/4.jpg',
  4.7,
  156,
  true,
  true,
  'https://meet.google.com/abc-defg-hij'
) ON CONFLICT (email) DO NOTHING;

-- 5. Dr. Meera Reddy - Dermatology & Cosmetology
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients,
  zoom_meeting_link
) VALUES (
  v_tenant_id,
  'Dr. Meera Reddy',
  'meera.reddy@aisurgeonpilot.com',
  '+919876543215',
  ARRAY['Dermatology', 'Cosmetology', 'Aesthetic Medicine'],
  ARRAY['English', 'Hindi', 'Telugu'],
  'Expert dermatologist offering advanced skin treatments, anti-aging solutions, and cosmetic procedures. Certified in laser treatments and aesthetic dermatology.',
  900,
  550,
  'INR',
  'https://randomuser.me/api/portraits/women/5.jpg',
  4.8,
  234,
  true,
  true,
  'https://us05web.zoom.us/j/4567890123'
) ON CONFLICT (email) DO NOTHING;

-- 6. Dr. Arjun Mehta - General Surgery
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients
) VALUES (
  v_tenant_id,
  'Dr. Arjun Mehta',
  'arjun.mehta@aisurgeonpilot.com',
  '+919876543216',
  ARRAY['General Surgery', 'Laparoscopic Surgery'],
  ARRAY['English', 'Hindi', 'Marathi'],
  'Highly skilled general surgeon with expertise in minimally invasive laparoscopic procedures. Specialized in gallbladder, hernia, and appendix surgeries.',
  1100,
  650,
  'INR',
  'https://randomuser.me/api/portraits/men/6.jpg',
  4.9,
  178,
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- 7. Dr. Kavita Desai - Gynecology & Obstetrics
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients,
  zoom_meeting_link
) VALUES (
  v_tenant_id,
  'Dr. Kavita Desai',
  'kavita.desai@aisurgeonpilot.com',
  '+919876543217',
  ARRAY['Gynecology', 'Obstetrics', 'Infertility'],
  ARRAY['English', 'Hindi', 'Gujarati'],
  'Dedicated women''s health specialist with 16+ years experience in pregnancy care, high-risk deliveries, and fertility treatments. Committed to compassionate patient care.',
  850,
  500,
  'INR',
  'https://randomuser.me/api/portraits/women/7.jpg',
  4.9,
  267,
  true,
  true,
  'https://meet.google.com/xyz-abcd-efg'
) ON CONFLICT (email) DO NOTHING;

-- 8. Dr. Sanjay Gupta - Ophthalmology
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients
) VALUES (
  v_tenant_id,
  'Dr. Sanjay Gupta',
  'sanjay.gupta@aisurgeonpilot.com',
  '+919876543218',
  ARRAY['Ophthalmology', 'Cataract Surgery', 'LASIK'],
  ARRAY['English', 'Hindi'],
  'Leading eye specialist with expertise in cataract surgery, LASIK, and retinal disorders. Over 10,000 successful eye surgeries performed with advanced technology.',
  700,
  450,
  'INR',
  'https://randomuser.me/api/portraits/men/8.jpg',
  4.8,
  312,
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- 9. Dr. Nisha Kapoor - Psychiatry
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients,
  zoom_meeting_link,
  zoom_password
) VALUES (
  v_tenant_id,
  'Dr. Nisha Kapoor',
  'nisha.kapoor@aisurgeonpilot.com',
  '+919876543219',
  ARRAY['Psychiatry', 'Clinical Psychology'],
  ARRAY['English', 'Hindi'],
  'Compassionate psychiatrist specializing in depression, anxiety, stress management, and relationship counseling. Evidence-based approach with focus on holistic wellness.',
  1000,
  600,
  'INR',
  'https://randomuser.me/api/portraits/women/9.jpg',
  4.9,
  145,
  true,
  true,
  'https://us05web.zoom.us/j/5678901234',
  'mind2024'
) ON CONFLICT (email) DO NOTHING;

-- 10. Dr. Amit Shah - ENT (Ear, Nose, Throat)
INSERT INTO doctors (
  tenant_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  bio,
  consultation_fee_standard,
  consultation_fee_followup,
  currency,
  profile_photo_url,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients
) VALUES (
  v_tenant_id,
  'Dr. Amit Shah',
  'amit.shah@aisurgeonpilot.com',
  '+919876543220',
  ARRAY['ENT', 'Head and Neck Surgery'],
  ARRAY['English', 'Hindi', 'Gujarati'],
  'Experienced ENT surgeon with expertise in sinus surgery, tonsillectomy, and hearing disorders. 14 years of practice with advanced endoscopic techniques.',
  750,
  475,
  'INR',
  'https://randomuser.me/api/portraits/men/10.jpg',
  4.7,
  198,
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Display created doctors
RAISE NOTICE 'Successfully created/updated 10 doctor profiles!';

END $$;

-- Verify the doctors were created
SELECT
  id,
  full_name,
  email,
  specialties,
  phone,
  consultation_fee_standard,
  rating_avg,
  rating_count
FROM doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY full_name;
