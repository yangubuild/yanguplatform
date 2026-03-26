
-- Add created_at to public_profile_view (join date is public info for friend profiles)
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
  verified_tick,
  created_at
FROM profiles
WHERE account_status = 'active';

GRANT SELECT ON public.public_profile_view TO authenticated;
GRANT SELECT ON public.public_profile_view TO anon;
