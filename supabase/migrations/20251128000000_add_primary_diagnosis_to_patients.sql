-- Add primary_diagnosis column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS primary_diagnosis TEXT;

-- Add comment for documentation
COMMENT ON COLUMN patients.primary_diagnosis IS 'Primary diagnosis for the patient';
