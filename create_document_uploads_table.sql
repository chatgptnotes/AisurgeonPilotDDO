-- Create table for storing uploaded medical documents
CREATE TABLE IF NOT EXISTS document_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id TEXT NOT NULL,
    patient_id UUID,
    hospital_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('blood', 'radiology', 'previous')),
    storage_path TEXT NOT NULL,
    extracted_text TEXT,
    parsed_data JSONB,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_document_uploads_visit FOREIGN KEY (visit_id)
        REFERENCES visits(visit_id) ON DELETE CASCADE,
    CONSTRAINT fk_document_uploads_patient FOREIGN KEY (patient_id)
        REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_uploads_user FOREIGN KEY (uploaded_by)
        REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_uploads_visit_id ON document_uploads(visit_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_patient_id ON document_uploads(patient_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_hospital_id ON document_uploads(hospital_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_category ON document_uploads(category);
CREATE INDEX IF NOT EXISTS idx_document_uploads_created_at ON document_uploads(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hospital data isolation
CREATE POLICY "Users can only access documents from their hospital" ON document_uploads
    FOR ALL USING (
        hospital_id = (
            SELECT hospital_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Create policy for inserting documents
CREATE POLICY "Users can insert documents for their hospital" ON document_uploads
    FOR INSERT WITH CHECK (
        hospital_id = (
            SELECT hospital_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_document_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_uploads_updated_at
    BEFORE UPDATE ON document_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_document_uploads_updated_at();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON document_uploads TO authenticated;

-- Add comment to table
COMMENT ON TABLE document_uploads IS 'Stores uploaded medical documents with AI text extraction results';
COMMENT ON COLUMN document_uploads.category IS 'Type of medical document: blood, radiology, or previous consultation';
COMMENT ON COLUMN document_uploads.extracted_text IS 'Raw text extracted from the document using OCR/PDF parsing';
COMMENT ON COLUMN document_uploads.parsed_data IS 'Structured medical data extracted from the text using AI parsing';
COMMENT ON COLUMN document_uploads.processing_status IS 'Status of document processing: pending, processing, completed, or failed';