
-- A) Alter dropship_imports: add sync tracking fields
ALTER TABLE public.dropship_imports
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'ok',
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS sync_attempts int NOT NULL DEFAULT 0;

-- B) Create dropship_sync_jobs table
CREATE TABLE public.dropship_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL,
  shop_surface_id uuid NOT NULL,
  external_product_id text NOT NULL,
  job_type text NOT NULL DEFAULT 'both',
  status text NOT NULL DEFAULT 'queued',
  attempts int NOT NULL DEFAULT 0,
  run_after timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on dropship_sync_jobs: read-only for org members via builder_surfaces ownership
ALTER TABLE public.dropship_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read sync jobs for their surfaces"
  ON public.dropship_sync_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_surfaces bs
      JOIN public.org_memberships om ON om.org_id = bs.org_id
      WHERE bs.id = dropship_sync_jobs.shop_surface_id
        AND om.user_id = auth.uid()
    )
  );

-- Index for worker queries
CREATE INDEX idx_sync_jobs_status_run_after ON public.dropship_sync_jobs (status, run_after)
  WHERE status = 'queued';

-- C) RPCs

-- 1. enqueue_dropship_sync_jobs
CREATE OR REPLACE FUNCTION public.enqueue_dropship_sync_jobs(p_limit int DEFAULT 200)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH candidates AS (
    SELECT di.provider_key, di.shop_surface_id, di.external_product_id
    FROM public.dropship_imports di
    WHERE di.last_synced_at IS NULL
       OR di.last_synced_at < now() - interval '15 minutes'
    LIMIT p_limit
  ),
  filtered AS (
    SELECT c.*
    FROM candidates c
    WHERE NOT EXISTS (
      SELECT 1 FROM public.dropship_sync_jobs j
      WHERE j.provider_key = c.provider_key
        AND j.shop_surface_id = c.shop_surface_id
        AND j.external_product_id = c.external_product_id
        AND j.status IN ('queued', 'running')
    )
  ),
  inserted AS (
    INSERT INTO public.dropship_sync_jobs (provider_key, shop_surface_id, external_product_id, job_type, status)
    SELECT provider_key, shop_surface_id, external_product_id, 'both', 'queued'
    FROM filtered
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM inserted;

  RETURN v_count;
END;
$$;

-- 2. process_dropship_sync_batch
CREATE OR REPLACE FUNCTION public.process_dropship_sync_batch(p_limit int DEFAULT 25)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jobs jsonb;
BEGIN
  WITH batch AS (
    SELECT id, provider_key, shop_surface_id, external_product_id, job_type
    FROM public.dropship_sync_jobs
    WHERE status = 'queued' AND run_after <= now()
    ORDER BY run_after ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE public.dropship_sync_jobs j
    SET status = 'running', updated_at = now()
    FROM batch b
    WHERE j.id = b.id
    RETURNING j.id, j.provider_key, j.shop_surface_id, j.external_product_id, j.job_type
  )
  SELECT coalesce(jsonb_agg(row_to_json(updated)), '[]'::jsonb)
  INTO v_jobs
  FROM updated;

  RETURN v_jobs;
END;
$$;

-- 3. complete_dropship_sync_job
CREATE OR REPLACE FUNCTION public.complete_dropship_sync_job(
  p_job_id uuid,
  p_success boolean,
  p_error text DEFAULT NULL,
  p_new_snapshot jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job record;
  v_new_attempts int;
BEGIN
  SELECT * INTO v_job FROM public.dropship_sync_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found: %', p_job_id; END IF;

  v_new_attempts := v_job.attempts + 1;

  IF p_success THEN
    -- Update the import snapshot
    UPDATE public.dropship_imports
    SET variants = COALESCE(p_new_snapshot->'variants', variants),
        last_synced_at = now(),
        sync_status = 'ok',
        last_error = NULL,
        sync_attempts = v_new_attempts
    WHERE provider_key = v_job.provider_key
      AND shop_surface_id = v_job.shop_surface_id
      AND external_product_id = v_job.external_product_id;

    -- Mark job done
    UPDATE public.dropship_sync_jobs
    SET status = 'done', attempts = v_new_attempts, updated_at = now()
    WHERE id = p_job_id;
  ELSE
    -- Exponential backoff: 2^attempts minutes, max 120 min
    UPDATE public.dropship_sync_jobs
    SET status = 'failed',
        attempts = v_new_attempts,
        run_after = now() + (least(power(2, v_new_attempts), 120) || ' minutes')::interval,
        updated_at = now()
    WHERE id = p_job_id;

    -- Update import error state
    UPDATE public.dropship_imports
    SET sync_status = CASE WHEN p_error ILIKE '%429%' OR p_error ILIKE '%rate%' THEN 'rate_limited' ELSE 'error' END,
        last_error = p_error,
        sync_attempts = v_new_attempts
    WHERE provider_key = v_job.provider_key
      AND shop_surface_id = v_job.shop_surface_id
      AND external_product_id = v_job.external_product_id;
  END IF;
END;
$$;
