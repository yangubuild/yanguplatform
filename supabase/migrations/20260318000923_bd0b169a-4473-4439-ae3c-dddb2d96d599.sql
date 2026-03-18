
-- Phase 3: Reviews, FAQs, Reports tables

CREATE TABLE public.entity_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.searchable_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, user_id)
);
ALTER TABLE public.entity_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read visible reviews" ON public.entity_reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Users can create own review" ON public.entity_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own review" ON public.entity_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own review" ON public.entity_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.entity_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.searchable_entities(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entity_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read visible FAQs" ON public.entity_faqs FOR SELECT USING (is_visible = true);
CREATE POLICY "Entity owner can manage FAQs" ON public.entity_faqs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.searchable_entities se WHERE se.id = entity_faqs.entity_id AND se.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.searchable_entities se WHERE se.id = entity_faqs.entity_id AND se.owner_user_id = auth.uid()));

CREATE TABLE public.entity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.searchable_entities(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entity_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can submit reports" ON public.entity_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON public.entity_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage all reports" ON public.entity_reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.entity_reviews TO anon;
GRANT SELECT ON public.entity_faqs TO anon;
CREATE INDEX idx_entity_reviews_entity ON public.entity_reviews(entity_id);
CREATE INDEX idx_entity_faqs_entity ON public.entity_faqs(entity_id);
CREATE INDEX idx_entity_reports_entity ON public.entity_reports(entity_id);
CREATE INDEX idx_entity_reports_status ON public.entity_reports(status);

-- RPC: get entity detail by slug (public)
CREATE OR REPLACE FUNCTION public.get_entity_by_slug(p_slug TEXT)
RETURNS TABLE(
  id UUID, entity_type TEXT, entity_subtype TEXT, title TEXT,
  short_description TEXT, primary_category TEXT, tags TEXT[],
  visibility_tier TEXT, is_verified BOOLEAN, domain_host TEXT,
  slug TEXT, industry TEXT, surface_type TEXT, cover_image_url TEXT,
  published_at TIMESTAMPTZ, owner_user_id UUID,
  review_count BIGINT, avg_rating NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    se.id, se.entity_type::TEXT, se.entity_subtype::TEXT, se.title,
    se.short_description, se.primary_category, se.tags,
    se.visibility_tier::TEXT, se.is_verified, se.domain_host,
    se.slug, se.industry, se.surface_type, se.cover_image_url,
    se.published_at, se.owner_user_id,
    COUNT(er.id)::BIGINT AS review_count,
    ROUND(AVG(er.rating)::NUMERIC, 1) AS avg_rating
  FROM public.searchable_entities se
  LEFT JOIN public.entity_reviews er ON er.entity_id = se.id AND er.is_visible = true
  WHERE se.slug = p_slug AND se.is_searchable = true AND se.is_published = true
  GROUP BY se.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_entity_by_slug(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_entity_by_slug(TEXT) TO authenticated;
