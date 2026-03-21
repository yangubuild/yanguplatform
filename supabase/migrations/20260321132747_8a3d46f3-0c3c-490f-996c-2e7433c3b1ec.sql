-- Fix the owner_user_id for the kafeeroAz surface in searchable_entities
UPDATE searchable_entities 
SET owner_user_id = '81730258-d910-4e0b-84bf-d4c6e31e11c6'
WHERE id = '4fcc6700-dc36-42a3-8b8c-8c0f61bd45b0';

-- Also fix the sync_searchable_entity function to correctly pull user_id from builder_surfaces
CREATE OR REPLACE FUNCTION public.sync_searchable_entity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type text;
  v_entity_subtype text;
  v_primary_category text;
  v_builder_surface_type text;
  v_cover_image text;
  v_description text;
  v_owner_user_id uuid;
BEGIN
  -- Get builder surface data including the real owner
  SELECT bs.surface_type, bs.cover_image_url, 
         COALESCE(bs.seo_description, bs.description),
         bs.user_id
  INTO v_builder_surface_type, v_cover_image, v_description, v_owner_user_id
  FROM builder_surfaces bs
  WHERE bs.id = NEW.surface_id;

  -- Derive entity type from builder_surface_type
  v_entity_type := CASE
    WHEN v_builder_surface_type IN ('eshop','emenu','quick_site','store_listing') THEN 'business'
    WHEN v_builder_surface_type IN ('live_bio','live_selling') THEN 'creator'
    WHEN v_builder_surface_type IN ('community_group','community_listing') THEN 'community'
    WHEN v_builder_surface_type = 'studio_showcase' THEN 'project'
    ELSE 'business'
  END;

  v_entity_subtype := CASE
    WHEN v_builder_surface_type = 'live_bio' THEN 'influencer'
    WHEN v_builder_surface_type = 'community_listing' THEN 'leader'
    ELSE 'general'
  END;

  -- Derive primary_category from builder_surface_type
  v_primary_category := CASE
    WHEN v_builder_surface_type = 'eshop' THEN 'shop'
    WHEN v_builder_surface_type = 'emenu' THEN 'shop'
    WHEN v_builder_surface_type = 'esite' THEN 'services'
    WHEN v_builder_surface_type = 'estore' THEN 'store'
    WHEN v_builder_surface_type = 'store_listing' THEN 'store'
    WHEN v_builder_surface_type = 'live_bio' THEN 'influencer'
    WHEN v_builder_surface_type = 'live_selling' THEN 'creator'
    WHEN v_builder_surface_type = 'community_group' THEN 'community'
    WHEN v_builder_surface_type = 'community_listing' THEN 'community'
    WHEN v_builder_surface_type = 'studio_showcase' THEN 'studio'
    ELSE NULL
  END;

  INSERT INTO searchable_entities (
    surface_id, builder_surface_id, owner_user_id,
    entity_type, entity_subtype, title, short_description,
    primary_category, builder_surface_type, cover_image_url,
    is_searchable, is_published
  ) VALUES (
    NEW.surface_id, NEW.surface_id, v_owner_user_id,
    v_entity_type::searchable_entity_type,
    v_entity_subtype::entity_subtype,
    NEW.slug,
    v_description,
    v_primary_category,
    v_builder_surface_type,
    v_cover_image,
    CASE WHEN v_cover_image IS NOT NULL AND v_cover_image != '' AND v_cover_image NOT LIKE 'data:%' THEN true ELSE false END,
    true
  )
  ON CONFLICT (surface_id) DO UPDATE SET
    builder_surface_id = EXCLUDED.builder_surface_id,
    owner_user_id = v_owner_user_id,
    entity_type = EXCLUDED.entity_type,
    entity_subtype = EXCLUDED.entity_subtype,
    short_description = COALESCE(v_description, searchable_entities.short_description),
    primary_category = COALESCE(v_primary_category, searchable_entities.primary_category),
    builder_surface_type = COALESCE(v_builder_surface_type, searchable_entities.builder_surface_type),
    cover_image_url = COALESCE(v_cover_image, searchable_entities.cover_image_url),
    is_searchable = CASE WHEN COALESCE(v_cover_image, searchable_entities.cover_image_url) IS NOT NULL 
                         AND COALESCE(v_cover_image, searchable_entities.cover_image_url) != '' 
                         AND COALESCE(v_cover_image, searchable_entities.cover_image_url) NOT LIKE 'data:%' 
                    THEN true ELSE false END,
    is_published = true,
    updated_at = now();

  RETURN NEW;
END;
$$;