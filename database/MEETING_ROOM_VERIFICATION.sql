-- ============================================================================
-- Meeting Room Configuration Verification Script
-- ============================================================================
-- Purpose: Verify doctor meeting room settings are properly configured
-- Run this after executing CORRECT_05_add_doctor_meeting_settings.sql
-- ============================================================================

\echo '============================================'
\echo 'MEETING ROOM CONFIGURATION VERIFICATION'
\echo '============================================'
\echo ''

-- ============================================================================
-- 1. CHECK SCHEMA - Verify columns exist
-- ============================================================================

\echo '1. Schema Verification - Checking if meeting columns exist...'
\echo ''

SELECT
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'doctors'
  AND column_name IN (
    'meeting_platform',
    'meeting_link',
    'meeting_password',
    'meeting_id',
    'meeting_instructions'
  )
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- 2. CHECK INDEXES - Verify performance indexes exist
-- ============================================================================

\echo '2. Index Verification - Checking meeting-related indexes...'
\echo ''

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'doctors'
  AND indexname LIKE '%meeting%';

\echo ''

-- ============================================================================
-- 3. DOCTOR MEETING CONFIGURATION STATUS
-- ============================================================================

\echo '3. Doctor Meeting Configuration Status'
\echo ''

SELECT
    full_name AS "Doctor Name",
    specialties[1] AS "Primary Specialty",
    meeting_platform AS "Platform",
    CASE
        WHEN meeting_link IS NOT NULL THEN '✓ Configured'
        ELSE '✗ Not Set'
    END AS "Meeting Link Status",
    CASE
        WHEN meeting_password IS NOT NULL THEN '✓ Password Set'
        ELSE '○ No Password'
    END AS "Security",
    CASE
        WHEN meeting_id IS NOT NULL THEN '✓ Has ID'
        ELSE '○ No ID'
    END AS "Meeting ID",
    LEFT(meeting_instructions, 40) || '...' AS "Instructions Preview"
FROM public.doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY full_name;

\echo ''

-- ============================================================================
-- 4. PLATFORM DISTRIBUTION
-- ============================================================================

\echo '4. Platform Usage Distribution'
\echo ''

SELECT
    COALESCE(meeting_platform, 'Not Configured') AS "Platform",
    COUNT(*) AS "Number of Doctors",
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.doctors), 1) AS "Percentage %"
FROM public.doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
GROUP BY meeting_platform
ORDER BY COUNT(*) DESC;

\echo ''

-- ============================================================================
-- 5. DETAILED MEETING INFORMATION
-- ============================================================================

\echo '5. Detailed Meeting Room Information'
\echo ''

SELECT
    full_name AS "Doctor",
    meeting_platform AS "Platform",
    meeting_link AS "Meeting Link",
    meeting_password AS "Password",
    meeting_id AS "Meeting ID",
    meeting_instructions AS "Patient Instructions"
FROM public.doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND meeting_link IS NOT NULL
ORDER BY meeting_platform, full_name;

\echo ''

-- ============================================================================
-- 6. SECURITY AUDIT - Doctors with public links (no password)
-- ============================================================================

\echo '6. Security Audit - Public Meeting Rooms (No Password)'
\echo ''

SELECT
    full_name AS "Doctor",
    meeting_platform AS "Platform",
    meeting_link AS "Public Link",
    '⚠ Consider adding password for sensitive consultations' AS "Recommendation"
FROM public.doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND meeting_link IS NOT NULL
  AND meeting_password IS NULL
ORDER BY full_name;

\echo ''

-- ============================================================================
-- 7. INCOMPLETE CONFIGURATIONS
-- ============================================================================

\echo '7. Incomplete Configurations - Action Required'
\echo ''

SELECT
    full_name AS "Doctor",
    email AS "Email",
    CASE
        WHEN meeting_link IS NULL THEN '✗ Missing meeting link'
        ELSE '✓ Link configured'
    END AS "Link Status",
    CASE
        WHEN meeting_instructions = 'Please join 5 minutes before your appointment time.'
        THEN '⚠ Using default instructions'
        ELSE '✓ Custom instructions'
    END AS "Instructions Status"
FROM public.doctors
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND (meeting_link IS NULL
       OR meeting_instructions = 'Please join 5 minutes before your appointment time.')
ORDER BY full_name;

\echo ''

-- ============================================================================
-- 8. ONLINE APPOINTMENTS REQUIRING MEETING LINKS
-- ============================================================================

\echo '8. Upcoming Online Appointments - Meeting Link Check'
\echo ''

SELECT
    a.appointment_date AS "Date",
    TO_CHAR(a.start_at, 'HH24:MI') AS "Time",
    p.name AS "Patient",
    d.full_name AS "Doctor",
    a.mode AS "Mode",
    CASE
        WHEN d.meeting_link IS NOT NULL THEN '✓ Ready'
        ELSE '✗ NO LINK!'
    END AS "Meeting Link",
    d.meeting_platform AS "Platform"
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN public.doctors d ON a.doctor_id = d.id
WHERE a.tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND a.mode IN ('video', 'online')
  AND a.appointment_date >= CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date, a.start_at;

\echo ''

-- ============================================================================
-- 9. SAMPLE MEETING INVITE FORMAT
-- ============================================================================

\echo '9. Sample Meeting Invite for Patients'
\echo ''

SELECT
    '------------------------' AS "Separator",
    'APPOINTMENT CONFIRMATION' AS "Header",
    '------------------------' AS "Separator2",
    '' AS "Blank1",
    'Dr. ' || d.full_name AS "Doctor",
    d.specialties[1] AS "Specialty",
    '' AS "Blank2",
    'Meeting Platform: ' || UPPER(d.meeting_platform) AS "Platform",
    'Join Link: ' || d.meeting_link AS "Link",
    CASE WHEN d.meeting_password IS NOT NULL
         THEN 'Password: ' || d.meeting_password
         ELSE ''
    END AS "Password",
    CASE WHEN d.meeting_id IS NOT NULL
         THEN 'Meeting ID: ' || d.meeting_id
         ELSE ''
    END AS "MeetingID",
    '' AS "Blank3",
    'Instructions:' AS "InstructionsHeader",
    d.meeting_instructions AS "Instructions",
    '' AS "Blank4",
    '------------------------' AS "Footer"
FROM public.doctors d
WHERE d.tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND d.meeting_link IS NOT NULL
LIMIT 1;

\echo ''

-- ============================================================================
-- 10. SUMMARY STATISTICS
-- ============================================================================

\echo '10. Summary Statistics'
\echo ''

WITH stats AS (
    SELECT
        COUNT(*) AS total_doctors,
        COUNT(meeting_link) AS configured_doctors,
        COUNT(meeting_password) AS password_protected,
        COUNT(CASE WHEN meeting_platform = 'zoom' THEN 1 END) AS zoom_users,
        COUNT(CASE WHEN meeting_platform = 'google_meet' THEN 1 END) AS gmeet_users,
        COUNT(CASE WHEN meeting_platform = 'microsoft_teams' THEN 1 END) AS teams_users,
        COUNT(CASE WHEN meeting_platform = 'webex' THEN 1 END) AS webex_users,
        COUNT(CASE WHEN meeting_platform = 'other' THEN 1 END) AS other_users
    FROM public.doctors
    WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
)
SELECT
    total_doctors AS "Total Doctors",
    configured_doctors AS "Configured Meeting Links",
    ROUND(configured_doctors::NUMERIC / total_doctors * 100, 1) AS "Configuration %",
    password_protected AS "Password Protected",
    zoom_users AS "Zoom",
    gmeet_users AS "Google Meet",
    teams_users AS "Teams",
    webex_users AS "Webex",
    other_users AS "Other Platforms"
FROM stats;

\echo ''
\echo '============================================'
\echo 'VERIFICATION COMPLETE'
\echo '============================================'
\echo ''
\echo 'Next Steps:'
\echo '1. Review incomplete configurations above'
\echo '2. Update doctors without meeting links'
\echo '3. Test meeting links before appointments'
\echo '4. Consider adding passwords for sensitive consultations'
\echo ''
\echo 'Documentation: See MEETING_PLATFORMS_SUPPORTED.md'
\echo '============================================'

-- ============================================================================
-- QUICK UPDATE TEMPLATE
-- ============================================================================

\echo ''
\echo 'Quick Update Template:'
\echo ''
\echo 'UPDATE doctors SET'
\echo '  meeting_platform = ''zoom'','
\echo '  meeting_link = ''https://zoom.us/j/YOUR_MEETING_ID'','
\echo '  meeting_password = ''YOUR_PASSWORD'','
\echo '  meeting_id = ''YOUR_MEETING_ID'','
\echo '  meeting_instructions = ''Join 5 minutes early. Camera on preferred.'''
\echo 'WHERE email = ''doctor@example.com'';'
\echo ''
