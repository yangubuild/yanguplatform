
-- 1. Community Promotions
CREATE OR REPLACE FUNCTION public.manage_community_promotions()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(json_agg(t), '[]'::json) FROM (
    SELECT cp.id, cp.section, cp.category_key, cp.tier, cp.starts_at, cp.ends_at,
           cp.is_active, cp.created_at, cp.updated_at, s.title AS surface_title
    FROM community_promotions cp LEFT JOIN surfaces s ON s.id = cp.surface_id
    WHERE has_role(auth.uid(), 'admin') ORDER BY cp.created_at DESC LIMIT 200
  ) t
$$;

-- 2. Support tickets
CREATE OR REPLACE FUNCTION public.manage_support_tickets_full()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(json_agg(t), '[]'::json) FROM (
    SELECT st.id, st.subject, st.description, st.category, st.status, st.priority,
           st.created_at, st.updated_at, p.username, p.display_name, p.avatar_url,
           EXTRACT(EPOCH FROM (now() - st.created_at)) / 3600 AS hours_since_created,
           (SELECT COALESCE(json_agg(m ORDER BY m.created_at ASC), '[]'::json)
            FROM support_messages m WHERE m.ticket_id = st.id) AS messages
    FROM support_tickets st LEFT JOIN profiles p ON p.id = st.user_id
    WHERE has_role(auth.uid(), 'admin') ORDER BY st.updated_at DESC LIMIT 200
  ) t
$$;

-- 3. Reply
CREATE OR REPLACE FUNCTION public.manage_support_reply(p_ticket_id uuid, p_content text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO support_messages (ticket_id, sender_type, sender_id, content) VALUES (p_ticket_id, 'admin', auth.uid(), p_content);
  UPDATE support_tickets SET status = 'replied', updated_at = now() WHERE id = p_ticket_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data) VALUES (auth.uid(), 'support_reply', 'support_ticket', p_ticket_id::text, jsonb_build_object('content_preview', left(p_content, 100)));
END; $$;

-- 4. Update status
CREATE OR REPLACE FUNCTION public.manage_support_update_status(p_ticket_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE support_tickets SET status = p_status, updated_at = now() WHERE id = p_ticket_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data) VALUES (auth.uid(), 'support_status_update', 'support_ticket', p_ticket_id::text, jsonb_build_object('new_status', p_status));
END; $$;

-- 5. News from user_posts
CREATE OR REPLACE FUNCTION public.manage_news_articles()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(json_agg(t), '[]'::json) FROM (
    SELECT up.id, up.content, up.media_urls, up.media_type, up.created_at,
           p.username AS author_username, p.display_name AS author_name
    FROM user_posts up LEFT JOIN profiles p ON p.id = up.user_id
    WHERE has_role(auth.uid(), 'admin') ORDER BY up.created_at DESC LIMIT 200
  ) t
$$;

-- 6. Events
CREATE OR REPLACE FUNCTION public.manage_events_overview()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(json_agg(t), '[]'::json) FROM (
    SELECT event_type, count(*) AS event_count, max(created_at) AS last_seen
    FROM discovery_events WHERE has_role(auth.uid(), 'admin')
    GROUP BY event_type ORDER BY event_count DESC LIMIT 50
  ) t
$$;
