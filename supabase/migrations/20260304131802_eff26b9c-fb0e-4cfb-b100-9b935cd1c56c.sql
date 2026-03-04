
-- Phase 5: Order Status + Tracking Sync

-- A) Extend dropship_orders with sync columns
ALTER TABLE public.dropship_orders
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'ok',
  ADD COLUMN IF NOT EXISTS sync_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_sync_after timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_dropship_orders_sync_poll
  ON public.dropship_orders (status, next_sync_after)
  WHERE status IN ('submitted','accepted','shipped');

-- B) Create dropship_order_sync_jobs
CREATE TABLE IF NOT EXISTS public.dropship_order_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL,
  dropship_order_id uuid NOT NULL REFERENCES public.dropship_orders(id) ON DELETE CASCADE,
  provider_order_id text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  attempts int NOT NULL DEFAULT 0,
  run_after timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dropship_order_sync_jobs_poll
  ON public.dropship_order_sync_jobs (run_after)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_dropship_order_sync_jobs_order
  ON public.dropship_order_sync_jobs (dropship_order_id);

-- RLS on dropship_order_sync_jobs
ALTER TABLE public.dropship_order_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_order_sync_jobs"
  ON public.dropship_order_sync_jobs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dropship_orders o
      JOIN public.surfaces s ON s.id = o.shop_surface_id
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE o.id = dropship_order_sync_jobs.dropship_order_id
        AND om.user_id = auth.uid()
    )
  );

-- C) RPCs

-- 1. Enqueue order sync jobs
CREATE OR REPLACE FUNCTION public.enqueue_dropship_order_sync_jobs(p_limit int DEFAULT 200)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH eligible AS (
    SELECT o.id AS dropship_order_id, o.provider_key, o.provider_order_id
    FROM public.dropship_orders o
    WHERE o.status IN ('submitted','accepted','shipped')
      AND o.next_sync_after <= now()
      AND o.provider_order_id IS NOT NULL
      AND NOT public.is_dropship_provider_cooled_down(o.provider_key)
      AND NOT EXISTS (
        SELECT 1 FROM public.dropship_order_sync_jobs j
        WHERE j.dropship_order_id = o.id
          AND j.status IN ('queued','running')
      )
    ORDER BY o.next_sync_after ASC
    LIMIT p_limit
  ),
  inserted AS (
    INSERT INTO public.dropship_order_sync_jobs (provider_key, dropship_order_id, provider_order_id)
    SELECT provider_key, dropship_order_id, provider_order_id FROM eligible
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM inserted;

  RETURN v_count;
END;
$$;

-- 2. Process batch (claim jobs)
CREATE OR REPLACE FUNCTION public.process_dropship_order_sync_batch(p_limit int DEFAULT 25)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Reap stale running jobs first
  UPDATE public.dropship_order_sync_jobs
  SET status = 'queued',
      attempts = attempts + 1,
      run_after = now() + interval '1 minute',
      updated_at = now()
  WHERE status = 'running'
    AND updated_at < now() - interval '10 minutes';

  WITH batch AS (
    SELECT id FROM public.dropship_order_sync_jobs
    WHERE status = 'queued'
      AND run_after <= now()
      AND NOT public.is_dropship_provider_cooled_down(provider_key)
    ORDER BY run_after ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.dropship_order_sync_jobs j
    SET status = 'running', updated_at = now()
    FROM batch b WHERE j.id = b.id
    RETURNING j.id, j.provider_key, j.dropship_order_id, j.provider_order_id, j.attempts
  )
  SELECT coalesce(jsonb_agg(row_to_json(claimed)), '[]'::jsonb)
  INTO v_result FROM claimed;

  RETURN v_result;
END;
$$;

-- 3. Complete order sync job
CREATE OR REPLACE FUNCTION public.complete_dropship_order_sync_job(
  p_job_id uuid,
  p_success boolean,
  p_new_status text DEFAULT NULL,
  p_tracking jsonb DEFAULT NULL,
  p_provider_payload jsonb DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_attempts int;
  v_next interval;
BEGIN
  -- Get job info
  SELECT dropship_order_id INTO v_order_id
  FROM public.dropship_order_sync_jobs WHERE id = p_job_id;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  -- Mark job done or failed
  IF p_success THEN
    UPDATE public.dropship_order_sync_jobs
    SET status = 'done', updated_at = now(), last_error = NULL
    WHERE id = p_job_id;
  ELSE
    UPDATE public.dropship_order_sync_jobs
    SET status = 'failed', updated_at = now(), last_error = p_error, attempts = attempts + 1
    WHERE id = p_job_id;
  END IF;

  -- Update dropship_orders
  SELECT sync_attempts INTO v_attempts FROM public.dropship_orders WHERE id = v_order_id;

  IF p_success THEN
    UPDATE public.dropship_orders
    SET
      status = coalesce(p_new_status, status),
      provider_payload = CASE WHEN p_provider_payload IS NOT NULL
        THEN coalesce(provider_payload, '{}'::jsonb) || p_provider_payload
        ELSE provider_payload END,
      last_synced_at = now(),
      sync_status = 'ok',
      sync_attempts = 0,
      next_sync_after = now() + interval '30 minutes',
      updated_at = now()
    WHERE id = v_order_id;
  ELSE
    -- Exponential backoff: 5min, 15min, 45min, 2h, 6h (capped)
    v_next := least(interval '6 hours', (interval '5 minutes') * power(3, least(v_attempts, 5)));

    UPDATE public.dropship_orders
    SET
      last_synced_at = now(),
      sync_status = CASE WHEN p_error ILIKE '%429%' OR p_error ILIKE '%rate%' THEN 'rate_limited' ELSE 'error' END,
      sync_attempts = sync_attempts + 1,
      next_sync_after = now() + v_next,
      last_error = coalesce(p_error, last_error),
      updated_at = now()
    WHERE id = v_order_id;
  END IF;

  -- Upsert shipment tracking if provided
  IF p_tracking IS NOT NULL AND (p_tracking->>'tracking_number') IS NOT NULL THEN
    INSERT INTO public.dropship_shipments (
      dropship_order_id, tracking_number, carrier, status, raw, shipped_at
    ) VALUES (
      v_order_id,
      p_tracking->>'tracking_number',
      p_tracking->>'carrier',
      coalesce(p_tracking->>'shipment_status', 'pending'),
      p_tracking,
      CASE WHEN (p_tracking->>'shipment_status') IN ('shipped','delivered') THEN now() ELSE NULL END
    )
    ON CONFLICT (dropship_order_id) WHERE tracking_number = (p_tracking->>'tracking_number')
    DO UPDATE SET
      carrier = coalesce(EXCLUDED.carrier, public.dropship_shipments.carrier),
      status = EXCLUDED.status,
      raw = EXCLUDED.raw,
      shipped_at = coalesce(EXCLUDED.shipped_at, public.dropship_shipments.shipped_at),
      delivered_at = CASE WHEN EXCLUDED.status = 'delivered' THEN now() ELSE public.dropship_shipments.delivered_at END,
      updated_at = now();
  END IF;
END;
$$;

-- Add partial unique index for shipment upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_dropship_shipments_order_tracking
  ON public.dropship_shipments (dropship_order_id, tracking_number);

-- Add tracking_url column to shipments if missing
ALTER TABLE public.dropship_shipments
  ADD COLUMN IF NOT EXISTS tracking_url text;
