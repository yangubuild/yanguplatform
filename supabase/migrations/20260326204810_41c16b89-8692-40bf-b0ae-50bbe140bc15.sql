
-- Create the AI Visibility Score calculation function
CREATE OR REPLACE FUNCTION public.calculate_ai_visibility_score(p_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_queries INTEGER;
  v_mentioned_count INTEGER;
  v_mention_rate NUMERIC;
  v_mention_score NUMERIC;
  
  v_position_sum NUMERIC;
  v_position_count INTEGER;
  v_avg_position_score NUMERIC;
  v_position_score NUMERIC;
  
  v_capabilities_covered INTEGER;
  v_coverage_rate NUMERIC;
  v_capability_score NUMERIC;
  
  v_positioning_matched INTEGER;
  v_positioning_rate NUMERIC;
  v_positioning_score NUMERIC;
  
  v_competitive_sum NUMERIC;
  v_competitive_score NUMERIC;
  
  v_total_score NUMERIC;
  v_interpretation TEXT;
  
  v_cutoff TIMESTAMPTZ;
  rec RECORD;
BEGIN
  v_cutoff := NOW() - (p_days || ' days')::INTERVAL;
  
  -- Total queries in period
  SELECT COUNT(*) INTO v_total_queries
  FROM ai_visibility_tracking
  WHERE tracked_at >= v_cutoff;
  
  IF v_total_queries = 0 THEN
    RETURN jsonb_build_object(
      'total_score', 0,
      'mention_score', 0,
      'position_score', 0,
      'capability_score', 0,
      'positioning_score', 0,
      'competitive_score', 0,
      'interpretation', 'No data',
      'total_queries', 0,
      'mentioned_count', 0
    );
  END IF;
  
  -- 1. MENTION RATE (0-30)
  SELECT COUNT(*) INTO v_mentioned_count
  FROM ai_visibility_tracking
  WHERE tracked_at >= v_cutoff AND yangu_mentioned = true;
  
  v_mention_rate := v_mentioned_count::NUMERIC / v_total_queries;
  v_mention_score := ROUND(v_mention_rate * 30, 1);
  
  -- 2. POSITION SCORE (0-20)
  v_position_sum := 0;
  v_position_count := 0;
  FOR rec IN
    SELECT yangu_position FROM ai_visibility_tracking
    WHERE tracked_at >= v_cutoff AND yangu_mentioned = true AND yangu_position IS NOT NULL
  LOOP
    v_position_count := v_position_count + 1;
    v_position_sum := v_position_sum + CASE
      WHEN rec.yangu_position = 1 THEN 1.0
      WHEN rec.yangu_position = 2 THEN 0.8
      WHEN rec.yangu_position = 3 THEN 0.6
      WHEN rec.yangu_position = 4 THEN 0.4
      ELSE 0.2
    END;
  END LOOP;
  
  IF v_position_count > 0 THEN
    v_avg_position_score := v_position_sum / v_position_count;
  ELSE
    v_avg_position_score := 0;
  END IF;
  v_position_score := ROUND(v_avg_position_score * 20, 1);
  
  -- 3. CAPABILITY COVERAGE (0-20)
  SELECT COUNT(DISTINCT cap) INTO v_capabilities_covered
  FROM ai_visibility_tracking, LATERAL unnest(capability_mentioned) AS cap
  WHERE tracked_at >= v_cutoff;
  
  v_coverage_rate := LEAST(v_capabilities_covered::NUMERIC / 12, 1.0);
  v_capability_score := ROUND(v_coverage_rate * 20, 1);
  
  -- 4. POSITIONING MATCH (0-15)
  SELECT COUNT(*) INTO v_positioning_matched
  FROM ai_visibility_tracking
  WHERE tracked_at >= v_cutoff AND yangu_mentioned = true AND positioning_match = true;
  
  IF v_mentioned_count > 0 THEN
    v_positioning_rate := v_positioning_matched::NUMERIC / v_mentioned_count;
  ELSE
    v_positioning_rate := 0;
  END IF;
  v_positioning_score := ROUND(v_positioning_rate * 15, 1);
  
  -- 5. COMPETITIVE STRENGTH (0-15)
  v_competitive_sum := 0;
  FOR rec IN
    SELECT yangu_mentioned, yangu_position, competitors_mentioned
    FROM ai_visibility_tracking
    WHERE tracked_at >= v_cutoff
  LOOP
    IF rec.yangu_mentioned AND rec.yangu_position IS NOT NULL AND rec.yangu_position <= 2 THEN
      v_competitive_sum := v_competitive_sum + 1.0;
    ELSIF rec.yangu_mentioned THEN
      v_competitive_sum := v_competitive_sum + 0.5;
    END IF;
  END LOOP;
  v_competitive_score := ROUND((v_competitive_sum / v_total_queries) * 15, 1);
  
  -- TOTAL
  v_total_score := v_mention_score + v_position_score + v_capability_score + v_positioning_score + v_competitive_score;
  
  -- Interpretation
  v_interpretation := CASE
    WHEN v_total_score >= 85 THEN 'Dominant AI Presence'
    WHEN v_total_score >= 70 THEN 'Strong Positioning'
    WHEN v_total_score >= 50 THEN 'Growing Visibility'
    WHEN v_total_score >= 30 THEN 'Weak Presence'
    ELSE 'Invisible in AI'
  END;
  
  RETURN jsonb_build_object(
    'total_score', ROUND(v_total_score, 0),
    'mention_score', v_mention_score,
    'position_score', v_position_score,
    'capability_score', v_capability_score,
    'positioning_score', v_positioning_score,
    'competitive_score', v_competitive_score,
    'mention_rate_pct', ROUND(v_mention_rate * 100, 1),
    'avg_position', CASE WHEN v_position_count > 0 THEN ROUND(v_position_sum / v_position_count * 5, 1) ELSE NULL END,
    'capabilities_covered', v_capabilities_covered,
    'positioning_match_pct', ROUND(COALESCE(v_positioning_rate, 0) * 100, 1),
    'interpretation', v_interpretation,
    'total_queries', v_total_queries,
    'mentioned_count', v_mentioned_count
  );
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.calculate_ai_visibility_score TO authenticated;
