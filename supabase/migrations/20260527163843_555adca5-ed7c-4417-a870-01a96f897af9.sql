ALTER TABLE public.surface_commerce_config
  ADD COLUMN IF NOT EXISTS mobile_money_account_name text,
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_publishable_key text,
  ADD COLUMN IF NOT EXISTS paypal_email text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS buyer_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_orders_buyer_user_id ON public.orders(buyer_user_id);