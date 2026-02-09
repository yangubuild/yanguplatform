
CREATE OR REPLACE FUNCTION public.get_published_surface(p_publish_id uuid DEFAULT NULL, p_surface_id uuid DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  pub record;
  surf record;
  dom record;
BEGIN
  -- Find the publish record
  IF p_publish_id IS NOT NULL THEN
    SELECT * INTO pub
    FROM public.surface_publishes
    WHERE id = p_publish_id
      AND state = 'published'
      AND unpublished_at IS NULL
    LIMIT 1;
  ELSIF p_surface_id IS NOT NULL THEN
    SELECT * INTO pub
    FROM public.surface_publishes
    WHERE surface_id = p_surface_id
      AND state = 'published'
      AND unpublished_at IS NULL
    ORDER BY is_primary DESC, published_at DESC
    LIMIT 1;
  ELSE
    RETURN jsonb_build_object('error', 'Must provide p_publish_id or p_surface_id');
  END IF;

  IF pub IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- Fetch the surface
  SELECT * INTO surf
  FROM public.surfaces
  WHERE id = pub.surface_id
  LIMIT 1;

  -- Fetch the domain
  SELECT * INTO dom
  FROM public.domains
  WHERE id = pub.domain_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'surface_id', surf.id,
    'title', surf.title,
    'surface_type', surf.kind,
    'publish_id', pub.id,
    'slug', pub.slug,
    'domain_host', dom.host,
    'domain_type', dom.domain_type,
    'org_id', pub.org_id
  );
END;
$function$;
