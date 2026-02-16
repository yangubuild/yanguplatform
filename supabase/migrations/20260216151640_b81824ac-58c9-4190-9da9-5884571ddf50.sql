
-- Add country and business_name columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS business_name text;
