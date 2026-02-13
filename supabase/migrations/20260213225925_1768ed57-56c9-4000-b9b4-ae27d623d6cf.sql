
-- ============================================================
-- Credits foundation: new RPCs + generation RPC updates
-- Uses existing user_credits and credit_transactions tables
-- ============================================================

-- 1) get_my_credit_balance: returns current user's balance (0 if no row)
CREATE OR REPLACE FUNCTION public.get_my_credit_balance()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT balance INTO v_balance
  FROM public.user_credits
  WHERE user_id = auth.uid();

  RETURN COALESCE(v_balance, 0);
END;
$$;

-- 2) reserve_credits: authenticated user reserves credits before generation
CREATE OR REPLACE FUNCTION public.reserve_credits(
  p_amount int,
  p_ref_type text,
  p_ref_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current int;
  v_new int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT balance INTO v_current
  FROM public.user_credits
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF v_current IS NULL OR v_current < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  v_new := v_current - p_amount;

  UPDATE public.user_credits
  SET balance = v_new, updated_at = now()
  WHERE user_id = auth.uid();

  INSERT INTO public.credit_transactions
    (user_id, amount, balance_after, transaction_type, description, reference_id, reference_type)
  VALUES
    (auth.uid(), -p_amount, v_new, 'reserve',
     'Reserved ' || p_amount || ' credits for ' || p_ref_type,
     p_ref_id, p_ref_type);
END;
$$;

-- 3) charge_reserved: service_role finalizes a charge (no balance change)
CREATE OR REPLACE FUNCTION public.charge_reserved(
  p_ref_type text,
  p_ref_id uuid,
  p_amount int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_balance int;
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'service_role only';
  END IF;

  -- Find the user from the reserve ledger entry
  SELECT user_id INTO v_user_id
  FROM public.credit_transactions
  WHERE reference_id = p_ref_id
    AND reference_type = p_ref_type
    AND transaction_type = 'reserve'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No reservation found for ref %', p_ref_id;
  END IF;

  SELECT balance INTO v_balance
  FROM public.user_credits
  WHERE user_id = v_user_id;

  INSERT INTO public.credit_transactions
    (user_id, amount, balance_after, transaction_type, description, reference_id, reference_type)
  VALUES
    (v_user_id, -p_amount, COALESCE(v_balance, 0), 'charge',
     'Charged ' || p_amount || ' credits for ' || p_ref_type,
     p_ref_id, p_ref_type);
END;
$$;

-- 4) refund_credits: service_role refunds reserved credits back
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_amount int,
  p_ref_type text,
  p_ref_id uuid,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_new int;
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'service_role only';
  END IF;

  -- Find the user from the reserve ledger entry
  SELECT user_id INTO v_user_id
  FROM public.credit_transactions
  WHERE reference_id = p_ref_id
    AND reference_type = p_ref_type
    AND transaction_type = 'reserve'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No reservation found for ref %', p_ref_id;
  END IF;

  UPDATE public.user_credits
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = v_user_id
  RETURNING balance INTO v_new;

  INSERT INTO public.credit_transactions
    (user_id, amount, balance_after, transaction_type, description, reference_id, reference_type)
  VALUES
    (v_user_id, p_amount, COALESCE(v_new, 0), 'refund',
     COALESCE(p_note, 'Refund ' || p_amount || ' credits for failed ' || p_ref_type),
     p_ref_id, p_ref_type);
END;
$$;

-- 5) Grant credits: service_role only version (complementing existing admin-only add_credits)
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id uuid,
  p_amount int,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new int;
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'service_role only';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  INSERT INTO public.user_credits (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_credits.balance + p_amount, updated_at = now()
  RETURNING balance INTO v_new;

  INSERT INTO public.credit_transactions
    (user_id, amount, balance_after, transaction_type, description)
  VALUES
    (p_user_id, p_amount, v_new, 'grant',
     COALESCE(p_note, 'Granted ' || p_amount || ' credits'));
END;
$$;

-- 6) Update generation RPCs to accept optional p_cost_credits and reserve if > 0

-- Ideogram
CREATE OR REPLACE FUNCTION public.create_ideogram_generation(
  p_prompt text,
  p_params jsonb DEFAULT '{}'::jsonb,
  p_cost_credits int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_params jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_params := p_params;
  IF p_cost_credits IS NOT NULL AND p_cost_credits > 0 THEN
    v_params := v_params || jsonb_build_object('cost_credits', p_cost_credits);
  END IF;

  INSERT INTO public.ai_image_generations (user_id, provider, prompt, params, status)
  VALUES (auth.uid(), 'ideogram', p_prompt, v_params, 'queued')
  RETURNING id INTO v_id;

  IF p_cost_credits IS NOT NULL AND p_cost_credits > 0 THEN
    PERFORM public.reserve_credits(p_cost_credits, 'image', v_id);
  END IF;

  RETURN v_id;
END;
$$;

-- Qwen
CREATE OR REPLACE FUNCTION public.create_qwen_generation(
  p_prompt text,
  p_params jsonb DEFAULT '{}'::jsonb,
  p_cost_credits int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_params jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_params := p_params;
  IF p_cost_credits IS NOT NULL AND p_cost_credits > 0 THEN
    v_params := v_params || jsonb_build_object('cost_credits', p_cost_credits);
  END IF;

  INSERT INTO public.ai_image_generations (user_id, provider, prompt, params, status)
  VALUES (auth.uid(), 'qwen', p_prompt, v_params, 'queued')
  RETURNING id INTO v_id;

  IF p_cost_credits IS NOT NULL AND p_cost_credits > 0 THEN
    PERFORM public.reserve_credits(p_cost_credits, 'image', v_id);
  END IF;

  RETURN v_id;
END;
$$;

-- Creatify
CREATE OR REPLACE FUNCTION public.create_creatify_generation(
  p_prompt text,
  p_params jsonb DEFAULT '{}'::jsonb,
  p_cost_credits int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_params jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_params := p_params;
  IF p_cost_credits IS NOT NULL AND p_cost_credits > 0 THEN
    v_params := v_params || jsonb_build_object('cost_credits', p_cost_credits);
  END IF;

  INSERT INTO public.ai_video_generations (user_id, provider, prompt, params, status)
  VALUES (auth.uid(), 'creatify', p_prompt, v_params, 'queued')
  RETURNING id INTO v_id;

  IF p_cost_credits IS NOT NULL AND p_cost_credits > 0 THEN
    PERFORM public.reserve_credits(p_cost_credits, 'video', v_id);
  END IF;

  RETURN v_id;
END;
$$;
