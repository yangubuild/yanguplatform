-- Add RLS policies for dropship_imports so users can read their own imports
-- First, we need to know which shop_surface_ids belong to the user via org membership

-- Policy: users can SELECT their own imports (via org membership on the surface)
CREATE POLICY "Users can read own imports"
  ON public.dropship_imports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.surfaces s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = dropship_imports.shop_surface_id
        AND om.user_id = auth.uid()
    )
  );

-- Policy: users can INSERT imports for surfaces they own
CREATE POLICY "Users can insert own imports"
  ON public.dropship_imports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.surfaces s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = dropship_imports.shop_surface_id
        AND om.user_id = auth.uid()
    )
  );
