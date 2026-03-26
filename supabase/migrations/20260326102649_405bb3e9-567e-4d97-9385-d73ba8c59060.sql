
-- 1. FIX: orders INSERT — currently allows any authenticated user to insert without binding user identity
-- The orders table has no user_id column, insert is gated by auth.uid() IS NOT NULL which is correct
-- for a checkout flow where orders reference surface_id. No change needed.

-- 2. FIX: developer functions search_path — remove pg_temp (security risk with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.developer_check_and_increment_usage(
  p_app_id uuid,
  p_endpoint text,
  p_method text DEFAULT 'GET'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_daily_limit integer;
  v_monthly_limit integer;
  v_daily_used integer;
  v_monthly_used integer;
  v_today date := current_date;
  v_month_start date := date_trunc('month', current_date)::date;
BEGIN
  -- Get limits from quota config
  SELECT daily_limit, monthly_limit INTO v_daily_limit, v_monthly_limit
  FROM developer_api_quota_config
  WHERE app_id = p_app_id;

  IF NOT FOUND THEN
    v_daily_limit := 1000;
    v_monthly_limit := 30000;
  END IF;

  -- Check overrides
  SELECT COALESCE(daqo.daily_limit, v_daily_limit),
         COALESCE(daqo.monthly_limit, v_monthly_limit)
  INTO v_daily_limit, v_monthly_limit
  FROM developer_app_quota_overrides daqo
  WHERE daqo.app_id = p_app_id
    AND daqo.is_active = true;

  -- Get current daily usage
  SELECT COALESCE(SUM(request_count), 0) INTO v_daily_used
  FROM developer_api_usage_daily
  WHERE app_id = p_app_id AND usage_date = v_today;

  -- Get current monthly usage
  SELECT COALESCE(SUM(request_count), 0) INTO v_monthly_used
  FROM developer_api_usage_daily
  WHERE app_id = p_app_id AND usage_date >= v_month_start;

  IF v_daily_used >= v_daily_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_limit_exceeded');
  END IF;

  IF v_monthly_used >= v_monthly_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'monthly_limit_exceeded');
  END IF;

  -- Increment usage
  INSERT INTO developer_api_usage_daily (app_id, usage_date, endpoint, request_count)
  VALUES (p_app_id, v_today, p_endpoint, 1)
  ON CONFLICT (app_id, usage_date, endpoint)
  DO UPDATE SET request_count = developer_api_usage_daily.request_count + 1,
                updated_at = now();

  RETURN jsonb_build_object(
    'allowed', true,
    'daily_used', v_daily_used + 1,
    'daily_limit', v_daily_limit,
    'monthly_used', v_monthly_used + 1,
    'monthly_limit', v_monthly_limit
  );
END;
$function$;

-- Fix developer_get_usage_summary search_path
CREATE OR REPLACE FUNCTION public.developer_get_usage_summary(p_app_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_today date := current_date;
  v_month_start date := date_trunc('month', current_date)::date;
  v_daily_used integer;
  v_monthly_used integer;
  v_daily_limit integer;
  v_monthly_limit integer;
BEGIN
  SELECT COALESCE(SUM(request_count), 0) INTO v_daily_used
  FROM developer_api_usage_daily
  WHERE app_id = p_app_id AND usage_date = v_today;

  SELECT COALESCE(SUM(request_count), 0) INTO v_monthly_used
  FROM developer_api_usage_daily
  WHERE app_id = p_app_id AND usage_date >= v_month_start;

  SELECT daily_limit, monthly_limit INTO v_daily_limit, v_monthly_limit
  FROM developer_api_quota_config
  WHERE app_id = p_app_id;

  IF NOT FOUND THEN
    v_daily_limit := 1000;
    v_monthly_limit := 30000;
  END IF;

  SELECT COALESCE(daqo.daily_limit, v_daily_limit),
         COALESCE(daqo.monthly_limit, v_monthly_limit)
  INTO v_daily_limit, v_monthly_limit
  FROM developer_app_quota_overrides daqo
  WHERE daqo.app_id = p_app_id AND daqo.is_active = true;

  RETURN jsonb_build_object(
    'daily_used', v_daily_used,
    'daily_limit', v_daily_limit,
    'monthly_used', v_monthly_used,
    'monthly_limit', v_monthly_limit,
    'period_start', v_month_start,
    'today', v_today
  );
END;
$function$;
