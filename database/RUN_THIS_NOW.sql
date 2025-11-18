-- ============================================================================
-- COPY AND PASTE THIS ENTIRE SCRIPT INTO YOUR SUPABASE SQL EDITOR
-- ============================================================================
-- This script will:
-- 1. Add meeting room columns to doctors table
-- 2. Create necessary indexes
-- 3. Verify the installation
-- ============================================================================

\echo '============================================'
\echo 'DOCTOR MEETING ROOM SETUP'
\echo 'Starting installation...'
\echo '============================================'
\echo ''

-- ============================================================================
-- STEP 1: ADD COLUMNS
-- ============================================================================

\echo 'Step 1: Adding meeting room columns to doctors table...'

BEGIN;

ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS meeting_platform VARCHAR(50) DEFAULT 'zoom',
  ADD COLUMN IF NOT EXISTS meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS meeting_password VARCHAR(100),
  ADD COLUMN IF NOT EXISTS meeting_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS meeting_instructions TEXT DEFAULT 'Please join 5 minutes before your appointment time.';

COMMENT ON COLUMN public.doctors.meeting_platform IS 'Video platform: zoom, google_meet, microsoft_teams, skype, webex, other';
COMMENT ON COLUMN public.doctors.meeting_link IS 'Doctor''s permanent meeting room URL';
COMMENT ON COLUMN public.doctors.meeting_password IS 'Meeting password/passcode if required';
COMMENT ON COLUMN public.doctors.meeting_id IS 'Meeting ID (for platforms that use numeric IDs)';
COMMENT ON COLUMN public.doctors.meeting_instructions IS 'Custom instructions for patients joining the meeting';

COMMIT;

\echo '✅ Columns added successfully!'
\echo ''

-- ============================================================================
-- STEP 2: CREATE INDEXES
-- ============================================================================

\echo 'Step 2: Creating performance indexes...'

CREATE INDEX IF NOT EXISTS idx_doctors_meeting_link
  ON public.doctors(meeting_link)
  WHERE meeting_link IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_doctors_meeting_platform
  ON public.doctors(meeting_platform);

\echo '✅ Indexes created successfully!'
\echo ''

-- ============================================================================
-- STEP 3: VERIFY INSTALLATION
-- ============================================================================

\echo 'Step 3: Verifying installation...'
\echo ''

-- Check columns
\echo '📊 Columns Created:'
SELECT
    column_name,
    data_type,
    COALESCE(column_default, 'NULL') AS default_value
FROM information_schema.columns
WHERE table_name = 'doctors'
  AND column_name IN ('meeting_platform', 'meeting_link', 'meeting_password', 'meeting_id', 'meeting_instructions')
ORDER BY ordinal_position;

\echo ''

-- Check indexes
\echo '📊 Indexes Created:'
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'doctors'
  AND indexname LIKE '%meeting%';

\echo ''

-- ============================================================================
-- STEP 4: ADD SAMPLE DATA (OPTIONAL)
-- ============================================================================

\echo 'Step 4: Adding sample meeting links to existing doctors...'
\echo '(Only updates doctors that don''t have meeting links)'
\echo ''

-- Update sample doctors with meeting links
UPDATE public.doctors SET
  meeting_platform = 'zoom',
  meeting_link = 'https://zoom.us/j/' || LPAD((random() * 9999999999)::bigint::text, 10, '0'),
  meeting_password = 'Demo' || (random() * 999)::int,
  meeting_id = LPAD((random() * 9999999999)::bigint::text, 10, '0'),
  meeting_instructions = 'Please join 5 minutes before your appointment. Camera on preferred for better consultation.'
WHERE meeting_link IS NULL
  AND email LIKE '%@aisurgeonpilot.com'
  RETURNING full_name, meeting_platform, meeting_link;

\echo ''

-- ============================================================================
-- STEP 5: FINAL VERIFICATION
-- ============================================================================

\echo 'Step 5: Final verification and summary...'
\echo ''

WITH stats AS (
    SELECT
        COUNT(*) AS total_doctors,
        COUNT(meeting_link) AS configured_doctors,
        COUNT(meeting_password) AS password_protected,
        COUNT(CASE WHEN meeting_platform = 'zoom' THEN 1 END) AS zoom_count
    FROM public.doctors
)
SELECT
    '✅ INSTALLATION COMPLETE!' AS status,
    total_doctors AS "Total Doctors in System",
    configured_doctors AS "Doctors with Meeting Links",
    ROUND(configured_doctors::NUMERIC / NULLIF(total_doctors, 0) * 100, 1) AS "Setup Percentage"
FROM stats;

\echo ''
\echo '============================================'
\echo 'SETUP COMPLETE!'
\echo '============================================'
\echo ''
\echo 'What you can do now:'
\echo ''
\echo '1. Update a doctor''s meeting link:'
\echo '   UPDATE doctors SET'
\echo '     meeting_platform = ''zoom'','
\echo '     meeting_link = ''https://zoom.us/j/YOUR_MEETING_ID'','
\echo '     meeting_password = ''YOUR_PASSWORD'','
\echo '     meeting_id = ''YOUR_MEETING_ID'''
\echo '   WHERE email = ''doctor@example.com'';'
\echo ''
\echo '2. View all meeting configurations:'
\echo '   SELECT full_name, meeting_platform, meeting_link'
\echo '   FROM doctors WHERE meeting_link IS NOT NULL;'
\echo ''
\echo '3. Get meeting info for an appointment:'
\echo '   SELECT d.meeting_link, d.meeting_password, d.meeting_instructions'
\echo '   FROM appointments a'
\echo '   JOIN doctors d ON a.doctor_id = d.id'
\echo '   WHERE a.id = ''your-appointment-id'';'
\echo ''
\echo 'Documentation: See MEETING_PLATFORMS_SUPPORTED.md'
\echo '============================================'
