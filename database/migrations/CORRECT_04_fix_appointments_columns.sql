-- ============================================================================
-- AI Surgeon Pilot - Fix Appointments Table Columns
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-15
-- Purpose: Update appointments table to match frontend expectations
--
-- CHANGES:
--   ✅ Add currency VARCHAR(3) DEFAULT 'INR'
--   ✅ Add discount_amount DECIMAL(10,2) DEFAULT 0
--   ✅ Add coupon_code VARCHAR(50)
--   ✅ Ensure meeting_link TEXT exists
--   ✅ Add symptoms TEXT
--   ✅ Add reason TEXT
--   ✅ Add booked_by VARCHAR(50) DEFAULT 'patient'
--
-- SAFETY: Idempotent - safe to re-run
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD CURRENCY COLUMN
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';
        RAISE NOTICE '✅ Added column: currency';
    ELSE
        RAISE NOTICE '⏭️  Column currency already exists';
    END IF;
END $$;

-- ============================================================================
-- 2. ADD DISCOUNT AND COUPON COLUMNS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added column: discount_amount';
    ELSE
        RAISE NOTICE '⏭️  Column discount_amount already exists';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'coupon_code'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN coupon_code VARCHAR(50);
        RAISE NOTICE '✅ Added column: coupon_code';
    ELSE
        RAISE NOTICE '⏭️  Column coupon_code already exists';
    END IF;
END $$;

-- ============================================================================
-- 3. ADD MEETING LINK COLUMN
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'meeting_link'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN meeting_link TEXT;
        RAISE NOTICE '✅ Added column: meeting_link';
    ELSE
        RAISE NOTICE '⏭️  Column meeting_link already exists';
    END IF;
END $$;

-- ============================================================================
-- 4. ADD SYMPTOMS AND REASON COLUMNS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'symptoms'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN symptoms TEXT;
        RAISE NOTICE '✅ Added column: symptoms';
    ELSE
        RAISE NOTICE '⏭️  Column symptoms already exists';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'reason'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN reason TEXT;
        RAISE NOTICE '✅ Added column: reason';
    ELSE
        RAISE NOTICE '⏭️  Column reason already exists';
    END IF;
END $$;

-- ============================================================================
-- 5. ADD BOOKED_BY COLUMN
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'booked_by'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN booked_by VARCHAR(50) DEFAULT 'patient';
        RAISE NOTICE '✅ Added column: booked_by';
    ELSE
        RAISE NOTICE '⏭️  Column booked_by already exists';
    END IF;
END $$;

-- ============================================================================
-- 6. UPDATE EXISTING APPOINTMENTS
-- ============================================================================

-- Set default values for existing appointments
UPDATE public.appointments
SET
    currency = COALESCE(currency, 'INR'),
    discount_amount = COALESCE(discount_amount, 0),
    booked_by = COALESCE(booked_by, 'patient')
WHERE id IS NOT NULL;

-- ============================================================================
-- 7. CREATE INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_appointments_booked_by ON public.appointments(booked_by);
CREATE INDEX IF NOT EXISTS idx_appointments_coupon_code ON public.appointments(coupon_code) WHERE coupon_code IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_appointment_count INTEGER;
    v_with_currency INTEGER;
    v_with_discount INTEGER;
    v_columns_exist BOOLEAN := true;
    v_column_name TEXT;
    v_expected_columns TEXT[] := ARRAY[
        'currency',
        'discount_amount',
        'coupon_code',
        'meeting_link',
        'symptoms',
        'reason',
        'booked_by'
    ];
BEGIN
    SELECT COUNT(*) INTO v_appointment_count FROM public.appointments;
    SELECT COUNT(*) INTO v_with_currency FROM public.appointments WHERE currency IS NOT NULL;
    SELECT COUNT(*) INTO v_with_discount FROM public.appointments WHERE discount_amount > 0;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'APPOINTMENTS TABLE FIX COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'New Columns Added:';
    RAISE NOTICE '  ✅ currency (default: INR)';
    RAISE NOTICE '  ✅ discount_amount (default: 0)';
    RAISE NOTICE '  ✅ coupon_code';
    RAISE NOTICE '  ✅ meeting_link';
    RAISE NOTICE '  ✅ symptoms';
    RAISE NOTICE '  ✅ reason';
    RAISE NOTICE '  ✅ booked_by (default: patient)';
    RAISE NOTICE '';
    RAISE NOTICE 'Appointments Updated:';
    RAISE NOTICE '  Total Appointments: %', v_appointment_count;
    RAISE NOTICE '  With Currency Set: %', v_with_currency;
    RAISE NOTICE '  With Discounts: %', v_with_discount;
    RAISE NOTICE '';

    -- Verify all columns exist
    RAISE NOTICE 'Column Verification:';
    FOREACH v_column_name IN ARRAY v_expected_columns
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'appointments'
            AND column_name = v_column_name
        ) THEN
            RAISE NOTICE '  ✅ %', v_column_name;
        ELSE
            RAISE NOTICE '  ❌ % (MISSING)', v_column_name;
            v_columns_exist := false;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    IF v_columns_exist THEN
        RAISE NOTICE 'Status: ALL COLUMNS VERIFIED ✅';
    ELSE
        RAISE NOTICE 'Status: SOME COLUMNS MISSING ❌';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Update seed data or test your application';
    RAISE NOTICE '============================================';
END $$;

COMMIT;
