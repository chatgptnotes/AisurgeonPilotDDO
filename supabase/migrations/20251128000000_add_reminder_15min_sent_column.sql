-- Migration: Add reminder_15min_sent column to appointments table
-- This column tracks whether the 15-minute reminder has been sent for video consultations

-- Add the column if it doesn't exist
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS reminder_15min_sent BOOLEAN DEFAULT false;

-- Add index for efficient querying of appointments needing reminders
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_15min_sent
ON public.appointments (reminder_15min_sent)
WHERE reminder_15min_sent = false AND meeting_link IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.appointments.reminder_15min_sent IS 'Tracks whether the 15-minute WhatsApp/Email reminder has been sent for video consultations';
