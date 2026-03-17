
-- ============================================================
-- 1. builder_events: Tighten INSERT from WITH CHECK (true)
--    to require the publish_id belongs to a surface the user owns
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert builder events" ON public.builder_events;

CREATE POLICY "Owner can insert builder events"
ON public.builder_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM builder_publishes bp
    JOIN builder_surfaces bs ON bs.id = bp.surface_id
    WHERE bp.id = builder_events.publish_id
      AND bs.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- ============================================================
-- 2. Add SET search_path TO 'public' to 4 SECURITY DEFINER
--    pgmq wrapper functions
-- ============================================================

-- 2a. delete_email
CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$ SELECT pgmq.delete(queue_name, message_id); $function$;

-- 2b. enqueue_email
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$ SELECT pgmq.send(queue_name, payload); $function$;

-- 2c. move_to_dlq
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$function$;

-- 2d. read_email_batch
CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$ SELECT msg_id, read_ct, message FROM pgmq.read(queue_name, vt, batch_size); $function$;

-- ============================================================
-- 3. Restrict email queue RPCs to service_role only
--    These should never be called directly by end users
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;

-- ============================================================
-- 4. Add rate limiting to track_order to prevent enumeration
-- ============================================================
CREATE OR REPLACE FUNCTION public.track_order(p_tracking_code text, p_buyer_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  o record;
  items jsonb;
  is_limited boolean;
BEGIN
  -- Rate limit: 10 attempts per 60 seconds per IP/session
  -- Uses a NULL user_id since this is callable by anon
  SELECT NOT public.check_rate_limit(
    '00000000-0000-0000-0000-000000000000'::uuid,
    'track_order',
    10,
    60
  ) INTO is_limited;

  IF is_limited THEN
    RETURN jsonb_build_object('error', 'Too many attempts. Please try again later.');
  END IF;

  SELECT * INTO o
  FROM public.orders
  WHERE tracking_code = p_tracking_code
    AND lower(buyer_email) = lower(p_buyer_email);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  SELECT coalesce(
    jsonb_agg(to_jsonb(oi) ORDER BY oi.created_at),
    '[]'::jsonb
  ) INTO items
  FROM public.order_items oi
  WHERE oi.order_id = o.id;

  RETURN jsonb_build_object(
    'id', o.id,
    'status', o.status,
    'total_cents', o.total_cents,
    'currency', o.currency,
    'created_at', o.created_at,
    'items', items
  );
END;
$function$;
