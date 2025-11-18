-- ============================================
-- BOOKING SYSTEM DATABASE SCHEMA
-- Phase 2: Doctor Profiles, Availability, Appointments
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  specialties TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  bio TEXT,
  qualifications JSONB DEFAULT '[]',
  experience_years INTEGER,

  -- Consultation fees
  consultation_fee_standard DECIMAL(10,2) NOT NULL,
  consultation_fee_followup DECIMAL(10,2),
  followup_window_days INTEGER DEFAULT 7,
  currency VARCHAR(3) DEFAULT 'AED',

  -- Media
  profile_photo_url TEXT,
  letterhead_url TEXT,

  -- Ratings
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- Status
  is_accepting_patients BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents JSONB DEFAULT '[]',

  -- Settings
  timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
  cancellation_policy TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- Indexes for doctors
CREATE INDEX idx_doctors_email ON doctors(email);
CREATE INDEX idx_doctors_specialties ON doctors USING GIN(specialties);
CREATE INDEX idx_doctors_is_accepting ON doctors(is_accepting_patients) WHERE is_accepting_patients = true;
CREATE INDEX idx_doctors_rating ON doctors(rating_avg DESC);

-- ============================================
-- 2. DOCTOR AVAILABILITY SCHEDULE
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,

  -- Schedule
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Slot configuration
  slot_duration_minutes INTEGER DEFAULT 30 CHECK (slot_duration_minutes > 0),
  buffer_minutes INTEGER DEFAULT 10 CHECK (buffer_minutes >= 0),
  max_patients_per_day INTEGER DEFAULT 20 CHECK (max_patients_per_day > 0),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes for availability
CREATE INDEX idx_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX idx_availability_day ON doctor_availability(day_of_week);
CREATE INDEX idx_availability_active ON doctor_availability(is_active) WHERE is_active = true;

-- ============================================
-- 3. AVAILABILITY EXCEPTIONS (Holidays, Special Hours)
-- ============================================
CREATE TABLE IF NOT EXISTS availability_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,

  -- Exception details
  exception_date DATE NOT NULL,
  exception_type VARCHAR(20) NOT NULL CHECK (exception_type IN ('blocked', 'custom_hours')),

  -- Custom hours (only if type = 'custom_hours')
  custom_start TIME,
  custom_end TIME,

  -- Reason
  reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_custom_hours CHECK (
    (exception_type = 'blocked') OR
    (exception_type = 'custom_hours' AND custom_start IS NOT NULL AND custom_end IS NOT NULL AND custom_end > custom_start)
  )
);

-- Indexes for exceptions
CREATE INDEX idx_exceptions_doctor ON availability_exceptions(doctor_id);
CREATE INDEX idx_exceptions_date ON availability_exceptions(exception_date);

-- ============================================
-- 4. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Participants
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,

  -- Timing
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,

  -- Type and Status
  appointment_type VARCHAR(20) DEFAULT 'standard' CHECK (appointment_type IN ('standard', 'followup')),
  status VARCHAR(20) DEFAULT 'pending_payment' CHECK (status IN
    ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show', 'refunded')
  ),

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AED',
  coupon_id UUID REFERENCES coupons(id),
  discount_amount DECIMAL(10,2) DEFAULT 0,

  -- Payment reference
  payment_id UUID REFERENCES payments(id),

  -- Meeting
  meet_link TEXT,

  -- Intake
  intake_completed BOOLEAN DEFAULT FALSE,
  intake_completed_at TIMESTAMPTZ,

  -- Cancellation
  cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('patient', 'doctor', 'system', NULL)),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_time_range CHECK (end_at > start_at),
  CONSTRAINT valid_cancellation CHECK (
    (status != 'cancelled') OR (cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL)
  )
);

-- Indexes for appointments
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_start ON appointments(start_at);
CREATE INDEX idx_appointments_doctor_time ON appointments(doctor_id, start_at);
CREATE INDEX idx_appointments_upcoming ON appointments(start_at) WHERE status IN ('confirmed', 'pending_payment');

-- ============================================
-- 5. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Appointment reference
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

  -- Provider details
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'paytabs', 'manual')),
  provider_payment_id TEXT UNIQUE,
  provider_customer_id TEXT,

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AED',

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN
    ('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded')
  ),

  -- Refund
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- Metadata
  raw_payload JSONB,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

-- Indexes for payments
CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_provider_id ON payments(provider_payment_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- 6. COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,

  -- Coupon details
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Discount
  discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),

  -- Usage limits
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,

  -- Validity
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_validity_period CHECK (valid_to > valid_from),
  CONSTRAINT valid_usage CHECK (current_uses <= max_uses OR max_uses IS NULL)
);

-- Indexes for coupons
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_doctor ON coupons(doctor_id);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX idx_coupons_validity ON coupons(valid_from, valid_to);

-- ============================================
-- 7. COUPON USAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,

  -- Discount applied
  discount_applied DECIMAL(10,2) NOT NULL,

  -- Timestamp
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for coupon usages
CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_patient ON coupon_usages(patient_id);
CREATE INDEX idx_coupon_usages_appointment ON coupon_usages(appointment_id);

-- ============================================
-- 8. SLOT LOCKS (Race Condition Prevention)
-- ============================================
CREATE TABLE IF NOT EXISTS slot_locks (
  slot_key VARCHAR(255) PRIMARY KEY, -- Format: 'doctor_id:start_time'
  locked_by UUID NOT NULL, -- session_id or user_id
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup
CREATE INDEX idx_slot_locks_expires ON slot_locks(expires_at);

-- ============================================
-- 9. PAYMENT CONFIGURATIONS (Per Doctor)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,

  -- Provider
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'paytabs')),

  -- Credentials (encrypted at app level)
  publishable_key TEXT,
  secret_key_encrypted TEXT NOT NULL,
  webhook_secret TEXT,

  -- Settings
  currency VARCHAR(3) DEFAULT 'AED',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(doctor_id, provider)
);

-- Indexes
CREATE INDEX idx_payment_configs_doctor ON payment_configs(doctor_id);
CREATE INDEX idx_payment_configs_active ON payment_configs(is_active) WHERE is_active = true;

-- ============================================
-- 10. VIDEO CONSULTATION CONFIGS
-- ============================================
CREATE TABLE IF NOT EXISTS video_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Provider
  provider VARCHAR(50) DEFAULT 'zoom' CHECK (provider IN ('zoom', 'teams', 'meet', 'custom')),

  -- Static link (for simple setup)
  static_link TEXT,

  -- OAuth (for scheduled meetings)
  oauth_token_encrypted TEXT,
  oauth_refresh_token_encrypted TEXT,
  oauth_expires_at TIMESTAMPTZ,

  -- Settings
  auto_record BOOLEAN DEFAULT FALSE,
  waiting_room BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON doctor_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_configs_updated_at BEFORE UPDATE ON payment_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_configs_updated_at BEFORE UPDATE ON video_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_configs ENABLE ROW LEVEL SECURITY;

-- Public read access to doctor profiles (for discovery)
CREATE POLICY "Public can view active doctors"
  ON doctors FOR SELECT
  USING (is_verified = true AND is_accepting_patients = true);

-- Doctors can manage their own profile
CREATE POLICY "Doctors can update own profile"
  ON doctors FOR UPDATE
  USING (auth.uid() = user_id);

-- Public can view availability
CREATE POLICY "Public can view availability"
  ON doctor_availability FOR SELECT
  USING (is_active = true);

-- Doctors can manage their availability
CREATE POLICY "Doctors can manage own availability"
  ON doctor_availability FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE email = auth.email()));

-- Doctors can view their appointments
CREATE POLICY "Doctors can view own appointments"
  ON appointments FOR SELECT
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Authenticated users can create appointments (handled by app logic)
CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Patients can view their payments
CREATE POLICY "Patients can view own payments"
  ON payments FOR SELECT
  USING (appointment_id IN (
    SELECT id FROM appointments WHERE patient_id IN (
      SELECT id FROM patients WHERE email = auth.email()
    )
  ));

-- Public can view active coupons (for validation)
CREATE POLICY "Public can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true AND valid_from <= NOW() AND valid_to >= NOW());

-- ============================================
-- SAMPLE DATA (For Testing)
-- ============================================

-- Insert a sample doctor
INSERT INTO doctors (
  full_name, email, phone, specialties, languages, bio,
  consultation_fee_standard, consultation_fee_followup,
  profile_photo_url, is_verified, is_accepting_patients
) VALUES (
  'Dr. Sarah Ahmed',
  'dr.sarah@aisurgeonpilot.com',
  '+971501234567',
  ARRAY['Cardiology', 'Internal Medicine'],
  ARRAY['English', 'Arabic', 'Urdu'],
  'Board-certified cardiologist with 15 years of experience in treating cardiovascular diseases. Specialized in preventive cardiology and heart failure management.',
  200.00,
  150.00,
  'https://randomuser.me/api/portraits/women/44.jpg',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Get doctor ID for availability setup
DO $$
DECLARE
  doc_id UUID;
BEGIN
  SELECT id INTO doc_id FROM doctors WHERE email = 'dr.sarah@aisurgeonpilot.com';

  -- Insert availability (Monday to Friday, 9 AM - 5 PM)
  INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
  SELECT doc_id, day, '09:00'::TIME, '17:00'::TIME, 30
  FROM generate_series(1, 5) AS day
  ON CONFLICT DO NOTHING;

  -- Insert video config
  INSERT INTO video_configs (doctor_id, provider, static_link)
  VALUES (doc_id, 'zoom', 'https://zoom.us/j/1234567890')
  ON CONFLICT (doctor_id) DO NOTHING;
END $$;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE doctors IS 'Doctor profiles and credentials';
COMMENT ON TABLE doctor_availability IS 'Regular weekly availability schedule';
COMMENT ON TABLE availability_exceptions IS 'Holidays and special hours overrides';
COMMENT ON TABLE appointments IS 'All appointments (past, present, future)';
COMMENT ON TABLE payments IS 'Payment transactions and refunds';
COMMENT ON TABLE coupons IS 'Discount coupons created by doctors';
COMMENT ON TABLE slot_locks IS 'Temporary locks to prevent double-booking';
COMMENT ON TABLE payment_configs IS 'Payment gateway credentials per doctor';
COMMENT ON TABLE video_configs IS 'Video consultation settings per doctor';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'Booking system schema created successfully! ✅' AS status;
