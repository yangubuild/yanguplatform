ALTER TABLE public.builder_surfaces DISABLE TRIGGER trg_enforce_surface_type_lock;

UPDATE public.builder_surfaces
SET surface_type = 'community_group'
WHERE id = '79afaedc-0b16-4cd8-be45-d3e65716ada9'
  AND surface_type = 'community_listing';

ALTER TABLE public.builder_surfaces ENABLE TRIGGER trg_enforce_surface_type_lock;