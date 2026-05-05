-- Permanently retire HTML snapshot publishing across all surface types.
-- 1) Clear builder_new_html and pages_html from builder_surfaces.metadata
UPDATE public.builder_surfaces
SET metadata = COALESCE(metadata, '{}'::jsonb)
  - 'builder_new_html'
  - 'pages_html';

-- 2) Remove emenu_html from published_schema.surface in builder_publishes
UPDATE public.builder_publishes
SET published_schema = jsonb_set(
  published_schema,
  '{surface}',
  COALESCE(published_schema->'surface', '{}'::jsonb) - 'emenu_html'
)
WHERE published_schema ? 'surface';
