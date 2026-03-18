
-- Phase 10: Exposure tuning signals table
-- Stores computed optimization signals per entity, refreshed periodically

CREATE TABLE public.exposure_tuning_signals (
  entity_id TEXT PRIMARY KEY,
  impressions_7d INTEGER NOT NULL DEFAULT 0,
  clicks_7d INTEGER NOT NULL DEFAULT 0,
  ctr_7d NUMERIC(5,4) NOT NULL DEFAULT 0,
  overexposure_score NUMERIC(4,3) NOT NULL DEFAULT 0,
  cooldown_factor NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  ctr_boost NUMERIC(4,3) NOT NULL DEFAULT 0,
  trend_engagement_score NUMERIC(4,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups during rotation
CREATE INDEX idx_exposure_tuning_entity ON public.exposure_tuning_signals (entity_id);

-- Banner optimization signals
CREATE TABLE public.banner_optimization_signals (
  slot TEXT PRIMARY KEY,
  impressions_7d INTEGER NOT NULL DEFAULT 0,
  clicks_7d INTEGER NOT NULL DEFAULT 0,
  ctr_7d NUMERIC(5,4) NOT NULL DEFAULT 0,
  recommended_weight NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: read-only for all, write via RPC/service role
ALTER TABLE public.exposure_tuning_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_optimization_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exposure tuning signals"
  ON public.exposure_tuning_signals FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read banner optimization signals"
  ON public.banner_optimization_signals FOR SELECT
  USING (true);

-- RPC to refresh exposure tuning signals from discovery_events
CREATE OR REPLACE FUNCTION public.refresh_exposure_tuning_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_impressions NUMERIC;
BEGIN
  -- Clear and rebuild
  DELETE FROM exposure_tuning_signals;

  -- Aggregate last 7 days
  INSERT INTO exposure_tuning_signals (entity_id, impressions_7d, clicks_7d, ctr_7d, updated_at)
  SELECT
    entity_id,
    COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions_7d,
    COUNT(*) FILTER (WHERE event_type = 'click') AS clicks_7d,
    CASE
      WHEN COUNT(*) FILTER (WHERE event_type = 'impression') > 0
      THEN ROUND(COUNT(*) FILTER (WHERE event_type = 'click')::NUMERIC / COUNT(*) FILTER (WHERE event_type = 'impression'), 4)
      ELSE 0
    END AS ctr_7d,
    now()
  FROM discovery_events
  WHERE created_at >= now() - interval '7 days'
  GROUP BY entity_id;

  -- Compute average impressions for overexposure detection
  SELECT COALESCE(AVG(impressions_7d), 1) INTO avg_impressions FROM exposure_tuning_signals;

  -- Set overexposure_score (0 = normal, 1 = heavily overexposed)
  UPDATE exposure_tuning_signals
  SET overexposure_score = LEAST(1.0, GREATEST(0, (impressions_7d - avg_impressions) / GREATEST(avg_impressions, 1)));

  -- Set cooldown_factor: overexposed entities get reduced (min 0.7)
  UPDATE exposure_tuning_signals
  SET cooldown_factor = GREATEST(0.7, 1.0 - (overexposure_score * 0.3));

  -- Set CTR boost: high CTR gets small positive, low CTR gets slight negative
  -- Neutral at avg CTR, max +0.15 / -0.10
  UPDATE exposure_tuning_signals
  SET ctr_boost = CASE
    WHEN impressions_7d < 10 THEN 0  -- not enough data
    WHEN ctr_7d > 0.05 THEN LEAST(0.15, (ctr_7d - 0.03) * 3)
    WHEN ctr_7d < 0.01 THEN GREATEST(-0.10, (ctr_7d - 0.02) * 5)
    ELSE 0
  END;

  -- Set trend engagement score
  UPDATE exposure_tuning_signals
  SET trend_engagement_score = CASE
    WHEN impressions_7d < 5 THEN 0
    WHEN ctr_7d >= 0.04 THEN 1.0
    WHEN ctr_7d >= 0.02 THEN 0.6
    ELSE 0.3
  END;
END;
$$;

-- RPC to refresh banner optimization signals
CREATE OR REPLACE FUNCTION public.refresh_banner_optimization_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM banner_optimization_signals;

  INSERT INTO banner_optimization_signals (slot, impressions_7d, clicks_7d, ctr_7d, recommended_weight, updated_at)
  SELECT
    surface,
    COUNT(*) FILTER (WHERE event_type = 'impression'),
    COUNT(*) FILTER (WHERE event_type = 'click'),
    CASE
      WHEN COUNT(*) FILTER (WHERE event_type = 'impression') > 0
      THEN ROUND(COUNT(*) FILTER (WHERE event_type = 'click')::NUMERIC / COUNT(*) FILTER (WHERE event_type = 'impression'), 4)
      ELSE 0
    END,
    -- Higher CTR banners get more weight (range 0.8–1.2)
    CASE
      WHEN COUNT(*) FILTER (WHERE event_type = 'impression') < 10 THEN 1.0
      WHEN COUNT(*) FILTER (WHERE event_type = 'click')::NUMERIC / GREATEST(1, COUNT(*) FILTER (WHERE event_type = 'impression')) > 0.04 THEN 1.2
      WHEN COUNT(*) FILTER (WHERE event_type = 'click')::NUMERIC / GREATEST(1, COUNT(*) FILTER (WHERE event_type = 'impression')) < 0.01 THEN 0.8
      ELSE 1.0
    END,
    now()
  FROM discovery_events
  WHERE surface IN ('banner_middle', 'banner_lower')
    AND created_at >= now() - interval '7 days'
  GROUP BY surface;
END;
$$;
