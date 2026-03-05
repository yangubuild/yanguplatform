INSERT INTO public.dropship_providers (provider_key, name, is_enabled)
VALUES ('aliexpress', 'AliExpress', true)
ON CONFLICT (provider_key) DO UPDATE SET is_enabled = true, name = 'AliExpress';