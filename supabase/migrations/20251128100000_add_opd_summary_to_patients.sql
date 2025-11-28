-- Add OPD Summary columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS opd_summary TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS opd_summary_published_at TIMESTAMPTZ;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS opd_summary_published_by TEXT;

-- Add comments for documentation
COMMENT ON COLUMN patients.opd_summary IS 'AI-generated OPD summary in markdown format';
COMMENT ON COLUMN patients.opd_summary_published_at IS 'Timestamp when the OPD summary was published';
COMMENT ON COLUMN patients.opd_summary_published_by IS 'Name of the doctor who published the summary';
