-- Derive entity_type from surface_type string
CREATE OR REPLACE FUNCTION public.derive_entity_type(p_surface_type text)
RETURNS public.searchable_entity_type
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_surface_type
    WHEN 'eshop' THEN 'business'::public.searchable_entity_type
    WHEN 'emenu' THEN 'business'::public.searchable_entity_type
    WHEN 'quick_site' THEN 'business'::public.searchable_entity_type
    WHEN 'store_listing' THEN 'business'::public.searchable_entity_type
    WHEN 'live_bio' THEN 'creator'::public.searchable_entity_type
    WHEN 'live_selling' THEN 'creator'::public.searchable_entity_type
    WHEN 'community_group' THEN 'community'::public.searchable_entity_type
    WHEN 'community_listing' THEN 'community'::public.searchable_entity_type
    WHEN 'studio_showcase' THEN 'project'::public.searchable_entity_type
    ELSE 'business'::public.searchable_entity_type
  END;
$$;

-- Derive entity_subtype from surface_type + industry
CREATE OR REPLACE FUNCTION public.derive_entity_subtype(
  p_surface_type text,
  p_industry text DEFAULT NULL
)
RETURNS public.entity_subtype
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'church' THEN 'church'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'pastors' THEN 'ministry'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'ngo' THEN 'ngo'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'school' THEN 'school'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'institutions' THEN 'institution'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'coaches' THEN 'coach'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'freelancers' THEN 'freelancer'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'leaders' THEN 'leader'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'professional' THEN 'professional_network'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing') AND p_industry = 'therapists' THEN 'consultant'::public.entity_subtype
    WHEN p_surface_type = 'live_bio' THEN 'influencer'::public.entity_subtype
    WHEN p_surface_type = 'live_selling' THEN 'influencer'::public.entity_subtype
    ELSE 'general'::public.entity_subtype
  END;
$$;

-- Main sync function
CREATE OR REPLACE FUNCTION public.sync_searchable_entity(p_surface_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SELECT * INTO v_surface FROM surfaces WHERE id = p_surface_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_surface.draft_slug IS NOT NULL THEN
    SELECT * INTO v_builder FROM builder_surfaces WHERE slug = v_surface.draft_slug LIMIT 1;
  END IF;

  SELECT om.user_id INTO v_owner_user_id
    FROM org_memberships om WHERE om.org_id = v_surface.org_id
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
    v_cover := v_builder.metadata->>'cover_image_url';
    IF v_cover IS NULL AND v_builder.metadata->'photos' IS NOT NULL
       AND jsonb_array_length(v_builder.metadata->'photos') > 0 THEN
      v_cover := v_builder.metadata->'photos'->>0;
    END IF;
    IF v_builder.metadata->'tags' IS NOT NULL THEN
      SELECT array_agg(t.value) INTO v_tags
        FROM jsonb_array_elements_text(v_builder.metadata->'tags') AS t(value);
      v_tags := COALESCE(v_tags, '{}');
    END IF;
  END IF;

  v_entity_type := derive_entity_type(
    COALESCE(v_builder.surface_type::text, v_surface.surface_type)
  );
  v_entity_subtype := derive_entity_subtype(
    COALESCE(v_builder.surface_type::text, v_surface.surface_type),
    v_industry
  );

  SELECT sp.slug, sp.published_at, d.host
    INTO v_slug, v_pub_at, v_domain_host
    FROM surface_publishes sp
    JOIN domains d ON d.id = sp.domain_id
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
    SELECT 1 FROM kyc_verifications WHERE user_id = v_owner_user_id AND status = 'approved'
  ) INTO v_is_verified;

  IF EXISTS (
    SELECT 1 FROM community_promotions cp
    WHERE cp.surface_id = p_surface_id AND cp.is_active = true
      AND (cp.ends_at IS NULL OR cp.ends_at > now())
  ) THEN
    v_visibility := 'paid';
  ELSIF v_is_verified THEN
    v_visibility := 'verified';
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_entitlements ue
    WHERE ue.user_id = v_owner_user_id AND ue.plan_id IN ('pro','enterprise')
  ) THEN
    IF v_visibility IN ('paid','verified') THEN v_visibility := 'premium';
    ELSE v_visibility := 'paid';
    END IF;
  END IF;

  INSERT INTO searchable_entities (
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
    v_is_published AND v_surface.archived_at IS NULL,
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
$$;

-- Trigger on surface_publishes
CREATE OR REPLACE FUNCTION public.trigger_sync_searchable_on_publish()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM sync_searchable_entity(NEW.surface_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_searchable_on_publish_change
  AFTER INSERT OR UPDATE ON public.surface_publishes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_searchable_on_publish();

-- Trigger on surfaces
CREATE OR REPLACE FUNCTION public.trigger_sync_searchable_on_surface()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM sync_searchable_entity(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_searchable_on_surface_change
  AFTER INSERT OR UPDATE ON public.surfaces
  FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_searchable_on_surface();