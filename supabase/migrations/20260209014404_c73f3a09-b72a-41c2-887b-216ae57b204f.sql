-- Update is_slug_available to only block actively published slugs
-- A slug is available if there's no active publish using it on the domain

CREATE OR REPLACE FUNCTION public.is_slug_available(_domain_id uuid, _slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Slug is available if no active publish exists with this slug on the domain
  SELECT NOT EXISTS (
    SELECT 1 FROM public.surface_publishes sp
    WHERE sp.domain_id = _domain_id
      AND LOWER(sp.slug) = LOWER(_slug)
      AND sp.state = 'published'
      AND sp.unpublished_at IS NULL
  )
$$;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.is_slug_available(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_slug_available(uuid, text) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';