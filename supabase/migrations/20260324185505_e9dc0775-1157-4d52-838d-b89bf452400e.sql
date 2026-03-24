
-- Hub bookings table for agency workspace
CREATE TABLE IF NOT EXISTS public.hub_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  booked_by uuid NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hub_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view own agency bookings"
  ON public.hub_bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM agency_members WHERE agency_id = hub_bookings.agency_id AND user_id = auth.uid()));

CREATE POLICY "Agency admins/managers can insert bookings"
  ON public.hub_bookings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM agency_members WHERE agency_id = hub_bookings.agency_id AND user_id = auth.uid()));

-- RPC: get agency dashboard with extended stats
CREATE OR REPLACE FUNCTION public.get_agency_dashboard_v2(p_agency_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'agency', (SELECT row_to_json(a) FROM agencies a WHERE a.id = p_agency_id),
    'total_members', (SELECT count(*) FROM agency_members WHERE agency_id = p_agency_id AND status = 'active'),
    'total_referrals', (SELECT count(*) FROM referrals WHERE agency_id = p_agency_id),
    'kyc_pending', (SELECT count(*) FROM referrals r JOIN kyc_verifications k ON k.user_id = r.referred_user_id WHERE r.agency_id = p_agency_id AND k.status = 'pending_review'),
    'kyc_approved', (SELECT count(*) FROM referrals r JOIN kyc_verifications k ON k.user_id = r.referred_user_id WHERE r.agency_id = p_agency_id AND k.status = 'verified'),
    'kyc_rejected', (SELECT count(*) FROM referrals r JOIN kyc_verifications k ON k.user_id = r.referred_user_id WHERE r.agency_id = p_agency_id AND k.status = 'rejected'),
    'active_subscribers', (SELECT count(*) FROM referrals r JOIN billing_subscriptions bs ON bs.user_id = r.referred_user_id WHERE r.agency_id = p_agency_id AND bs.status = 'active'),
    'phase1_total_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE agency_id = p_agency_id AND phase = 'phase_1'), 0),
    'phase2_total_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE agency_id = p_agency_id AND phase = 'phase_2'), 0),
    'total_earned_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE agency_id = p_agency_id AND status = 'paid'), 0),
    'pending_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE agency_id = p_agency_id AND status = 'pending'), 0),
    'converted_referrals', (SELECT count(*) FROM referrals WHERE agency_id = p_agency_id AND status = 'converted'),
    'churned_referrals', (SELECT count(*) FROM referrals WHERE agency_id = p_agency_id AND status = 'churned')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- RPC: get referrals with KYC status and foot soldier info
CREATE OR REPLACE FUNCTION public.get_agency_referrals(p_agency_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id, 'referred_user_id', r.referred_user_id, 'referred_by_user_id', r.referred_by_user_id,
      'source', r.source, 'status', r.status, 'created_at', r.created_at, 'converted_at', r.converted_at,
      'referred_name', rp.display_name, 'referred_email', rp.email,
      'soldier_name', sp.display_name,
      'kyc_status', COALESCE((SELECT k.status FROM kyc_verifications k WHERE k.user_id = r.referred_user_id ORDER BY k.created_at DESC LIMIT 1), 'not_started')
    ) ORDER BY r.created_at DESC)
    FROM referrals r
    LEFT JOIN profiles rp ON rp.id = r.referred_user_id
    LEFT JOIN profiles sp ON sp.id = r.referred_by_user_id
    WHERE r.agency_id = p_agency_id
    AND (p_user_id IS NULL OR r.referred_by_user_id = p_user_id)
    LIMIT 500
  ), '[]'::jsonb);
END;
$$;

-- RPC: get hub bookings for agency
CREATE OR REPLACE FUNCTION public.get_hub_bookings(p_agency_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', hb.id, 'booked_by', hb.booked_by, 'booking_date', hb.booking_date,
      'start_time', hb.start_time, 'end_time', hb.end_time, 'status', hb.status, 'notes', hb.notes,
      'booker_name', p.display_name
    ) ORDER BY hb.booking_date DESC, hb.start_time)
    FROM hub_bookings hb LEFT JOIN profiles p ON p.id = hb.booked_by
    WHERE hb.agency_id = p_agency_id
    LIMIT 200
  ), '[]'::jsonb);
END;
$$;

-- RPC: create hub booking
CREATE OR REPLACE FUNCTION public.create_hub_booking(p_agency_id uuid, p_date date, p_start time, p_end time, p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO hub_bookings (agency_id, booked_by, booking_date, start_time, end_time, notes)
  VALUES (p_agency_id, auth.uid(), p_date, p_start, p_end, p_notes) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- RPC: get agency support tickets
CREATE OR REPLACE FUNCTION public.get_agency_support_tickets(p_agency_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid() AND role IN ('agency_admin','agency_manager'))) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', st.id, 'subject', st.subject, 'description', st.description,
      'category', st.category, 'status', st.status, 'priority', st.priority,
      'created_at', st.created_at, 'updated_at', st.updated_at,
      'user_name', p.display_name,
      'messages', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', sm.id, 'content', sm.content, 'sender_type', sm.sender_type, 'created_at', sm.created_at) ORDER BY sm.created_at)
        FROM support_messages sm WHERE sm.ticket_id = st.id
      ), '[]'::jsonb)
    ) ORDER BY st.updated_at DESC)
    FROM support_tickets st
    LEFT JOIN profiles p ON p.id = st.user_id
    WHERE st.user_id IN (SELECT user_id FROM agency_members WHERE agency_id = p_agency_id)
    LIMIT 100
  ), '[]'::jsonb);
END;
$$;

-- RPC: foot soldier own stats
CREATE OR REPLACE FUNCTION public.get_my_agency_stats(p_agency_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN jsonb_build_object(
    'my_referrals', (SELECT count(*) FROM referrals WHERE referred_by_user_id = auth.uid() AND agency_id = p_agency_id),
    'my_converted', (SELECT count(*) FROM referrals WHERE referred_by_user_id = auth.uid() AND agency_id = p_agency_id AND status = 'converted'),
    'my_kyc_approved', (SELECT count(*) FROM referrals r JOIN kyc_verifications k ON k.user_id = r.referred_user_id WHERE r.referred_by_user_id = auth.uid() AND r.agency_id = p_agency_id AND k.status = 'verified'),
    'my_total_earned_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE member_user_id = auth.uid() AND agency_id = p_agency_id AND status = 'paid'), 0),
    'my_pending_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE member_user_id = auth.uid() AND agency_id = p_agency_id AND status = 'pending'), 0),
    'my_phase1_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE member_user_id = auth.uid() AND agency_id = p_agency_id AND phase = 'phase_1'), 0),
    'my_phase2_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE member_user_id = auth.uid() AND agency_id = p_agency_id AND phase = 'phase_2'), 0)
  );
END;
$$;
