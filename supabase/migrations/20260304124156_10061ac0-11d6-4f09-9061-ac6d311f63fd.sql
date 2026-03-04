
-- 1) Stale running job reaper RPC
CREATE OR REPLACE FUNCTION public.reap_stale_dropship_sync_jobs()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH stale AS (
    SELECT id FROM dropship_sync_jobs
    WHERE status = 'running'
      AND updated_at < now() - interval '10 minutes'
    FOR UPDATE SKIP LOCKED
  )
  UPDATE dropship_sync_jobs j
  SET status = 'queued',
      attempts = attempts + 1,
      run_after = now(),
      updated_at = now()
  FROM stale s
  WHERE j.id = s.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 2) Per-provider rate limit cooldown table
CREATE TABLE IF NOT EXISTS public.dropship_provider_cooldowns (
  provider_key text PRIMARY KEY,
  cooldown_until timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dropship_provider_cooldowns ENABLE ROW LEVEL SECURITY;

-- No direct access — only via SECURITY DEFINER RPCs
CREATE POLICY "No direct access" ON public.dropship_provider_cooldowns
  FOR ALL TO authenticated USING (false);

-- 3) RPC to set cooldown when 429 detected
CREATE OR REPLACE FUNCTION public.set_dropship_provider_cooldown(
  p_provider_key text,
  p_minutes int DEFAULT 15
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO dropship_provider_cooldowns (provider_key, cooldown_until, updated_at)
  VALUES (p_provider_key, now() + (p_minutes || ' minutes')::interval, now())
  ON CONFLICT (provider_key)
  DO UPDATE SET cooldown_until = now() + (p_minutes || ' minutes')::interval, updated_at = now();
END;
$$;

-- 4) RPC to check if provider is on cooldown
CREATE OR REPLACE FUNCTION public.is_dropship_provider_cooled_down(p_provider_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM dropship_provider_cooldowns
    WHERE provider_key = p_provider_key
      AND cooldown_until > now()
  );
$$;

-- 5) Update enqueue to skip cooled-down providers
CREATE OR REPLACE FUNCTION public.enqueue_dropship_sync_jobs(p_limit int DEFAULT 200)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO dropship_sync_jobs (provider_key, shop_surface_id, external_product_id, job_type)
  SELECT di.provider_key, di.shop_surface_id, di.external_product_id, 'both'
  FROM dropship_imports di
  WHERE (di.last_synced_at IS NULL OR di.last_synced_at < now() - interval '15 minutes')
    AND NOT EXISTS (
      SELECT 1 FROM dropship_sync_jobs sj
      WHERE sj.provider_key = di.provider_key
        AND sj.shop_surface_id = di.shop_surface_id
        AND sj.external_product_id = di.external_product_id
        AND sj.status IN ('queued', 'running')
    )
    AND NOT public.is_dropship_provider_cooled_down(di.provider_key)
  LIMIT p_limit;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 6) Update process_batch to also skip cooled-down providers
CREATE OR REPLACE FUNCTION public.process_dropship_sync_batch(p_limit int DEFAULT 25)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- First reap any stale running jobs
  PERFORM public.reap_stale_dropship_sync_jobs();

  WITH batch AS (
    SELECT id FROM dropship_sync_jobs
    WHERE status = 'queued'
      AND run_after <= now()
      AND NOT public.is_dropship_provider_cooled_down(provider_key)
    ORDER BY run_after ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE dropship_sync_jobs j
    SET status = 'running', updated_at = now()
    FROM batch b
    WHERE j.id = b.id
    RETURNING j.id, j.provider_key, j.external_product_id, j.shop_surface_id, j.job_type
  )
  SELECT COALESCE(jsonb_agg(row_to_json(updated)), '[]'::jsonb)
  INTO v_result
  FROM updated;

  RETURN v_result;
END;
$$;
