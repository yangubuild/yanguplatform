ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_status text;
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);