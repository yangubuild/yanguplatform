
-- Add unique constraint for upsert support
ALTER TABLE public.dropship_connections
  ADD CONSTRAINT dropship_connections_org_provider_unique UNIQUE (org_id, provider_key);

-- Add DELETE policy so users can disconnect
CREATE POLICY "Users can delete own org connections"
  ON public.dropship_connections FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid()));

-- Add UPDATE policy so users can update connection status
CREATE POLICY "Users can update own org connections"
  ON public.dropship_connections FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid()));
