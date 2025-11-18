-- ============================================================================
-- DDO Phase 1: Foundation Setup
-- ============================================================================
-- Purpose: Set up multi-tenant architecture, RLS policies, and enhanced patient schema
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD SLUG TO DOCTORS TABLE (for custom shareable links)
-- ============================================================================

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_doctors_slug ON doctors(slug);

COMMENT ON COLUMN doctors.slug IS 'URL-friendly identifier for doctor (e.g., shwetha-dubai-dermat)';

-- Function to auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_doctor_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := regexp_replace(
      lower(trim(NEW.full_name)),
      '[^a-z0-9]+',
      '-',
      'g'
    );
    -- Remove leading/trailing hyphens
    NEW.slug := regexp_replace(NEW.slug, '^-+|-+$', '', 'g');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS doctors_generate_slug_trigger ON doctors;

CREATE TRIGGER doctors_generate_slug_trigger
BEFORE INSERT OR UPDATE ON doctors
FOR EACH ROW
EXECUTE FUNCTION generate_doctor_slug();

-- ============================================================================
-- 2. ENHANCE PATIENTS TABLE (add required medical fields)
-- ============================================================================

ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS current_medications TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_email_verified ON patients(email_verified);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Doctors see own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors update own profile" ON doctors;
DROP POLICY IF EXISTS "Public read doctors" ON doctors;
DROP POLICY IF EXISTS "Patients see own data" ON patients;
DROP POLICY IF EXISTS "Patients update own data" ON patients;
DROP POLICY IF EXISTS "Patients see own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors see own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors manage own appointments" ON appointments;

-- ============================================================================
-- DOCTORS TABLE RLS
-- ============================================================================

-- Doctors can see and update their own profile
CREATE POLICY "Doctors see own profile"
ON doctors FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Doctors update own profile"
ON doctors FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public can read doctor profiles (for booking)
CREATE POLICY "Public read doctors"
ON doctors FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ============================================================================
-- PATIENTS TABLE RLS
-- ============================================================================

-- Patients can see and update their own data
CREATE POLICY "Patients see own data"
ON patients FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Patients update own data"
ON patients FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Doctors can see their patients (who have appointments)
CREATE POLICY "Doctors see their patients"
ON patients FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT patient_id FROM appointments
    WHERE doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- APPOINTMENTS TABLE RLS
-- ============================================================================

-- Patients see only their own appointments
CREATE POLICY "Patients see own appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM patients WHERE auth.uid() = id
  )
);

-- Patients can create appointments
CREATE POLICY "Patients create appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
  patient_id IN (
    SELECT id FROM patients WHERE auth.uid() = id
  )
);

-- Doctors see appointments for their patients
CREATE POLICY "Doctors see own appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

-- Doctors can manage (update/delete) their appointments
CREATE POLICY "Doctors manage own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

-- ============================================================================
-- 4. CONSULTATION TYPES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS consultation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,

  type VARCHAR(50) NOT NULL, -- 'teleconsult', 'in_person', 'home_visit'
  name VARCHAR(255) NOT NULL, -- Display name
  description TEXT,

  -- Pricing
  fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Duration
  duration_minutes INTEGER DEFAULT 30,

  -- Availability
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(doctor_id, type)
);

CREATE INDEX IF NOT EXISTS idx_consultation_types_doctor ON consultation_types(doctor_id);

-- RLS for consultation_types
ALTER TABLE consultation_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read consultation types"
ON consultation_types FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Doctors manage own consultation types"
ON consultation_types FOR ALL
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

-- ============================================================================
-- 5. DOCTOR SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Follow-up
  followup_window_days INTEGER DEFAULT 7,
  followup_fee DECIMAL(10,2) DEFAULT 0,

  -- Payment
  payment_provider VARCHAR(50) DEFAULT 'razorpay',
  payment_account_id VARCHAR(255),

  -- Refund policy
  cancellation_hours INTEGER DEFAULT 24,
  refund_percentage INTEGER DEFAULT 100,

  -- Timezone
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',

  -- Additional settings
  settings JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS for doctor_settings
ALTER TABLE doctor_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own settings"
ON doctor_settings FOR ALL
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

-- ============================================================================
-- 6. SLOT LOCKS TABLE (prevent double booking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS slot_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,

  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,

  locked_by_session VARCHAR(255) NOT NULL,
  locked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  UNIQUE(doctor_id, start_at)
);

CREATE INDEX IF NOT EXISTS idx_slot_locks_doctor ON slot_locks(doctor_id);
CREATE INDEX IF NOT EXISTS idx_slot_locks_expires ON slot_locks(expires_at);

-- Function to cleanup expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_slot_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM slot_locks WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. BLACKOUT DATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_blackout_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,

  date DATE NOT NULL,
  reason VARCHAR(255),
  is_recurring BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(doctor_id, date)
);

CREATE INDEX IF NOT EXISTS idx_blackout_doctor_date ON doctor_blackout_dates(doctor_id, date);

-- RLS
ALTER TABLE doctor_blackout_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own blackout dates"
ON doctor_blackout_dates FOR ALL
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

-- ============================================================================
-- 8. PAYMENTS TABLE (enhanced)
-- ============================================================================

-- Check if payments table exists, if not create it
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,

  -- Provider details
  provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  provider_order_id VARCHAR(255),
  provider_payment_id VARCHAR(255),

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP,

  -- Raw data
  provider_response JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns if table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='provider_response') THEN
    ALTER TABLE payments ADD COLUMN provider_response JSONB;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_appointment ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own payments"
ON payments FOR SELECT
TO authenticated
USING (
  appointment_id IN (
    SELECT id FROM appointments WHERE patient_id IN (
      SELECT id FROM patients WHERE auth.uid() = id
    )
  )
);

CREATE POLICY "Doctors see own payments"
ON payments FOR SELECT
TO authenticated
USING (
  appointment_id IN (
    SELECT id FROM appointments WHERE doctor_id IN (
      SELECT id FROM doctors WHERE auth.uid() = user_id
    )
  )
);

-- ============================================================================
-- 9. ADD IDEMPOTENCY KEY TO APPOINTMENTS
-- ============================================================================

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
SELECT 'Tables created successfully' AS status;

SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'doctors',
  'patients',
  'appointments',
  'consultation_types',
  'doctor_settings',
  'slot_locks',
  'doctor_blackout_dates',
  'payments'
)
ORDER BY tablename;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('doctors', 'patients', 'appointments')
ORDER BY tablename;

COMMIT;
