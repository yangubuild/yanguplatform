
-- =============================================
-- YANGU Platform Database Schema
-- =============================================

-- Enums for type safety
CREATE TYPE public.surface_type AS ENUM ('shop', 'store', 'site', 'studio', 'live', 'community');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'unpaid');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.login_mode AS ENUM ('disabled', 'optional', 'required');
CREATE TYPE public.agent_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE public.ad_status AS ENUM ('draft', 'pending_review', 'active', 'paused', 'rejected');

-- =============================================
-- SURFACE DOMAINS (Registry of available domains)
-- =============================================
CREATE TABLE public.surface_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  surface_type surface_type NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the domains based on platform config
INSERT INTO public.surface_domains (domain, surface_type, label, description) VALUES
  ('yangu.shop', 'shop', 'Shop', 'Create your own online store'),
  ('yangu.store', 'store', 'Store', 'Sell digital products and downloads'),
  ('yangu.site', 'site', 'Site', 'Build your personal website'),
  ('yangu.studio', 'studio', 'Studio', 'Showcase your creative portfolio'),
  ('yangu.live', 'live', 'Live', 'Stream and connect in real-time'),
  ('yangu.community', 'community', 'Community', 'Build and grow your community');

ALTER TABLE public.surface_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active domains"
  ON public.surface_domains FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage domains"
  ON public.surface_domains FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- KYC VERIFICATIONS
-- =============================================
CREATE TABLE public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status kyc_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  document_urls TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
  ON public.kyc_verifications FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Users can submit KYC"
  ON public.kyc_verifications FOR INSERT
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Users can update pending KYC"
  ON public.kyc_verifications FOR UPDATE
  USING (public.is_owner(user_id) AND status = 'pending')
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Admins can manage all KYC"
  ON public.kyc_verifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'active',
  plan_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIALS (Track free trial usage)
-- =============================================
CREATE TABLE public.trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surface_id UUID, -- Will reference public_surfaces after creation
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- One trial per user
);

ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trials"
  ON public.trials FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Admins can manage trials"
  ON public.trials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PAYMENTS
-- =============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PUBLIC SURFACES (Main content entities)
-- =============================================
CREATE TABLE public.public_surfaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.surface_domains(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  custom_domain TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Slug must be unique per domain
  UNIQUE(domain_id, slug)
);

-- Add foreign key from trials to surfaces
ALTER TABLE public.trials 
  ADD CONSTRAINT trials_surface_id_fkey 
  FOREIGN KEY (surface_id) REFERENCES public.public_surfaces(id) ON DELETE SET NULL;

ALTER TABLE public.public_surfaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published surfaces"
  ON public.public_surfaces FOR SELECT
  USING (is_published = true);

CREATE POLICY "Owners can view own surfaces"
  ON public.public_surfaces FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Owners can create surfaces"
  ON public.public_surfaces FOR INSERT
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Owners can update own surfaces"
  ON public.public_surfaces FOR UPDATE
  USING (public.is_owner(user_id))
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Owners can delete own surfaces"
  ON public.public_surfaces FOR DELETE
  USING (public.is_owner(user_id));

CREATE POLICY "Admins can manage all surfaces"
  ON public.public_surfaces FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SURFACE SETTINGS
-- =============================================
CREATE TABLE public.surface_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_id UUID NOT NULL REFERENCES public.public_surfaces(id) ON DELETE CASCADE,
  login_mode login_mode NOT NULL DEFAULT 'disabled',
  primary_color TEXT DEFAULT '#000000',
  accent_color TEXT DEFAULT '#3B82F6',
  logo_url TEXT,
  favicon_url TEXT,
  custom_css TEXT,
  social_links JSONB DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  seo_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(surface_id)
);

ALTER TABLE public.surface_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings of published surfaces"
  ON public.surface_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.public_surfaces 
      WHERE id = surface_id AND is_published = true
    )
  );

CREATE POLICY "Owners can view own surface settings"
  ON public.surface_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.public_surfaces 
      WHERE id = surface_id AND public.is_owner(user_id)
    )
  );

CREATE POLICY "Owners can manage own surface settings"
  ON public.surface_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.public_surfaces 
      WHERE id = surface_id AND public.is_owner(user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.public_surfaces 
      WHERE id = surface_id AND public.is_owner(user_id)
    )
  );

CREATE POLICY "Admins can manage all settings"
  ON public.surface_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- AGENTS (AI Agents)
-- =============================================
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surface_id UUID REFERENCES public.public_surfaces(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status agent_status NOT NULL DEFAULT 'draft',
  system_prompt TEXT,
  model TEXT DEFAULT 'gemini-2.5-flash',
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  tools JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own agents"
  ON public.agents FOR ALL
  USING (public.is_owner(user_id))
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Active agents visible on published surfaces"
  ON public.agents FOR SELECT
  USING (
    status = 'active' AND 
    EXISTS (
      SELECT 1 FROM public.public_surfaces 
      WHERE id = surface_id AND is_published = true
    )
  );

CREATE POLICY "Admins can manage all agents"
  ON public.agents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- AGENT ONBOARDINGS
-- =============================================
CREATE TABLE public.agent_onboardings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  input_type TEXT DEFAULT 'text',
  input_options JSONB,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, step_order)
);

ALTER TABLE public.agent_onboardings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent owners can manage onboardings"
  ON public.agent_onboardings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agents 
      WHERE id = agent_id AND public.is_owner(user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents 
      WHERE id = agent_id AND public.is_owner(user_id)
    )
  );

CREATE POLICY "Visible for active agents on published surfaces"
  ON public.agent_onboardings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      JOIN public.public_surfaces s ON a.surface_id = s.id
      WHERE a.id = agent_id AND a.status = 'active' AND s.is_published = true
    )
  );

CREATE POLICY "Admins can manage all onboardings"
  ON public.agent_onboardings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ADS
-- =============================================
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  target_url TEXT NOT NULL,
  status ad_status NOT NULL DEFAULT 'draft',
  budget_cents INTEGER,
  spent_cents INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  targeting JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own ads"
  ON public.ads FOR ALL
  USING (public.is_owner(user_id))
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Active ads are publicly visible"
  ON public.ads FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage all ads"
  ON public.ads FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- AD PLACEMENTS
-- =============================================
CREATE TABLE public.ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  surface_id UUID REFERENCES public.public_surfaces(id) ON DELETE CASCADE,
  placement_type TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ad owners can manage placements"
  ON public.ad_placements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ads 
      WHERE id = ad_id AND public.is_owner(user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ads 
      WHERE id = ad_id AND public.is_owner(user_id)
    )
  );

CREATE POLICY "Active placements visible on published surfaces"
  ON public.ad_placements FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.ads WHERE id = ad_id AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage all placements"
  ON public.ad_placements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- AUDIT LOGS
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if user has approved KYC
CREATE OR REPLACE FUNCTION public.has_approved_kyc(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kyc_verifications
    WHERE user_id = _user_id AND status = 'approved'
  )
$$;

-- Check if user has used their free trial
CREATE OR REPLACE FUNCTION public.has_used_trial(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trials
    WHERE user_id = _user_id
  )
$$;

-- Count user's published surfaces
CREATE OR REPLACE FUNCTION public.count_published_surfaces(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.public_surfaces
  WHERE user_id = _user_id AND is_published = true
$$;

-- Check if user can publish (KYC approved OR first surface with trial)
CREATE OR REPLACE FUNCTION public.can_publish_surface(_user_id UUID, _surface_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  published_count INTEGER;
  has_kyc BOOLEAN;
  has_trial BOOLEAN;
BEGIN
  -- Check KYC status
  has_kyc := public.has_approved_kyc(_user_id);
  
  -- If KYC approved, can always publish
  IF has_kyc THEN
    RETURN true;
  END IF;
  
  -- Check if this is first surface and trial not used
  published_count := public.count_published_surfaces(_user_id);
  has_trial := public.has_used_trial(_user_id);
  
  -- First surface can use trial
  IF published_count = 0 AND NOT has_trial THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create settings when surface is created
CREATE OR REPLACE FUNCTION public.create_surface_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.surface_settings (surface_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_surface_created
  AFTER INSERT ON public.public_surfaces
  FOR EACH ROW
  EXECUTE FUNCTION public.create_surface_settings();

-- Update timestamps
CREATE TRIGGER update_kyc_updated_at
  BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surfaces_updated_at
  BEFORE UPDATE ON public.public_surfaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surface_settings_updated_at
  BEFORE UPDATE ON public.surface_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_surfaces_user_id ON public.public_surfaces(user_id);
CREATE INDEX idx_surfaces_domain_slug ON public.public_surfaces(domain_id, slug);
CREATE INDEX idx_surfaces_published ON public.public_surfaces(is_published) WHERE is_published = true;
CREATE INDEX idx_kyc_user_status ON public.kyc_verifications(user_id, status);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_agents_user ON public.agents(user_id);
CREATE INDEX idx_agents_surface ON public.agents(surface_id);
CREATE INDEX idx_ads_user ON public.ads(user_id);
CREATE INDEX idx_ads_status ON public.ads(status);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
