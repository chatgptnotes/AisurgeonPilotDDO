-- ============================================================================
-- FINAL: Consultation Notes Table (No Errors)
-- ============================================================================
-- This version drops all policies first to avoid "already exists" errors
-- ============================================================================

-- 1. CREATE CONSULTATION_NOTES TABLE
DROP TABLE IF EXISTS public.consultation_notes CASCADE;

CREATE TABLE public.consultation_notes (
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

-- Create indexes
CREATE INDEX idx_consultation_notes_appointment ON public.consultation_notes(appointment_id);
CREATE INDEX idx_consultation_notes_doctor ON public.consultation_notes(doctor_id);
CREATE INDEX idx_consultation_notes_patient ON public.consultation_notes(patient_id);
CREATE INDEX idx_consultation_notes_created_at ON public.consultation_notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Doctors can view their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can insert their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can update their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can delete their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Patients can view their own consultation notes" ON public.consultation_notes;

-- Create RLS Policies (using user_id, NOT auth_user_id)
CREATE POLICY "Doctors can view their own consultation notes"
    ON public.consultation_notes FOR SELECT
    TO authenticated
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can insert their own consultation notes"
    ON public.consultation_notes FOR INSERT
    TO authenticated
    WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can update their own consultation notes"
    ON public.consultation_notes FOR UPDATE
    TO authenticated
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can delete their own consultation notes"
    ON public.consultation_notes FOR DELETE
    TO authenticated
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can view their own consultation notes"
    ON public.consultation_notes FOR SELECT
    TO authenticated
    USING (patient_id = auth.uid());

-- Auto-update trigger
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_notes TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check table exists
SELECT 'consultation_notes table created' AS status, COUNT(*) AS row_count FROM consultation_notes;

-- Check RLS policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'consultation_notes' ORDER BY policyname;
