-- ============================================================================
-- Quick Test: Meeting Room Setup Verification
-- ============================================================================
-- Copy and paste this entire script to verify meeting room setup
-- ============================================================================

-- Test 1: Check if columns exist
\echo '=== TEST 1: Schema Check ==='
SELECT
    CASE WHEN COUNT(*) = 5 THEN '✅ PASS' ELSE '❌ FAIL' END AS result,
    COUNT(*) || ' of 5 columns found' AS details
FROM information_schema.columns
WHERE table_name = 'doctors'
  AND column_name IN ('meeting_platform', 'meeting_link', 'meeting_password', 'meeting_id', 'meeting_instructions');

-- Test 2: Check if indexes exist
\echo ''
\echo '=== TEST 2: Index Check ==='
SELECT
    CASE WHEN COUNT(*) >= 1 THEN '✅ PASS' ELSE '⚠️ WARNING' END AS result,
    COUNT(*) || ' meeting-related indexes found' AS details
FROM pg_indexes
WHERE tablename = 'doctors'
  AND indexname LIKE '%meeting%';

-- Test 3: Check if sample data has meeting links
\echo ''
\echo '=== TEST 3: Sample Data Check ==='
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '⚠️ NO DATA' END AS result,
    COUNT(*) || ' doctors with meeting links configured' AS details
FROM doctors
WHERE meeting_link IS NOT NULL;

-- Test 4: Platform variety check
\echo ''
\echo '=== TEST 4: Platform Variety ==='
SELECT
    meeting_platform,
    COUNT(*) AS doctor_count
FROM doctors
WHERE meeting_link IS NOT NULL
GROUP BY meeting_platform
ORDER BY COUNT(*) DESC;

-- Test 5: Sample meeting configuration
\echo ''
\echo '=== TEST 5: Sample Meeting Configuration ==='
SELECT
    full_name,
    meeting_platform,
    LEFT(meeting_link, 40) || '...' AS meeting_link_preview,
    CASE WHEN meeting_password IS NOT NULL THEN '✓ Has Password' ELSE '○ No Password' END AS security
FROM doctors
WHERE meeting_link IS NOT NULL
LIMIT 3;

-- Test 6: Instructions check
\echo ''
\echo '=== TEST 6: Meeting Instructions ==='
SELECT
    COUNT(*) AS total_doctors,
    COUNT(CASE WHEN meeting_instructions = 'Please join 5 minutes before your appointment time.' THEN 1 END) AS using_default,
    COUNT(CASE WHEN meeting_instructions != 'Please join 5 minutes before your appointment time.' AND meeting_link IS NOT NULL THEN 1 END) AS custom_instructions
FROM doctors;

-- Final Summary
\echo ''
\echo '=== FINAL SUMMARY ==='
WITH summary AS (
    SELECT
        COUNT(*) AS total_doctors,
        COUNT(meeting_link) AS configured_links,
        COUNT(meeting_password) AS has_password,
        COUNT(DISTINCT meeting_platform) AS platform_count
    FROM doctors
)
SELECT
    total_doctors AS "Total Doctors",
    configured_links AS "Configured Meeting Links",
    ROUND(configured_links::NUMERIC / NULLIF(total_doctors, 0) * 100, 1) AS "Setup Percentage",
    platform_count AS "Different Platforms Used",
    CASE
        WHEN configured_links > 0 THEN '✅ READY FOR USE'
        ELSE '⚠️ NEED TO CONFIGURE'
    END AS "Status"
FROM summary;

\echo ''
\echo '=== SETUP VERIFICATION COMPLETE ==='
\echo ''
\echo 'If all tests show ✅ PASS, your meeting room setup is complete!'
\echo 'If any test fails, check the migration files and re-run.'
\echo ''
