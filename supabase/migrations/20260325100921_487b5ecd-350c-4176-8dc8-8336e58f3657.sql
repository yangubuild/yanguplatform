
-- Agency invitations table
CREATE TABLE public.agency_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  commission_split_phase1 NUMERIC(10,2) DEFAULT 0.50,
  commission_split_phase2 NUMERIC(10,2) DEFAULT 1.00,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency notifications table
CREATE TABLE public.agency_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_notifications ENABLE ROW LEVEL SECURITY;

-- RLS for agency_invitations: agency admins can manage their own agency's invitations
CREATE POLICY "Agency admins can manage invitations"
ON public.agency_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members am
    WHERE am.user_id = auth.uid()
    AND am.agency_id = agency_invitations.agency_id
    AND am.role = 'agency_admin'
    AND am.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agency_members am
    WHERE am.user_id = auth.uid()
    AND am.agency_id = agency_invitations.agency_id
    AND am.role = 'agency_admin'
    AND am.status = 'active'
  )
);

-- Public can read their own invitation by token (for accept flow)
CREATE POLICY "Anyone can read invitation by token"
ON public.agency_invitations
FOR SELECT
TO authenticated
USING (true);

-- RLS for agency_notifications: users can read their own notifications
CREATE POLICY "Users read own notifications"
ON public.agency_notifications
FOR SELECT
TO authenticated
USING (recipient_user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications"
ON public.agency_notifications
FOR UPDATE
TO authenticated
USING (recipient_user_id = auth.uid())
WITH CHECK (recipient_user_id = auth.uid());

-- Agency admins can insert notifications for their agency
CREATE POLICY "Agency admins insert notifications"
ON public.agency_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agency_members am
    WHERE am.user_id = auth.uid()
    AND am.agency_id = agency_notifications.agency_id
    AND am.role IN ('agency_admin', 'agency_manager')
    AND am.status = 'active'
  )
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_notifications;
