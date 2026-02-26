
-- Drop the ambiguous 6-param overload of builder_upsert_section
-- Keep ONLY the 7-param version (with p_core_slot)
DROP FUNCTION IF EXISTS public.builder_upsert_section(uuid, uuid, text, jsonb, integer, boolean);
