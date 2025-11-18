-- Add Doctor Availability for All Doctors
-- This fixes the 406 error when booking appointments
-- Creates availability Monday-Friday 9 AM - 5 PM for all doctors

DO $$
DECLARE
  v_doctor RECORD;
  v_day INT;
BEGIN
  -- Loop through all doctors
  FOR v_doctor IN
    SELECT id, full_name
    FROM doctors
    WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  LOOP
    -- Add availability for Monday (1) through Friday (5)
    FOR v_day IN 1..5 LOOP
      INSERT INTO doctor_availability (
        doctor_id,
        day_of_week,
        start_time,
        end_time,
        is_active,
        max_appointments_per_slot
      ) VALUES (
        v_doctor.id,
        v_day,
        '09:00:00',
        '17:00:00',
        true,
        4
      )
      ON CONFLICT (doctor_id, day_of_week) DO UPDATE SET
        start_time = '09:00:00',
        end_time = '17:00:00',
        is_active = true;
    END LOOP;

    RAISE NOTICE 'Added availability for: %', v_doctor.full_name;
  END LOOP;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Completed! All doctors now have availability.';
  RAISE NOTICE '==============================================';
END $$;

-- Verify availability was created
SELECT
  d.full_name,
  da.day_of_week,
  da.start_time,
  da.end_time,
  da.is_active
FROM doctor_availability da
JOIN doctors d ON d.id = da.doctor_id
WHERE d.tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY d.full_name, da.day_of_week;
