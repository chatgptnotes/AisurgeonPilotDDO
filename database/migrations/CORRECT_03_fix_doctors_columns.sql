-- ============================================================================
-- AI Surgeon Pilot - Fix Doctors Table Columns
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-15
-- Purpose: Update doctors table to match frontend expectations
--
-- CHANGES:
--   ✅ Rename consultation_fee → consultation_fee_standard
--   ✅ Rename followup_fee → consultation_fee_followup
--   ✅ Add currency VARCHAR(3) DEFAULT 'INR'
--   ✅ Add rating_avg DECIMAL(3,2) DEFAULT 0.0
--   ✅ Add rating_count INTEGER DEFAULT 0
--   ✅ Add is_verified BOOLEAN DEFAULT true
--   ✅ Add is_accepting_patients BOOLEAN DEFAULT true
--   ✅ Update existing doctors to verified and accepting patients
--
-- SAFETY: Idempotent - safe to re-run
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RENAME CONSULTATION FEE COLUMNS
-- ============================================================================

-- Rename consultation_fee to consultation_fee_standard
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'doctors'
        AND column_name = 'consultation_fee'
    ) THEN
        ALTER TABLE public.doctors RENAME COLUMN consultation_fee TO consultation_fee_standard;
        RAISE NOTICE '✅ Renamed consultation_fee → consultation_fee_standard';
    ELSE
        RAISE NOTICE '⏭️  Column consultation_fee already renamed or does not exist';
    END IF;
END $$;

-- Rename followup_fee to consultation_fee_followup
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'doctors'
        AND column_name = 'followup_fee'
    ) THEN
        ALTER TABLE public.doctors RENAME COLUMN followup_fee TO consultation_fee_followup;
        RAISE NOTICE '✅ Renamed followup_fee → consultation_fee_followup';
    ELSE
        RAISE NOTICE '⏭️  Column followup_fee already renamed or does not exist';
    END IF;
END $$;

-- ============================================================================
-- 2. ADD NEW COLUMNS
-- ============================================================================

-- Add currency column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'doctors'
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.doctors ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';
        RAISE NOTICE '✅ Added column: currency';
    ELSE
        RAISE NOTICE '⏭️  Column currency already exists';
    END IF;
END $$;

-- Add rating_avg column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'doctors'
        AND column_name = 'rating_avg'
    ) THEN
        ALTER TABLE public.doctors ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 0.0;
        RAISE NOTICE '✅ Added column: rating_avg';
    ELSE
        RAISE NOTICE '⏭️  Column rating_avg already exists';
    END IF;
END $$;

-- Add rating_count column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'doctors'
        AND column_name = 'rating_count'
    ) THEN
        ALTER TABLE public.doctors ADD COLUMN rating_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added column: rating_count';
    ELSE
        RAISE NOTICE '⏭️  Column rating_count already exists';
    END IF;
END $$;

-- Add is_verified column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'doctors'
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.doctors ADD COLUMN is_verified BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Added column: is_verified';
    ELSE
        RAISE NOTICE '⏭️  Column is_verified already exists';
    END IF;
END $$;

-- Add is_accepting_patients column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'doctors'
        AND column_name = 'is_accepting_patients'
    ) THEN
        ALTER TABLE public.doctors ADD COLUMN is_accepting_patients BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Added column: is_accepting_patients';
    ELSE
        RAISE NOTICE '⏭️  Column is_accepting_patients already exists';
    END IF;
END $$;

-- ============================================================================
-- 3. UPDATE EXISTING DOCTORS
-- ============================================================================

-- Set all existing doctors as verified and accepting patients
UPDATE public.doctors
SET
    is_verified = true,
    is_accepting_patients = true,
    currency = COALESCE(currency, 'INR'),
    rating_avg = COALESCE(rating_avg, 0.0),
    rating_count = COALESCE(rating_count, 0)
WHERE id IS NOT NULL;

-- ============================================================================
-- 4. CREATE INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_doctors_is_verified ON public.doctors(is_verified);
CREATE INDEX IF NOT EXISTS idx_doctors_is_accepting_patients ON public.doctors(is_accepting_patients);
CREATE INDEX IF NOT EXISTS idx_doctors_rating_avg ON public.doctors(rating_avg DESC);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_doctor_count INTEGER;
    v_verified_count INTEGER;
    v_accepting_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_doctor_count FROM public.doctors;
    SELECT COUNT(*) INTO v_verified_count FROM public.doctors WHERE is_verified = true;
    SELECT COUNT(*) INTO v_accepting_count FROM public.doctors WHERE is_accepting_patients = true;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'DOCTORS TABLE FIX COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Column Changes:';
    RAISE NOTICE '  ✅ consultation_fee → consultation_fee_standard';
    RAISE NOTICE '  ✅ followup_fee → consultation_fee_followup';
    RAISE NOTICE '';
    RAISE NOTICE 'New Columns Added:';
    RAISE NOTICE '  ✅ currency (default: INR)';
    RAISE NOTICE '  ✅ rating_avg (default: 0.0)';
    RAISE NOTICE '  ✅ rating_count (default: 0)';
    RAISE NOTICE '  ✅ is_verified (default: true)';
    RAISE NOTICE '  ✅ is_accepting_patients (default: true)';
    RAISE NOTICE '';
    RAISE NOTICE 'Doctors Updated:';
    RAISE NOTICE '  Total Doctors: %', v_doctor_count;
    RAISE NOTICE '  Verified: %', v_verified_count;
    RAISE NOTICE '  Accepting Patients: %', v_accepting_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Run CORRECT_04_fix_appointments_columns.sql';
    RAISE NOTICE '============================================';
END $$;

COMMIT;
