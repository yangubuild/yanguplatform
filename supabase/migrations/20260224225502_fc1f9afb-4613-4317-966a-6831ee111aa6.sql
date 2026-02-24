CREATE OR REPLACE FUNCTION public.deduct_download_credit(
  p_asset_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_cost integer;
  v_balance integer;
  v_new_balance integer;
  v_file_url text;
BEGIN
  -- Always trust auth, not client input
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Lock the asset row to prevent race on reads
  SELECT download_credits, file_url
    INTO v_cost, v_file_url
  FROM studio_assets
  WHERE id = p_asset_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_cost IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset not found or not owned by user');
  END IF;

  IF v_cost = 0 THEN
    RETURN jsonb_build_object('success', true, 'file_url', v_file_url, 'cost', 0);
  END IF;

  -- Lock the credits row to prevent double-spend
  SELECT balance
    INTO v_balance
  FROM user_credits
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'required', v_cost,
      'balance', COALESCE(v_balance, 0)
    );
  END IF;

  v_new_balance := v_balance - v_cost;

  UPDATE user_credits
  SET balance = v_new_balance,
      updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO credit_transactions (
    user_id, amount, balance_after, transaction_type, description, reference_id, reference_type
  )
  VALUES (
    v_user_id, -v_cost, v_new_balance, 'spend', 'Studio asset download', p_asset_id::text, 'studio_asset_download'
  );

  RETURN jsonb_build_object('success', true, 'file_url', v_file_url, 'cost', v_cost, 'balance', v_new_balance);
END;
$$;