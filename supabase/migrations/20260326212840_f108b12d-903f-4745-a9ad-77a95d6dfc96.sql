
CREATE TABLE public.user_ai_visibility_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL, -- shop, bio_page, digital_products, community, influencer
  goal TEXT NOT NULL DEFAULT 'get_discovered', -- get_discovered, sell_more, grow_audience
  region TEXT NOT NULL DEFAULT 'africa', -- africa, middle_east, global
  website_url TEXT,
  score INTEGER,
  scan_count INTEGER DEFAULT 0,
  last_scan_at TIMESTAMPTZ,
  plan TEXT DEFAULT 'free', -- free, pro, done_for_you
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_ai_visibility_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.user_ai_visibility_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.user_ai_visibility_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.user_ai_visibility_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User-specific scan results (linked to their project)
CREATE TABLE public.user_ai_visibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.user_ai_visibility_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  ai_platform TEXT NOT NULL,
  query TEXT NOT NULL,
  response_snippet TEXT,
  yangu_mentioned BOOLEAN DEFAULT false,
  business_mentioned BOOLEAN DEFAULT false,
  business_position INTEGER,
  competitors_mentioned TEXT[],
  sentiment TEXT,
  capability_mentioned TEXT[],
  positioning_match BOOLEAN DEFAULT false,
  tracked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_ai_visibility_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON public.user_ai_visibility_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert results"
  ON public.user_ai_visibility_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
