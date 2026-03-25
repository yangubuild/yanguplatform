
-- Agency reports table for daily/monthly reports
CREATE TABLE IF NOT EXISTS public.agency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'daily',
  report_date DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'submitted',
  created_by UUID,
  file_url TEXT
);

ALTER TABLE public.agency_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view own agency reports"
  ON public.agency_reports FOR SELECT TO authenticated
  USING (agency_id IN (
    SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Agency admins/finance can insert reports"
  ON public.agency_reports FOR INSERT TO authenticated
  WITH CHECK (agency_id IN (
    SELECT agency_id FROM public.agency_members
    WHERE user_id = auth.uid() AND status = 'active' AND role IN ('agency_admin', 'finance_officer')
  ));

-- Agency assets table
CREATE TABLE IF NOT EXISTS public.agency_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  asset_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agency_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view public assets"
  ON public.agency_assets FOR SELECT TO authenticated
  USING (
    agency_id IS NULL
    OR agency_id IN (
      SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Content calendar table
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  asset_id UUID REFERENCES public.agency_assets(id),
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view content calendar"
  ON public.content_calendar FOR SELECT TO authenticated
  USING (agency_id IN (
    SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Creators and admins can manage content calendar"
  ON public.content_calendar FOR ALL TO authenticated
  USING (agency_id IN (
    SELECT agency_id FROM public.agency_members
    WHERE user_id = auth.uid() AND status = 'active' AND role IN ('agency_admin', 'creator')
  ));
