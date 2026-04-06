
CREATE TABLE public.builder_media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  surface_id UUID REFERENCES public.builder_surfaces(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  public_url TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'image',
  source_type TEXT NOT NULL DEFAULT 'upload',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.builder_media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media assets"
  ON public.builder_media_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media assets"
  ON public.builder_media_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media assets"
  ON public.builder_media_assets FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_builder_media_assets_user_surface
  ON public.builder_media_assets (user_id, surface_id);
