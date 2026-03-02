ALTER TABLE public.profiles ADD COLUMN cover_url text;
NOTIFY pgrst, 'reload schema';