
-- A) usage_quota_config
CREATE TABLE IF NOT EXISTS public.usage_quota_config (
  key text PRIMARY KEY,
  free_limit int NOT NULL DEFAULT 4,
  starter_limit int NOT NULL DEFAULT 10,
  creator_limit int,
  reset_days int NOT NULL DEFAULT 10,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_quota_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read quota config" ON public.usage_quota_config;
CREATE POLICY "Anyone can read quota config"
  ON public.usage_quota_config FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update quota config" ON public.usage_quota_config;
CREATE POLICY "Admins can update quota config"
  ON public.usage_quota_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.usage_quota_config (key, free_limit, starter_limit, creator_limit, reset_days) VALUES
  ('ada_image', 4, 10, NULL, 10),
  ('yangu_image', 4, 10, NULL, 10),
  ('yangu_video', 2, 5, NULL, 10)
ON CONFLICT (key) DO UPDATE
SET free_limit = EXCLUDED.free_limit,
    starter_limit = EXCLUDED.starter_limit,
    creator_limit = EXCLUDED.creator_limit,
    reset_days = EXCLUDED.reset_days,
    updated_at = now();

-- B) user_usage_quotas
CREATE TABLE IF NOT EXISTS public.user_usage_quotas (
  user_id uuid NOT NULL,
  quota_key text NOT NULL REFERENCES public.usage_quota_config(key),
  used_count int NOT NULL DEFAULT 0,
  period_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  PRIMARY KEY (user_id, quota_key)
);

ALTER TABLE public.user_usage_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own usage" ON public.user_usage_quotas;
DROP POLICY IF EXISTS "Service role manages usage" ON public.user_usage_quotas;

CREATE POLICY "Users can read own usage"
  ON public.user_usage_quotas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages usage"
  ON public.user_usage_quotas FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- C) RPC check_and_increment_quota
CREATE OR REPLACE FUNCTION public.check_and_increment_quota(p_quota_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_config record;
  v_usage record;
  v_limit int;
  v_tier text;
  v_new_count int;
  v_plan text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  IF public.has_role(v_user_id, 'admin'::app_role) THEN
    RETURN jsonb_build_object('ok', true, 'code', 'ALLOWED', 'tier', 'admin', 'used', 0, 'limit', -1);
  END IF;

  SELECT * INTO v_config FROM public.usage_quota_config WHERE key = p_quota_key;
  IF v_config IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'code', 'NO_CONFIG', 'tier', 'free');
  END IF;

  IF NOT v_config.is_enabled THEN
    RETURN jsonb_build_object('ok', true, 'code', 'DISABLED', 'tier', 'free');
  END IF;

  v_plan := 'free';
  BEGIN
    SELECT LOWER(us.plan_id) INTO v_plan
      FROM public.subscriptions us
     WHERE us.user_id = v_user_id AND us.status = 'active'
     ORDER BY us.created_at DESC LIMIT 1;
  EXCEPTION WHEN undefined_table THEN
    v_plan := 'free';
  END;

  IF v_plan ILIKE '%creator%' THEN
    v_tier := 'creator';
    v_limit := v_config.creator_limit;
  ELSIF v_plan ILIKE '%starter%' THEN
    v_tier := 'starter';
    v_limit := v_config.starter_limit;
  ELSE
    v_tier := 'free';
    v_limit := v_config.free_limit;
  END IF;

  IF v_limit IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'code', 'UNLIMITED', 'tier', v_tier);
  END IF;

  INSERT INTO public.user_usage_quotas (user_id, quota_key, used_count, period_started_at)
  VALUES (v_user_id, p_quota_key, 0, now())
  ON CONFLICT (user_id, quota_key) DO NOTHING;

  SELECT * INTO v_usage
  FROM public.user_usage_quotas
  WHERE user_id = v_user_id AND quota_key = p_quota_key
  FOR UPDATE;

  IF v_usage.locked_until IS NOT NULL AND now() >= v_usage.locked_until THEN
    UPDATE public.user_usage_quotas
    SET used_count = 0, locked_until = NULL, period_started_at = now()
    WHERE user_id = v_user_id AND quota_key = p_quota_key;
    v_usage.used_count := 0;
    v_usage.locked_until := NULL;
  END IF;

  IF v_usage.locked_until IS NOT NULL AND now() < v_usage.locked_until THEN
    RETURN jsonb_build_object('ok', false, 'code', 'QUOTA_REACHED',
      'tier', v_tier, 'used', v_usage.used_count, 'limit', v_limit, 'next_reset_at', v_usage.locked_until);
  END IF;

  v_new_count := v_usage.used_count + 1;

  IF v_new_count >= v_limit THEN
    UPDATE public.user_usage_quotas
    SET used_count = v_new_count,
        locked_until = now() + (v_config.reset_days || ' days')::interval
    WHERE user_id = v_user_id AND quota_key = p_quota_key;
  ELSE
    UPDATE public.user_usage_quotas
    SET used_count = v_new_count
    WHERE user_id = v_user_id AND quota_key = p_quota_key;
  END IF;

  RETURN jsonb_build_object('ok', true, 'code', 'ALLOWED', 'tier', v_tier, 'used', v_new_count, 'limit', v_limit);
END;
$$;

-- D) Admin RPCs
CREATE OR REPLACE FUNCTION public.admin_update_quota_config(
  p_key text,
  p_free_limit int,
  p_starter_limit int,
  p_creator_limit int,
  p_reset_days int,
  p_is_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE public.usage_quota_config
  SET free_limit = p_free_limit,
      starter_limit = p_starter_limit,
      creator_limit = p_creator_limit,
      reset_days = p_reset_days,
      is_enabled = p_is_enabled,
      updated_at = now()
  WHERE key = p_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_user_quota(
  p_user_id uuid,
  p_quota_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE public.user_usage_quotas
  SET used_count = 0, locked_until = NULL, period_started_at = now()
  WHERE user_id = p_user_id AND quota_key = p_quota_key;
END;
$$;
