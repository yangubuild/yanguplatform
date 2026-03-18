
-- RPC: List all surfaces feeding Explore
CREATE OR REPLACE FUNCTION public.manage_explore_surfaces()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.manual_position NULLS LAST, t.trust_score DESC), '[]'::jsonb)
  FROM (
    SELECT
      se.id,
      se.title,
      se.entity_type,
      se.primary_category AS category,
      se.visibility_tier,
      se.is_verified,
      coalesce(se.trust_score, 0) AS trust_score,
      CASE
        WHEN se.visibility_tier IN ('paid', 'premium') THEN 'premium_subscriber'
        WHEN se.is_verified THEN 'engagement'
        ELSE 'user_published'
      END AS fill_source,
      au.email AS owner_email,
      emo.position AS manual_position
    FROM searchable_entities se
    LEFT JOIN auth.users au ON au.id = se.owner_user_id
    LEFT JOIN explore_manual_overrides emo ON emo.entity_id = se.id::text
  ) t
$$;

-- RPC: User stats
CREATE OR REPLACE FUNCTION public.manage_explore_users_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'published_users', (SELECT count(DISTINCT owner_user_id) FROM searchable_entities),
    'active_publishers', (SELECT count(DISTINCT owner_user_id) FROM searchable_entities WHERE updated_at > now() - interval '30 days')
  )
$$;

-- RPC: Surface stats
CREATE OR REPLACE FUNCTION public.manage_explore_surfaces_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_surfaces', (SELECT count(*) FROM surfaces),
    'published_surfaces', (SELECT count(*) FROM surface_publishes WHERE state = 'published'),
    'unpublished_surfaces', (SELECT count(*) FROM surfaces s WHERE NOT EXISTS (SELECT 1 FROM surface_publishes sp WHERE sp.surface_id = s.id AND sp.state = 'published'))
  )
$$;

-- RPC: Save manual ordering
CREATE OR REPLACE FUNCTION public.manage_save_explore_order(p_orderings jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM explore_manual_overrides;
  INSERT INTO explore_manual_overrides (entity_id, position, set_by, updated_at)
  SELECT
    (item->>'entity_id')::text,
    (item->>'position')::integer,
    auth.uid(),
    now()
  FROM jsonb_array_elements(p_orderings) AS item;
END;
$$;
