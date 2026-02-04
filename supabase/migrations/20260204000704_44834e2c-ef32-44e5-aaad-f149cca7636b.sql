-- =============================================
-- YANGU.STUDIO DATABASE SCHEMA (CORRECTED)
-- =============================================

-- 1. USER CREDITS TABLE
CREATE TABLE public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 10 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credits"
  ON public.user_credits FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. CREDIT TRANSACTIONS TABLE (audit trail)
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('spend', 'add', 'refund', 'bonus')),
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 3. STUDIO PROJECTS TABLE
CREATE TABLE public.studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  product_url TEXT,
  brand_name TEXT,
  brand_description TEXT,
  brand_blueprint JSONB DEFAULT '{}'::jsonb,
  target_platforms TEXT[] DEFAULT '{}',
  target_language TEXT DEFAULT 'en',
  content_types TEXT[] DEFAULT '{}',
  album_slug TEXT,
  album_published BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX studio_projects_album_slug_idx 
  ON public.studio_projects (user_id, album_slug) 
  WHERE album_slug IS NOT NULL;

ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON public.studio_projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Published albums are publicly viewable"
  ON public.studio_projects FOR SELECT
  USING (album_published = true AND album_slug IS NOT NULL);

CREATE POLICY "Admins can manage all projects"
  ON public.studio_projects FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. STUDIO ASSETS TABLE
CREATE TABLE public.studio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('video_ad', 'image_ad', 'ugc_video', 'carousel', 'copy', 'thumbnail')),
  title TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  platform TEXT,
  language TEXT DEFAULT 'en',
  variation_index INTEGER DEFAULT 0,
  generation_prompt TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  download_credits INTEGER NOT NULL DEFAULT 1,
  is_uploaded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own assets"
  ON public.studio_assets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Assets in published albums are viewable"
  ON public.studio_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.studio_projects sp
      WHERE sp.id = studio_assets.project_id
        AND sp.album_published = true
        AND sp.album_slug IS NOT NULL
    )
  );

CREATE POLICY "Admins can manage all assets"
  ON public.studio_assets FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. SPEND CREDITS RPC (atomic deduction)
CREATE OR REPLACE FUNCTION public.spend_credits(
  _user_id UUID,
  _amount INTEGER,
  _description TEXT DEFAULT NULL,
  _reference_id UUID DEFAULT NULL,
  _reference_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_balance INTEGER;
  _new_balance INTEGER;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT balance INTO _current_balance
  FROM public.user_credits
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credit record found');
  END IF;

  IF _current_balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'balance', _current_balance);
  END IF;

  _new_balance := _current_balance - _amount;

  UPDATE public.user_credits
  SET balance = _new_balance, updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, description, reference_id, reference_type)
  VALUES (_user_id, -_amount, _new_balance, 'spend', _description, _reference_id, _reference_type);

  RETURN jsonb_build_object('success', true, 'balance', _new_balance);
END;
$$;

-- 6. ADD CREDITS RPC (admin only)
CREATE OR REPLACE FUNCTION public.add_credits(
  _user_id UUID,
  _amount INTEGER,
  _transaction_type TEXT DEFAULT 'add',
  _description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller_id UUID;
  _new_balance INTEGER;
BEGIN
  _caller_id := auth.uid();

  IF NOT has_role(_caller_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  IF _amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  IF _transaction_type NOT IN ('add', 'refund', 'bonus') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  INSERT INTO public.user_credits (user_id, balance)
  VALUES (_user_id, _amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_credits.balance + _amount, updated_at = now()
  RETURNING balance INTO _new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, description)
  VALUES (_user_id, _amount, _new_balance, _transaction_type, _description);

  RETURN jsonb_build_object('success', true, 'balance', _new_balance);
END;
$$;

-- 7. AUTO-CREATE CREDITS ON PROFILE CREATION (10 free credits)
CREATE OR REPLACE FUNCTION public.ensure_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_credits();

-- 8. UPDATED_AT TRIGGERS
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_projects_updated_at
  BEFORE UPDATE ON public.studio_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();