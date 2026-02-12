
-- 1) community_promotions table
CREATE TABLE public.community_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_id uuid NOT NULL REFERENCES public.surfaces(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('trending','popular','category')),
  category_key text,
  tier int NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique active placement constraint
CREATE UNIQUE INDEX uq_community_promotions_active
  ON public.community_promotions (surface_id, section, category_key)
  WHERE is_active = true;

-- Query index
CREATE INDEX idx_community_promotions_lookup
  ON public.community_promotions (section, category_key, is_active, starts_at, ends_at);

-- RLS
ALTER TABLE public.community_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions"
  ON public.community_promotions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage promotions"
  ON public.community_promotions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER update_community_promotions_updated_at
  BEFORE UPDATE ON public.community_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) community_surface_stats table
CREATE TABLE public.community_surface_stats (
  surface_id uuid PRIMARY KEY REFERENCES public.surfaces(id) ON DELETE CASCADE,
  clicks_total bigint NOT NULL DEFAULT 0,
  clicks_7d bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_surface_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stats"
  ON public.community_surface_stats FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stats"
  ON public.community_surface_stats FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_community_surface_stats_updated_at
  BEFORE UPDATE ON public.community_surface_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) RPC: get_community_section
CREATE OR REPLACE FUNCTION public.get_community_section(
  p_section text,
  p_category_key text DEFAULT NULL,
  p_limit int DEFAULT 12,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  surface_id uuid,
  title text,
  org_id uuid,
  domain_host text,
  slug text,
  listed_at timestamptz,
  cover_image text,
  category text,
  price_text text,
  description text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS surface_id,
    s.title,
    s.org_id,
    d.host AS domain_host,
    sp.slug,
    cl.listed_at,
    NULL::text AS cover_image,
    NULL::text AS category,
    NULL::text AS price_text,
    NULL::text AS description
  FROM public.community_listings cl
  JOIN public.surfaces s ON s.id = cl.surface_id
  JOIN public.surface_publishes sp
    ON sp.surface_id = s.id
    AND sp.state = 'published'
    AND sp.unpublished_at IS NULL
  JOIN public.domains d ON d.id = sp.domain_id
  JOIN public.community_promotions cp
    ON cp.surface_id = s.id
    AND cp.section = p_section
    AND cp.is_active = true
    AND cp.starts_at <= now()
    AND (cp.ends_at IS NULL OR cp.ends_at > now())
    AND (p_section != 'category' OR cp.category_key = p_category_key)
  LEFT JOIN public.community_surface_stats css
    ON css.surface_id = s.id
  WHERE cl.status = 'active'
    AND s.archived_at IS NULL
  ORDER BY
    CASE WHEN p_section = 'popular'
      THEN COALESCE(css.clicks_7d, 0) ELSE 0 END DESC,
    cp.tier DESC,
    cp.starts_at DESC,
    cl.listed_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_community_section(text, text, int, int) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
