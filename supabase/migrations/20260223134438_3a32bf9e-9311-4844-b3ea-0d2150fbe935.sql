
-- ============================================================
-- YANGU Developer Usage + Quotas (FINAL, ALL FIXES INCLUDED)
-- ============================================================

-- 0) Ensure helper trigger function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1) developer_api_usage_daily
-- ============================================================
CREATE TABLE IF NOT EXISTS public.developer_api_usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  date date NOT NULL,
  endpoint text NOT NULL,
  success_count int NOT NULL DEFAULT 0,
  error_count int NOT NULL DEFAULT 0,
  total_count int NOT NULL DEFAULT 0,
  total_latency_ms bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT developer_api_usage_daily_unique UNIQUE (developer_id, app_id, date, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_usage_daily_developer ON public.developer_api_usage_daily(developer_id);
CREATE INDEX IF NOT EXISTS idx_usage_daily_app       ON public.developer_api_usage_daily(app_id);
CREATE INDEX IF NOT EXISTS idx_usage_daily_date      ON public.developer_api_usage_daily(date);

ALTER TABLE public.developer_api_usage_daily ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'developer_api_usage_daily'
      AND policyname = 'Developers can view own usage'
  ) THEN
    CREATE POLICY "Developers can view own usage"
      ON public.developer_api_usage_daily
      FOR SELECT
      USING (developer_id = auth.uid());
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_developer_api_usage_daily_updated_at ON public.developer_api_usage_daily;
CREATE TRIGGER update_developer_api_usage_daily_updated_at
  BEFORE UPDATE ON public.developer_api_usage_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2) developer_api_quota_config
-- ============================================================
CREATE TABLE IF NOT EXISTS public.developer_api_quota_config (
  quota_key text PRIMARY KEY,
  daily_limit int NOT NULL,
  monthly_limit int NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true
);

ALTER TABLE public.developer_api_quota_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'developer_api_quota_config'
      AND policyname = 'Authenticated users can read quota config'
  ) THEN
    CREATE POLICY "Authenticated users can read quota config"
      ON public.developer_api_quota_config
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

INSERT INTO public.developer_api_quota_config (quota_key, daily_limit, monthly_limit, is_enabled)
VALUES ('api_calls', 1000, 20000, true)
ON CONFLICT (quota_key) DO NOTHING;

-- ============================================================
-- 3) developer_app_quota_overrides
-- ============================================================
CREATE TABLE IF NOT EXISTS public.developer_app_quota_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  quota_key text NOT NULL REFERENCES public.developer_api_quota_config(quota_key),
  daily_limit int,
  monthly_limit int,
  CONSTRAINT developer_app_quota_overrides_unique UNIQUE (app_id, quota_key)
);

ALTER TABLE public.developer_app_quota_overrides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'developer_app_quota_overrides'
      AND policyname = 'App owners can view own overrides'
  ) THEN
    CREATE POLICY "App owners can view own overrides"
      ON public.developer_app_quota_overrides
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.developer_apps da
          WHERE da.id = app_id AND da.owner_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- 4) RPC: developer_check_and_increment_usage
-- ============================================================
CREATE OR REPLACE FUNCTION public.developer_check_and_increment_usage(
  p_app_id uuid,
  p_endpoint text,
  p_success boolean,
  p_latency_ms int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dev_id uuid := auth.uid();
  v_today date := current_date;
  v_month_start date := date_trunc('month', current_date)::date;
  v_daily_limit int;
  v_monthly_limit int;
  v_enabled boolean;
  v_daily_used int;
  v_monthly_used int;
  v_latency int := COALESCE(p_latency_ms, 0);
BEGIN
  IF v_dev_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  IF p_endpoint IS NULL OR btrim(p_endpoint) = '' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_ENDPOINT');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.developer_apps
    WHERE id = p_app_id AND owner_user_id = v_dev_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'APP_NOT_FOUND');
  END IF;

  SELECT
    COALESCE(o.daily_limit, c.daily_limit),
    COALESCE(o.monthly_limit, c.monthly_limit),
    c.is_enabled
  INTO v_daily_limit, v_monthly_limit, v_enabled
  FROM public.developer_api_quota_config c
  LEFT JOIN public.developer_app_quota_overrides o
    ON o.app_id = p_app_id AND o.quota_key = c.quota_key
  WHERE c.quota_key = 'api_calls';

  IF v_enabled IS NOT TRUE OR v_daily_limit IS NULL OR v_monthly_limit IS NULL THEN
    v_daily_limit := 2147483647;
    v_monthly_limit := 2147483647;
  END IF;

  SELECT COALESCE(SUM(total_count), 0)::int
  INTO v_daily_used
  FROM public.developer_api_usage_daily
  WHERE developer_id = v_dev_id AND app_id = p_app_id AND date = v_today;

  SELECT COALESCE(SUM(total_count), 0)::int
  INTO v_monthly_used
  FROM public.developer_api_usage_daily
  WHERE developer_id = v_dev_id
    AND app_id = p_app_id
    AND date >= v_month_start
    AND date <= v_today;

  IF v_daily_used + 1 > v_daily_limit THEN
    RETURN jsonb_build_object(
      'ok', false, 'code', 'QUOTA_EXCEEDED',
      'daily_used', v_daily_used, 'daily_limit', v_daily_limit,
      'monthly_used', v_monthly_used, 'monthly_limit', v_monthly_limit,
      'reset_at', (v_today + interval '1 day')::date
    );
  END IF;

  IF v_monthly_used + 1 > v_monthly_limit THEN
    RETURN jsonb_build_object(
      'ok', false, 'code', 'QUOTA_EXCEEDED',
      'daily_used', v_daily_used, 'daily_limit', v_daily_limit,
      'monthly_used', v_monthly_used, 'monthly_limit', v_monthly_limit,
      'reset_at', (date_trunc('month', v_today) + interval '1 month')::date
    );
  END IF;

  INSERT INTO public.developer_api_usage_daily (
    developer_id, app_id, date, endpoint,
    success_count, error_count, total_count, total_latency_ms
  )
  VALUES (
    v_dev_id, p_app_id, v_today, p_endpoint,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    1,
    v_latency
  )
  ON CONFLICT (developer_id, app_id, date, endpoint) DO UPDATE SET
    success_count     = public.developer_api_usage_daily.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
    error_count       = public.developer_api_usage_daily.error_count   + CASE WHEN p_success THEN 0 ELSE 1 END,
    total_count       = public.developer_api_usage_daily.total_count   + 1,
    total_latency_ms  = public.developer_api_usage_daily.total_latency_ms + v_latency,
    updated_at        = now();

  RETURN jsonb_build_object(
    'ok', true,
    'daily_used', v_daily_used + 1, 'daily_limit', v_daily_limit,
    'monthly_used', v_monthly_used + 1, 'monthly_limit', v_monthly_limit
  );
END;
$$;

-- ============================================================
-- 5) RPC: developer_get_usage_summary
-- ============================================================
CREATE OR REPLACE FUNCTION public.developer_get_usage_summary(
  p_app_id uuid DEFAULT NULL,
  p_days int DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dev_id uuid := auth.uid();
  v_today date := current_date;
  v_month_start date := date_trunc('month', current_date)::date;
  v_days int := GREATEST(1, LEAST(COALESCE(p_days, 30), 365));
  v_from date := (current_date - (GREATEST(1, LEAST(COALESCE(p_days, 30), 365)) * interval '1 day'))::date;
  v_daily_breakdown jsonb;
  v_top_endpoints jsonb;
  v_daily_used int;
  v_monthly_used int;
  v_daily_limit int;
  v_monthly_limit int;
  v_error_count_24h int;
  v_total_count_24h int;
  v_avg_latency_24h numeric;
BEGIN
  IF v_dev_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.date), '[]'::jsonb)
  INTO v_daily_breakdown
  FROM (
    SELECT
      date,
      SUM(total_count)::int   AS total,
      SUM(success_count)::int AS success,
      SUM(error_count)::int   AS errors
    FROM public.developer_api_usage_daily
    WHERE developer_id = v_dev_id
      AND (p_app_id IS NULL OR app_id = p_app_id)
      AND date >= v_from
    GROUP BY date
  ) d;

  SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb)
  INTO v_top_endpoints
  FROM (
    SELECT
      endpoint,
      SUM(total_count)::int AS calls,
      SUM(error_count)::int AS errors
    FROM public.developer_api_usage_daily
    WHERE developer_id = v_dev_id
      AND (p_app_id IS NULL OR app_id = p_app_id)
      AND date >= v_from
    GROUP BY endpoint
    ORDER BY calls DESC
    LIMIT 10
  ) e;

  SELECT COALESCE(SUM(total_count), 0)::int
  INTO v_daily_used
  FROM public.developer_api_usage_daily
  WHERE developer_id = v_dev_id
    AND (p_app_id IS NULL OR app_id = p_app_id)
    AND date = v_today;

  SELECT COALESCE(SUM(total_count), 0)::int
  INTO v_monthly_used
  FROM public.developer_api_usage_daily
  WHERE developer_id = v_dev_id
    AND (p_app_id IS NULL OR app_id = p_app_id)
    AND date >= v_month_start
    AND date <= v_today;

  SELECT
    COALESCE(SUM(error_count), 0)::int,
    COALESCE(SUM(total_count), 0)::int,
    CASE WHEN COALESCE(SUM(total_count), 0) > 0
      THEN ROUND(SUM(total_latency_ms)::numeric / SUM(total_count), 1)
      ELSE 0
    END
  INTO v_error_count_24h, v_total_count_24h, v_avg_latency_24h
  FROM public.developer_api_usage_daily
  WHERE developer_id = v_dev_id
    AND (p_app_id IS NULL OR app_id = p_app_id)
    AND date = v_today;

  SELECT
    COALESCE(o.daily_limit, c.daily_limit),
    COALESCE(o.monthly_limit, c.monthly_limit)
  INTO v_daily_limit, v_monthly_limit
  FROM public.developer_api_quota_config c
  LEFT JOIN public.developer_app_quota_overrides o
    ON (p_app_id IS NOT NULL AND o.app_id = p_app_id AND o.quota_key = c.quota_key)
  WHERE c.quota_key = 'api_calls';

  v_daily_limit := COALESCE(v_daily_limit, 1000);
  v_monthly_limit := COALESCE(v_monthly_limit, 20000);

  RETURN jsonb_build_object(
    'ok', true,
    'days', v_days,
    'from', v_from,
    'daily_breakdown', v_daily_breakdown,
    'top_endpoints', v_top_endpoints,
    'daily_used', v_daily_used,
    'daily_limit', v_daily_limit,
    'monthly_used', v_monthly_used,
    'monthly_limit', v_monthly_limit,
    'error_count_24h', v_error_count_24h,
    'total_count_24h', v_total_count_24h,
    'avg_latency_ms_24h', v_avg_latency_24h,
    'day_reset_at', (v_today + interval '1 day')::date,
    'month_reset_at', (date_trunc('month', v_today) + interval '1 month')::date
  );
END;
$$;

-- ============================================================
-- 6) Tighten function permissions
-- ============================================================
REVOKE ALL ON FUNCTION public.developer_check_and_increment_usage(uuid, text, boolean, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.developer_check_and_increment_usage(uuid, text, boolean, int) TO authenticated;

REVOKE ALL ON FUNCTION public.developer_get_usage_summary(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.developer_get_usage_summary(uuid, int) TO authenticated;
