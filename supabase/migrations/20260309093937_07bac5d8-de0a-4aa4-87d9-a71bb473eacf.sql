
-- Merchant promo codes table
CREATE TABLE public.merchant_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surface_id UUID REFERENCES public.surfaces(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 10,
  duration TEXT NOT NULL DEFAULT 'forever',
  duration_months INTEGER,
  eligible_users TEXT NOT NULL DEFAULT 'everyone',
  affiliate_id UUID,
  expires_at TIMESTAMPTZ,
  max_redemptions INTEGER,
  one_use_per_user BOOLEAN NOT NULL DEFAULT true,
  applicable_product_ids TEXT[] DEFAULT '{}',
  promo_link TEXT,
  qr_code_url TEXT,
  popup_config JSONB DEFAULT '{}',
  redemption_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own promo codes"
  ON public.merchant_promo_codes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Promo redemptions by visitors
CREATE TABLE public.merchant_promo_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.merchant_promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_email TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo code owners can view redemptions"
  ON public.merchant_promo_redemptions
  FOR SELECT
  TO authenticated
  USING (
    promo_code_id IN (SELECT id FROM public.merchant_promo_codes WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can redeem promos"
  ON public.merchant_promo_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
