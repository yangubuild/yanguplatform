
-- Add creator type enum for user roles
CREATE TYPE public.creator_type AS ENUM ('seller', 'builder', 'organization', 'learner');

-- Add creator_type to profiles
ALTER TABLE public.profiles 
ADD COLUMN creator_type creator_type;

-- Function to get default domain for creator type
CREATE OR REPLACE FUNCTION public.get_default_domain_for_creator(_creator_type creator_type)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.surface_domains
  WHERE surface_type = CASE _creator_type
    WHEN 'seller' THEN 'shop'::surface_type
    WHEN 'builder' THEN 'studio'::surface_type
    WHEN 'organization' THEN 'community'::surface_type
    WHEN 'learner' THEN 'site'::surface_type
  END
  LIMIT 1
$$;

-- Check if slug is available for a domain
CREATE OR REPLACE FUNCTION public.is_slug_available(_domain_id UUID, _slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.public_surfaces
    WHERE domain_id = _domain_id AND LOWER(slug) = LOWER(_slug)
  )
$$;

-- Updated complete_onboarding to also create draft surface
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  _user_id UUID,
  _username TEXT,
  _display_name TEXT DEFAULT NULL,
  _creator_type creator_type DEFAULT 'builder',
  _surface_slug TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _domain_id UUID;
  _surface_id UUID;
  _final_slug TEXT;
BEGIN
  -- Validate username is provided
  IF _username IS NULL OR TRIM(_username) = '' THEN
    RAISE EXCEPTION 'Username is required';
  END IF;
  
  -- Check username availability
  IF NOT public.is_username_available(_username) THEN
    RAISE EXCEPTION 'Username is already taken';
  END IF;
  
  -- Validate username format (alphanumeric, underscores, 3-30 chars)
  IF NOT _username ~ '^[a-zA-Z0-9_]{3,30}$' THEN
    RAISE EXCEPTION 'Username must be 3-30 characters, alphanumeric and underscores only';
  END IF;

  -- Get default domain for creator type
  _domain_id := public.get_default_domain_for_creator(_creator_type);
  
  IF _domain_id IS NULL THEN
    RAISE EXCEPTION 'No domain found for creator type';
  END IF;

  -- Use provided slug or default to username
  _final_slug := COALESCE(NULLIF(TRIM(_surface_slug), ''), _username);
  
  -- Validate slug format
  IF NOT _final_slug ~ '^[a-zA-Z0-9_-]{3,30}$' THEN
    RAISE EXCEPTION 'Slug must be 3-30 characters, alphanumeric, underscores and hyphens only';
  END IF;

  -- Check slug availability
  IF NOT public.is_slug_available(_domain_id, _final_slug) THEN
    RAISE EXCEPTION 'This URL is already taken';
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET 
    username = _username,
    display_name = _display_name,
    creator_type = _creator_type,
    onboarding_completed = true
  WHERE id = _user_id;
  
  -- Create draft surface
  INSERT INTO public.public_surfaces (
    user_id,
    domain_id,
    slug,
    title,
    is_published
  ) VALUES (
    _user_id,
    _domain_id,
    LOWER(_final_slug),
    COALESCE(_display_name, _username) || '''s Space',
    false
  )
  RETURNING id INTO _surface_id;
  
  RETURN _surface_id;
END;
$$;
