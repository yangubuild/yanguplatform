
-- ============================================================
-- YANGU Payments v1 (safe, idempotent)
-- ============================================================

-- 1) creator_payment_profiles
CREATE TABLE IF NOT EXISTS public.creator_payment_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  methods jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creator_id)
);

ALTER TABLE public.creator_payment_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can view own payment profile" ON public.creator_payment_profiles;
DROP POLICY IF EXISTS "Creators can insert own payment profile" ON public.creator_payment_profiles;
DROP POLICY IF EXISTS "Creators can update own payment profile" ON public.creator_payment_profiles;
DROP POLICY IF EXISTS "Admins can manage all payment profiles" ON public.creator_payment_profiles;

CREATE POLICY "Creators can view own payment profile"
  ON public.creator_payment_profiles FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own payment profile"
  ON public.creator_payment_profiles FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own payment profile"
  ON public.creator_payment_profiles FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all payment profiles"
  ON public.creator_payment_profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) payment_attempts
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'initiated',
  provider_ref text,
  amount numeric,
  currency text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create payment attempts" ON public.payment_attempts;
DROP POLICY IF EXISTS "Surface owner/admin can read payment attempts" ON public.payment_attempts;
DROP POLICY IF EXISTS "Surface owner/admin can update payment attempts" ON public.payment_attempts;

CREATE POLICY "Authenticated users can create payment attempts"
  ON public.payment_attempts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Surface owner/admin can read payment attempts"
  ON public.payment_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders o
    JOIN builder_surfaces bs ON bs.id = o.surface_id
    WHERE o.id = payment_attempts.order_id
      AND (bs.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Surface owner/admin can update payment attempts"
  ON public.payment_attempts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM orders o
    JOIN builder_surfaces bs ON bs.id = o.surface_id
    WHERE o.id = payment_attempts.order_id
      AND (bs.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id ON public.payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts(status);

-- 3) webhook_events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage webhook events" ON public.webhook_events;

CREATE POLICY "Admins can manage webhook events"
  ON public.webhook_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_event
  ON public.webhook_events(provider, event_id)
  WHERE event_id IS NOT NULL;

-- 4) orders extras
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_address text;
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 5) Sanitized RPC
CREATE OR REPLACE FUNCTION public.get_creator_payment_methods(p_creator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_methods jsonb;
  safe_methods jsonb := '{}'::jsonb;
  key text;
  value jsonb;
BEGIN
  SELECT methods INTO raw_methods
  FROM public.creator_payment_profiles
  WHERE creator_id = p_creator_id;

  IF raw_methods IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  FOR key, value IN SELECT * FROM jsonb_each(raw_methods) LOOP
    IF COALESCE((value->>'enabled')::boolean, false) = true THEN
      CASE key
        WHEN 'cod' THEN
          safe_methods := safe_methods || jsonb_build_object('cod', jsonb_build_object('enabled', true));
        WHEN 'bank' THEN
          safe_methods := safe_methods || jsonb_build_object('bank', jsonb_build_object(
            'enabled', true,
            'bank_name', COALESCE(value->>'bank_name', ''),
            'account_name', COALESCE(value->>'account_name', '')
          ));
        WHEN 'mobile_money' THEN
          safe_methods := safe_methods || jsonb_build_object('mobile_money', jsonb_build_object(
            'enabled', true,
            'provider', COALESCE(value->>'provider', ''),
            'number', COALESCE(value->>'number', ''),
            'name', COALESCE(value->>'name', '')
          ));
        WHEN 'paypal' THEN
          safe_methods := safe_methods || jsonb_build_object('paypal', jsonb_build_object(
            'enabled', true,
            'email', COALESCE(value->>'email', '')
          ));
        WHEN 'stripe' THEN
          safe_methods := safe_methods || jsonb_build_object('stripe', jsonb_build_object('enabled', true));
        WHEN 'flutterwave' THEN
          safe_methods := safe_methods || jsonb_build_object('flutterwave', jsonb_build_object('enabled', true));
        ELSE
          safe_methods := safe_methods || jsonb_build_object(key, jsonb_build_object('enabled', true));
      END CASE;
    END IF;
  END LOOP;

  RETURN safe_methods;
END;
$$;

-- 6) Upsert RPC
CREATE OR REPLACE FUNCTION public.upsert_creator_payment_profile(p_methods jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.creator_payment_profiles (creator_id, methods, updated_at)
  VALUES (auth.uid(), p_methods, now())
  ON CONFLICT (creator_id) DO UPDATE
  SET methods = p_methods, updated_at = now();
END;
$$;

NOTIFY pgrst, 'reload schema';
