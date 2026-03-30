
-- Platform variants table for storing rendered aspect-ratio variants per design
CREATE TABLE public.social_platform_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id uuid NOT NULL REFERENCES public.social_generated_designs(id) ON DELETE CASCADE,
  platform text NOT NULL,
  aspect_ratio text NOT NULL DEFAULT '1:1',
  width integer NOT NULL DEFAULT 1000,
  height integer NOT NULL DEFAULT 1000,
  layer_transforms jsonb NOT NULL DEFAULT '[]',
  rendered_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_variants_design ON public.social_platform_variants (design_id);
CREATE UNIQUE INDEX idx_platform_variants_unique ON public.social_platform_variants (design_id, platform);

ALTER TABLE public.social_platform_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own platform variants"
  ON public.social_platform_variants FOR ALL TO authenticated
  USING (
    design_id IN (
      SELECT id FROM public.social_generated_designs WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    design_id IN (
      SELECT id FROM public.social_generated_designs WHERE user_id = auth.uid()
    )
  );
