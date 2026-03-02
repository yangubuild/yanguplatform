
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dashboard_credit_claimed boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS free_images_used integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_videos_used integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.claim_dashboard_credits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_already_claimed boolean;
  v_new_balance bigint;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT dashboard_credit_claimed
    INTO v_already_claimed
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_already_claimed IS TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already claimed');
  END IF;

  UPDATE public.profiles
  SET dashboard_credit_claimed = true,
      updated_at = now()
  WHERE id = v_user_id;

  INSERT INTO public.user_credits (user_id, balance)
  VALUES (v_user_id, 312500)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = public.user_credits.balance + 312500,
                updated_at = now()
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, description)
  VALUES (v_user_id, 312500, v_new_balance, 'bonus', 'Dashboard welcome bonus — $25 AI tokens');

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$;

NOTIFY pgrst, 'reload schema';
