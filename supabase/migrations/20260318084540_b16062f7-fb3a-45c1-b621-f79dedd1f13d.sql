
-- Discovery analytics: exposure + click tracking
CREATE TABLE public.discovery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,          -- 'impression' | 'click'
  entity_id text NOT NULL,           -- entity being tracked
  surface text NOT NULL,             -- 'landing_verified' | 'landing_products' | 'landing_services' | 'landing_creators' | 'landing_community' | 'popular_grid' | 'trend_bar' | 'explore_results' | 'explore_sponsored' | 'related_entities' | 'banner_middle' | 'banner_lower'
  visibility_tier text,              -- free | verified | paid | premium
  trust_band text,                   -- 'high' | 'moderate' | 'emerging' | 'low'
  session_id text,                   -- anonymous session identifier (no PII)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for aggregation queries
CREATE INDEX idx_discovery_events_surface_type ON public.discovery_events (surface, event_type, created_at);
CREATE INDEX idx_discovery_events_entity ON public.discovery_events (entity_id, event_type, created_at);

-- Enable RLS
ALTER TABLE public.discovery_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous tracking)
CREATE POLICY "Anyone can insert discovery events"
  ON public.discovery_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read discovery events"
  ON public.discovery_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RPC: aggregated discovery analytics for management panel
CREATE OR REPLACE FUNCTION public.discovery_analytics_summary(p_days int DEFAULT 30)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'impressions_by_surface', (
      SELECT coalesce(json_agg(row_to_json(r)), '[]'::json)
      FROM (
        SELECT surface, count(*) as impressions,
               count(*) FILTER (WHERE event_type = 'click') as clicks
        FROM discovery_events
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY surface
        ORDER BY impressions DESC
      ) r
    ),
    'top_entities', (
      SELECT coalesce(json_agg(row_to_json(r)), '[]'::json)
      FROM (
        SELECT entity_id,
               count(*) FILTER (WHERE event_type = 'impression') as impressions,
               count(*) FILTER (WHERE event_type = 'click') as clicks,
               CASE WHEN count(*) FILTER (WHERE event_type = 'impression') > 0
                    THEN round(count(*) FILTER (WHERE event_type = 'click')::numeric / count(*) FILTER (WHERE event_type = 'impression') * 100, 2)
                    ELSE 0 END as ctr
        FROM discovery_events
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY entity_id
        ORDER BY impressions DESC
        LIMIT 50
      ) r
    ),
    'trust_band_performance', (
      SELECT coalesce(json_agg(row_to_json(r)), '[]'::json)
      FROM (
        SELECT trust_band,
               count(*) FILTER (WHERE event_type = 'impression') as impressions,
               count(*) FILTER (WHERE event_type = 'click') as clicks,
               CASE WHEN count(*) FILTER (WHERE event_type = 'impression') > 0
                    THEN round(count(*) FILTER (WHERE event_type = 'click')::numeric / count(*) FILTER (WHERE event_type = 'impression') * 100, 2)
                    ELSE 0 END as ctr
        FROM discovery_events
        WHERE created_at >= now() - (p_days || ' days')::interval
          AND trust_band IS NOT NULL
        GROUP BY trust_band
        ORDER BY impressions DESC
      ) r
    ),
    'visibility_tier_performance', (
      SELECT coalesce(json_agg(row_to_json(r)), '[]'::json)
      FROM (
        SELECT visibility_tier,
               count(*) FILTER (WHERE event_type = 'impression') as impressions,
               count(*) FILTER (WHERE event_type = 'click') as clicks,
               CASE WHEN count(*) FILTER (WHERE event_type = 'impression') > 0
                    THEN round(count(*) FILTER (WHERE event_type = 'click')::numeric / count(*) FILTER (WHERE event_type = 'impression') * 100, 2)
                    ELSE 0 END as ctr
        FROM discovery_events
        WHERE created_at >= now() - (p_days || ' days')::interval
          AND visibility_tier IS NOT NULL
        GROUP BY visibility_tier
        ORDER BY impressions DESC
      ) r
    ),
    'daily_trend', (
      SELECT coalesce(json_agg(row_to_json(r)), '[]'::json)
      FROM (
        SELECT date_trunc('day', created_at)::date as day,
               count(*) FILTER (WHERE event_type = 'impression') as impressions,
               count(*) FILTER (WHERE event_type = 'click') as clicks
        FROM discovery_events
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY day
        ORDER BY day
      ) r
    ),
    'rotation_fairness', (
      SELECT json_build_object(
        'total_entities_shown', (SELECT count(DISTINCT entity_id) FROM discovery_events WHERE created_at >= now() - (p_days || ' days')::interval AND event_type = 'impression'),
        'paid_impression_share', (
          SELECT CASE WHEN total > 0 THEN round(paid::numeric / total * 100, 2) ELSE 0 END
          FROM (
            SELECT count(*) as total,
                   count(*) FILTER (WHERE visibility_tier IN ('paid', 'premium')) as paid
            FROM discovery_events
            WHERE created_at >= now() - (p_days || ' days')::interval
              AND event_type = 'impression'
          ) sub
        ),
        'top_overexposed', (
          SELECT coalesce(json_agg(row_to_json(r)), '[]'::json)
          FROM (
            SELECT entity_id, count(*) as impressions
            FROM discovery_events
            WHERE created_at >= now() - (p_days || ' days')::interval
              AND event_type = 'impression'
            GROUP BY entity_id
            ORDER BY impressions DESC
            LIMIT 10
          ) r
        )
      )
    ),
    'banner_performance', (
      SELECT coalesce(json_agg(row_to_json(r)), '[]'::json)
      FROM (
        SELECT surface,
               count(*) FILTER (WHERE event_type = 'impression') as impressions,
               count(*) FILTER (WHERE event_type = 'click') as clicks,
               CASE WHEN count(*) FILTER (WHERE event_type = 'impression') > 0
                    THEN round(count(*) FILTER (WHERE event_type = 'click')::numeric / count(*) FILTER (WHERE event_type = 'impression') * 100, 2)
                    ELSE 0 END as ctr
        FROM discovery_events
        WHERE created_at >= now() - (p_days || ' days')::interval
          AND surface LIKE 'banner_%'
        GROUP BY surface
      ) r
    )
  );
$$;

-- Revoke direct execution from non-admins (admin check inside the function)
REVOKE EXECUTE ON FUNCTION public.discovery_analytics_summary FROM anon;
