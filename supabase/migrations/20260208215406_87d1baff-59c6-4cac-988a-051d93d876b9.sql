-- Step 1: Rename the existing function to internal
ALTER FUNCTION public.evaluate_publish_eligibility(p_org_id uuid, p_domain_id uuid, p_surface_id uuid, p_user_id uuid)
RENAME TO _evaluate_publish_eligibility_internal;

-- Step 2: Create new wrapper function with the expected signature
CREATE OR REPLACE FUNCTION public.evaluate_publish_eligibility(
  p_domain_id uuid,
  p_org_id uuid,
  p_slug text,
  p_surface_id uuid
)
RETURNS TABLE(eligible boolean, reasons text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Forward to internal function with named parameters
  -- Note: p_slug is not used by the internal function, p_user_id uses auth.uid()
  RETURN QUERY SELECT * FROM _evaluate_publish_eligibility_internal(
    p_org_id := p_org_id,
    p_domain_id := p_domain_id,
    p_surface_id := p_surface_id,
    p_user_id := auth.uid()
  );
END;
$$;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.evaluate_publish_eligibility(uuid, uuid, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.evaluate_publish_eligibility(uuid, uuid, text, uuid) TO authenticated;

-- Step 4: Trigger PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';