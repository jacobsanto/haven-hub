-- Add auto-sync settings to pms_connections
ALTER TABLE public.pms_connections 
ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.pms_connections 
ADD COLUMN IF NOT EXISTS sync_interval_minutes integer NOT NULL DEFAULT 5;

-- Add trigger_type to pms_sync_runs to track sync source
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'pms_sync_runs_sync_type_check'
  ) THEN
    -- No constraint exists, add the column
    NULL;
  ELSE
    -- Drop the existing check constraint first to allow new values
    ALTER TABLE public.pms_sync_runs DROP CONSTRAINT IF EXISTS pms_sync_runs_sync_type_check;
  END IF;
END $$;

-- Add trigger_type column
ALTER TABLE public.pms_sync_runs 
ADD COLUMN IF NOT EXISTS trigger_type text NOT NULL DEFAULT 'manual';

-- Add check constraint for sync_type including new values
ALTER TABLE public.pms_sync_runs 
ADD CONSTRAINT pms_sync_runs_sync_type_check 
CHECK (sync_type IN ('full', 'property', 'availability', 'rates', 'booking'));

-- Add check constraint for trigger_type
ALTER TABLE public.pms_sync_runs 
ADD CONSTRAINT pms_sync_runs_trigger_type_check 
CHECK (trigger_type IN ('manual', 'scheduled', 'webhook', 'booking'));

-- Add retry columns to bookings for PMS sync failures
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS pms_retry_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS pms_last_error text;

-- Enable pg_cron and pg_net extensions for scheduled sync
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create or replace the scheduled sync job (5-minute interval)
-- Note: This uses the service role key authorization for cron jobs
SELECT cron.unschedule('pms-availability-sync') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'pms-availability-sync'
);

SELECT cron.schedule(
  'pms-availability-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xavjbiuhcmupsoocrmhf.supabase.co/functions/v1/pms-sync-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdmpiaXVoY211cHNvb2NybWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MzkxNjksImV4cCI6MjA4NTExNTE2OX0.YhtM5158gJXroq98yV7WeYQeZ8NjzfUlUHZIYqOwnTs'
    ),
    body := '{"action": "sync-all-availability", "triggerType": "scheduled"}'::jsonb
  );
  $$
);