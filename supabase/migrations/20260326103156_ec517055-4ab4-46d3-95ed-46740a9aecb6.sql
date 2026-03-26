
-- The security_invoker view won't work because cross-user reads have no RLS permission.
-- The correct pattern is security_definer with ONLY safe columns — this is intentional.
-- Recreate as security_definer (default) which is the correct pattern for public profile views.
DROP VIEW IF EXISTS public.public_profile_view;

CREATE VIEW public.public_profile_view AS
SELECT
  id,
  username,
  display_name,
  avatar_url,
  avatar_mode,
  avatar_emoji_key,
  cover_url,
  cover_crop,
  social_links,
  business_name,
  country,
  creator_type,
  verified_tick
FROM profiles
WHERE account_status = 'active';

-- Grant SELECT to authenticated and anon (for public profile pages)
GRANT SELECT ON public.public_profile_view TO authenticated;
GRANT SELECT ON public.public_profile_view TO anon;
