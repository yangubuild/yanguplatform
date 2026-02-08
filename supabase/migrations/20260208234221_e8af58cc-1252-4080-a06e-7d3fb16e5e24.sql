-- Create additional wrapper function with uuid slug parameter (for overload)
CREATE OR REPLACE FUNCTION public.evaluate_publish_eligibility(
  p_domain_id uuid,
  p_org_id uuid,
  p_slug uuid,
  p_surface_id uuid
)
RETURNS TABLE(eligible boolean, reasons text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Forward to internal function with named parameters
  -- Note: p_slug (uuid) is ignored by the internal function, p_user_id uses auth.uid()
  RETURN QUERY SELECT * FROM _evaluate_publish_eligibility_internal(
    p_org_id := p_org_id,
    p_domain_id := p_domain_id,
    p_surface_id := p_surface_id,
    p_user_id := auth.uid()
  );
END;
$$;

-- Grant execute permissions for the uuid,uuid,uuid,uuid signature
GRANT EXECUTE ON FUNCTION public.evaluate_publish_eligibility(uuid, uuid, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.evaluate_publish_eligibility(uuid, uuid, uuid, uuid) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';