-- ============================================================================
-- DDO Phase 2: Booking Engine Setup
-- ============================================================================
-- Purpose: Set up doctor availability, slot management, and booking infrastructure
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DOCTOR AVAILABILITY TABLE
-- ============================================================================

-- NOTE: Table may already exist with different schema
-- If it exists, we'll add missing columns instead of recreating

CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,

  -- Day of week (0 = Sunday, 1 = Monday, ... 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

  -- Time range
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Slot configuration
  slot_duration_minutes INTEGER DEFAULT 30,
  max_appointments_per_slot INTEGER DEFAULT 1,

  -- Availability flag
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),

  -- One availability record per doctor per day
  UNIQUE(doctor_id, day_of_week)
);

-- Add missing columns if table already exists
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER DEFAULT 30;
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS max_appointments_per_slot INTEGER DEFAULT 1;
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS breaks JSONB DEFAULT '[]'::jsonb;

-- Rename is_available to is_active if needed (for consistency)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctor_availability' AND column_name = 'is_available'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctor_availability' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE doctor_availability RENAME COLUMN is_available TO is_active;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON doctor_availability(doctor_id, day_of_week);

COMMENT ON TABLE doctor_availability IS 'Doctor weekly availability schedule';
COMMENT ON COLUMN doctor_availability.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN doctor_availability.slot_duration_minutes IS 'Duration of each appointment slot in minutes (default 30)';
COMMENT ON COLUMN doctor_availability.max_appointments_per_slot IS 'Maximum number of concurrent appointments per slot (default 1)';

-- Add breaks column comment only if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctor_availability' AND column_name = 'breaks'
  ) THEN
    EXECUTE $cmd$COMMENT ON COLUMN doctor_availability.breaks IS 'Array of break times in JSONB format'$cmd$;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore comment errors, not critical
    NULL;
END $$;

-- RLS for doctor_availability
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (including old policy names)
DROP POLICY IF EXISTS "Allow authenticated read access" ON doctor_availability;
DROP POLICY IF EXISTS "Public read availability" ON doctor_availability;
DROP POLICY IF EXISTS "Doctors manage own availability" ON doctor_availability;

-- Create policy for public read access
CREATE POLICY "Public read availability"
ON doctor_availability FOR SELECT
TO public
USING (is_active = true);

-- Create policy for doctors to manage their own availability
CREATE POLICY "Doctors manage own availability"
ON doctor_availability FOR ALL
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 2. UPDATE TRIGGER FOR doctor_availability
-- ============================================================================

-- Only create trigger if updated_at column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctor_availability' AND column_name = 'updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION update_doctor_availability_timestamp()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS doctor_availability_update_timestamp ON doctor_availability;

    CREATE TRIGGER doctor_availability_update_timestamp
    BEFORE UPDATE ON doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_doctor_availability_timestamp();
  END IF;
END $$;

-- ============================================================================
-- 3. SEED DEFAULT AVAILABILITY FOR EXISTING DOCTORS
-- ============================================================================

-- NOTE: Table already has 60 rows, so only add for doctors without availability
-- Add default 9 AM - 5 PM availability for Monday-Friday for all doctors
-- Skip if availability already exists

-- Only insert if there are doctors without availability records
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the default tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE is_active = true LIMIT 1;

  -- Add weekday availability (Monday-Friday) for doctors without any schedule
  INSERT INTO doctor_availability (tenant_id, doctor_id, day_of_week, start_time, end_time, is_active, slot_duration_minutes, max_appointments_per_slot)
  SELECT
    COALESCE(d.tenant_id, v_tenant_id),
    d.id,
    day_num,
    '09:00:00'::TIME,
    '17:00:00'::TIME,
    true,
    30,
    1
  FROM doctors d
  CROSS JOIN generate_series(1, 5) AS day_num  -- Monday to Friday
  WHERE NOT EXISTS (
    SELECT 1 FROM doctor_availability da
    WHERE da.doctor_id = d.id AND da.day_of_week = day_num
  )
  AND d.is_active = true;

  -- Mark Saturday and Sunday as unavailable for doctors without weekend schedule
  INSERT INTO doctor_availability (tenant_id, doctor_id, day_of_week, start_time, end_time, is_active, slot_duration_minutes, max_appointments_per_slot)
  SELECT
    COALESCE(d.tenant_id, v_tenant_id),
    d.id,
    day_num,
    '09:00:00'::TIME,
    '17:00:00'::TIME,
    false,
    30,
    1
  FROM doctors d
  CROSS JOIN (SELECT 0 AS day_num UNION SELECT 6) AS weekends  -- Sunday and Saturday
  WHERE NOT EXISTS (
    SELECT 1 FROM doctor_availability da
    WHERE da.doctor_id = d.id AND da.day_of_week = day_num
  )
  AND d.is_active = true;
END $$;

-- ============================================================================
-- 4. VERIFY SCHEMA
-- ============================================================================

SELECT 'Doctor availability table created successfully' AS status;

-- Count availability records
SELECT
  d.full_name,
  COUNT(da.id) as availability_records
FROM doctors d
LEFT JOIN doctor_availability da ON d.id = da.doctor_id
WHERE d.is_active = true
GROUP BY d.id, d.full_name
ORDER BY d.full_name;

COMMIT;
