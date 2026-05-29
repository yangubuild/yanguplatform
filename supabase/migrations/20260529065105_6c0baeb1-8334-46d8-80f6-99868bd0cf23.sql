
-- Fix dashboard regression: public_profile_view (security_invoker) now hides other users' profiles
-- because profiles RLS only allows owner+admin SELECT. Add a public-read policy so the safe
-- columns exposed by public_profile_view are visible to everyone for active accounts.
DROP POLICY IF EXISTS "Public can view active profiles" ON public.profiles;
CREATE POLICY "Public can view active profiles"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (account_status = 'active');

-- Restore buyer-facing contact fields to the public commerce view.
-- These are intentionally public (sellers display them on checkout). Only true
-- credentials remain private: stripe_account_id, stripe_publishable_key, paypal_email.
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
  mobile_money_phone,
  mobile_money_account_name,
  stripe_enabled,
  paypal_enabled,
  whatsapp_enabled,
  whatsapp_default_message,
  support_whatsapp,
  support_email,
  support_phone,
  min_order_value_cents,
  delivery_fee_cents
FROM public.surface_commerce_config;

GRANT SELECT ON public.surface_commerce_config_public TO anon, authenticated;
