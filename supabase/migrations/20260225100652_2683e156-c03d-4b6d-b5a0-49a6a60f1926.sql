
-- ============================================================
-- YANGU Builder Core: Tables, RLS, RPCs
-- ============================================================

-- 1) ENUM for surface types
CREATE TYPE public.builder_surface_type AS ENUM (
  'live_bio', 'live_selling', 'quick_site', 'emenu',
  'eshop', 'community_group', 'store_listing', 'studio_showcase'
);

-- 2) builder_surfaces
CREATE TABLE public.builder_surfaces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.orgs(id),
  surface_type public.builder_surface_type NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  theme jsonb NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, surface_type, slug)
);
ALTER TABLE public.builder_surfaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can CRUD own builder surfaces"
  ON public.builder_surfaces FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all builder surfaces"
  ON public.builder_surfaces FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) builder_pages
CREATE TABLE public.builder_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surface_id uuid NOT NULL REFERENCES public.builder_surfaces(id) ON DELETE CASCADE,
  slug text NOT NULL DEFAULT 'home',
  title text NOT NULL DEFAULT 'Home',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(surface_id, slug)
);
ALTER TABLE public.builder_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can CRUD own builder pages"
  ON public.builder_pages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.builder_surfaces bs
    WHERE bs.id = builder_pages.surface_id AND bs.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.builder_surfaces bs
    WHERE bs.id = builder_pages.surface_id AND bs.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all builder pages"
  ON public.builder_pages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4) builder_sections
CREATE TABLE public.builder_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.builder_pages(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  schema jsonb NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.builder_sections ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_builder_sections_page_position ON public.builder_sections(page_id, position);

CREATE POLICY "Owners can CRUD own builder sections"
  ON public.builder_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.builder_pages bp
    JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
    WHERE bp.id = builder_sections.page_id AND bs.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.builder_pages bp
    JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
    WHERE bp.id = builder_sections.page_id AND bs.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all builder sections"
  ON public.builder_sections FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5) builder_publishes
CREATE TABLE public.builder_publishes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surface_id uuid NOT NULL REFERENCES public.builder_surfaces(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id),
  slug text NOT NULL DEFAULT 'home',
  published_schema jsonb NOT NULL DEFAULT '{}',
  state text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  unpublished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(surface_id, slug),
  UNIQUE(domain_id, slug)
);
ALTER TABLE public.builder_publishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own publishes"
  ON public.builder_publishes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.builder_surfaces bs
    WHERE bs.id = builder_publishes.surface_id AND bs.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.builder_surfaces bs
    WHERE bs.id = builder_publishes.surface_id AND bs.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all publishes"
  ON public.builder_publishes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read published pages"
  ON public.builder_publishes FOR SELECT
  USING (state = 'published');

-- 6) builder_events
CREATE TABLE public.builder_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publish_id uuid NOT NULL REFERENCES public.builder_publishes(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.builder_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_builder_events_publish ON public.builder_events(publish_id, event_type, created_at DESC);

CREATE POLICY "Anyone can insert builder events"
  ON public.builder_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can read own surface events"
  ON public.builder_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.builder_publishes bp
    JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
    WHERE bp.id = builder_events.publish_id AND bs.user_id = auth.uid()
  ));

CREATE POLICY "Admins can read all events"
  ON public.builder_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 7) updated_at triggers
CREATE TRIGGER update_builder_surfaces_updated_at
  BEFORE UPDATE ON public.builder_surfaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_builder_pages_updated_at
  BEFORE UPDATE ON public.builder_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_builder_sections_updated_at
  BEFORE UPDATE ON public.builder_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_builder_publishes_updated_at
  BEFORE UPDATE ON public.builder_publishes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RPCs
-- ============================================================

-- A) builder_get_editor_state: returns pages + ordered sections for a surface
CREATE OR REPLACE FUNCTION public.builder_get_editor_state(p_surface_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_surface jsonb;
  v_pages jsonb;
BEGIN
  -- Verify ownership
  SELECT to_jsonb(bs.*) INTO v_surface
  FROM builder_surfaces bs
  WHERE bs.id = p_surface_id AND bs.user_id = auth.uid();

  IF v_surface IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'surface_not_found_or_not_owner');
  END IF;

  SELECT coalesce(jsonb_agg(page_data ORDER BY page_data->>'slug'), '[]'::jsonb)
  INTO v_pages
  FROM (
    SELECT jsonb_build_object(
      'id', bp.id,
      'slug', bp.slug,
      'title', bp.title,
      'sections', coalesce((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', bsec.id,
            'section_type', bsec.section_type,
            'schema', bsec.schema,
            'position', bsec.position,
            'is_visible', bsec.is_visible
          ) ORDER BY bsec.position
        )
        FROM builder_sections bsec
        WHERE bsec.page_id = bp.id
      ), '[]'::jsonb)
    ) AS page_data
    FROM builder_pages bp
    WHERE bp.surface_id = p_surface_id
  ) sub;

  RETURN jsonb_build_object('ok', true, 'surface', v_surface, 'pages', v_pages);
END;
$$;

-- B) builder_upsert_section
CREATE OR REPLACE FUNCTION public.builder_upsert_section(
  p_page_id uuid,
  p_section_id uuid DEFAULT NULL,
  p_section_type text DEFAULT 'generic',
  p_schema jsonb DEFAULT '{}',
  p_position integer DEFAULT 0,
  p_is_visible boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_section_id uuid;
BEGIN
  -- Verify ownership via page -> surface
  IF NOT EXISTS (
    SELECT 1 FROM builder_pages bp
    JOIN builder_surfaces bs ON bs.id = bp.surface_id
    WHERE bp.id = p_page_id AND bs.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'page_not_found_or_not_owner');
  END IF;

  IF p_section_id IS NOT NULL THEN
    -- Update existing
    UPDATE builder_sections SET
      section_type = p_section_type,
      schema = p_schema,
      position = p_position,
      is_visible = p_is_visible
    WHERE id = p_section_id AND page_id = p_page_id;
    v_section_id := p_section_id;
  ELSE
    -- Insert new
    INSERT INTO builder_sections (page_id, section_type, schema, position, is_visible)
    VALUES (p_page_id, p_section_type, p_schema, p_position, p_is_visible)
    RETURNING id INTO v_section_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'section_id', v_section_id);
END;
$$;

-- C) builder_reorder_sections
CREATE OR REPLACE FUNCTION public.builder_reorder_sections(
  p_page_id uuid,
  p_ordered_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i integer;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM builder_pages bp
    JOIN builder_surfaces bs ON bs.id = bp.surface_id
    WHERE bp.id = p_page_id AND bs.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'page_not_found_or_not_owner');
  END IF;

  FOR i IN 1..array_length(p_ordered_ids, 1) LOOP
    UPDATE builder_sections
    SET position = i - 1
    WHERE id = p_ordered_ids[i] AND page_id = p_page_id;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'count', array_length(p_ordered_ids, 1));
END;
$$;

-- D) builder_publish_surface
CREATE OR REPLACE FUNCTION public.builder_publish_surface(
  p_surface_id uuid,
  p_domain_id uuid,
  p_slug text DEFAULT 'home'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_compiled jsonb;
  v_publish_id uuid;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM builder_surfaces bs
    WHERE bs.id = p_surface_id AND bs.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'surface_not_found_or_not_owner');
  END IF;

  -- Verify domain exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM domains d WHERE d.id = p_domain_id AND d.is_active = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'domain_not_found_or_inactive');
  END IF;

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

  -- Upsert publish record
  INSERT INTO builder_publishes (surface_id, domain_id, slug, published_schema, state, published_at)
  VALUES (p_surface_id, p_domain_id, p_slug, v_compiled, 'published', now())
  ON CONFLICT (surface_id, slug) DO UPDATE SET
    domain_id = EXCLUDED.domain_id,
    published_schema = EXCLUDED.published_schema,
    state = 'published',
    published_at = now(),
    unpublished_at = NULL
  RETURNING id INTO v_publish_id;

  RETURN jsonb_build_object('ok', true, 'publish_id', v_publish_id);
END;
$$;

-- E) builder_unpublish_surface
CREATE OR REPLACE FUNCTION public.builder_unpublish_surface(p_publish_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM builder_publishes bpub
    JOIN builder_surfaces bs ON bs.id = bpub.surface_id
    WHERE bpub.id = p_publish_id AND bs.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'publish_not_found_or_not_owner');
  END IF;

  UPDATE builder_publishes
  SET state = 'unpublished', unpublished_at = now()
  WHERE id = p_publish_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- F) builder_get_public_schema (public resolver — no auth needed)
CREATE OR REPLACE FUNCTION public.builder_get_public_schema(
  p_host text,
  p_slug text DEFAULT 'home'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'ok', true,
    'publish_id', bpub.id,
    'published_schema', bpub.published_schema,
    'published_at', bpub.published_at
  ) INTO v_result
  FROM builder_publishes bpub
  JOIN domains d ON d.id = bpub.domain_id
  WHERE d.host = p_host
    AND bpub.slug = p_slug
    AND bpub.state = 'published'
    AND d.is_active = true
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN v_result;
END;
$$;
