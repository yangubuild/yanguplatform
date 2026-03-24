
-- ============================================================
-- PHASE 2.5: Admin action RPCs for all management pages
-- ============================================================

-- 1. PAGES: Delete a builder page
CREATE OR REPLACE FUNCTION public.manage_delete_page(p_page_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM builder_sections WHERE page_id = p_page_id;
  DELETE FROM builder_pages WHERE id = p_page_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'delete_page', 'builder_pages', p_page_id::text);
END; $$;

-- 2. BRANDING: Reset theme to empty
CREATE OR REPLACE FUNCTION public.manage_reset_theme(p_surface_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE builder_surfaces SET theme = '{}'::jsonb, updated_at = now() WHERE id = p_surface_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'reset_theme', 'builder_surfaces', p_surface_id::text);
END; $$;

-- 3. INTEGRATIONS: Toggle status (active/inactive)
CREATE OR REPLACE FUNCTION public.manage_toggle_integration(p_app_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_status NOT IN ('active', 'inactive', 'deprecated') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE app_registry SET status = p_status::app_registry_status, updated_at = now() WHERE id = p_app_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'toggle_integration', 'app_registry', p_app_id::text, jsonb_build_object('status', p_status));
END; $$;

-- 4. INTEGRATIONS: Toggle featured
CREATE OR REPLACE FUNCTION public.manage_toggle_featured(p_app_id uuid, p_featured boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE app_registry SET is_featured = p_featured, updated_at = now() WHERE id = p_app_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'toggle_featured', 'app_registry', p_app_id::text, jsonb_build_object('featured', p_featured));
END; $$;

-- 5. COMMUNITY: Toggle promo active/inactive
CREATE OR REPLACE FUNCTION public.manage_toggle_promo(p_promo_id uuid, p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE community_promotions SET is_active = p_active, updated_at = now() WHERE id = p_promo_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'toggle_promo', 'community_promotions', p_promo_id::text, jsonb_build_object('is_active', p_active));
END; $$;

-- 6. COMMUNITY: Delete promo
CREATE OR REPLACE FUNCTION public.manage_delete_promo(p_promo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM community_promotions WHERE id = p_promo_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'delete_promo', 'community_promotions', p_promo_id::text);
END; $$;

-- 7. NEWS: Delete post
CREATE OR REPLACE FUNCTION public.manage_delete_post(p_post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM user_posts WHERE id = p_post_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'delete_post', 'user_posts', p_post_id::text);
END; $$;
