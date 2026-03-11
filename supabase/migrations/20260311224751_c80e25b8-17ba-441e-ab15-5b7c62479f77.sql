
-- Set launch_routes for Google apps so "Open" button works in My Apps
UPDATE app_registry SET launch_route = '/dashboard/visionaire' WHERE slug = 'google-drive';
UPDATE app_registry SET launch_route = '/dashboard/my-apps' WHERE slug = 'gmail';
UPDATE app_registry SET launch_route = '/dashboard/my-apps' WHERE slug = 'google-meet';
-- Stripe: direct API key connection, not OAuth
UPDATE app_registry SET supports_oauth = false WHERE slug = 'stripe';
