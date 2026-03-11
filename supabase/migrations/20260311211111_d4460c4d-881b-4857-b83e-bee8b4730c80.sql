-- Add PayPal and Stripe to app_registry
INSERT INTO app_registry (slug, name, short_description, icon, provider_name, provider_type, category, app_type, action_type, pricing_type, visibility, status, is_featured, is_native_yangu, supports_oauth, supports_api_key, supports_desktop_install, supports_web_install, supports_embed, sort_order, tags, launch_route, connect_route)
VALUES
  ('paypal', 'PayPal', 'Accept payments and manage payouts with PayPal', NULL, 'PayPal', 'third_party', 'finance', 'connector_app', 'connect', 'free', 'public', 'active', false, false, true, false, false, true, false, 28, ARRAY['payments','payouts','checkout'], '/dashboard/payment-settings', NULL),
  ('stripe', 'Stripe', 'Process payments and subscriptions with Stripe', NULL, 'Stripe', 'third_party', 'finance', 'connector_app', 'connect', 'free', 'public', 'active', false, false, true, false, false, true, false, 29, ARRAY['payments','subscriptions','checkout'], '/dashboard/payment-settings', NULL);

-- Enable supports_oauth on Google apps
UPDATE app_registry SET supports_oauth = true, action_type = 'connect' WHERE slug IN ('google-drive', 'gmail', 'google-meet');

-- Enable supports_oauth on Notion
UPDATE app_registry SET supports_oauth = true, action_type = 'connect' WHERE slug = 'notion';