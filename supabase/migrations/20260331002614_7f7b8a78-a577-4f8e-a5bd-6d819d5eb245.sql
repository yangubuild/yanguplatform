
-- Campaign table
CREATE TABLE public.social_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 7,
  posts_per_day INTEGER NOT NULL DEFAULT 2,
  total_posts INTEGER NOT NULL DEFAULT 14,
  campaign_goal TEXT DEFAULT 'engagement',
  selected_template_ids TEXT[] DEFAULT '{}',
  selected_platforms TEXT[] DEFAULT '{}',
  start_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 day'),
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign content plan items
CREATE TABLE public.social_campaign_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.social_campaigns(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  slot_number INTEGER NOT NULL,
  content_bucket TEXT NOT NULL,
  topic_angle TEXT,
  cta_style TEXT,
  template_id TEXT,
  post_id UUID,
  design_id UUID,
  status TEXT NOT NULL DEFAULT 'planned',
  scheduled_for TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_campaign_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaigns"
  ON public.social_campaigns FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own campaign items"
  ON public.social_campaign_items FOR ALL
  TO authenticated
  USING (campaign_id IN (SELECT id FROM public.social_campaigns WHERE user_id = auth.uid()))
  WITH CHECK (campaign_id IN (SELECT id FROM public.social_campaigns WHERE user_id = auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_social_campaigns_workspace ON public.social_campaigns(workspace_id);
CREATE INDEX idx_social_campaigns_status ON public.social_campaigns(status);
CREATE INDEX idx_social_campaign_items_campaign ON public.social_campaign_items(campaign_id);

-- Add campaign_id to social_posts for linkage
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.social_campaigns(id) ON DELETE SET NULL;
