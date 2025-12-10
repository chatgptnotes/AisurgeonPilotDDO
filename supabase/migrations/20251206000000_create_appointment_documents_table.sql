-- Create appointment_documents table for patient document uploads
CREATE TABLE IF NOT EXISTS appointment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,

  -- File information
  file_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  file_url TEXT,

  -- Metadata
  uploaded_by TEXT DEFAULT 'patient', -- 'patient' or 'doctor'
  remarks TEXT,
  is_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_appointment_documents_appointment_id ON appointment_documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_documents_patient_id ON appointment_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_documents_doctor_id ON appointment_documents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_documents_document_type ON appointment_documents(document_type);

-- Enable Row Level Security
ALTER TABLE appointment_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to view documents (for now)
CREATE POLICY "Allow authenticated users to view appointment documents"
  ON appointment_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow all authenticated users to insert documents
CREATE POLICY "Allow authenticated users to insert appointment documents"
  ON appointment_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow all authenticated users to update documents
CREATE POLICY "Allow authenticated users to update appointment documents"
  ON appointment_documents
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Allow all authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete appointment documents"
  ON appointment_documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_appointment_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointment_documents_updated_at
  BEFORE UPDATE ON appointment_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_documents_updated_at();

-- Add comment
COMMENT ON TABLE appointment_documents IS 'Stores documents uploaded by patients for their appointments, accessible by their doctor';
