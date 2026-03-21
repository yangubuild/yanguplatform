DROP FUNCTION IF EXISTS public.search_entities(
  p_query text,
  p_entity_type searchable_entity_type,
  p_entity_subtype entity_subtype,
  p_category text,
  p_visibility_tier visibility_tier,
  p_verified_only boolean,
  p_limit integer,
  p_offset integer
);