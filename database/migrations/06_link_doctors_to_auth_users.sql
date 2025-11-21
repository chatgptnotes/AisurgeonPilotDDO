-- ============================================================================
-- AI Surgeon Pilot - Link Doctors to Auth Users
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-21
-- Purpose: Fix PGRST116 error by linking existing doctors to auth users
--
-- FIXES:
--   ✅ Links doctors.user_id to auth.users.id by matching email
--   ✅ Handles email variations (with/without "dr." prefix)
--   ✅ Creates trigger to auto-populate user_id on new doctor records
--   ✅ Creates function to safely link doctors after auth signup
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FUNCTION: Link Doctor to Auth User by Email
-- ============================================================================
-- This function finds auth users and links them to doctor records by email
-- Handles both exact matches and variations (e.g., dr.email vs email)

CREATE OR REPLACE FUNCTION public.link_doctor_to_auth_user(p_doctor_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auth_user_id UUID;
    v_doctor_id UUID;
BEGIN
    -- Try to find auth user with exact email match
    SELECT id INTO v_auth_user_id
    FROM auth.users
    WHERE email = LOWER(p_doctor_email)
    LIMIT 1;

    -- If not found, try without "dr." prefix
    IF v_auth_user_id IS NULL THEN
        SELECT id INTO v_auth_user_id
        FROM auth.users
        WHERE email = LOWER(REPLACE(p_doctor_email, 'dr.', ''))
        LIMIT 1;
    END IF;

    -- If not found, try with "dr." prefix
    IF v_auth_user_id IS NULL THEN
        SELECT id INTO v_auth_user_id
        FROM auth.users
        WHERE email = LOWER('dr.' || p_doctor_email)
        LIMIT 1;
    END IF;

    -- Update doctor record with auth user_id
    IF v_auth_user_id IS NOT NULL THEN
        UPDATE public.doctors
        SET user_id = v_auth_user_id
        WHERE email = p_doctor_email
        RETURNING id INTO v_doctor_id;

        RAISE NOTICE 'Linked doctor % to auth user %', v_doctor_id, v_auth_user_id;
    ELSE
        RAISE NOTICE 'No auth user found for doctor email: %', p_doctor_email;
    END IF;

    RETURN v_auth_user_id;
END;
$$;

-- ============================================================================
-- 2. LINK ALL EXISTING DOCTORS TO AUTH USERS
-- ============================================================================
-- Run the linking function for all doctors

DO $$
DECLARE
    v_doctor RECORD;
    v_linked_count INTEGER := 0;
    v_total_count INTEGER := 0;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Linking Doctors to Auth Users...';
    RAISE NOTICE '============================================';

    FOR v_doctor IN SELECT id, email, full_name FROM public.doctors WHERE user_id IS NULL
    LOOP
        v_total_count := v_total_count + 1;

        IF link_doctor_to_auth_user(v_doctor.email) IS NOT NULL THEN
            v_linked_count := v_linked_count + 1;
            RAISE NOTICE '  ✅ Linked: % (%) to auth user', v_doctor.full_name, v_doctor.email;
        ELSE
            RAISE NOTICE '  ⚠️  No auth user found for: % (%)', v_doctor.full_name, v_doctor.email;
        END IF;
    END LOOP;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Linking Complete!';
    RAISE NOTICE '  Total doctors: %', v_total_count;
    RAISE NOTICE '  Successfully linked: %', v_linked_count;
    RAISE NOTICE '  Not linked (no auth user): %', v_total_count - v_linked_count;
    RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- 3. TRIGGER: Auto-link Doctor on Insert/Update
-- ============================================================================
-- Automatically link doctor to auth user when doctor record is created/updated

CREATE OR REPLACE FUNCTION public.auto_link_doctor_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If user_id is not set, try to find and link auth user
    IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
        NEW.user_id := link_doctor_to_auth_user(NEW.email);
    END IF;

    RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_auto_link_doctor ON public.doctors;

CREATE TRIGGER trigger_auto_link_doctor
    BEFORE INSERT OR UPDATE ON public.doctors
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_link_doctor_to_auth();

-- ============================================================================
-- 4. FUNCTION: Create Doctor Profile After Auth Signup
-- ============================================================================
-- This function can be called after a new doctor signs up via Supabase Auth
-- It creates a doctor profile automatically linked to the auth user

CREATE OR REPLACE FUNCTION public.create_doctor_profile_after_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the default tenant (first one) or use a specific tenant
    SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;

    -- Only create doctor profile if user has doctor role metadata
    IF NEW.raw_user_meta_data->>'role' = 'doctor' THEN
        INSERT INTO public.doctors (
            tenant_id,
            user_id,
            email,
            full_name,
            is_active,
            is_verified,
            is_accepting_patients,
            consultation_fee_standard,
            consultation_fee_followup,
            currency
        ) VALUES (
            v_tenant_id,
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Doctor ' || split_part(NEW.email, '@', 1)),
            true,
            false,  -- Needs admin verification
            true,
            1000.00,
            700.00,
            'INR'
        ) ON CONFLICT (user_id) DO NOTHING;

        RAISE NOTICE 'Created doctor profile for: %', NEW.email;
    END IF;

    RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_create_doctor_after_signup ON auth.users;

CREATE TRIGGER trigger_create_doctor_after_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_doctor_profile_after_signup();

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to call the linking function
GRANT EXECUTE ON FUNCTION public.link_doctor_to_auth_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_doctor_to_auth_user(TEXT) TO anon;

-- ============================================================================
-- 6. VERIFICATION QUERY
-- ============================================================================

DO $$
DECLARE
    v_total_doctors INTEGER;
    v_linked_doctors INTEGER;
    v_unlinked_doctors INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_doctors FROM public.doctors;
    SELECT COUNT(*) INTO v_linked_doctors FROM public.doctors WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO v_unlinked_doctors FROM public.doctors WHERE user_id IS NULL;

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'FINAL VERIFICATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total doctors in database: %', v_total_doctors;
    RAISE NOTICE 'Doctors linked to auth: %', v_linked_doctors;
    RAISE NOTICE 'Doctors not linked: %', v_unlinked_doctors;
    RAISE NOTICE '';

    IF v_unlinked_doctors > 0 THEN
        RAISE NOTICE 'Unlinked doctors need to:';
        RAISE NOTICE '  1. Create auth account with matching email';
        RAISE NOTICE '  2. Run: SELECT link_doctor_to_auth_user(''their.email@domain.com'');';
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Migration Complete!';
    RAISE NOTICE '============================================';
END $$;

COMMIT;
