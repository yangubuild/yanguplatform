-- Add quota keys for builder AI features
INSERT INTO public.usage_quota_config (key, free_limit, starter_limit, creator_limit, reset_days, is_enabled)
VALUES 
  ('builder_ai_section', 10, 30, 100, 1, true),
  ('builder_ai_business_profile', 5, 15, 50, 1, true)
ON CONFLICT (key) DO NOTHING;