CREATE OR REPLACE FUNCTION public.consume_entitlement(p_asset_type text, p_amount int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_quota int;
  v_used int;
BEGIN
  SELECT us.plan_id, us.current_period_start, us.current_period_end
    INTO v_sub
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
   WHERE us.user_id = auth.uid()
     AND us.status = 'active'
     AND sp.is_active = true
   ORDER BY us.created_at DESC
   LIMIT 1;

  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'No active subscription found';
  END IF;

  SELECT pe.monthly_quota INTO v_quota
    FROM public.plan_entitlements pe
   WHERE pe.plan_id = v_sub.plan_id
     AND pe.asset_type = p_asset_type;

  IF v_quota IS NULL THEN
    RAISE EXCEPTION 'No entitlement for asset type: %', p_asset_type;
  END IF;

  INSERT INTO public.usage_counters (user_id, asset_type, period_start, period_end, used)
  VALUES (auth.uid(), p_asset_type, v_sub.current_period_start, v_sub.current_period_end, 0)
  ON CONFLICT (user_id, asset_type, period_start, period_end) DO NOTHING;

  SELECT uc.used INTO v_used
    FROM public.usage_counters uc
   WHERE uc.user_id = auth.uid()
     AND uc.asset_type = p_asset_type
     AND uc.period_start = v_sub.current_period_start
     AND uc.period_end = v_sub.current_period_end
   FOR UPDATE;

  IF v_used + p_amount > v_quota THEN
    RAISE EXCEPTION 'Quota exceeded for %', p_asset_type;
  END IF;

  UPDATE public.usage_counters
     SET used = used + p_amount
   WHERE user_id = auth.uid()
     AND asset_type = p_asset_type
     AND period_start = v_sub.current_period_start
     AND period_end = v_sub.current_period_end;
END;
$$;