
CREATE OR REPLACE FUNCTION public.evaluate_publish_eligibility(p_domain_id uuid, p_org_id uuid, p_slug text, p_surface_id uuid)
 RETURNS TABLE(eligible boolean, reasons text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM _evaluate_publish_eligibility_internal(
    p_org_id := p_org_id,
    p_domain_id := p_domain_id,
    p_surface_id := p_surface_id,
    p_user_id := auth.uid()
  );
END;
$function$;
