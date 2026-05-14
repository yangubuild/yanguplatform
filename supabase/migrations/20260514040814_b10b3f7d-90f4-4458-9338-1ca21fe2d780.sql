-- Update the comment on rate_per_sale_pct to document fraction storage
COMMENT ON COLUMN public.offline_bounty_rates.rate_per_sale_pct IS 'Commission rate per sale, stored as a fraction (e.g. 0.02 = 2%)';

-- Add CHECK constraint ensuring rate_per_sale_pct is between 0 and 1
ALTER TABLE public.offline_bounty_rates
ADD CONSTRAINT chk_rate_per_sale_pct_range
CHECK (rate_per_sale_pct >= 0 AND rate_per_sale_pct <= 1);