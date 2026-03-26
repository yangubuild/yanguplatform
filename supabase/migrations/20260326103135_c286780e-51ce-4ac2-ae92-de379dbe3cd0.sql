
-- Fix: Make the view use security_invoker (Postgres 15+) so it doesn't bypass RLS as definer
-- Since we want ANY authenticated user to read safe profile fields, we add a SELECT policy
-- on profiles that only exposes what public_profile_view needs, scoped to the view columns.
-- Actually simpler: just set the view to security invoker and add a thin SELECT policy.

-- Drop and recreate with security_invoker
DROP VIEW IF EXISTS public.public_profile_view;

CREATE VIEW public.public_profile_view
WITH (security_invoker = true)
AS
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

-- We need a SELECT policy that allows authenticated users to read ONLY via this view.
-- Since the view is security_invoker, it will use the calling user's RLS.
-- We need a narrow SELECT policy that allows reading the safe columns.
-- But RLS is row-level not column-level, so we use a SECURITY DEFINER function instead.

-- Create a safe RPC for cross-user profile lookups
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  avatar_mode text,
  avatar_emoji_key text,
  cover_url text,
  cover_crop jsonb,
  social_links jsonb,
  business_name text,
  country text,
  creator_type text,
  verified_tick text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    p.id, p.username, p.display_name, p.avatar_url,
    p.avatar_mode, p.avatar_emoji_key, p.cover_url, p.cover_crop,
    p.social_links, p.business_name, p.country, p.creator_type,
    p.verified_tick
  FROM profiles p
  WHERE p.id = ANY(p_user_ids)
    AND p.account_status = 'active';
$$;

-- Also a search version for messaging/discovery
CREATE OR REPLACE FUNCTION public.search_public_profiles(p_query text, p_limit integer DEFAULT 20)
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  avatar_mode text,
  avatar_emoji_key text,
  business_name text,
  country text,
  creator_type text,
  verified_tick text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    p.id, p.username, p.display_name, p.avatar_url,
    p.avatar_mode, p.avatar_emoji_key,
    p.business_name, p.country, p.creator_type, p.verified_tick
  FROM profiles p
  WHERE p.account_status = 'active'
    AND (
      p.username ILIKE '%' || p_query || '%'
      OR p.display_name ILIKE '%' || p_query || '%'
      OR p.business_name ILIKE '%' || p_query || '%'
    )
  LIMIT p_limit;
$$;
