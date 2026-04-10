
-- Surface Commerce Config table
CREATE TABLE public.surface_commerce_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_id uuid NOT NULL REFERENCES public.builder_surfaces(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  ordering_enabled boolean NOT NULL DEFAULT false,
  order_types text[] NOT NULL DEFAULT '{delivery}',
  currency text NOT NULL DEFAULT 'UGX',
  payment_methods text[] NOT NULL DEFAULT '{cash}',
  mobile_money_phone text,
  mobile_money_provider text,
  mobile_money_country text,
  stripe_enabled boolean NOT NULL DEFAULT false,
  paypal_enabled boolean NOT NULL DEFAULT false,
  support_email text,
  support_phone text,
  support_whatsapp text,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  whatsapp_default_message text DEFAULT 'Hello! I have a question about my order.',
  min_order_value_cents integer DEFAULT 0,
  delivery_fee_cents integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(surface_id)
);

ALTER TABLE public.surface_commerce_config ENABLE ROW LEVEL SECURITY;

-- Public can read config (needed for cart/checkout on public pages)
CREATE POLICY "Anyone can read commerce config"
  ON public.surface_commerce_config FOR SELECT
  USING (true);

-- Owner can manage their own config
CREATE POLICY "Owners can insert their commerce config"
  ON public.surface_commerce_config FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their commerce config"
  ON public.surface_commerce_config FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their commerce config"
  ON public.surface_commerce_config FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Add order_type and owner_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Timestamp trigger for surface_commerce_config
CREATE TRIGGER update_surface_commerce_config_updated_at
  BEFORE UPDATE ON public.surface_commerce_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
