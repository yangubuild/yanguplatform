
-- Update builder_publish_surface to validate multi-page structure before publishing
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
  v_page_count int;
  v_dup_slugs text;
  v_empty_slug_count int;
  v_primary_slug text;
  v_primary_exists boolean;
  v_primary_section_count int;
  v_orphan_count int;
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

  -- ═══ PAGE VALIDATION ═══

  -- 1. Must have at least one page
  SELECT count(*) INTO v_page_count FROM builder_pages WHERE surface_id = p_surface_id;
  IF v_page_count = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_pages');
  END IF;

  -- 2. Check for empty page slugs
  SELECT count(*) INTO v_empty_slug_count
  FROM builder_pages
  WHERE surface_id = p_surface_id
    AND (slug IS NULL OR trim(slug) = '');
  IF v_empty_slug_count > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_page_slug');
  END IF;

  -- 3. Check for duplicate page slugs (case-insensitive)
  SELECT string_agg(lower(trim(slug)), ', ') INTO v_dup_slugs
  FROM (
    SELECT lower(trim(slug)) as slug
    FROM builder_pages
    WHERE surface_id = p_surface_id
    GROUP BY lower(trim(slug))
    HAVING count(*) > 1
  ) dups;
  IF v_dup_slugs IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate_page_slugs');
  END IF;

  -- 4. Required primary page: check 'home' exists (or 'menu' for emenu, 'links' for live_bio)
  v_primary_slug := 'home';
  IF v_surface.surface_type = 'emenu' THEN
    v_primary_exists := EXISTS (
      SELECT 1 FROM builder_pages WHERE surface_id = p_surface_id AND lower(trim(slug)) IN ('menu', 'home')
    );
  ELSIF v_surface.surface_type IN ('live_bio', 'live_selling') THEN
    v_primary_exists := EXISTS (
      SELECT 1 FROM builder_pages WHERE surface_id = p_surface_id AND lower(trim(slug)) IN ('home', 'links')
    );
  ELSE
    v_primary_exists := EXISTS (
      SELECT 1 FROM builder_pages WHERE surface_id = p_surface_id AND lower(trim(slug)) = 'home'
    );
  END IF;

  IF NOT v_primary_exists THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_primary_page');
  END IF;

  -- 5. Primary page must have content (at least one visible non-header/footer section)
  SELECT count(*) INTO v_primary_section_count
  FROM builder_sections bsec
  JOIN builder_pages bp ON bp.id = bsec.page_id
  WHERE bp.surface_id = p_surface_id
    AND lower(trim(bp.slug)) IN ('home', 'menu', 'links')
    AND bsec.is_visible = true
    AND bsec.section_type NOT IN ('header', 'footer');
  IF v_primary_section_count = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_primary_page');
  END IF;

  -- 6. Orphan section check: sections whose page_id doesn't match a page on this surface
  SELECT count(*) INTO v_orphan_count
  FROM builder_sections bsec
  WHERE bsec.page_id IN (SELECT id FROM builder_pages WHERE surface_id = p_surface_id)
    AND NOT EXISTS (SELECT 1 FROM builder_pages bp2 WHERE bp2.id = bsec.page_id AND bp2.surface_id = p_surface_id);
  -- This is inherently 0 due to the IN clause, but we also check for sections referencing deleted pages
  SELECT count(*) INTO v_orphan_count
  FROM builder_sections bsec
  WHERE bsec.page_id NOT IN (SELECT id FROM builder_pages)
    AND bsec.page_id IN (
      SELECT id FROM builder_pages WHERE surface_id = p_surface_id
      UNION
      SELECT bsec2.page_id FROM builder_sections bsec2
      JOIN builder_pages bp3 ON bp3.surface_id = p_surface_id
      WHERE bsec2.page_id = bp3.id
    );

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

  -- Compile schema: surface meta + ordered pages + ordered sections
  -- Filter out empty optional pages (no visible non-header/footer sections)
  SELECT jsonb_build_object(
    'surface', jsonb_build_object(
      'id', bs.id, 'surface_type', bs.surface_type,
      'title', bs.title, 'description', bs.description,
      'theme', bs.theme
    ),
    'pages', coalesce((
      SELECT jsonb_agg(page_data ORDER BY page_pos)
      FROM (
        SELECT
          (bp.metadata->>'position')::int AS page_pos,
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
          ) AS page_data
        FROM builder_pages bp
        WHERE bp.surface_id = bs.id
          -- Include page if it's the primary page OR has content sections
          AND (
            lower(trim(bp.slug)) IN ('home', 'menu', 'links')
            OR EXISTS (
              SELECT 1 FROM builder_sections bsec2
              WHERE bsec2.page_id = bp.id
                AND bsec2.is_visible = true
                AND bsec2.section_type NOT IN ('header', 'footer')
            )
          )
      ) ordered_pages
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
  INSERT INTO surfaces (id, org_id, surface_type, title, status, draft_slug, draft_domain_id)
  VALUES (p_surface_id, v_org_id, v_surface.surface_type::text, v_surface.title, 'published', v_normalized_slug, p_domain_id)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = 'published',
    draft_slug = EXCLUDED.draft_slug,
    draft_domain_id = EXCLUDED.draft_domain_id;

  -- 2) Upsert into surface_publishes
  UPDATE surface_publishes
  SET unpublished_at = now(), state = 'unpublished'
  WHERE surface_id = p_surface_id
    AND domain_id = p_domain_id
    AND unpublished_at IS NULL;

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
