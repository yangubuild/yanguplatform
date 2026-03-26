
-- 1. Update public_profile_view to include all active profiles (not just those with published surfaces)
-- This is needed because chat, messaging, follows, team panels need to resolve any user's display info
CREATE OR REPLACE VIEW public.public_profile_view AS
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

-- 2. Drop the broad "Authenticated users can view active profiles" SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view active profiles" ON public.profiles;

-- Now profiles SELECT = own row + admin only
-- Cross-user reads go through public_profile_view (no RLS, safe columns only)
