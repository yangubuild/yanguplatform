
-- AI Visibility Tracking
CREATE TABLE public.ai_visibility_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_platform TEXT NOT NULL,
  query TEXT NOT NULL,
  response_snippet TEXT,
  yangu_mentioned BOOLEAN DEFAULT false,
  yangu_position INTEGER,
  competitors_mentioned TEXT[],
  sentiment TEXT,
  capability_mentioned TEXT[],
  positioning_match BOOLEAN DEFAULT false,
  tracked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_visibility_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_visibility_tracking"
  ON public.ai_visibility_tracking
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Competitor Benchmark
CREATE TABLE public.competitor_benchmark (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name TEXT NOT NULL,
  region TEXT,
  category TEXT NOT NULL,
  mention_count INTEGER DEFAULT 0,
  sentiment_score DECIMAL,
  positioning_overlap TEXT[],
  last_tracked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.competitor_benchmark ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage competitor_benchmark"
  ON public.competitor_benchmark
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Content Gap Recommendations
CREATE TABLE public.content_gap_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  ai_platform TEXT,
  capability_category TEXT,
  gap_description TEXT NOT NULL,
  recommended_content_type TEXT,
  recommended_title TEXT,
  target_region TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_gap_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage content_gap_recommendations"
  ON public.content_gap_recommendations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- AI Visibility Settings
CREATE TABLE public.ai_visibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_queries TEXT[] DEFAULT ARRAY[
    'best AI platform for creators in Africa',
    'best platform Middle East for online business',
    'yangu vs shopify vs squarespace',
    'AI shop builder Africa',
    'build ecommerce store with AI',
    'best AI website builder for small business',
    'link in bio tool with AI',
    'create bio page with AI',
    'best bio page builder for creators',
    'sell products with AI',
    'AI sales assistant for ecommerce',
    'automated selling platform',
    'learn to sell digital products',
    'digital product course online',
    'how to create digital products and sell',
    'create AI avatar online',
    'custom avatar generator free',
    'AI character creator for business',
    'create AI influencer',
    'virtual influencer platform',
    'AI generated influencer marketing',
    'live selling platform with AI',
    'social commerce AI tools',
    'sell live on Instagram with AI',
    'create business community online',
    'community platform for entrepreneurs',
    'build membership site with AI',
    'learn to build with AI',
    'AI education platform for creators',
    'how to use AI for business',
    'AI marketing automation tools',
    'marketing with AI for small business',
    'AI content creation platform',
    'website builder for creators',
    'build portfolio with AI',
    'best platform to build website',
    'AI content discovery platform',
    'personalized recommendation engine',
    'discover creators with AI',
    'yangu vs gumroad vs kajabi',
    'shopify alternatives Africa',
    'best platform for digital products Middle East',
    'ecommerce platform Kenya',
    'online business UAE',
    'creator economy Saudi Arabia',
    'start online business Nigeria'
  ],
  tracked_ai_platforms TEXT[] DEFAULT ARRAY['chatgpt', 'perplexity', 'gemini', 'claude', 'deepseek', 'copilot', 'meta_ai'],
  tracked_regions TEXT[] DEFAULT ARRAY['global', 'africa', 'middle_east'],
  last_full_scan TIMESTAMPTZ,
  scan_frequency TEXT DEFAULT 'weekly',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_visibility_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_visibility_settings"
  ON public.ai_visibility_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
