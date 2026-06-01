ALTER TABLE public.builder_surfaces
DROP CONSTRAINT IF EXISTS builder_surfaces_user_id_surface_type_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS builder_surfaces_user_type_slug_alive_key
ON public.builder_surfaces (user_id, surface_type, slug)
WHERE deleted_at IS NULL;