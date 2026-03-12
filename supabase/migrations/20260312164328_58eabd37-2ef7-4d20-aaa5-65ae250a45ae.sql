ALTER TABLE public.connected_accounts
DROP CONSTRAINT IF EXISTS connected_accounts_provider_check;

ALTER TABLE public.connected_accounts
ADD CONSTRAINT connected_accounts_provider_check
CHECK (
  provider = ANY (
    ARRAY[
      'instagram'::text,
      'facebook'::text,
      'tiktok'::text,
      'google-drive'::text,
      'gmail'::text,
      'google-meet'::text,
      'youtube'::text
    ]
  )
);
