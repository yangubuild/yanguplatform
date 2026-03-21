-- Fix searchable entity sync to use authoritative builder_surfaces.cover_image_url
-- and re-sync whenever builder_surfaces changes.

CREATE OR REPLACE FUNCTION public.sync_searchable_entity(p_surface_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_surface RECORD;
  v_builder RECORD;
  v_publish RECORD;
  v_entity_type searchable_entity_type;
  v_entity_subtype entity_subtype;
  v_industry text;
  v_description text;
  v_tags text[] := '{}';
  v_category text;
  v_cover text;
  v_is_published boolean := false;
  v_domain_host text;
  v_slug text;
  v_owner_user_id uuid;
  v_visibility visibility_tier := 'free';
  v_is_verified boolean := false;
  v_pub_at timestamptz;
BEGIN
  SELECT * INTO v_surface FROM public.surfaces WHERE id = p_surface_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_surface.draft_slug IS NOT NULL THEN
    SELECT * INTO v_builder FROM public.builder_surfaces WHERE slug = v_surface.draft_slug LIMIT 1;
  END IF;

  SELECT om.user_id INTO v_owner_user_id
    FROM public.org_memberships om WHERE om.org_id = v_surface.org_id
    ORDER BY om.created_at ASC LIMIT 1;

  IF v_owner_user_id IS NULL AND v_builder.id IS NOT NULL THEN
    v_owner_user_id := v_builder.user_id;
  END IF;
  IF v_owner_user_id IS NULL THEN RETURN; END IF;

  IF v_builder.id IS NOT NULL THEN
    v_industry := v_builder.metadata->>'industry';
    IF v_industry IS NULL THEN v_industry := v_builder.metadata->>'niche'; END IF;
    v_description := v_builder.description;
    v_category := v_industry;

    -- Authoritative cover source: dedicated column only.
    v_cover := NULLIF(BTRIM(v_builder.cover_image_url), '');

    IF v_builder.metadata->'tags' IS NOT NULL THEN
      SELECT array_agg(t.value) INTO v_tags
      FROM jsonb_array_elements_text(v_builder.metadata->'tags') AS t(value);
      v_tags := COALESCE(v_tags, '{}');
    END IF;
  END IF;

  v_entity_type := public.derive_entity_type(
    COALESCE(v_builder.surface_type::text, v_surface.surface_type)
  );
  v_entity_subtype := public.derive_entity_subtype(
    COALESCE(v_builder.surface_type::text, v_surface.surface_type),
    v_industry
  );

  SELECT sp.slug, sp.published_at, d.host
    INTO v_slug, v_pub_at, v_domain_host
    FROM public.surface_publishes sp
    JOIN public.domains d ON d.id = sp.domain_id
    WHERE sp.surface_id = p_surface_id
      AND sp.state = 'published'
      AND sp.unpublished_at IS NULL
    ORDER BY sp.published_at DESC NULLS LAST LIMIT 1;

  IF v_domain_host IS NOT NULL THEN
    v_is_published := true;
  ELSE
    v_slug := v_surface.draft_slug;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.kyc_verifications WHERE user_id = v_owner_user_id AND status = 'approved'
  ) INTO v_is_verified;

  IF EXISTS (
    SELECT 1 FROM public.community_promotions cp
    WHERE cp.surface_id = p_surface_id AND cp.is_active = true
      AND (cp.ends_at IS NULL OR cp.ends_at > now())
  ) THEN
    v_visibility := 'paid';
  ELSIF v_is_verified THEN
    v_visibility := 'verified';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_entitlements ue
    WHERE ue.user_id = v_owner_user_id AND ue.plan_id IN ('pro','enterprise')
  ) THEN
    IF v_visibility IN ('paid','verified') THEN v_visibility := 'premium';
    ELSE v_visibility := 'paid';
    END IF;
  END IF;

  INSERT INTO public.searchable_entities (
    surface_id, builder_surface_id, owner_user_id, owner_org_id,
    entity_type, entity_subtype,
    title, short_description, primary_category, tags,
    is_searchable, is_published, is_verified,
    visibility_tier, is_ad_eligible,
    domain_host, slug,
    industry, surface_type, builder_surface_type,
    cover_image_url, published_at
  ) VALUES (
    p_surface_id, v_builder.id, v_owner_user_id, v_surface.org_id,
    v_entity_type, v_entity_subtype,
    COALESCE(v_surface.title, v_builder.title, 'Untitled'),
    v_description, v_category, v_tags,
    v_is_published AND v_surface.archived_at IS NULL
      AND v_cover IS NOT NULL
      AND v_cover NOT LIKE 'data:%',
    v_is_published, v_is_verified,
    v_visibility,
    v_is_published AND v_surface.archived_at IS NULL,
    v_domain_host, v_slug,
    v_industry, v_surface.surface_type,
    v_builder.surface_type::text,
    v_cover, v_pub_at
  )
  ON CONFLICT (surface_id) DO UPDATE SET
    builder_surface_id = EXCLUDED.builder_surface_id,
    owner_user_id = EXCLUDED.owner_user_id,
    owner_org_id = EXCLUDED.owner_org_id,
    entity_type = EXCLUDED.entity_type,
    entity_subtype = EXCLUDED.entity_subtype,
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    primary_category = EXCLUDED.primary_category,
    tags = EXCLUDED.tags,
    is_searchable = EXCLUDED.is_searchable,
    is_published = EXCLUDED.is_published,
    is_verified = EXCLUDED.is_verified,
    visibility_tier = EXCLUDED.visibility_tier,
    is_ad_eligible = EXCLUDED.is_ad_eligible,
    domain_host = EXCLUDED.domain_host,
    slug = EXCLUDED.slug,
    industry = EXCLUDED.industry,
    surface_type = EXCLUDED.surface_type,
    builder_surface_type = EXCLUDED.builder_surface_type,
    cover_image_url = EXCLUDED.cover_image_url,
    published_at = EXCLUDED.published_at,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_sync_searchable_on_builder_surface()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_surface_id uuid;
BEGIN
  SELECT s.id INTO v_surface_id
  FROM public.surfaces s
  WHERE s.draft_slug = NEW.slug
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_surface_id IS NOT NULL THEN
    PERFORM public.sync_searchable_entity(v_surface_id);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_searchable_on_builder_surface_change ON public.builder_surfaces;
CREATE TRIGGER sync_searchable_on_builder_surface_change
  AFTER INSERT OR UPDATE ON public.builder_surfaces
  FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_searchable_on_builder_surface();

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT s.id
    FROM public.surfaces s
    WHERE s.draft_slug IS NOT NULL
  LOOP
    PERFORM public.sync_searchable_entity(r.id);
  END LOOP;
END $$;