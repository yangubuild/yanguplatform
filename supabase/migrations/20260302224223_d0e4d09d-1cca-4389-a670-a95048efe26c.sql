
-- =============================================
-- Platform Billing v1 — Tables, RLS, RPCs
-- =============================================

-- A) billing_customers
CREATE TABLE IF NOT EXISTS public.billing_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  paypal_payer_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own billing_customers"
  ON public.billing_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all billing_customers"
  ON public.billing_customers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert billing_customers"
  ON public.billing_customers FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update billing_customers"
  ON public.billing_customers FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- B) billing_subscriptions (with provider constraint)
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('stripe','paypal')),
  provider_sub_id text,
  plan_id text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own billing_subscriptions"
  ON public.billing_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all billing_subscriptions"
  ON public.billing_subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE for clients — service role only

-- C) billing_events (provider constraint + non-null payload)
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('stripe','paypal')),
  event_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS billing_events_provider_event_id_idx
  ON public.billing_events (provider, event_id)
  WHERE event_id IS NOT NULL;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read billing_events"
  ON public.billing_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE for clients — service role only

-- D) user_entitlements
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL DEFAULT 'free',
  published_surfaces_limit int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own entitlements"
  ON public.user_entitlements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all entitlements"
  ON public.user_entitlements FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No client INSERT/UPDATE/DELETE — service role + RPCs only

-- E) RPC: get_my_entitlements()
CREATE OR REPLACE FUNCTION public.get_my_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _email text;
  _is_admin boolean;
  _is_bypass boolean;
  _plan text;
  _limit int;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  _is_admin := public.has_role(_user_id, 'admin');
  _is_bypass := _is_admin OR lower(_email) IN ('yanguabuild@gmail.com','kafeeroaz@gmail.com');

  SELECT ue.plan_id, ue.published_surfaces_limit
    INTO _plan, _limit
    FROM public.user_entitlements ue
   WHERE ue.user_id = _user_id;

  IF NOT FOUND THEN
    _plan := 'free';
    _limit := 1;
  END IF;

  RETURN jsonb_build_object(
    'plan_id', _plan,
    'published_surfaces_limit', _limit,
    'is_admin_bypass', _is_bypass
  );
END;
$$;

-- F) RPC: can_publish_more_surfaces()
CREATE OR REPLACE FUNCTION public.can_publish_more_surfaces()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _email text;
  _is_admin boolean;
  _is_bypass boolean;
  _limit int;
  _count int;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  _is_admin := public.has_role(_user_id, 'admin');
  _is_bypass := _is_admin OR lower(_email) IN ('yanguabuild@gmail.com','kafeeroaz@gmail.com');

  IF _is_bypass THEN
    RETURN jsonb_build_object('allowed', true, 'limit', 999, 'published_count', 0, 'reason', 'admin_bypass');
  END IF;

  SELECT COALESCE(ue.published_surfaces_limit, 1)
    INTO _limit
    FROM public.user_entitlements ue
   WHERE ue.user_id = _user_id;

  IF NOT FOUND THEN _limit := 1; END IF;

  SELECT count(DISTINCT bp.surface_id)
    INTO _count
    FROM public.builder_publishes bp
    JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
   WHERE bs.user_id = _user_id
     AND bp.state = 'published';

  IF _count >= _limit THEN
    RETURN jsonb_build_object('allowed', false, 'limit', _limit, 'published_count', _count, 'reason', 'limit_reached');
  END IF;

  RETURN jsonb_build_object('allowed', true, 'limit', _limit, 'published_count', _count);
END;
$$;

-- G) RPC: ensure_my_entitlements()
CREATE OR REPLACE FUNCTION public.ensure_my_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
BEGIN
  INSERT INTO public.user_entitlements (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO UPDATE
    SET updated_at = now();

  RETURN public.get_my_entitlements();
END;
$$;
