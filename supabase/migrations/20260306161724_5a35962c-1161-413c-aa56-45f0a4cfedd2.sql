
-- Add Discord connector
INSERT INTO public.app_registry (
  slug, name, short_description, icon, provider_name, provider_type,
  category, app_type, action_type, pricing_type, visibility, status,
  is_native_yangu, supports_desktop_install, supports_web_install,
  supports_oauth, sort_order, tags
) VALUES (
  'discord', 'Discord', 'Connect your Discord server for community management.',
  NULL, 'Discord', 'external', 'connectors', 'connector_app', 'connect',
  'free', 'public', 'active', false, false, false, true, 250,
  ARRAY['communication', 'community', 'chat']
);

-- Reorder so VLS=1, VisionBoard=2, etc.
UPDATE public.app_registry SET sort_order = 1 WHERE slug = 'vls';
UPDATE public.app_registry SET sort_order = 2 WHERE slug = 'visionboard';
UPDATE public.app_registry SET sort_order = 3 WHERE slug = 'visionaire';
UPDATE public.app_registry SET sort_order = 4 WHERE slug = 'foundaweb';
UPDATE public.app_registry SET sort_order = 5 WHERE slug = 'ada-ai';
UPDATE public.app_registry SET sort_order = 6 WHERE slug = 'yangu-livestream';
UPDATE public.app_registry SET sort_order = 7 WHERE slug = 'yangu-studio';
UPDATE public.app_registry SET sort_order = 10 WHERE slug = 'tasks';
UPDATE public.app_registry SET sort_order = 11 WHERE slug = 'hr-app';
UPDATE public.app_registry SET sort_order = 12 WHERE slug = 'personal-budgeting';
UPDATE public.app_registry SET sort_order = 13 WHERE slug = 'sales-marketing';
UPDATE public.app_registry SET sort_order = 14 WHERE slug = 'logo-creator';
UPDATE public.app_registry SET sort_order = 20 WHERE slug = 'youtube';
UPDATE public.app_registry SET sort_order = 21 WHERE slug = 'telegram';
UPDATE public.app_registry SET sort_order = 22 WHERE slug = 'zoom';
UPDATE public.app_registry SET sort_order = 23 WHERE slug = 'google-meet';
UPDATE public.app_registry SET sort_order = 24 WHERE slug = 'gmail';
UPDATE public.app_registry SET sort_order = 25 WHERE slug = 'google-drive';
UPDATE public.app_registry SET sort_order = 26 WHERE slug = 'notion';
UPDATE public.app_registry SET sort_order = 27 WHERE slug = 'discord';

-- Update descriptions for YANGU native apps
UPDATE public.app_registry SET short_description = 'Vision Leadership System assessment app for businesses and organizations to help them hire right, lead and scale faster.' WHERE slug = 'vls';
UPDATE public.app_registry SET short_description = 'Productivity app to help businesses organize their work, daily tasks, docs and strategies.' WHERE slug = 'visionboard';
UPDATE public.app_registry SET short_description = 'YANGU digital university with more than 1,213+ proven digital assets trusted by entrepreneurs worldwide — ebooks, courses, tool stacks and business resources.' WHERE slug = 'visionaire';
UPDATE public.app_registry SET short_description = 'YANGU Builder AI for pages, social bios and simple websites for entrepreneurs.' WHERE slug = 'foundaweb';
UPDATE public.app_registry SET short_description = 'YANGU AI engine and platform assistant.' WHERE slug = 'ada-ai';
UPDATE public.app_registry SET short_description = 'Live stream your shop, selling and content 24hrs inside YANGU.' WHERE slug = 'yangu-livestream';
UPDATE public.app_registry SET short_description = 'Build AI agents, avatars and ads inside YANGU powered by Creatify, Gemini, Nano Banana and future creative engines.' WHERE slug = 'yangu-studio';
