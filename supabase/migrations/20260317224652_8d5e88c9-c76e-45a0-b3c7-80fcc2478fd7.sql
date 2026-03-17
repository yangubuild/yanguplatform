-- Canonical entity_type enum for platform-wide search classification
CREATE TYPE public.searchable_entity_type AS ENUM (
  'product',
  'service',
  'business',
  'creator',
  'organization',
  'community',
  'project'
);

-- Creator/org subtype for fine-grained filtering without fragmenting entity_type
CREATE TYPE public.entity_subtype AS ENUM (
  'influencer',
  'freelancer',
  'coach',
  'consultant',
  'leader',
  'church',
  'ministry',
  'faith_org',
  'ngo',
  'school',
  'institution',
  'professional_network',
  'general'
);

-- Visibility tier for discovery ranking contracts
CREATE TYPE public.visibility_tier AS ENUM (
  'free',
  'verified',
  'paid',
  'premium'
);

-- Canonical searchable entities index
CREATE TABLE public.searchable_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_id uuid REFERENCES public.surfaces(id) ON DELETE CASCADE,
  builder_surface_id uuid REFERENCES public.builder_surfaces(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  owner_org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  entity_type public.searchable_entity_type NOT NULL,
  entity_subtype public.entity_subtype NOT NULL DEFAULT 'general',
  title text NOT NULL,
  short_description text,
  primary_category text,
  tags text[] NOT NULL DEFAULT '{}',
  is_searchable boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  visibility_tier public.visibility_tier NOT NULL DEFAULT 'free',
  is_ad_eligible boolean NOT NULL DEFAULT false,
  promotion_id uuid REFERENCES public.community_promotions(id) ON DELETE SET NULL,
  domain_host text,
  slug text,
  industry text,
  surface_type text,
  builder_surface_type text,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT one_source CHECK (
    (surface_id IS NOT NULL) OR (builder_surface_id IS NOT NULL)
  ),
  CONSTRAINT unique_surface UNIQUE (surface_id),
  CONSTRAINT unique_builder_surface UNIQUE (builder_surface_id)
);

CREATE INDEX idx_se_type ON public.searchable_entities(entity_type);
CREATE INDEX idx_se_subtype ON public.searchable_entities(entity_subtype);
CREATE INDEX idx_se_category ON public.searchable_entities(primary_category);
CREATE INDEX idx_se_visibility ON public.searchable_entities(visibility_tier);
CREATE INDEX idx_se_searchable ON public.searchable_entities(is_searchable, is_published);
CREATE INDEX idx_se_owner ON public.searchable_entities(owner_user_id);
CREATE INDEX idx_se_org ON public.searchable_entities(owner_org_id);
CREATE INDEX idx_se_tags ON public.searchable_entities USING GIN(tags);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_se_title_trgm ON public.searchable_entities USING GIN(title gin_trgm_ops);

ALTER TABLE public.searchable_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read searchable entities"
  ON public.searchable_entities FOR SELECT
  USING (is_searchable = true AND is_published = true);

CREATE POLICY "Owners can read own entities"
  ON public.searchable_entities FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Admin can manage entities"
  ON public.searchable_entities FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));