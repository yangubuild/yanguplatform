
-- Enable pg_cron and pg_net for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add unique constraint for upsert on agency_reports
CREATE UNIQUE INDEX IF NOT EXISTS agency_reports_unique_daily
  ON public.agency_reports (agency_id, report_type, report_date);
