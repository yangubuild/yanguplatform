
-- ═══════════ PAYOUT TABLES ═══════════
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  disbursed_at timestamptz,
  rejection_reason text,
  notes text
);
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own payouts" ON public.payout_requests
  FOR SELECT TO authenticated
  USING (member_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ═══════════ PAYOUT LEDGER VIEW RPC ═══════════
CREATE OR REPLACE FUNCTION public.get_agency_payouts(p_agency_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'requests', COALESCE((
      SELECT jsonb_agg(row_to_json(pr) ORDER BY pr.requested_at DESC)
      FROM payout_requests pr
      WHERE pr.agency_id = p_agency_id
        AND (p_user_id IS NULL OR pr.member_user_id = p_user_id)
    ), '[]'::jsonb),
    'payable_cents', COALESCE((
      SELECT SUM(c.amount_cents) FROM commissions c
      WHERE c.agency_id = p_agency_id AND c.status = 'pending'
        AND (p_user_id IS NULL OR c.member_user_id = p_user_id)
    ), 0),
    'disbursed_cents', COALESCE((
      SELECT SUM(c.amount_cents) FROM commissions c
      WHERE c.agency_id = p_agency_id AND c.status = 'paid'
        AND (p_user_id IS NULL OR c.member_user_id = p_user_id)
    ), 0),
    'pending_request_cents', COALESCE((
      SELECT SUM(pr.amount_cents) FROM payout_requests pr
      WHERE pr.agency_id = p_agency_id AND pr.status = 'pending'
        AND (p_user_id IS NULL OR pr.member_user_id = p_user_id)
    ), 0)
  ) INTO result;
  RETURN result;
END;
$$;

-- Request payout RPC
CREATE OR REPLACE FUNCTION public.request_payout(p_agency_id uuid, p_amount_cents integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
  v_available integer;
BEGIN
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_available
  FROM commissions
  WHERE agency_id = p_agency_id AND member_user_id = auth.uid() AND status = 'pending';

  IF p_amount_cents > v_available THEN
    RAISE EXCEPTION 'Requested amount exceeds available balance';
  END IF;

  INSERT INTO payout_requests (agency_id, member_user_id, amount_cents)
  VALUES (p_agency_id, auth.uid(), p_amount_cents)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ═══════════ HUB BOOKING ACTIONS ═══════════
CREATE OR REPLACE FUNCTION public.cancel_hub_booking(p_booking_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE hub_bookings SET status = 'cancelled'
  WHERE id = p_booking_id
    AND (booked_by = auth.uid() OR EXISTS (
      SELECT 1 FROM agency_members am
      WHERE am.user_id = auth.uid() AND am.agency_id = hub_bookings.agency_id
        AND am.role IN ('agency_admin', 'agency_manager') AND am.status = 'active'
    ));
END;
$$;

CREATE OR REPLACE FUNCTION public.modify_hub_booking(p_booking_id uuid, p_date date, p_start time, p_end time, p_notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Conflict check
  IF EXISTS (
    SELECT 1 FROM hub_bookings hb
    WHERE hb.agency_id = (SELECT agency_id FROM hub_bookings WHERE id = p_booking_id)
      AND hb.booking_date = p_date
      AND hb.id != p_booking_id
      AND hb.status != 'cancelled'
      AND hb.start_time < p_end AND hb.end_time > p_start
  ) THEN
    RAISE EXCEPTION 'Time slot conflicts with an existing booking';
  END IF;

  UPDATE hub_bookings
  SET booking_date = p_date, start_time = p_start, end_time = p_end,
      notes = COALESCE(p_notes, notes)
  WHERE id = p_booking_id
    AND (booked_by = auth.uid() OR EXISTS (
      SELECT 1 FROM agency_members am
      WHERE am.user_id = auth.uid() AND am.agency_id = hub_bookings.agency_id
        AND am.role IN ('agency_admin', 'agency_manager') AND am.status = 'active'
    ));
END;
$$;

-- Add conflict check to create_hub_booking too
CREATE OR REPLACE FUNCTION public.create_hub_booking(p_agency_id uuid, p_date date, p_start time, p_end time, p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM hub_bookings hb
    WHERE hb.agency_id = p_agency_id AND hb.booking_date = p_date
      AND hb.status != 'cancelled'
      AND hb.start_time < p_end AND hb.end_time > p_start
  ) THEN
    RAISE EXCEPTION 'Time slot conflicts with an existing booking';
  END IF;

  INSERT INTO hub_bookings (agency_id, booked_by, booking_date, start_time, end_time, notes)
  VALUES (p_agency_id, auth.uid(), p_date, p_start, p_end, p_notes)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ═══════════ SUPPORT ESCALATION ═══════════
CREATE OR REPLACE FUNCTION public.escalate_agency_ticket(p_ticket_id uuid, p_reason text DEFAULT 'Agency escalation')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE support_tickets SET status = 'escalated',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'escalated_at', now(),
      'escalated_by', auth.uid(),
      'escalation_reason', p_reason
    )
  WHERE id = p_ticket_id;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'escalate_ticket', 'support_ticket', p_ticket_id::text,
    jsonb_build_object('reason', p_reason));
END;
$$;
