-- ============================================================================
-- CORRECTED: Consultation Notes & Notifications Tables
-- ============================================================================
-- Fixed: Uses correct column names (user_id instead of auth_user_id)
-- ============================================================================

-- ============================================================================
-- 1. CREATE CONSULTATION_NOTES TABLE
-- ============================================================================

DROP TABLE IF EXISTS public.consultation_notes CASCADE;

CREATE TABLE public.consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,

    -- SOAP Notes
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,

    -- Prescription (JSONB for flexibility)
    medications JSONB DEFAULT '[]'::jsonb,

    -- Follow-up
    follow_up TEXT,
    additional_notes TEXT,

    -- Metadata
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Doctors can view their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can insert their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can update their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Doctors can delete their own consultation notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Patients can view their own consultation notes" ON public.consultation_notes;

-- CORRECTED: Doctors RLS policies (using user_id, NOT auth_user_id)
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

-- CORRECTED: Patients RLS policy (patients.id is the auth.uid())
CREATE POLICY "Patients can view their own consultation notes"
    ON public.consultation_notes FOR SELECT
    TO authenticated
    USING (patient_id = auth.uid());

-- Auto-update trigger for updated_at
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
-- 2. CREATE NOTIFICATIONS TABLE (if doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    tenant_id UUID,
    patient_id UUID,
    user_id UUID,
    appointment_id UUID,
    visit_id UUID,

    -- Notification Details
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp', 'push')),
    channel TEXT NOT NULL CHECK (channel IN ('appointment', 'prescription', 'billing', 'general', 'emergency')),
    subject TEXT,
    message TEXT NOT NULL,
    html_content TEXT,

    -- Recipients
    recipient_email TEXT,
    recipient_phone TEXT,

    -- Status
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'read')),

    -- External Service
    external_id TEXT,
    error_message TEXT,

    -- Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON public.notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON public.notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Doctors can view notifications" ON public.notifications;

-- CORRECTED: RLS policies for notifications
CREATE POLICY "Patients can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view their notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (
            SELECT id FROM public.doctors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "System can update notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- 3. VERIFICATION QUERIES
-- ============================================================================

-- Check consultation_notes table
SELECT
    'consultation_notes table created' AS status,
    COUNT(*) AS row_count
FROM consultation_notes;

-- Check notifications table
SELECT
    'notifications table ready' AS status,
    COUNT(*) AS row_count
FROM notifications;

-- Verify RLS policies on consultation_notes
SELECT
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'consultation_notes'
ORDER BY policyname;

-- Verify RLS policies on notifications
SELECT
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- If you see the verification results above, tables are ready.
-- Refresh your browser and test the consultation workspace!
-- ============================================================================
