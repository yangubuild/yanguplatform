-- PHASE 2 — Step 4e: Canonicalize host inside resolve_route (www fix)

CREATE OR REPLACE FUNCTION public.resolve_route(p_host text, p_path text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  d record;
  clean_path text;
  v_slug text;
  v_username text;
  pub record;
  v_host text;
BEGIN
  -- Normalize host (KEY FIX)
  v_host := lower(coalesce(p_host, ''));
  IF left(v_host, 4) = 'www.' THEN
    v_host := substring(v_host from 5);
  END IF;

  -- Normalize path
  clean_path := COALESCE(p_path, '/');
  IF clean_path = '' THEN clean_path := '/'; END IF;

  -- Find domain using canonical host
  SELECT * INTO d
  FROM public.domains
  WHERE host = v_host
  LIMIT 1;

  IF d IS NULL THEN
    RETURN jsonb_build_object(
      'route_kind','not_found',
      'reason','unknown_host',
      'host', v_host
    );
  END IF;

  -- CUSTOM DOMAIN
  IF d.kind = 'custom' THEN
    IF d.points_to_surface_publish_id IS NULL THEN
      RETURN jsonb_build_object('route_kind','platform_home');
    END IF;

    SELECT sp.* INTO pub
    FROM public.surface_publishes sp
    WHERE sp.id = d.points_to_surface_publish_id
      AND sp.unpublished_at IS NULL
    LIMIT 1;

    IF pub IS NULL THEN
      RETURN jsonb_build_object('route_kind','platform_home');
    END IF;

    RETURN jsonb_build_object(
      'route_kind','surface',
      'publish_id', pub.id,
      'surface_id', pub.surface_id
    );
  END IF;

  -- "/" route
  IF clean_path = '/' THEN
    SELECT sp.* INTO pub
    FROM public.surface_publishes sp
    WHERE sp.domain_id = d.id
      AND sp.is_primary = true
      AND sp.unpublished_at IS NULL
    LIMIT 1;

    IF pub IS NOT NULL THEN
      RETURN jsonb_build_object(
        'route_kind','surface',
        'publish_id', pub.id,
        'surface_id', pub.surface_id
      );
    END IF;

    RETURN jsonb_build_object(
      'route_kind','platform_home',
      'platform_key', d.platform_key
    );
  END IF;

  -- "/@username"
  IF left(clean_path, 2) = '/@' THEN
    v_username := substring(clean_path from 3);
    RETURN jsonb_build_object(
      'route_kind','identity_profile',
      'username', v_username
    );
  END IF;

  -- "/slug"
  v_slug := regexp_replace(clean_path, '^/', '');
  v_slug := split_part(v_slug, '/', 1);

  SELECT sp.* INTO pub
  FROM public.surface_publishes sp
  WHERE sp.domain_id = d.id
    AND sp.slug = v_slug
    AND sp.unpublished_at IS NULL
  LIMIT 1;

  IF pub IS NULL THEN
    RETURN jsonb_build_object(
      'route_kind','not_found',
      'reason','no_publish_for_slug',
      'slug', v_slug
    );
  END IF;

  RETURN jsonb_build_object(
    'route_kind','surface',
    'publish_id', pub.id,
    'surface_id', pub.surface_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_route(text, text)
TO anon, authenticated;