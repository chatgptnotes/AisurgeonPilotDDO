-- Add doctor permanent Zoom meeting room settings
-- Zoom-only implementation for simplicity
-- Created: 2025-11-15

BEGIN;

-- Add Zoom meeting configuration columns
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS zoom_meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS zoom_password VARCHAR(100),
  ADD COLUMN IF NOT EXISTS zoom_meeting_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS zoom_instructions TEXT DEFAULT 'Please join 5 minutes before your appointment time.';

-- Add comments for documentation
COMMENT ON COLUMN public.doctors.zoom_meeting_link IS 'Doctor''s permanent Zoom meeting room URL (e.g., https://zoom.us/j/1234567890)';
COMMENT ON COLUMN public.doctors.zoom_password IS 'Zoom meeting password/passcode';
COMMENT ON COLUMN public.doctors.zoom_meeting_id IS 'Zoom numeric meeting ID (extracted from URL)';
COMMENT ON COLUMN public.doctors.zoom_instructions IS 'Custom instructions for patients joining the Zoom call';

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_doctors_zoom_link
  ON public.doctors(zoom_meeting_link)
  WHERE zoom_meeting_link IS NOT NULL;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Zoom meeting settings added to doctors table!';
END $$;

-- Verification query: Current Zoom Configuration Status
SELECT
  full_name,
  email,
  CASE
    WHEN zoom_meeting_link IS NOT NULL THEN 'Configured ✓'
    ELSE 'Not set'
  END as zoom_status,
  CASE
    WHEN zoom_password IS NOT NULL THEN 'Password set'
    ELSE 'No password'
  END as security_status
FROM public.doctors
ORDER BY full_name;

-- Usage Instructions:
-- 1. Run this migration: psql -d your_db -f CORRECT_05_add_doctor_meeting_settings.sql
-- 2. Update doctor Zoom links via admin panel or direct SQL
-- 3. Example update:
--    UPDATE doctors SET
--      zoom_meeting_link = 'https://zoom.us/j/1234567890',
--      zoom_password = 'secure123',
--      zoom_meeting_id = '1234567890',
--      zoom_instructions = 'Please join 5 minutes early. Camera on preferred.'
--    WHERE email = 'doctor@example.com';
