
-- =============================================
-- SOCIAL POST JOBS — Scheduled publishing queue
-- =============================================

CREATE TYPE public.post_job_status AS ENUM (
  'queued',
  'processing',
  'published',
  'failed',
  'retrying',
  'cancelled'
);

CREATE TABLE public.social_post_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  platform text NOT NULL,
  account_id uuid NOT NULL,
  variant_url text,
  caption text NOT NULL DEFAULT '',
  hashtags text[] DEFAULT '{}',
  scheduled_at timestamptz NOT NULL,
  status public.post_job_status NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text,
  next_retry_at timestamptz,
  claimed_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_jobs_due ON public.social_post_jobs (scheduled_at)
  WHERE status IN ('queued', 'retrying');
CREATE INDEX idx_post_jobs_post ON public.social_post_jobs (post_id);
CREATE INDEX idx_post_jobs_workspace ON public.social_post_jobs (workspace_id);

ALTER TABLE public.social_post_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read/manage their own workspace jobs
CREATE POLICY "Users manage own workspace jobs"
  ON public.social_post_jobs FOR ALL TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.social_workspaces WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.social_workspaces WHERE user_id = auth.uid()
    )
  );

-- Service role / edge functions need full access (default via service_role)

-- =============================================
-- SOCIAL POST JOB EVENTS — Audit log per attempt
-- =============================================

CREATE TABLE public.social_post_job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.social_post_jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text,
  error_code text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_events_job ON public.social_post_job_events (job_id);

ALTER TABLE public.social_post_job_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own job events"
  ON public.social_post_job_events FOR SELECT TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM public.social_post_jobs j
      JOIN public.social_workspaces w ON w.id = j.workspace_id
      WHERE w.user_id = auth.uid()
    )
  );

-- =============================================
-- CLAIM DUE POST JOBS — Atomic safe locking RPC
-- =============================================

CREATE OR REPLACE FUNCTION public.claim_due_post_jobs(limit_count integer DEFAULT 10)
RETURNS SETOF public.social_post_jobs
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.social_post_jobs
  SET
    status = 'processing',
    claimed_at = now(),
    updated_at = now()
  WHERE id IN (
    SELECT id
    FROM public.social_post_jobs
    WHERE status IN ('queued', 'retrying')
      AND scheduled_at <= now()
      AND (next_retry_at IS NULL OR next_retry_at <= now())
    ORDER BY scheduled_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT limit_count
  )
  RETURNING *;
$$;

-- Enable pg_cron and pg_net for scheduled worker
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
