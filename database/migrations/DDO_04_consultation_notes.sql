-- ============================================================================
-- DDO_04: Consultation Notes & SOAP Records
-- ============================================================================
-- Purpose: Create tables for storing doctor's consultation notes, SOAP records,
--          and prescriptions for each appointment
-- Date: 2025-11-16
-- ============================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.consultation_notes CASCADE;

-- Create consultation_notes table
CREATE TABLE IF NOT EXISTS public.consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,

    -- SOAP Notes
    subjective TEXT, -- Patient's account of symptoms, concerns, history
    objective TEXT, -- Clinical findings, vitals, exam results, lab results
    assessment TEXT, -- Diagnosis, clinical impression, problem list
    plan TEXT, -- Treatment plan, procedures, referrals, patient education

    -- Prescription (stored as JSONB for flexibility)
    medications JSONB DEFAULT '[]'::jsonb,
    -- Format: [{"name": "Medicine", "dosage": "500mg", "frequency": "Twice daily", "duration": "7 days", "instructions": "Take with food"}]

    -- Follow-up and Additional Notes
    follow_up TEXT, -- Follow-up instructions, next appointment, warning signs
    additional_notes TEXT, -- Any additional information

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one consultation note per appointment
    CONSTRAINT unique_appointment_note UNIQUE (appointment_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_consultation_notes_appointment ON public.consultation_notes(appointment_id);
CREATE INDEX idx_consultation_notes_doctor ON public.consultation_notes(doctor_id);
CREATE INDEX idx_consultation_notes_patient ON public.consultation_notes(patient_id);
CREATE INDEX idx_consultation_notes_created_at ON public.consultation_notes(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Doctors can view their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can insert their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can update their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can delete their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Patients can view their own consultation notes" ON public.consultation_notes;

-- Policy: Doctors can view their own consultation notes
CREATE POLICY "Doctors can view their own consultation notes"
    ON public.consultation_notes
    FOR SELECT
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Doctors can insert their own consultation notes
CREATE POLICY "Doctors can insert their own consultation notes"
    ON public.consultation_notes
    FOR INSERT
    WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.doctors
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Doctors can update their own consultation notes
CREATE POLICY "Doctors can update their own consultation notes"
    ON public.consultation_notes
    FOR UPDATE
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors
            WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        doctor_id IN (
            SELECT id FROM public.doctors
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Doctors can delete their own consultation notes
CREATE POLICY "Doctors can delete their own consultation notes"
    ON public.consultation_notes
    FOR DELETE
    USING (
        doctor_id IN (
            SELECT id FROM public.doctors
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Patients can view their own consultation notes
CREATE POLICY "Patients can view their own consultation notes"
    ON public.consultation_notes
    FOR SELECT
    USING (
        patient_id IN (
            SELECT id FROM public.patients
            WHERE auth_user_id = auth.uid()
        )
    );

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_consultation_notes_updated_at ON public.consultation_notes;
CREATE TRIGGER update_consultation_notes_updated_at
    BEFORE UPDATE ON public.consultation_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_notes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- SAMPLE DATA (for testing - optional)
-- ============================================================================

-- This section is commented out by default
-- Uncomment and modify to insert test data

/*
INSERT INTO public.consultation_notes (
    appointment_id,
    doctor_id,
    patient_id,
    subjective,
    objective,
    assessment,
    plan,
    medications,
    follow_up,
    additional_notes
) VALUES (
    'appointment-uuid-here',
    'doctor-uuid-here',
    'patient-uuid-here',
    'Patient complains of persistent headache for 3 days, worse in the morning',
    'BP: 120/80, Temperature: 98.6°F, No signs of neurological deficit',
    'Tension-type headache, likely stress-related',
    'Prescribed pain medication, advised rest and stress management',
    '[{"name": "Ibuprofen", "dosage": "400mg", "frequency": "Every 8 hours as needed", "duration": "5 days", "instructions": "Take with food"}]'::jsonb,
    'Return in 1 week if symptoms persist. Seek immediate care if severe headache, vision changes, or confusion develops.',
    'Patient advised to maintain regular sleep schedule and reduce caffeine intake.'
);
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table creation
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'consultation_notes'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'consultation_notes';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this SQL in Supabase SQL Editor
-- Expected result: consultation_notes table created with proper RLS policies
-- ============================================================================
