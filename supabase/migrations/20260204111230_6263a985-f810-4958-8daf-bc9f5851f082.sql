-- PHASE 2 — Step 2: Central routing resolver (host + path)

CREATE OR REPLACE FUNCTION public.resolve_route(p_host text, p_path text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  d record;
  clean_path text;
  slug text;
  username text;
  pub record;
BEGIN
  -- Normalize path
  clean_path := COALESCE(p_path, '/');
  IF clean_path = '' THEN clean_path := '/'; END IF;

  -- Find domain
  SELECT * INTO d
  FROM public.domains
  WHERE host = p_host
  LIMIT 1;

  IF d IS NULL THEN
    RETURN jsonb_build_object(
      'route_kind','not_found',
      'reason','unknown_host'
    );
  END IF;

  -- CUSTOM DOMAIN → fixed publish
  IF d.kind = 'custom' THEN
    IF d.points_to_surface_publish_id IS NULL THEN
      RETURN jsonb_build_object(
        'route_kind','platform_home',
        'domain_id', d.id,
        'host', d.host,
        'reason','custom_domain_no_target'
      );
    END IF;

    SELECT sp.* INTO pub
    FROM public.surface_publishes sp
    WHERE sp.id = d.points_to_surface_publish_id
      AND sp.unpublished_at IS NULL
    LIMIT 1;

    IF pub IS NULL THEN
      RETURN jsonb_build_object(
        'route_kind','platform_home',
        'domain_id', d.id,
        'host', d.host,
        'reason','custom_domain_target_unpublished'
      );
    END IF;

    RETURN jsonb_build_object(
      'route_kind','surface',
      'publish_id', pub.id,
      'surface_id', pub.surface_id,
      'domain_id', d.id,
      'host', d.host
    );
  END IF;

  -- PLATFORM DOMAIN
  -- "/" → primary surface or platform home
  IF clean_path = '/' THEN
    SELECT sp.* INTO pub
    FROM public.surface_publishes sp
    WHERE sp.domain_id = d.id
      AND sp.is_primary = true
      AND sp.unpublished_at IS NULL
    ORDER BY sp.published_at DESC NULLS LAST
    LIMIT 1;

    IF pub IS NOT NULL THEN
      RETURN jsonb_build_object(
        'route_kind','surface',
        'publish_id', pub.id,
        'surface_id', pub.surface_id,
        'domain_id', d.id,
        'host', d.host,
        'platform_key', d.platform_key
      );
    END IF;

    RETURN jsonb_build_object(
      'route_kind','platform_home',
      'platform_key', d.platform_key,
      'domain_id', d.id,
      'host', d.host
    );
  END IF;

  -- "/@username" → identity hub
  IF left(clean_path, 2) = '/@' THEN
    username := substring(clean_path from 3);
    RETURN jsonb_build_object(
      'route_kind','identity_profile',
      'username', username,
      'domain_id', d.id,
      'host', d.host,
      'platform_key', d.platform_key
    );
  END IF;

  -- "/slug" → surface by slug
  slug := regexp_replace(clean_path, '^/', '');
  slug := split_part(slug, '/', 1);

  SELECT sp.* INTO pub
  FROM public.surface_publishes sp
  WHERE sp.domain_id = d.id
    AND sp.slug = slug
    AND sp.unpublished_at IS NULL
  ORDER BY sp.published_at DESC NULLS LAST
  LIMIT 1;

  IF pub IS NULL THEN
    RETURN jsonb_build_object(
      'route_kind','not_found',
      'reason','no_publish_for_slug',
      'slug', slug,
      'domain_id', d.id,
      'host', d.host,
      'platform_key', d.platform_key
    );
  END IF;

  RETURN jsonb_build_object(
    'route_kind','surface',
    'publish_id', pub.id,
    'surface_id', pub.surface_id,
    'domain_id', d.id,
    'host', d.host,
    'platform_key', d.platform_key
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_route(text, text)
TO anon, authenticated;