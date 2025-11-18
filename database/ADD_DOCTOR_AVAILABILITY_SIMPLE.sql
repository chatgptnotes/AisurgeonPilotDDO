-- Add Doctor Availability - Simple Version (No ON CONFLICT)
-- Creates Mon-Fri 9AM-5PM availability for all doctors

DO $$
DECLARE
  v_doctor RECORD;
  v_day INT;
  v_exists BOOLEAN;
BEGIN
  -- Loop through all doctors
  FOR v_doctor IN
    SELECT id, full_name
    FROM doctors
    WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  LOOP
    -- Add availability for Monday (1) through Friday (5)
    FOR v_day IN 1..5 LOOP
      -- Check if availability already exists
      SELECT EXISTS(
        SELECT 1 FROM doctor_availability
        WHERE doctor_id = v_doctor.id AND day_of_week = v_day
      ) INTO v_exists;

      IF NOT v_exists THEN
        -- Create new availability
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
        );
      ELSE
        -- Update existing availability
        UPDATE doctor_availability
        SET
          start_time = '09:00:00',
          end_time = '17:00:00',
          is_active = true,
          max_appointments_per_slot = 4
        WHERE doctor_id = v_doctor.id AND day_of_week = v_day;
      END IF;
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
  COUNT(da.id) as days_available,
  MIN(da.start_time) as opens_at,
  MAX(da.end_time) as closes_at
FROM doctors d
LEFT JOIN doctor_availability da ON d.id = da.doctor_id AND da.is_active = true
WHERE d.tenant_id = '00000000-0000-0000-0000-000000000001'
GROUP BY d.id, d.full_name
ORDER BY d.full_name;

-- Show detailed availability
SELECT
  d.full_name,
  da.day_of_week,
  CASE da.day_of_week
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
    WHEN 0 THEN 'Sunday'
  END as day_name,
  da.start_time,
  da.end_time,
  da.is_active
FROM doctor_availability da
JOIN doctors d ON d.id = da.doctor_id
WHERE d.tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY d.full_name, da.day_of_week;
