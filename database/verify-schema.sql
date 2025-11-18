-- ============================================================================
-- Database Schema Verification Script
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-15
-- Purpose: Verify doctors and appointments tables match frontend expectations
-- ============================================================================

\echo '============================================'
\echo 'SCHEMA VERIFICATION STARTED'
\echo '============================================'
\echo ''

-- ============================================================================
-- 1. VERIFY DOCTORS TABLE SCHEMA
-- ============================================================================

\echo '1. DOCTORS TABLE - Column Check:'
\echo '--------------------------------------------'

DO $$
DECLARE
    v_expected_columns TEXT[] := ARRAY[
        'consultation_fee_standard',
        'consultation_fee_followup',
        'currency',
        'rating_avg',
        'rating_count',
        'is_verified',
        'is_accepting_patients'
    ];
    v_column TEXT;
    v_exists BOOLEAN;
    v_all_exist BOOLEAN := true;
BEGIN
    FOREACH v_column IN ARRAY v_expected_columns
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'doctors'
            AND column_name = v_column
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '  ✅ %', v_column;
        ELSE
            RAISE NOTICE '  ❌ % (MISSING)', v_column;
            v_all_exist := false;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    IF v_all_exist THEN
        RAISE NOTICE 'Status: ALL DOCTORS COLUMNS VERIFIED ✅';
    ELSE
        RAISE NOTICE 'Status: SOME DOCTORS COLUMNS MISSING ❌';
        RAISE NOTICE 'Action: Run CORRECT_03_fix_doctors_columns.sql';
    END IF;
END $$;

\echo ''

-- ============================================================================
-- 2. VERIFY APPOINTMENTS TABLE SCHEMA
-- ============================================================================

\echo '2. APPOINTMENTS TABLE - Column Check:'
\echo '--------------------------------------------'

DO $$
DECLARE
    v_expected_columns TEXT[] := ARRAY[
        'currency',
        'discount_amount',
        'coupon_code',
        'meeting_link',
        'symptoms',
        'reason',
        'booked_by'
    ];
    v_column TEXT;
    v_exists BOOLEAN;
    v_all_exist BOOLEAN := true;
BEGIN
    FOREACH v_column IN ARRAY v_expected_columns
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'appointments'
            AND column_name = v_column
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '  ✅ %', v_column;
        ELSE
            RAISE NOTICE '  ❌ % (MISSING)', v_column;
            v_all_exist := false;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    IF v_all_exist THEN
        RAISE NOTICE 'Status: ALL APPOINTMENTS COLUMNS VERIFIED ✅';
    ELSE
        RAISE NOTICE 'Status: SOME APPOINTMENTS COLUMNS MISSING ❌';
        RAISE NOTICE 'Action: Run CORRECT_04_fix_appointments_columns.sql';
    END IF;
END $$;

\echo ''

-- ============================================================================
-- 3. VERIFY OLD COLUMNS REMOVED
-- ============================================================================

\echo '3. OLD COLUMNS - Should Not Exist:'
\echo '--------------------------------------------'

DO $$
DECLARE
    v_old_columns TEXT[] := ARRAY[
        'consultation_fee',
        'followup_fee'
    ];
    v_column TEXT;
    v_exists BOOLEAN;
    v_all_removed BOOLEAN := true;
BEGIN
    FOREACH v_column IN ARRAY v_old_columns
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'doctors'
            AND column_name = v_column
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '  ⚠️  % (STILL EXISTS - should be renamed)', v_column;
            v_all_removed := false;
        ELSE
            RAISE NOTICE '  ✅ % (correctly renamed/removed)', v_column;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    IF v_all_removed THEN
        RAISE NOTICE 'Status: OLD COLUMNS CORRECTLY RENAMED ✅';
    ELSE
        RAISE NOTICE 'Status: OLD COLUMNS STILL EXIST ⚠️';
        RAISE NOTICE 'Action: Run CORRECT_03_fix_doctors_columns.sql';
    END IF;
END $$;

\echo ''

-- ============================================================================
-- 4. CHECK DATA INTEGRITY
-- ============================================================================

\echo '4. DATA INTEGRITY - Sample Records:'
\echo '--------------------------------------------'

DO $$
DECLARE
    v_doctor_count INTEGER;
    v_with_currency INTEGER;
    v_verified_count INTEGER;
    v_accepting_count INTEGER;
    v_appointment_count INTEGER;
    v_appt_with_currency INTEGER;
BEGIN
    -- Doctors
    SELECT COUNT(*) INTO v_doctor_count FROM public.doctors;
    SELECT COUNT(*) INTO v_with_currency FROM public.doctors WHERE currency IS NOT NULL;
    SELECT COUNT(*) INTO v_verified_count FROM public.doctors WHERE is_verified = true;
    SELECT COUNT(*) INTO v_accepting_count FROM public.doctors WHERE is_accepting_patients = true;

    -- Appointments
    SELECT COUNT(*) INTO v_appointment_count FROM public.appointments;
    SELECT COUNT(*) INTO v_appt_with_currency FROM public.appointments WHERE currency IS NOT NULL;

    RAISE NOTICE 'Doctors:';
    RAISE NOTICE '  Total: %', v_doctor_count;
    RAISE NOTICE '  With Currency: %', v_with_currency;
    RAISE NOTICE '  Verified: %', v_verified_count;
    RAISE NOTICE '  Accepting Patients: %', v_accepting_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Appointments:';
    RAISE NOTICE '  Total: %', v_appointment_count;
    RAISE NOTICE '  With Currency: %', v_appt_with_currency;

    RAISE NOTICE '';
    IF v_doctor_count > 0 AND v_with_currency = v_doctor_count THEN
        RAISE NOTICE 'Status: DATA INTEGRITY GOOD ✅';
    ELSIF v_doctor_count = 0 THEN
        RAISE NOTICE 'Status: NO DATA - Run CORRECT_02_seed_data.sql';
    ELSE
        RAISE NOTICE 'Status: PARTIAL DATA - Some records missing currency';
    END IF;
END $$;

\echo ''

-- ============================================================================
-- 5. VERIFY INDEXES
-- ============================================================================

\echo '5. INDEXES - Performance Optimization:'
\echo '--------------------------------------------'

DO $$
DECLARE
    v_expected_indexes TEXT[] := ARRAY[
        'idx_doctors_is_verified',
        'idx_doctors_is_accepting_patients',
        'idx_doctors_rating_avg',
        'idx_appointments_booked_by',
        'idx_appointments_coupon_code'
    ];
    v_index TEXT;
    v_exists BOOLEAN;
    v_all_exist BOOLEAN := true;
BEGIN
    FOREACH v_index IN ARRAY v_expected_indexes
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname = v_index
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '  ✅ %', v_index;
        ELSE
            RAISE NOTICE '  ❌ % (MISSING)', v_index;
            v_all_exist := false;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    IF v_all_exist THEN
        RAISE NOTICE 'Status: ALL INDEXES CREATED ✅';
    ELSE
        RAISE NOTICE 'Status: SOME INDEXES MISSING ❌';
    END IF;
END $$;

\echo ''

-- ============================================================================
-- 6. SAMPLE DATA PREVIEW
-- ============================================================================

\echo '6. SAMPLE DATA - Top 3 Doctors:'
\echo '--------------------------------------------'

SELECT
    full_name,
    specialties[1] as primary_specialty,
    consultation_fee_standard,
    consultation_fee_followup,
    currency,
    rating_avg,
    rating_count,
    is_verified,
    is_accepting_patients
FROM public.doctors
ORDER BY rating_avg DESC
LIMIT 3;

\echo ''
\echo '7. SAMPLE DATA - Recent Appointments:'
\echo '--------------------------------------------'

SELECT
    id,
    appointment_date,
    appointment_type,
    status,
    payment_amount,
    currency,
    discount_amount,
    booked_by
FROM public.appointments
ORDER BY created_at DESC
LIMIT 3;

\echo ''
\echo '============================================'
\echo 'VERIFICATION COMPLETE'
\echo '============================================'
\echo ''
\echo 'Next Steps:'
\echo '1. If any checks failed, run the suggested migration files'
\echo '2. If all passed, test your application'
\echo '3. Check /database/SCHEMA_FIX_GUIDE.md for details'
\echo ''
