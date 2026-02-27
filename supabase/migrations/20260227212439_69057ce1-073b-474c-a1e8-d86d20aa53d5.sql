
-- Update builder_publish_surface to sync into surface_publishes for route resolution
CREATE OR REPLACE FUNCTION public.builder_publish_surface(
  p_surface_id uuid,
  p_domain_id uuid,
  p_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_compiled jsonb;
  v_publish_id uuid;
  v_surface record;
  v_org_id uuid;
  v_core_surface_id uuid;
  v_normalized_slug text;
  v_sp_id uuid;
BEGIN
  -- Verify ownership
  SELECT * INTO v_surface
  FROM builder_surfaces bs
  WHERE bs.id = p_surface_id AND bs.user_id = auth.uid();

  IF v_surface IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'surface_not_found_or_not_owner');
  END IF;

  -- Verify domain exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM domains d WHERE d.id = p_domain_id AND d.is_active = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'domain_not_found_or_inactive');
  END IF;

  -- Resolve org_id: from builder_surface or user's org membership
  v_org_id := v_surface.org_id;
  IF v_org_id IS NULL THEN
    SELECT om.org_id INTO v_org_id
    FROM org_memberships om
    WHERE om.user_id = auth.uid()
    ORDER BY om.created_at ASC
    LIMIT 1;
  END IF;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_org_found');
  END IF;

  -- Normalize slug
  v_normalized_slug := coalesce(p_slug, v_surface.slug);
  v_normalized_slug := lower(trim(v_normalized_slug));
  v_normalized_slug := regexp_replace(v_normalized_slug, '\s+', '-', 'g');
  v_normalized_slug := regexp_replace(v_normalized_slug, '[^a-z0-9\-]', '', 'g');
  v_normalized_slug := regexp_replace(v_normalized_slug, '-+', '-', 'g');
  v_normalized_slug := trim(BOTH '-' FROM v_normalized_slug);

  -- Compile schema: surface meta + pages + sections
  SELECT jsonb_build_object(
    'surface', jsonb_build_object(
      'id', bs.id, 'surface_type', bs.surface_type,
      'title', bs.title, 'description', bs.description,
      'theme', bs.theme
    ),
    'pages', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'slug', bp.slug,
          'title', bp.title,
          'sections', coalesce((
            SELECT jsonb_agg(
              jsonb_build_object(
                'section_type', bsec.section_type,
                'schema', bsec.schema,
                'position', bsec.position
              ) ORDER BY bsec.position
            )
            FROM builder_sections bsec
            WHERE bsec.page_id = bp.id AND bsec.is_visible = true
          ), '[]'::jsonb)
        )
      )
      FROM builder_pages bp WHERE bp.surface_id = bs.id
    ), '[]'::jsonb)
  ) INTO v_compiled
  FROM builder_surfaces bs
  WHERE bs.id = p_surface_id;

  -- Upsert builder_publishes record
  INSERT INTO builder_publishes (surface_id, domain_id, slug, published_schema, state, published_at)
  VALUES (p_surface_id, p_domain_id, v_normalized_slug, v_compiled, 'published', now())
  ON CONFLICT (surface_id, slug) DO UPDATE SET
    domain_id = EXCLUDED.domain_id,
    published_schema = EXCLUDED.published_schema,
    state = 'published',
    published_at = now(),
    unpublished_at = NULL
  RETURNING id INTO v_publish_id;

  -- ═══ SYNC TO ROUTE RESOLVER ═══

  -- 1) Upsert into surfaces (core routing table)
  --    Map builder surface_type to surfaces surface_type
  INSERT INTO surfaces (id, org_id, surface_type, title, status, draft_slug, draft_domain_id)
  VALUES (p_surface_id, v_org_id, v_surface.surface_type::text, v_surface.title, 'published', v_normalized_slug, p_domain_id)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = 'published',
    draft_slug = EXCLUDED.draft_slug,
    draft_domain_id = EXCLUDED.draft_domain_id;

  -- 2) Upsert into surface_publishes (what resolve_route queries)
  --    Use unique index: (domain_id, slug) WHERE unpublished_at IS NULL
  --    First, unpublish any existing publish for this surface on this domain
  UPDATE surface_publishes
  SET unpublished_at = now(), state = 'unpublished'
  WHERE surface_id = p_surface_id
    AND domain_id = p_domain_id
    AND unpublished_at IS NULL;

  -- Insert fresh publish
  INSERT INTO surface_publishes (org_id, domain_id, surface_id, slug, state, is_primary, published_at)
  VALUES (v_org_id, p_domain_id, p_surface_id, v_normalized_slug, 'published', false, now())
  RETURNING id INTO v_sp_id;

  -- Update builder_surfaces org_id if it was null
  IF v_surface.org_id IS NULL THEN
    UPDATE builder_surfaces SET org_id = v_org_id WHERE id = p_surface_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'publish_id', v_publish_id, 'route_publish_id', v_sp_id);
END;
$$;
