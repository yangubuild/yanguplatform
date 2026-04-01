
-- Add conversion tracking columns to advertiser_campaigns
ALTER TABLE public.advertiser_campaigns
  ADD COLUMN IF NOT EXISTS target_conversions integer,
  ADD COLUMN IF NOT EXISTS delivered_conversions integer DEFAULT 0;

-- Add FK from ads.advertiser_id to advertiser_accounts
ALTER TABLE public.ads
  ADD CONSTRAINT ads_advertiser_id_fkey
  FOREIGN KEY (advertiser_id) REFERENCES public.advertiser_accounts(id) ON DELETE SET NULL;
