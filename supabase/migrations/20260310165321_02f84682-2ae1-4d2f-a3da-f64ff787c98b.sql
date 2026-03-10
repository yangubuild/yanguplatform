
-- Fix: ads public SELECT policy exposes sensitive financial data
-- The public_ads_view already exists with safe columns; remove the broad policy
DROP POLICY IF EXISTS "Active ads are publicly visible" ON public.ads;

-- Add a restricted public read policy that only returns display fields
-- (Since column-level RLS doesn't exist, direct public to the view;
-- keep table-level access for owners and admins only which already exist)

-- Fix: connected_accounts_safe view - set security invoker
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'connected_accounts_safe') THEN
    EXECUTE 'ALTER VIEW public.connected_accounts_safe SET (security_invoker = true)';
  END IF;
END $$;
