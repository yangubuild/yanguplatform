
-- =============================================
-- PROMO ENGINE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.promo_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reward_type text NOT NULL,
  reward_payload jsonb NOT NULL,
  trigger_type text NOT NULL,
  trigger_payload jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.promo_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'granted',
  granted_at timestamptz DEFAULT now(),
  meta jsonb DEFAULT '{}'::jsonb,
  UNIQUE(campaign_id, user_id)
);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quota_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type text NOT NULL,
  extra int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quota_addons ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (corrected)
-- =============================================

-- A) promo_campaigns: public can only see active + in-window
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.promo_campaigns;
CREATE POLICY "Anyone can view active campaigns"
  ON public.promo_campaigns FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.promo_campaigns;
CREATE POLICY "Admins can manage campaigns"
  ON public.promo_campaigns FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- B) promo_redemptions: users see own, admins manage all
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.promo_redemptions;
CREATE POLICY "Users can view own redemptions"
  ON public.promo_redemptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all redemptions" ON public.promo_redemptions;
CREATE POLICY "Admins can manage all redemptions"
  ON public.promo_redemptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- C) quota_addons: users see own, admins manage all
DROP POLICY IF EXISTS "Users can view own addons" ON public.quota_addons;
CREATE POLICY "Users can view own addons"
  ON public.quota_addons FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all addons" ON public.quota_addons;
CREATE POLICY "Admins can manage all addons"
  ON public.quota_addons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RPCs
-- =============================================

-- get_my_active_promos: active campaigns not yet redeemed by caller
CREATE OR REPLACE FUNCTION public.get_my_active_promos()
RETURNS SETOF public.promo_campaigns
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.*
  FROM public.promo_campaigns c
  WHERE c.is_active = true
    AND (c.starts_at IS NULL OR c.starts_at <= now())
    AND (c.ends_at IS NULL OR c.ends_at >= now())
    AND NOT EXISTS (
      SELECT 1 FROM public.promo_redemptions r
      WHERE r.campaign_id = c.id AND r.user_id = auth.uid()
    );
$$;

-- dismiss_promo: mark as dismissed
CREATE OR REPLACE FUNCTION public.dismiss_promo(p_campaign_key text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id uuid;
BEGIN
  SELECT id INTO v_campaign_id FROM public.promo_campaigns WHERE key = p_campaign_key;
  IF v_campaign_id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_key;
  END IF;
  INSERT INTO public.promo_redemptions (campaign_id, user_id, status)
  VALUES (v_campaign_id, auth.uid(), 'dismissed')
  ON CONFLICT (campaign_id, user_id) DO NOTHING;
END;
$$;

-- grant_promo: admin/service_role grants a promo to a user (idempotent)
CREATE OR REPLACE FUNCTION public.grant_promo(p_campaign_key text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign record;
  v_amount int;
  v_asset_type text;
  v_extra int;
  v_expires_days int;
BEGIN
  SELECT * INTO v_campaign FROM public.promo_campaigns WHERE key = p_campaign_key;
  IF v_campaign IS NULL THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_key;
  END IF;

  -- Idempotent: skip if already redeemed
  IF EXISTS (
    SELECT 1 FROM public.promo_redemptions
    WHERE campaign_id = v_campaign.id AND user_id = p_user_id
  ) THEN
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

  -- Record redemption
  INSERT INTO public.promo_redemptions (campaign_id, user_id, status)
  VALUES (v_campaign.id, p_user_id, 'granted');
END;
$$;
