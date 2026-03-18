
-- Drop old functions with old return types
DROP FUNCTION IF EXISTS public.search_entities(text,public.searchable_entity_type,public.entity_subtype,text,public.visibility_tier,boolean,integer,integer);
DROP FUNCTION IF EXISTS public.get_entity_by_slug(text);
