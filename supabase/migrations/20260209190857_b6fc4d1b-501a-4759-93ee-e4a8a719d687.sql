
CREATE OR REPLACE FUNCTION public.resolve_route(p_host text, p_path text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_host text;
  v_path text;
  v_slug text;
  v_username text;
  d record;
  pub record;
BEGIN
  -- Normalize host: lowercase, strip www.
  v_host := lower(coalesce(p_host, ''));
  IF left(v_host, 4) = 'www.' THEN
    v_host := substring(v_host from 5);
  END IF;

  -- Normalize path
  v_path := coalesce(p_path, '/');
  IF v_path = '' THEN v_path := '/'; END IF;

  -- Resolve domain by host + is_active
  SELECT * INTO d
  FROM public.domains
  WHERE host = v_host AND is_active = true
  LIMIT 1;

  IF d IS NULL THEN
    RETURN jsonb_build_object(
      'route_kind', 'not_found',
      'reason', 'unknown_host',
      'host', v_host
    );
  END IF;

  -- Root path: try primary publish
  IF v_path = '/' THEN
    SELECT sp.* INTO pub
    FROM public.surface_publishes sp
    WHERE sp.domain_id = d.id
      AND sp.is_primary = true
      AND sp.state = 'published'
      AND sp.unpublished_at IS NULL
    LIMIT 1;

    IF pub IS NOT NULL THEN
      RETURN jsonb_build_object(
        'route_kind', 'surface',
        'publish_id', pub.id,
        'surface_id', pub.surface_id,
        'domain_id', d.id,
        'host', d.host,
        'domain_type', d.domain_type
      );
    END IF;

    RETURN jsonb_build_object(
      'route_kind', 'platform_home',
      'domain_id', d.id,
      'host', d.host,
      'domain_type', d.domain_type
    );
  END IF;

  -- /@username → identity_profile
  IF left(v_path, 2) = '/@' THEN
    v_username := substring(v_path from 3);
    RETURN jsonb_build_object(
      'route_kind', 'identity_profile',
      'username', v_username,
      'domain_id', d.id,
      'host', d.host,
      'domain_type', d.domain_type
    );
  END IF;

  -- Slug: first path segment only
  v_slug := split_part(ltrim(v_path, '/'), '/', 1);

  SELECT sp.* INTO pub
  FROM public.surface_publishes sp
  WHERE sp.domain_id = d.id
    AND sp.slug = v_slug
    AND sp.state = 'published'
    AND sp.unpublished_at IS NULL
  LIMIT 1;

  IF pub IS NULL THEN
    RETURN jsonb_build_object(
      'route_kind', 'not_found',
      'reason', 'no_publish_for_slug',
      'slug', v_slug,
      'domain_id', d.id,
      'host', d.host,
      'domain_type', d.domain_type
    );
  END IF;

  RETURN jsonb_build_object(
    'route_kind', 'surface',
    'publish_id', pub.id,
    'surface_id', pub.surface_id,
    'slug', pub.slug,
    'domain_id', d.id,
    'host', d.host,
    'domain_type', d.domain_type
  );
END;
$function$;
