// YANGU App Store — Canonical Types

export type AppType =
  | "native_app"
  | "connector_app"
  | "ai_generated_app"
  | "embedded_app"
  | "developer_app";

export type AppActionType =
  | "install"
  | "connect"
  | "launch"
  | "generate"
  | "embed";

export type AppPricingType = "free" | "freemium" | "paid" | "enterprise";

export type AppStatus = "draft" | "active" | "hidden" | "archived";

export type AppVisibility = "public" | "private" | "internal";

export type AppInstallState =
  | "not_installed"
  | "installed"
  | "connected"
  | "available"
  | "coming_soon";

export interface AppRegistryEntry {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  icon: string | null;
  provider_name: string;
  provider_type: string;
  provider_badge_logo: string | null;
  category: string;
  subcategory: string | null;
  app_type: AppType;
  action_type: AppActionType;
  pricing_type: AppPricingType;
  visibility: AppVisibility;
  status: AppStatus;
  is_featured: boolean;
  is_native_yangu: boolean;
  supports_desktop_install: boolean;
  supports_web_install: boolean;
  supports_embed: boolean;
  supports_oauth: boolean;
  supports_api_key: boolean;
  launch_route: string | null;
  connect_route: string | null;
  install_route: string | null;
  generate_route: string | null;
  embed_url: string | null;
  sort_order: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AppCategory {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface AppUserInstall {
  id: string;
  user_id: string;
  app_id: string;
  status: AppInstallState;
  config: Record<string, unknown>;
  installed_at: string;
  updated_at: string;
}

/** Maps action_type → the primary CTA label shown on app cards */
export const ACTION_LABELS: Record<AppActionType, string> = {
  install: "Install",
  connect: "Connect",
  launch: "Open",
  generate: "Generate",
  embed: "Embed",
};

/** Maps install state → button state label */
export const INSTALL_STATE_LABELS: Record<AppInstallState, string> = {
  not_installed: "Get",
  installed: "Open",
  connected: "Connected",
  available: "Get",
  coming_soon: "Coming Soon",
};
