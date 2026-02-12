
-- ============================================================
-- community_listings table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.community_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_id uuid NOT NULL REFERENCES public.surfaces(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','removed')),
  listed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_listings_surface_id_key UNIQUE (surface_id)
);

ALTER TABLE public.community_listings ENABLE ROW LEVEL SECURITY;

-- Idempotent policy drops
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.community_listings;
DROP POLICY IF EXISTS "Org owner/admin can manage listings" ON public.community_listings;

-- SELECT: anyone can see active listings
CREATE POLICY "Anyone can view active listings"
  ON public.community_listings FOR SELECT
  USING (status = 'active');

-- ALL: org owner/admin can manage listings for their surfaces
CREATE POLICY "Org owner/admin can manage listings"
  ON public.community_listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.surfaces s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = community_listings.surface_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.surfaces s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = community_listings.surface_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    )
  );

-- Grants
GRANT SELECT ON public.community_listings TO anon, authenticated;
GRANT ALL ON public.community_listings TO authenticated;

-- ============================================================
-- Trigger for updated_at (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_community_listings_updated_at ON public.community_listings;

CREATE TRIGGER update_community_listings_updated_at
  BEFORE UPDATE ON public.community_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RPC: can_list_on_community
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_list_on_community(p_surface_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.surfaces s
    JOIN public.org_memberships om ON om.org_id = s.org_id
    WHERE s.id = p_surface_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
      AND s.archived_at IS NULL
  );
END;
$$;

-- ============================================================
-- RPC: list_on_community
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_on_community(p_surface_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_can boolean;
BEGIN
  v_can := can_list_on_community(p_surface_id);
  IF NOT v_can THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied or surface not found');
  END IF;

  INSERT INTO public.community_listings (surface_id, status, listed_at)
  VALUES (p_surface_id, 'active', now())
  ON CONFLICT (surface_id) DO UPDATE
    SET status = 'active', listed_at = now(), updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC: unlist_from_community
-- ============================================================
CREATE OR REPLACE FUNCTION public.unlist_from_community(p_surface_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_can boolean;
BEGIN
  v_can := can_list_on_community(p_surface_id);
  IF NOT v_can THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied or surface not found');
  END IF;

  UPDATE public.community_listings
  SET status = 'removed', updated_at = now()
  WHERE surface_id = p_surface_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No listing found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grants for RPCs
GRANT EXECUTE ON FUNCTION public.can_list_on_community(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_on_community(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlist_from_community(uuid) TO anon, authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
