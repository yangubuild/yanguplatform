
-- Special program applications (Students, Campus, Non-Profit)
CREATE TABLE IF NOT EXISTS public.special_program_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  country TEXT,
  role TEXT,
  application_type TEXT NOT NULL CHECK (application_type IN ('student','campus','non_profit')),
  explanation TEXT,
  uploaded_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected')),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.special_program_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can submit an application
CREATE POLICY "Anyone can submit application"
  ON public.special_program_applications FOR INSERT
  WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users view own applications"
  ON public.special_program_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Gift card purchases
CREATE TABLE IF NOT EXISTS public.gift_card_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  card_design TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('recipient','self_pdf')),
  recipient_name TEXT,
  recipient_email TEXT,
  sender_name TEXT,
  message TEXT,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','delivered','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_card_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create gift card order"
  ON public.gift_card_orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Buyer views own gift card orders"
  ON public.gift_card_orders FOR SELECT
  USING (auth.uid() = buyer_user_id);

-- Storage bucket for special-program documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('special-program-docs', 'special-program-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload special program docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'special-program-docs');

CREATE POLICY "Users can read own special program docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'special-program-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
