-- ============================================================================
-- FIX CONSOLE ERRORS - Add Missing Columns and Tables
-- ============================================================================
-- Purpose: Fix 400 errors in console related to missing hospital_name column
-- Impact: Resolves DoctorSidebar and DoctorDashboard hospital stats errors
-- Safety: Idempotent - safe to run multiple times
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD HOSPITAL_NAME COLUMN TO PATIENTS TABLE
-- ============================================================================

-- Add hospital_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'hospital_name'
    ) THEN
        ALTER TABLE patients ADD COLUMN hospital_name VARCHAR(100);
        RAISE NOTICE '✅ Added hospital_name column to patients table';
    ELSE
        RAISE NOTICE 'ℹ️  hospital_name column already exists';
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_patients_hospital_name ON patients(hospital_name);

-- ============================================================================
-- 2. SET DEFAULT VALUES FOR EXISTING PATIENTS
-- ============================================================================

-- Set hospital_name based on corporate field (if available)
UPDATE patients
SET hospital_name = CASE
    WHEN corporate = 'esic' THEN 'esic'
    WHEN corporate = 'cghs' THEN 'cghs'
    WHEN corporate LIKE '%ayushman%' THEN 'ayushman'
    WHEN corporate LIKE '%hope%' THEN 'hope'
    ELSE 'hope'  -- default to hope
END
WHERE hospital_name IS NULL;

-- ============================================================================
-- 3. VERIFY THE CHANGES
-- ============================================================================

-- Show updated schema
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name = 'hospital_name';

-- Show distribution of patients by hospital
SELECT
    hospital_name,
    COUNT(*) as patient_count
FROM patients
GROUP BY hospital_name
ORDER BY patient_count DESC;

COMMIT;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

-- After running this script:
-- 1. patients table will have hospital_name column
-- 2. All existing patients will have hospital_name set
-- 3. DoctorSidebar will show correct patient counts
-- 4. DoctorDashboard will display hospital stats
-- 5. Console 400 errors will disappear

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if column exists
-- SELECT EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_name = 'patients' AND column_name = 'hospital_name'
-- );

-- Check patient distribution
-- SELECT hospital_name, COUNT(*) FROM patients GROUP BY hospital_name;
