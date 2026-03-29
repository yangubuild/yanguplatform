
-- ═══════════════════════════════════════════════════════════
-- YANGU Social Media Engine — Schema Upgrade
-- Adds missing columns, enums, tables, indexes, RLS policies
-- ═══════════════════════════════════════════════════════════

-- 1. Create enums
DO $$ BEGIN
  CREATE TYPE public.social_post_status AS ENUM ('draft','ready','scheduled','publishing','published','failed','archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.social_provider_type AS ENUM ('facebook','instagram','instagram_story','x','linkedin_company','linkedin_personal','tiktok','youtube','threads','pinterest','snapchat');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.social_post_source AS ENUM ('manual','ai_generated','imported','duplicated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.social_content_type AS ENUM ('text','image','carousel','video','mixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.social_account_status AS ENUM ('active','disconnected','expired','error','pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.social_library_item_type AS ENUM ('image','video','document','pdf','website_import','text_import','csv_import','product','event','service','person','project','content','announcement');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Upgrade social_workspaces: add missing columns
ALTER TABLE public.social_workspaces
  ADD COLUMN IF NOT EXISTS org_id text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 3. Upgrade social_connected_accounts: add missing columns
ALTER TABLE public.social_connected_accounts
  ADD COLUMN IF NOT EXISTS account_type text,
  ADD COLUMN IF NOT EXISTS account_handle text,
  ADD COLUMN IF NOT EXISTS scopes text[],
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- 4. Upgrade social_brand_profiles: add richer fields
ALTER TABLE public.social_brand_profiles
  ADD COLUMN IF NOT EXISTS caption_rules text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS banned_terms text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_ctas text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hashtag_rules text,
  ADD COLUMN IF NOT EXISTS emoji_policy text,
  ADD COLUMN IF NOT EXISTS line_break_style text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS audience_notes text,
  ADD COLUMN IF NOT EXISTS positioning text,
  ADD COLUMN IF NOT EXISTS visual_style text,
  ADD COLUMN IF NOT EXISTS brand_keywords text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS negative_keywords text[] DEFAULT '{}';

-- 5. Upgrade social_topics: add category support
ALTER TABLE public.social_topics
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual';

-- 6. Upgrade social_posts: add canonical fields
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.social_workspaces(id),
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS ai_generation_mode text,
  ADD COLUMN IF NOT EXISTS ai_prompt text,
  ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.social_topics(id),
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS outstand_post_id text,
  ADD COLUMN IF NOT EXISTS primary_media_url text,
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS error_message text;

-- 7. Upgrade social_post_targets: add provider + scheduling
ALTER TABLE public.social_post_targets
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS metrics_summary jsonb;

-- 8. Upgrade social_publish_events: add workspace + post refs
ALTER TABLE public.social_publish_events
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.social_workspaces(id),
  ADD COLUMN IF NOT EXISTS post_id uuid,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS status text;

-- 9. Upgrade social_analytics_snapshots: add workspace + more metrics
ALTER TABLE public.social_analytics_snapshots
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.social_workspaces(id),
  ADD COLUMN IF NOT EXISTS post_id uuid,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reach integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves integer DEFAULT 0;

-- 10. Create social_topic_categories table
CREATE TABLE IF NOT EXISTS public.social_topic_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.social_workspaces(id),
  user_id uuid NOT NULL,
  title text NOT NULL,
  color text,
  sort_order integer DEFAULT 0,
  enabled boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_topic_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own topic categories"
  ON public.social_topic_categories
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 11. Create social_post_variants table
CREATE TABLE IF NOT EXISTS public.social_post_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  adapted_caption text NOT NULL DEFAULT '',
  hashtags text[] DEFAULT '{}',
  cta text,
  character_count integer DEFAULT 0,
  platform_payload jsonb,
  preview_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_post_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own post variants"
  ON public.social_post_variants
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.social_posts sp WHERE sp.id = post_id AND sp.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.social_posts sp WHERE sp.id = post_id AND sp.created_by = auth.uid()
  ));

-- 12. Create social_library_items table
CREATE TABLE IF NOT EXISTS public.social_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.social_workspaces(id),
  user_id uuid NOT NULL,
  item_type text NOT NULL DEFAULT 'content',
  title text NOT NULL,
  description text,
  file_url text,
  thumbnail_url text,
  source_url text,
  extracted_text text,
  extracted_metadata jsonb,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'ready',
  processing_error text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own library items"
  ON public.social_library_items
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 13. Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_social_posts_created_by_status ON public.social_posts(created_by, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_for ON public.social_posts(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_posts_workspace_id ON public.social_posts(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_post_targets_post_id ON public.social_post_targets(post_id);
CREATE INDEX IF NOT EXISTS idx_social_connected_accounts_workspace ON public.social_connected_accounts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_social_topics_workspace ON public.social_topics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_user_date ON public.social_analytics_snapshots(user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_social_library_user ON public.social_library_items(user_id);

-- 14. Add updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 15. Apply updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER trg_social_posts_updated_at BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_social_library_items_updated_at BEFORE UPDATE ON public.social_library_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_social_workspaces_updated_at BEFORE UPDATE ON public.social_workspaces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
