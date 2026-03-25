-- Phase A: New tables for management enhancement

-- 1. Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'engineer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_marketing';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'social_digital';

-- 2. Management team members (KYC tracked)
CREATE TABLE IF NOT EXISTS public.management_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  kyc_status TEXT DEFAULT 'pending',
  kyc_data JSONB,
  is_active BOOLEAN DEFAULT true,
  invited_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.management_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on management_team_members" ON public.management_team_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Domain health checks
CREATE TABLE IF NOT EXISTS public.domain_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  response_time_ms INTEGER,
  error_rate DECIMAL DEFAULT 0,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.domain_health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read domain_health_checks" ON public.domain_health_checks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_roles TEXT[],
  target_platforms TEXT[],
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Approval requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  title TEXT,
  details JSONB,
  status TEXT DEFAULT 'pending',
  approved_by UUID[],
  rejected_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on approval_requests" ON public.approval_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Department reports
CREATE TABLE IF NOT EXISTS public.department_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  report_date DATE NOT NULL,
  summary TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  highlights TEXT[],
  blockers TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.department_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on department_reports" ON public.department_reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Email triggers
CREATE TABLE IF NOT EXISTS public.email_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_event TEXT NOT NULL,
  trigger_name TEXT NOT NULL DEFAULT 'Untitled Trigger',
  template_id TEXT,
  template_content TEXT,
  conditions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_fired_at TIMESTAMPTZ,
  fire_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.email_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on email_triggers" ON public.email_triggers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Management assets (designer uploads with approval)
CREATE TABLE IF NOT EXISTS public.management_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'pending_approval',
  tags TEXT[],
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.management_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on management_assets" ON public.management_assets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Designer can insert management_assets" ON public.management_assets
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'designer'));
CREATE POLICY "Designer can view own management_assets" ON public.management_assets
  FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));