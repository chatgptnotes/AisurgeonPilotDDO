-- ============================================================================
-- FIX ALL ERRORS: consultation_notes, patients, user_profiles
-- Run this in: https://supabase.com/dashboard/project/qfneoowktsirwpzehgxp/sql
-- ============================================================================

-- 1. CREATE CONSULTATION_NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    medications JSONB DEFAULT '[]'::jsonb,
    follow_up TEXT,
    additional_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_appointment_note UNIQUE (appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_consultation_notes_appointment ON public.consultation_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor ON public.consultation_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient ON public.consultation_notes(patient_id);

ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can insert their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can update their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Patients can view their own consultation notes" ON public.consultation_notes;

CREATE POLICY "Doctors can view their own consultation notes"
    ON public.consultation_notes FOR SELECT TO authenticated
    USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can insert their own consultation notes"
    ON public.consultation_notes FOR INSERT TO authenticated
    WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their own consultation notes"
    ON public.consultation_notes FOR UPDATE TO authenticated
    USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Patients can view their own consultation notes"
    ON public.consultation_notes FOR SELECT TO authenticated
    USING (patient_id = auth.uid());

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_consultation_notes_updated_at ON public.consultation_notes;

CREATE TRIGGER update_consultation_notes_updated_at
    BEFORE UPDATE ON public.consultation_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_notes TO authenticated;

-- 2. ADD hospital_name TO patients TABLE
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'hospital_name'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN hospital_name TEXT;
        UPDATE public.patients SET hospital_name = 'hope' WHERE hospital_name IS NULL;
    END IF;
END $$;

-- 3. CREATE user_profiles TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    is_superadmin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT TO authenticated
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

GRANT SELECT ON public.user_profiles TO authenticated;

-- 4. FIX DOCTORS AND APPOINTMENTS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view their own appointments" ON public.appointments;

CREATE POLICY "Doctors can view their own profile"
    ON public.doctors FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Doctors can view their own appointments"
    ON public.appointments FOR SELECT TO authenticated
    USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- 5. VERIFICATION
-- ============================================================================
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'consultation_notes') AS consultation_notes_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'hospital_name') AS hospital_name_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_profiles') AS user_profiles_exists;
