CREATE OR REPLACE FUNCTION public.builder_get_public_schema(p_host text, p_slug text DEFAULT 'home'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'ok', true,
    'publish_id', bpub.id,
    'published_schema', bpub.published_schema,
    'published_at', bpub.published_at
  )
  INTO v_result
  FROM public.builder_publishes bpub
  JOIN public.domains d ON d.id = bpub.domain_id
  WHERE d.host = p_host
    AND bpub.slug = p_slug
    AND bpub.state = 'published'
    AND bpub.published_at IS NOT NULL
    AND d.is_active = true
  ORDER BY bpub.updated_at DESC NULLS LAST,
           bpub.published_at DESC NULLS LAST,
           bpub.created_at DESC NULLS LAST,
           bpub.id DESC
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN v_result;
END;
$function$;