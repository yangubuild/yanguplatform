-- =========================================================================
-- Fix 1: Security Definer View → security invoker
-- =========================================================================
DROP VIEW IF EXISTS public.public_profile_view;
CREATE VIEW public.public_profile_view
WITH (security_invoker = true) AS
SELECT id, username, display_name, avatar_url, avatar_mode, avatar_emoji_key,
       cover_url, cover_crop, social_links, business_name, country,
       creator_type, verified_tick, created_at
FROM public.profiles
WHERE account_status = 'active';

GRANT SELECT ON public.public_profile_view TO anon, authenticated;

-- =========================================================================
-- Fix 2: orders — remove `OR true` from SELECT policy
-- =========================================================================
DROP POLICY IF EXISTS "Owners and visitors can read orders" ON public.orders;
CREATE POLICY "Owners buyers and admins can read orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  (EXISTS (SELECT 1 FROM public.builder_surfaces bs WHERE bs.id = orders.surface_id AND bs.user_id = auth.uid()))
  OR (buyer_user_id IS NOT NULL AND buyer_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Lock down INSERT: guests allowed, but cannot impersonate another user
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Public can create orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (
  buyer_user_id IS NULL OR buyer_user_id = auth.uid()
);

-- =========================================================================
-- Fix 3: order_items — restrict reads and tighten writes
-- =========================================================================
DROP POLICY IF EXISTS "Anyone can read order items" ON public.order_items;
CREATE POLICY "Owners buyers and admins can read order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    LEFT JOIN public.builder_surfaces bs ON bs.id = o.surface_id
    WHERE o.id = order_items.order_id
      AND (
        bs.user_id = auth.uid()
        OR (o.buyer_user_id IS NOT NULL AND o.buyer_user_id = auth.uid())
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Public can insert items into fresh orders"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.created_at > (now() - interval '30 minutes')
      AND (o.buyer_user_id IS NULL OR o.buyer_user_id = auth.uid())
  )
);

-- =========================================================================
-- Fix 4: surface_commerce_config — hide payment creds, expose safe public view
-- =========================================================================
DROP POLICY IF EXISTS "Anyone can read commerce config" ON public.surface_commerce_config;
CREATE POLICY "Owners and admins can read commerce config"
ON public.surface_commerce_config FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Public view exposes only the fields needed by public checkout UI.
-- Excludes: stripe_account_id, paypal_email, mobile_money_phone,
-- mobile_money_account_name, support_email, support_phone (PII).
-- Keeps: payment_methods list, currency, public toggles, support_whatsapp,
-- stripe_publishable_key (publishable by design).
DROP VIEW IF EXISTS public.surface_commerce_config_public;
CREATE VIEW public.surface_commerce_config_public
WITH (security_invoker = true) AS
SELECT
  id,
  surface_id,
  ordering_enabled,
  order_types,
  currency,
  payment_methods,
  mobile_money_provider,
  mobile_money_country,
  stripe_enabled,
  stripe_publishable_key,
  paypal_enabled,
  whatsapp_enabled,
  whatsapp_default_message,
  support_whatsapp,
  min_order_value_cents,
  delivery_fee_cents
FROM public.surface_commerce_config;

GRANT SELECT ON public.surface_commerce_config_public TO anon, authenticated;

-- =========================================================================
-- Fix 5: realtime.messages — enable RLS with authenticated-only access
-- =========================================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_users_read_realtime" ON realtime.messages;
CREATE POLICY "auth_users_read_realtime"
ON realtime.messages FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "auth_users_write_realtime" ON realtime.messages;
CREATE POLICY "auth_users_write_realtime"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (true);
