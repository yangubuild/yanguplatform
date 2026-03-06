
-- App type enum
CREATE TYPE public.app_registry_type AS ENUM (
  'native_app',
  'connector_app',
  'ai_generated_app',
  'embedded_app',
  'developer_app'
);

-- Action type enum
CREATE TYPE public.app_action_type AS ENUM (
  'install',
  'connect',
  'launch',
  'generate',
  'embed'
);

-- Pricing type enum
CREATE TYPE public.app_pricing_type AS ENUM (
  'free',
  'freemium',
  'paid',
  'enterprise'
);

-- App status enum
CREATE TYPE public.app_registry_status AS ENUM (
  'draft',
  'active',
  'hidden',
  'archived'
);

-- Visibility enum
CREATE TYPE public.app_visibility AS ENUM (
  'public',
  'private',
  'internal'
);

-- Categories table
CREATE TABLE public.app_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app_categories" ON public.app_categories FOR SELECT USING (true);

-- Main app registry
CREATE TABLE public.app_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  short_description text,
  long_description text,
  icon text,
  provider_name text NOT NULL DEFAULT 'YANGU',
  provider_type text NOT NULL DEFAULT 'platform',
  provider_badge_logo text,
  category text NOT NULL DEFAULT 'yangu-native',
  subcategory text,
  app_type public.app_registry_type NOT NULL DEFAULT 'native_app',
  action_type public.app_action_type NOT NULL DEFAULT 'launch',
  pricing_type public.app_pricing_type NOT NULL DEFAULT 'free',
  visibility public.app_visibility NOT NULL DEFAULT 'public',
  status public.app_registry_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  is_native_yangu boolean NOT NULL DEFAULT false,
  supports_desktop_install boolean NOT NULL DEFAULT false,
  supports_web_install boolean NOT NULL DEFAULT false,
  supports_embed boolean NOT NULL DEFAULT false,
  supports_oauth boolean NOT NULL DEFAULT false,
  supports_api_key boolean NOT NULL DEFAULT false,
  launch_route text,
  connect_route text,
  install_route text,
  generate_route text,
  embed_url text,
  sort_order int NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active apps" ON public.app_registry FOR SELECT USING (true);

-- User install state table (future-ready)
CREATE TABLE public.app_user_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_id uuid NOT NULL REFERENCES public.app_registry(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'installed',
  config jsonb NOT NULL DEFAULT '{}',
  installed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id)
);

ALTER TABLE public.app_user_installs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own installs" ON public.app_user_installs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own installs" ON public.app_user_installs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own installs" ON public.app_user_installs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own installs" ON public.app_user_installs FOR DELETE TO authenticated USING (auth.uid() = user_id);
