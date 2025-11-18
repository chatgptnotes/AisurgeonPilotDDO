-- ============================================================================
-- DDO Phase 3: AI Features Setup
-- ============================================================================
-- Purpose: Set up tables for AI transcription and SOAP notes
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CONSULTATION TRANSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS consultation_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,

  -- Audio file
  audio_file_url TEXT NOT NULL,
  duration_seconds INTEGER,

  -- Transcription
  transcription_text TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'en',

  -- Metadata (segments, words, timestamps)
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcriptions_appointment ON consultation_transcriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_doctor ON consultation_transcriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_patient ON consultation_transcriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created ON consultation_transcriptions(created_at);

COMMENT ON TABLE consultation_transcriptions IS 'AI-generated transcriptions from consultation audio recordings';

-- RLS for consultation_transcriptions
ALTER TABLE consultation_transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own transcriptions"
ON consultation_transcriptions FOR SELECT
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

CREATE POLICY "Patients view own transcriptions"
ON consultation_transcriptions FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM patients WHERE auth.uid() = id
  )
);

CREATE POLICY "Doctors create transcriptions"
ON consultation_transcriptions FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

CREATE POLICY "Doctors update own transcriptions"
ON consultation_transcriptions FOR UPDATE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

CREATE POLICY "Doctors delete own transcriptions"
ON consultation_transcriptions FOR DELETE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

-- ============================================================================
-- 2. SOAP NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS soap_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,

  -- SOAP structure stored as JSONB
  soap_notes JSONB NOT NULL DEFAULT '{
    "subjective": "",
    "objective": "",
    "assessment": "",
    "plan": "",
    "chief_complaint": "",
    "vital_signs": {},
    "diagnoses": [],
    "medications": [],
    "procedures": [],
    "follow_up": ""
  }'::jsonb,

  -- AI-generated flag
  ai_generated BOOLEAN DEFAULT true,
  reviewed_by_doctor BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_soap_notes_appointment ON soap_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_doctor ON soap_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_patient ON soap_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_created ON soap_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_soap_notes_reviewed ON soap_notes(reviewed_by_doctor, reviewed_at);

COMMENT ON TABLE soap_notes IS 'AI-generated SOAP notes for consultations';

-- RLS for soap_notes
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own soap notes"
ON soap_notes FOR SELECT
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

CREATE POLICY "Patients view own soap notes"
ON soap_notes FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM patients WHERE auth.uid() = id
  )
);

CREATE POLICY "Doctors create soap notes"
ON soap_notes FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

CREATE POLICY "Doctors update own soap notes"
ON soap_notes FOR UPDATE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE auth.uid() = user_id
  )
);

-- ============================================================================
-- 3. CREATE STORAGE BUCKET FOR AUDIO RECORDINGS
-- ============================================================================

-- Create storage bucket for consultation recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultation-recordings', 'consultation-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage bucket
-- Drop existing policies first
DROP POLICY IF EXISTS "Doctors upload recordings" ON storage.objects;
DROP POLICY IF EXISTS "Doctors view own recordings" ON storage.objects;
DROP POLICY IF EXISTS "Doctors delete own recordings" ON storage.objects;

CREATE POLICY "Doctors upload recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'consultation-recordings'
  AND auth.uid() IN (SELECT user_id FROM doctors WHERE is_active = true)
);

CREATE POLICY "Doctors view own recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'consultation-recordings'
  AND auth.uid() IN (SELECT user_id FROM doctors WHERE is_active = true)
);

CREATE POLICY "Doctors delete own recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'consultation-recordings'
  AND auth.uid() IN (SELECT user_id FROM doctors WHERE is_active = true)
);

-- ============================================================================
-- 4. UPDATE TRIGGER FOR TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_transcription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transcription_update_timestamp
BEFORE UPDATE ON consultation_transcriptions
FOR EACH ROW
EXECUTE FUNCTION update_transcription_timestamp();

CREATE TRIGGER soap_notes_update_timestamp
BEFORE UPDATE ON soap_notes
FOR EACH ROW
EXECUTE FUNCTION update_transcription_timestamp();

-- ============================================================================
-- 5. VERIFY SCHEMA
-- ============================================================================

SELECT 'AI features tables created successfully' AS status;

SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('consultation_transcriptions', 'soap_notes')
ORDER BY tablename;

COMMIT;
