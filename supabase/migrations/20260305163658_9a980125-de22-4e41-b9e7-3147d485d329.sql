
-- Update the RPC to store pricing fields AND add product to builder_sections
CREATE OR REPLACE FUNCTION public.import_external_product_to_shop(
  p_provider_key text,
  p_external_product_id text,
  p_shop_surface_id text,
  p_title text,
  p_images text DEFAULT '[]',
  p_variants text DEFAULT '[]',
  p_raw text DEFAULT '{}',
  p_provider_currency text DEFAULT 'USD',
  p_provider_price_cents integer DEFAULT 0,
  p_display_currency text DEFAULT 'USD',
  p_display_price_cents integer DEFAULT 0,
  p_fx_rate numeric DEFAULT 1,
  p_fx_rate_timestamp text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_id uuid;
  v_page_id uuid;
  v_section_id uuid;
  v_first_image text;
  v_images_arr jsonb;
  v_price_display text;
BEGIN
  -- Upsert into dropship_imports
  INSERT INTO public.dropship_imports (
    shop_surface_id, provider_key, external_product_id, title, images, variants, raw,
    provider_currency, provider_price_cents, display_currency, display_price_cents,
    fx_rate, fx_rate_timestamp, sync_status
  ) VALUES (
    p_shop_surface_id, p_provider_key, p_external_product_id, p_title,
    p_images::jsonb, p_variants::jsonb, p_raw::jsonb,
    p_provider_currency, p_provider_price_cents, p_display_currency, p_display_price_cents,
    p_fx_rate, CASE WHEN p_fx_rate_timestamp IS NOT NULL THEN p_fx_rate_timestamp::timestamptz ELSE now() END,
    'synced'
  )
  ON CONFLICT (provider_key, external_product_id, shop_surface_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    images = EXCLUDED.images,
    variants = EXCLUDED.variants,
    raw = EXCLUDED.raw,
    provider_currency = EXCLUDED.provider_currency,
    provider_price_cents = EXCLUDED.provider_price_cents,
    display_currency = EXCLUDED.display_currency,
    display_price_cents = EXCLUDED.display_price_cents,
    fx_rate = EXCLUDED.fx_rate,
    fx_rate_timestamp = EXCLUDED.fx_rate_timestamp,
    sync_status = 'synced',
    last_synced_at = now()
  RETURNING id INTO v_id;

  -- Find the products section for this surface
  SELECT bs.id, bp.id INTO v_section_id, v_page_id
  FROM builder_sections bs
  JOIN builder_pages bp ON bp.id = bs.page_id
  WHERE bp.surface_id = p_shop_surface_id::uuid
    AND bs.section_type = 'products'
  ORDER BY bs.position
  LIMIT 1;

  -- If products section exists, append the product
  IF v_section_id IS NOT NULL THEN
    -- Get first image
    v_images_arr := p_images::jsonb;
    IF jsonb_array_length(v_images_arr) > 0 THEN
      v_first_image := v_images_arr->>0;
    ELSE
      v_first_image := '';
    END IF;

    -- Format price for display
    IF p_display_price_cents > 0 THEN
      v_price_display := (p_display_price_cents / 100.0)::text;
    ELSE
      v_price_display := '';
    END IF;

    -- Append product item to the section schema items array
    UPDATE builder_sections
    SET schema = jsonb_set(
      schema,
      '{items}',
      COALESCE(schema->'items', '[]'::jsonb) || jsonb_build_object(
        'name', p_title,
        'price', v_price_display,
        'image_url', v_first_image,
        'description', 'Sourced via ' || p_provider_key,
        'source', 'dropship',
        'dropship_import_id', v_id::text,
        'provider_key', p_provider_key,
        'external_product_id', p_external_product_id
      )
    ),
    updated_at = now()
    WHERE id = v_section_id;
  END IF;

  SELECT jsonb_build_object(
    'id', di.id,
    'shop_surface_id', di.shop_surface_id,
    'provider_key', di.provider_key,
    'external_product_id', di.external_product_id,
    'title', di.title,
    'images', di.images,
    'variants', di.variants,
    'created_at', di.created_at,
    'provider_currency', di.provider_currency,
    'provider_price_cents', di.provider_price_cents,
    'display_currency', di.display_currency,
    'display_price_cents', di.display_price_cents,
    'section_updated', v_section_id IS NOT NULL
  ) INTO v_result
  FROM public.dropship_imports di
  WHERE di.id = v_id;

  RETURN v_result;
END;
$$;

-- Add unique constraint for upsert if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dropship_imports_provider_product_surface_unique'
  ) THEN
    ALTER TABLE public.dropship_imports
    ADD CONSTRAINT dropship_imports_provider_product_surface_unique
    UNIQUE (provider_key, external_product_id, shop_surface_id);
  END IF;
END $$;
