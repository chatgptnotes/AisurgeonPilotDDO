-- Check Which Doctors Already Exist
-- Run this to see what doctors you already have

SELECT
  id,
  full_name,
  email,
  specialties,
  phone,
  consultation_fee_standard,
  rating_avg,
  rating_count,
  is_verified,
  is_accepting_patients,
  created_at
FROM doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY full_name;

-- Count total doctors
SELECT COUNT(*) as total_doctors
FROM doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
