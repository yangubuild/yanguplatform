
-- ============ surface_views ============
CREATE TABLE IF NOT EXISTS public.surface_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_id uuid NOT NULL REFERENCES public.builder_surfaces(id) ON DELETE CASCADE,
  path text,
  referrer text,
  user_agent text,
  country text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_surface_views_surface_created
  ON public.surface_views (surface_id, created_at DESC);

GRANT INSERT ON public.surface_views TO anon, authenticated;
GRANT SELECT ON public.surface_views TO authenticated;
GRANT ALL ON public.surface_views TO service_role;

ALTER TABLE public.surface_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a surface view"
  ON public.surface_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Surface owner can read their views"
  ON public.surface_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_surfaces s
      WHERE s.id = surface_views.surface_id
        AND s.user_id = auth.uid()
    )
  );

-- ============ link_clicks ============
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_id uuid NOT NULL REFERENCES public.builder_surfaces(id) ON DELETE CASCADE,
  target_url text NOT NULL,
  label text,
  path text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_link_clicks_surface_created
  ON public.link_clicks (surface_id, created_at DESC);

GRANT INSERT ON public.link_clicks TO anon, authenticated;
GRANT SELECT ON public.link_clicks TO authenticated;
GRANT ALL ON public.link_clicks TO service_role;

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a link click"
  ON public.link_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Surface owner can read their link clicks"
  ON public.link_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_surfaces s
      WHERE s.id = link_clicks.surface_id
        AND s.user_id = auth.uid()
    )
  );

-- ============ aggregator RPC ============
CREATE OR REPLACE FUNCTION public.surface_analytics_overview(
  p_surface_id uuid,
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_since timestamptz := now() - make_interval(days => greatest(p_days, 1));
  v_result jsonb;
BEGIN
  SELECT user_id INTO v_owner FROM public.builder_surfaces WHERE id = p_surface_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Surface not found';
  END IF;
  IF v_owner <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  WITH
    v AS (
      SELECT * FROM public.surface_views
      WHERE surface_id = p_surface_id AND created_at >= v_since
    ),
    c AS (
      SELECT * FROM public.link_clicks
      WHERE surface_id = p_surface_id AND created_at >= v_since
    ),
    daily AS (
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
             count(*)::int AS views,
             count(DISTINCT coalesce(session_id, id::text))::int AS visitors
      FROM v
      GROUP BY 1
      ORDER BY 1
    ),
    refs AS (
      SELECT coalesce(nullif(referrer, ''), 'Direct') AS referrer, count(*)::int AS n
      FROM v
      GROUP BY 1
      ORDER BY n DESC
      LIMIT 10
    ),
    paths AS (
      SELECT coalesce(nullif(path, ''), '/') AS path, count(*)::int AS n
      FROM v
      GROUP BY 1
      ORDER BY n DESC
      LIMIT 10
    ),
    clicks_top AS (
      SELECT target_url, coalesce(label, '') AS label, count(*)::int AS n
      FROM c
      GROUP BY 1, 2
      ORDER BY n DESC
      LIMIT 10
    )
  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'views', (SELECT count(*) FROM v),
      'visitors', (SELECT count(DISTINCT coalesce(session_id, id::text)) FROM v),
      'clicks', (SELECT count(*) FROM c),
      'days', p_days
    ),
    'daily', coalesce((SELECT jsonb_agg(to_jsonb(daily)) FROM daily), '[]'::jsonb),
    'referrers', coalesce((SELECT jsonb_agg(to_jsonb(refs)) FROM refs), '[]'::jsonb),
    'paths', coalesce((SELECT jsonb_agg(to_jsonb(paths)) FROM paths), '[]'::jsonb),
    'top_clicks', coalesce((SELECT jsonb_agg(to_jsonb(clicks_top)) FROM clicks_top), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.surface_analytics_overview(uuid, integer) TO authenticated;
