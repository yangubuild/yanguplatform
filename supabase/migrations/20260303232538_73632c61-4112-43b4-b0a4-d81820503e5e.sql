
-- Create dropship_providers table
CREATE TABLE public.dropship_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text UNIQUE NOT NULL,
  name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dropship_providers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read providers
CREATE POLICY "Authenticated users can read providers"
  ON public.dropship_providers
  FOR SELECT
  TO authenticated
  USING (true);

-- Seed data
INSERT INTO public.dropship_providers (provider_key, name, is_enabled) VALUES
  ('cj', 'CJ Dropshipping', true),
  ('moderndropship', 'ModernDropship', true),
  ('dsers', 'DSers', false);
