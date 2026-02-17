
-- Fix: recreate view as SECURITY INVOKER (default) to avoid security definer warning
DROP VIEW IF EXISTS public.connected_accounts_safe;

CREATE VIEW public.connected_accounts_safe
  WITH (security_invoker = true)
AS
SELECT id, user_id, provider, provider_user_id, expires_at, created_at, updated_at
FROM public.connected_accounts;

GRANT SELECT ON public.connected_accounts_safe TO authenticated;
