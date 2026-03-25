
-- Vision Board Goals
CREATE TABLE IF NOT EXISTS public.vision_board_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'weekly',
  target_kyc_users INTEGER DEFAULT 0,
  target_subscribers INTEGER DEFAULT 0,
  actual_kyc_users INTEGER DEFAULT 0,
  actual_subscribers INTEGER DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.vision_board_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can view goals" ON public.vision_board_goals FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Admins can manage goals" ON public.vision_board_goals FOR ALL TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active' AND role IN ('agency_admin', 'agency_manager')));

-- Vision Board Tasks
CREATE TABLE IF NOT EXISTS public.vision_board_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  assigned_to UUID,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.vision_board_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can view tasks" ON public.vision_board_tasks FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Leaders can manage tasks" ON public.vision_board_tasks FOR ALL TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active' AND role IN ('agency_admin', 'agency_manager')));

-- Hub Events
CREATE TABLE IF NOT EXISTS public.hub_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  purpose TEXT,
  location TEXT,
  attendees INTEGER,
  hub_booking_id UUID REFERENCES public.hub_bookings(id),
  status TEXT NOT NULL DEFAULT 'planned',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.hub_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can view hub events" ON public.hub_events FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Leaders can manage hub events" ON public.hub_events FOR ALL TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active' AND role IN ('agency_admin', 'agency_manager')));

-- Agency Contracts
CREATE TABLE IF NOT EXISTS public.agency_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  contract_url TEXT NOT NULL,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  signed_by UUID,
  signature_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.agency_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency admins can view contracts" ON public.agency_contracts FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active' AND role = 'agency_admin'));
CREATE POLICY "Agency admins can update contracts" ON public.agency_contracts FOR UPDATE TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active' AND role = 'agency_admin'));

-- Foot Soldier Check-ins
CREATE TABLE IF NOT EXISTS public.foot_soldier_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  checkin_date DATE NOT NULL,
  users_onboarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, checkin_date)
);
ALTER TABLE public.foot_soldier_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view own checkins" ON public.foot_soldier_checkins FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Foot soldiers can insert own checkins" ON public.foot_soldier_checkins FOR INSERT TO authenticated
  WITH CHECK (member_id IN (SELECT id FROM public.agency_members WHERE user_id = auth.uid() AND status = 'active'));
