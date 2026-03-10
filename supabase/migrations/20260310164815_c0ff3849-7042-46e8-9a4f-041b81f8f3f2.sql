
-- Fix SECURITY DEFINER views — change to SECURITY INVOKER
-- This ensures the views respect the calling user's permissions

ALTER VIEW public.public_profile_view SET (security_invoker = true);
ALTER VIEW public.public_ads_view SET (security_invoker = true);
ALTER VIEW public.public_vote_counts SET (security_invoker = true);

-- Grant read access on views to anon and authenticated
GRANT SELECT ON public.public_profile_view TO anon, authenticated;
GRANT SELECT ON public.public_ads_view TO anon, authenticated;
GRANT SELECT ON public.public_vote_counts TO anon, authenticated;
