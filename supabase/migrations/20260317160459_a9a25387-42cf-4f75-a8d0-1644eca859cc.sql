
-- 1. Add an IP-based rate limit function for anonymous callers
CREATE OR REPLACE FUNCTION public.check_rate_limit_anon(
  p_identifier text,
  p_action_key text,
  p_max_count int,
  p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
  v_cutoff timestamptz;
  -- Use a deterministic UUID from the identifier so we can reuse rate_limit_log
  v_user_id uuid;
BEGIN
  v_user_id := uuid_generate_v5(uuid_nil(), p_identifier);
  v_cutoff := now() - (p_window_seconds || ' seconds')::interval;

  SELECT count(*) INTO v_count
  FROM public.rate_limit_log
  WHERE user_id = v_user_id
    AND action_key = p_action_key
    AND created_at > v_cutoff;

  IF v_count >= p_max_count THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_log (user_id, action_key)
  VALUES (v_user_id, p_action_key);

  RETURN true;
END;
$function$;

-- Restrict to service_role only (called from SECURITY DEFINER context)
REVOKE EXECUTE ON FUNCTION public.check_rate_limit_anon(text, text, int, int) FROM anon, authenticated;

-- 2. Update track_order to use per-IP rate limiting
CREATE OR REPLACE FUNCTION public.track_order(p_tracking_code text, p_buyer_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  o record;
  items jsonb;
  is_allowed boolean;
  v_ip text;
BEGIN
  -- Get caller IP for per-client rate limiting
  v_ip := coalesce(inet_client_addr()::text, 'unknown');

  SELECT public.check_rate_limit_anon(
    v_ip,
    'track_order',
    10,
    60
  ) INTO is_allowed;

  IF NOT is_allowed THEN
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
