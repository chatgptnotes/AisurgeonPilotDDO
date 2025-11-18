-- Multi-Consultant Visits Schema
-- This schema supports multiple consultants for a single patient visit

-- Create table for consultant visits (multiple consultants per visit)
CREATE TABLE IF NOT EXISTS consultant_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id TEXT NOT NULL,
    patient_id UUID,
    hospital_id TEXT NOT NULL,
    consultant_id TEXT NOT NULL,
    consultant_name TEXT NOT NULL,
    consultant_specialty TEXT NOT NULL,
    consultant_department TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    voice_session_id TEXT,
    notes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_consultant_visits_visit FOREIGN KEY (visit_id)
        REFERENCES visits(visit_id) ON DELETE CASCADE,
    CONSTRAINT fk_consultant_visits_patient FOREIGN KEY (patient_id)
        REFERENCES patients(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultant_visits_visit_id ON consultant_visits(visit_id);
CREATE INDEX IF NOT EXISTS idx_consultant_visits_patient_id ON consultant_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultant_visits_hospital_id ON consultant_visits(hospital_id);
CREATE INDEX IF NOT EXISTS idx_consultant_visits_consultant_id ON consultant_visits(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_visits_specialty ON consultant_visits(consultant_specialty);
CREATE INDEX IF NOT EXISTS idx_consultant_visits_status ON consultant_visits(status);
CREATE INDEX IF NOT EXISTS idx_consultant_visits_created_at ON consultant_visits(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE consultant_visits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hospital data isolation
CREATE POLICY "Users can only access consultant visits from their hospital" ON consultant_visits
    FOR ALL USING (
        hospital_id = (
            SELECT hospital_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Create policy for inserting consultant visits
CREATE POLICY "Users can insert consultant visits for their hospital" ON consultant_visits
    FOR INSERT WITH CHECK (
        hospital_id = (
            SELECT hospital_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_consultant_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consultant_visits_updated_at
    BEFORE UPDATE ON consultant_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_consultant_visits_updated_at();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON consultant_visits TO authenticated;

-- Add comments to table and columns
COMMENT ON TABLE consultant_visits IS 'Stores multiple consultant visits for a single patient visit';
COMMENT ON COLUMN consultant_visits.visit_id IS 'References the main patient visit';
COMMENT ON COLUMN consultant_visits.consultant_id IS 'Unique identifier for the consultant (can be specialty-based)';
COMMENT ON COLUMN consultant_visits.consultant_specialty IS 'Medical specialty of the consultant (cardiology, orthopedics, etc.)';
COMMENT ON COLUMN consultant_visits.status IS 'Status of the consultant visit: pending, in_progress, completed';
COMMENT ON COLUMN consultant_visits.voice_session_id IS 'ID of the voice agent session for this consultant';
COMMENT ON COLUMN consultant_visits.notes IS 'JSON object containing all consultation notes and form data';

-- Create table for consultant specialties reference
CREATE TABLE IF NOT EXISTS consultant_specialties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    description TEXT,
    icon_name TEXT,
    color_theme TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default specialties
INSERT INTO consultant_specialties (id, name, department, description, icon_name, color_theme) VALUES
('general', 'General Physician', 'General Medicine', 'Primary care and general medical conditions', 'stethoscope', 'gray'),
('cardiology', 'Cardiologist', 'Cardiology', 'Heart and cardiovascular system disorders', 'heart', 'red'),
('orthopedic', 'Orthopedic Surgeon', 'Orthopedic Surgery', 'Bone, joint, and musculoskeletal disorders', 'bone', 'blue'),
('ophthalmology', 'Ophthalmologist', 'Ophthalmology', 'Eye and vision disorders', 'eye', 'green'),
('neurology', 'Neurologist', 'Neurology', 'Brain and nervous system disorders', 'brain', 'purple'),
('dermatology', 'Dermatologist', 'Dermatology', 'Skin and hair disorders', 'user', 'orange'),
('gynecology', 'Gynecologist', 'Gynecology & Obstetrics', 'Women''s health and reproductive system', 'baby', 'pink'),
('pediatrics', 'Pediatrician', 'Pediatrics', 'Child and adolescent health', 'baby', 'yellow'),
('psychiatry', 'Psychiatrist', 'Psychiatry', 'Mental health and behavioral disorders', 'brain', 'indigo'),
('surgery', 'General Surgeon', 'General Surgery', 'Surgical procedures and operations', 'activity', 'red')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on consultant_specialties
ALTER TABLE consultant_specialties ENABLE ROW LEVEL SECURITY;

-- Create policy for consultant_specialties (read-only for all authenticated users)
CREATE POLICY "Allow read access to consultant specialties" ON consultant_specialties
    FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON consultant_specialties TO authenticated;

-- Create view for consultant visit summaries
CREATE OR REPLACE VIEW consultant_visit_summary AS
SELECT
    cv.id,
    cv.visit_id,
    cv.patient_id,
    cv.hospital_id,
    cv.consultant_id,
    cv.consultant_name,
    cv.consultant_specialty,
    cs.department,
    cs.color_theme,
    cs.icon_name,
    cv.status,
    cv.start_time,
    cv.end_time,
    cv.created_at,
    EXTRACT(EPOCH FROM (cv.end_time - cv.start_time)) / 60 AS duration_minutes,
    (cv.notes->>'diagnosis') AS diagnosis,
    (cv.notes->>'relevance_complaints') AS complaints,
    (cv.notes->>'doctor_signature') AS doctor_signature
FROM consultant_visits cv
LEFT JOIN consultant_specialties cs ON cv.consultant_specialty = cs.id
ORDER BY cv.created_at;

-- Grant access to the view
GRANT SELECT ON consultant_visit_summary TO authenticated;

-- Create function to get all consultants for a visit
CREATE OR REPLACE FUNCTION get_visit_consultants(p_visit_id TEXT)
RETURNS TABLE (
    consultant_id TEXT,
    consultant_name TEXT,
    specialty TEXT,
    department TEXT,
    status TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    notes JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cv.consultant_id,
        cv.consultant_name,
        cv.consultant_specialty,
        cs.department,
        cv.status,
        cv.start_time,
        cv.end_time,
        cv.notes
    FROM consultant_visits cv
    LEFT JOIN consultant_specialties cs ON cv.consultant_specialty = cs.id
    WHERE cv.visit_id = p_visit_id
    ORDER BY cv.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_visit_consultants(TEXT) TO authenticated;

-- Create function to save consultant notes
CREATE OR REPLACE FUNCTION save_consultant_notes(
    p_visit_id TEXT,
    p_consultant_id TEXT,
    p_notes JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE consultant_visits
    SET
        notes = p_notes,
        updated_at = NOW()
    WHERE visit_id = p_visit_id AND consultant_id = p_consultant_id;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;

    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION save_consultant_notes(TEXT, TEXT, JSONB) TO authenticated;