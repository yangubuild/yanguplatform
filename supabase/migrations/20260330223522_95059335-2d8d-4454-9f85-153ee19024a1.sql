
-- ============================================================
-- YANGU Template Design System — Phase 1 Schema
-- ============================================================

-- 1. Template definitions (master template registry)
CREATE TABLE public.social_design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  preview_image_url TEXT NOT NULL,
  base_image_url TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT true,
  workspace_id UUID REFERENCES public.social_workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  color_slots JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Template layers (editable regions per template)
CREATE TABLE public.social_template_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.social_design_templates(id) ON DELETE CASCADE,
  layer_type TEXT NOT NULL, -- text, image, shape, background, icon, cta
  role TEXT, -- headline, subheadline, body, price, cta, logo, product_image, person_image, background, accent
  sort_order INT NOT NULL DEFAULT 0,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC NOT NULL DEFAULT 100,
  height NUMERIC NOT NULL DEFAULT 100,
  rotation NUMERIC DEFAULT 0,
  style JSONB DEFAULT '{}',
  content TEXT,
  src TEXT,
  locked BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Workspace template selections (which templates a workspace has enabled)
CREATE TABLE public.social_workspace_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.social_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.social_design_templates(id) ON DELETE CASCADE,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  brand_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, template_id)
);

-- 4. Generated designs (a post design created from a template)
CREATE TABLE public.social_generated_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.social_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.social_design_templates(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  layer_overrides JSONB NOT NULL DEFAULT '[]',
  color_overrides JSONB DEFAULT '{}',
  font_overrides JSONB DEFAULT '{}',
  logo_url TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  rendered_image_url TEXT,
  variation_index INT NOT NULL DEFAULT 0,
  ai_prompt TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Design variations (batch campaign variations from one template)
CREATE TABLE public.social_design_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_design_id UUID NOT NULL REFERENCES public.social_generated_designs(id) ON DELETE CASCADE,
  variation_index INT NOT NULL DEFAULT 1,
  layer_overrides JSONB NOT NULL DEFAULT '[]',
  color_overrides JSONB DEFAULT '{}',
  rendered_image_url TEXT,
  caption TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_template_layers_template ON public.social_template_layers(template_id);
CREATE INDEX idx_workspace_templates_ws ON public.social_workspace_templates(workspace_id);
CREATE INDEX idx_generated_designs_ws ON public.social_generated_designs(workspace_id);
CREATE INDEX idx_generated_designs_template ON public.social_generated_designs(template_id);
CREATE INDEX idx_design_variations_parent ON public.social_design_variations(parent_design_id);

-- RLS
ALTER TABLE public.social_design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_template_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_workspace_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_generated_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_design_variations ENABLE ROW LEVEL SECURITY;

-- Policies: templates (system ones readable by all authenticated, user ones by owner)
CREATE POLICY "Authenticated users can read system templates"
  ON public.social_design_templates FOR SELECT TO authenticated
  USING (is_system = true);

CREATE POLICY "Users can read own templates"
  ON public.social_design_templates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own templates"
  ON public.social_design_templates FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own templates"
  ON public.social_design_templates FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON public.social_design_templates FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Policies: layers (follow parent template access)
CREATE POLICY "Authenticated users can read template layers"
  ON public.social_template_layers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.social_design_templates t
    WHERE t.id = template_id AND (t.is_system = true OR t.user_id = auth.uid())
  ));

CREATE POLICY "Users can manage own template layers"
  ON public.social_template_layers FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.social_design_templates t
    WHERE t.id = template_id AND t.user_id = auth.uid()
  ));

-- Policies: workspace templates
CREATE POLICY "Users can manage workspace templates"
  ON public.social_workspace_templates FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.social_workspaces w
    WHERE w.id = workspace_id AND w.user_id = auth.uid()
  ));

-- Policies: generated designs
CREATE POLICY "Users can manage own designs"
  ON public.social_generated_designs FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Policies: variations
CREATE POLICY "Users can manage own variations"
  ON public.social_design_variations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.social_generated_designs d
    WHERE d.id = parent_design_id AND d.user_id = auth.uid()
  ));
