
CREATE TABLE public.merchant_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  owner_type TEXT NOT NULL DEFAULT 'yangu' CHECK (owner_type IN ('yangu', 'user')),
  image_url TEXT,
  header TEXT NOT NULL,
  description TEXT,
  destination_url TEXT,
  duration_type TEXT NOT NULL DEFAULT 'week' CHECK (duration_type IN ('day', 'week', 'month')),
  fee_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  love_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active offers"
  ON public.merchant_offers FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can insert own offers"
  ON public.merchant_offers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own offers"
  ON public.merchant_offers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own offers"
  ON public.merchant_offers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.offer_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.merchant_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.offer_comments(id) ON DELETE CASCADE,
  love_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view offer comments"
  ON public.offer_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.offer_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON public.offer_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.offer_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
