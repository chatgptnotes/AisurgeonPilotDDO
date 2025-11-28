-- Migration: Set up cron job to send video consultation reminders
-- This cron job runs every 5 minutes and calls the Edge Function to send reminders
-- to patients 15 minutes before their video consultations

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create or replace the cron job
-- Schedule: Every 5 minutes
-- The Edge Function will find appointments starting in 10-20 minutes and send reminders

-- First, remove existing job if it exists (to avoid duplicates)
SELECT cron.unschedule('send-video-consultation-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-video-consultation-reminders'
);

-- Schedule the new cron job
SELECT cron.schedule(
  'send-video-consultation-reminders',  -- Job name
  '*/5 * * * *',                         -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := CONCAT(current_setting('app.settings.supabase_url', true), '/functions/v1/send-video-consultation-reminders'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.supabase_service_role_key', true))
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Add comment for documentation
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for video consultation reminders';
