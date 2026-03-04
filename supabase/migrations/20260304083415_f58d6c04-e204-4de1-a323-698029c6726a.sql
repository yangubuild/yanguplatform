
-- Table: dropship_connections
CREATE TABLE public.dropship_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  provider_key text NOT NULL,
  connection_status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dropship_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org connections"
  ON public.dropship_connections FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own org connections"
  ON public.dropship_connections FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid()));

-- Table: dropship_imports
CREATE TABLE public.dropship_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_surface_id uuid NOT NULL,
  provider_key text NOT NULL,
  external_product_id text NOT NULL,
  title text NOT NULL,
  images jsonb DEFAULT '[]',
  variants jsonb DEFAULT '[]',
  raw jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dropship_imports ENABLE ROW LEVEL SECURITY;

-- RLS: allow select/insert for authenticated users who own the surface via org membership
CREATE POLICY "Users can view imports for their surfaces"
  ON public.dropship_imports FOR SELECT TO authenticated
  USING (shop_surface_id IN (
    SELECT bs.id FROM public.builder_surfaces bs
    JOIN public.org_memberships om ON om.org_id = bs.org_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert imports for their surfaces"
  ON public.dropship_imports FOR INSERT TO authenticated
  WITH CHECK (shop_surface_id IN (
    SELECT bs.id FROM public.builder_surfaces bs
    JOIN public.org_memberships om ON om.org_id = bs.org_id
    WHERE om.user_id = auth.uid()
  ));

-- RPC: import_external_product_to_shop
CREATE OR REPLACE FUNCTION public.import_external_product_to_shop(
  p_provider_key text,
  p_external_product_id text,
  p_shop_surface_id uuid,
  p_title text,
  p_images jsonb DEFAULT '[]',
  p_variants jsonb DEFAULT '[]',
  p_raw jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_id uuid;
BEGIN
  INSERT INTO public.dropship_imports (
    shop_surface_id, provider_key, external_product_id, title, images, variants, raw
  ) VALUES (
    p_shop_surface_id, p_provider_key, p_external_product_id, p_title, p_images, p_variants, p_raw
  )
  RETURNING id INTO v_id;

  SELECT jsonb_build_object(
    'id', di.id,
    'shop_surface_id', di.shop_surface_id,
    'provider_key', di.provider_key,
    'external_product_id', di.external_product_id,
    'title', di.title,
    'images', di.images,
    'variants', di.variants,
    'created_at', di.created_at
  ) INTO v_result
  FROM public.dropship_imports di
  WHERE di.id = v_id;

  RETURN v_result;
END;
$$;
