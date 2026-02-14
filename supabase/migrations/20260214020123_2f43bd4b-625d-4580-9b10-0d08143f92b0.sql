-- Harden grant_promo: use ON CONFLICT for true idempotency and validate campaign is active/in-window
CREATE OR REPLACE FUNCTION public.grant_promo(p_campaign_key text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign record;
  v_amount int;
  v_asset_type text;
  v_extra int;
  v_expires_days int;
  v_already boolean;
BEGIN
  SELECT * INTO v_campaign FROM public.promo_campaigns
  WHERE key = p_campaign_key
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now());

  IF v_campaign IS NULL THEN
    RAISE EXCEPTION 'Campaign not found or inactive: %', p_campaign_key;
  END IF;

  -- Idempotent insert using ON CONFLICT
  INSERT INTO public.promo_redemptions (campaign_id, user_id, status)
  VALUES (v_campaign.id, p_user_id, 'granted')
  ON CONFLICT (campaign_id, user_id) DO NOTHING;

  -- If row was already there, skip reward
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Apply reward
  IF v_campaign.reward_type = 'credits' THEN
    v_amount := (v_campaign.reward_payload->>'amount')::int;
    PERFORM public.grant_credits(p_user_id := p_user_id, p_amount := v_amount, p_note := 'Promo: ' || v_campaign.title);
  ELSIF v_campaign.reward_type = 'quota' THEN
    v_asset_type := v_campaign.reward_payload->>'asset_type';
    v_extra := (v_campaign.reward_payload->>'extra')::int;
    v_expires_days := COALESCE((v_campaign.reward_payload->>'expires_in_days')::int, 30);
    INSERT INTO public.quota_addons (user_id, asset_type, extra, expires_at)
    VALUES (p_user_id, v_asset_type, v_extra, now() + (v_expires_days || ' days')::interval);
  END IF;
END;
$$;