
-- Full audit log listing with filters
CREATE OR REPLACE FUNCTION public.manage_audit_logs_list(
  p_action TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
  INTO result
  FROM (
    SELECT al.id, al.user_id, al.action, al.entity_type, al.entity_id,
           al.old_data, al.new_data, al.ip_address::text as ip_address,
           al.user_agent, al.created_at,
           p.display_name as user_display_name
    FROM audit_logs al
    LEFT JOIN profiles p ON p.id = al.user_id
    WHERE (p_action IS NULL OR al.action = p_action)
      AND (p_entity_type IS NULL OR al.entity_type = p_entity_type)
      AND (p_search IS NULL OR al.action ILIKE '%' || p_search || '%'
           OR al.entity_type ILIKE '%' || p_search || '%'
           OR al.entity_id::text ILIKE '%' || p_search || '%')
    ORDER BY al.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) a;

  RETURN result;
END;
$$;

-- Distinct actions/entity_types for filter dropdowns
CREATE OR REPLACE FUNCTION public.manage_audit_log_filters()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  v_actions JSON;
  v_types JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COALESCE(json_agg(action ORDER BY action), '[]'::json)
  INTO v_actions
  FROM (SELECT DISTINCT action FROM audit_logs) sub;

  SELECT COALESCE(json_agg(entity_type ORDER BY entity_type), '[]'::json)
  INTO v_types
  FROM (SELECT DISTINCT entity_type FROM audit_logs) sub;

  SELECT json_build_object('actions', v_actions, 'entity_types', v_types) INTO result;
  RETURN result;
END;
$$;

-- Toggle feature flag (admin only, RLS already covers but this is explicit)
CREATE OR REPLACE FUNCTION public.manage_toggle_feature_flag(
  p_key TEXT,
  p_enabled BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE feature_flags SET enabled = p_enabled, updated_at = now() WHERE key = p_key;
END;
$$;

-- Update usage quota config (admin only)
CREATE OR REPLACE FUNCTION public.manage_update_quota_config(
  p_key TEXT,
  p_free_limit INT DEFAULT NULL,
  p_starter_limit INT DEFAULT NULL,
  p_creator_limit INT DEFAULT NULL,
  p_is_enabled BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE usage_quota_config SET
    free_limit = COALESCE(p_free_limit, free_limit),
    starter_limit = COALESCE(p_starter_limit, starter_limit),
    creator_limit = COALESCE(p_creator_limit, creator_limit),
    is_enabled = COALESCE(p_is_enabled, is_enabled),
    updated_at = now()
  WHERE key = p_key;
END;
$$;
