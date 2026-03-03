
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_mode text NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS avatar_emoji_key text;
