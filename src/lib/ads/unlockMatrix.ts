/**
 * YANGU Unlock Matrix v1 — Constants, Types & Client Decision Engine
 *
 * Mirrors the DB-seeded rules. The DB is authoritative;
 * these constants are for client-side UI hints and fast checks.
 */

// ── Tier enum ──────────────────────────────────────────────

export type UnlockTier =
  | "FREE"
  | "FIRST_FREE"
  | "SOFT_LIMIT"
  | "FLEX_UNLOCK"
  | "HARD_PREMIUM";

// ── Modules ────────────────────────────────────────────────

export type UnlockModule =
  | "social"
  | "builder"
  | "social_engine"
  | "studio"
  | "downloads"
  | "commerce"
  | "ada"
  | "workspace"
  | "business";

// ── Placement types ────────────────────────────────────────

export type PlacementType =
  | "post_action"
  | "download_action"
  | "ai_generation"
  | "extra_surface_creation"
  | "workspace_expansion"
  | "premium_tool_unlock"
  | "popup_unlock"
  | "poster_unlock"
  | "modal_unlock";

// ── Action keys (exhaustive) ───────────────────────────────

export const ACTION_KEYS = {
  // Social (FREE)
  PROFILE_POST: "profile_post",
  FOLLOW_USER: "follow_user",
  LIKE_COMMENT: "like_comment",
  CHAT_DM: "chat_dm",
  VIEW_FEEDS: "view_feeds",

  // Builder
  CREATE_SURFACE: "create_surface",
  PUBLISH_SURFACE: "publish_surface",

  // Social Engine
  CREATE_POST: "create_post",
  SCHEDULE_POST: "schedule_post",
  CREATE_CAMPAIGN: "create_campaign",
  BATCH_GENERATION: "batch_generation",

  // Studio AI
  GENERATE_AI_IMAGE: "generate_ai_image",
  GENERATE_AI_VIDEO: "generate_ai_video",
  GENERATE_AI_SHORTS: "generate_ai_shorts",
  CREATE_AVATAR: "create_avatar",

  // Downloads
  DOWNLOAD_ASSET: "download_asset",
  DOWNLOAD_EBOOK: "download_ebook",
  DOWNLOAD_MOCKUP: "download_mockup",
  EXPORT_PDF: "export_pdf",

  // Commerce
  ADD_PRODUCTS: "add_products",

  // Ada
  ADA_BASIC_CHAT: "ada_basic_chat",
  ADA_EXTENDED: "ada_extended",

  // Subscription-only
  CREATE_WORKSPACE: "create_workspace",
  CUSTOM_DOMAIN: "custom_domain",
  REMOVE_BRANDING: "remove_branding",
  BUSINESS_TOOLS: "business_tools",
  LIVE_SELLING: "live_selling",
  AGENCY_PANEL: "agency_panel",
} as const;

export type ActionKey = (typeof ACTION_KEYS)[keyof typeof ACTION_KEYS];

// ── Client-side matrix (UI hints only, DB is authoritative) ──

export interface MatrixEntry {
  tier: UnlockTier;
  module: UnlockModule;
  placement?: PlacementType;
  adAllowed: boolean;
  creditCost?: number;
}

export const UNLOCK_MATRIX: Record<ActionKey, MatrixEntry> = {
  // Social — always free
  profile_post: { tier: "FREE", module: "social", adAllowed: false },
  follow_user: { tier: "FREE", module: "social", adAllowed: false },
  like_comment: { tier: "FREE", module: "social", adAllowed: false },
  chat_dm: { tier: "FREE", module: "social", adAllowed: false },
  view_feeds: { tier: "FREE", module: "social", adAllowed: false },

  // Builder
  create_surface: { tier: "FIRST_FREE", module: "builder", placement: "extra_surface_creation", adAllowed: true },
  publish_surface: { tier: "FIRST_FREE", module: "builder", placement: "extra_surface_creation", adAllowed: true },

  // Social Engine
  create_post: { tier: "SOFT_LIMIT", module: "social_engine", placement: "post_action", adAllowed: true },
  schedule_post: { tier: "FLEX_UNLOCK", module: "social_engine", placement: "post_action", adAllowed: true },
  create_campaign: { tier: "FLEX_UNLOCK", module: "social_engine", placement: "post_action", adAllowed: true },
  batch_generation: { tier: "HARD_PREMIUM", module: "social_engine", placement: "post_action", adAllowed: false },

  // Studio AI
  generate_ai_image: { tier: "SOFT_LIMIT", module: "studio", placement: "ai_generation", adAllowed: true, creditCost: 1 },
  generate_ai_video: { tier: "HARD_PREMIUM", module: "studio", placement: "ai_generation", adAllowed: false, creditCost: 5 },
  generate_ai_shorts: { tier: "SOFT_LIMIT", module: "studio", placement: "ai_generation", adAllowed: false, creditCost: 2 },
  create_avatar: { tier: "HARD_PREMIUM", module: "studio", placement: "ai_generation", adAllowed: false, creditCost: 10 },

  // Downloads
  download_asset: { tier: "FIRST_FREE", module: "downloads", placement: "download_action", adAllowed: true },
  download_ebook: { tier: "FLEX_UNLOCK", module: "downloads", placement: "download_action", adAllowed: true },
  download_mockup: { tier: "FLEX_UNLOCK", module: "downloads", placement: "download_action", adAllowed: true },
  export_pdf: { tier: "FLEX_UNLOCK", module: "downloads", placement: "download_action", adAllowed: true },

  // Commerce
  add_products: { tier: "SOFT_LIMIT", module: "commerce", adAllowed: true },

  // Ada
  ada_basic_chat: { tier: "FREE", module: "ada", adAllowed: false },
  ada_extended: { tier: "FLEX_UNLOCK", module: "ada", placement: "modal_unlock", adAllowed: true },

  // Subscription-only
  create_workspace: { tier: "HARD_PREMIUM", module: "workspace", adAllowed: false },
  custom_domain: { tier: "HARD_PREMIUM", module: "business", adAllowed: false },
  remove_branding: { tier: "HARD_PREMIUM", module: "business", adAllowed: false },
  business_tools: { tier: "HARD_PREMIUM", module: "business", adAllowed: false },
  live_selling: { tier: "HARD_PREMIUM", module: "business", adAllowed: false },
  agency_panel: { tier: "HARD_PREMIUM", module: "business", adAllowed: false },
};

// ── Balance protection rules ───────────────────────────────

/** Actions where ads must NEVER appear */
export const AD_BLOCKED_MODULES: UnlockModule[] = ["social"];

/** Paid users never see ads within their plan */
export function shouldShowAd(
  actionKey: ActionKey,
  isPaidUser: boolean
): boolean {
  const entry = UNLOCK_MATRIX[actionKey];
  if (!entry) return false;
  if (AD_BLOCKED_MODULES.includes(entry.module)) return false;
  if (isPaidUser) return false;
  return entry.adAllowed;
}

// ── Quick tier check (client-side, no RPC) ─────────────────

export function getActionTier(actionKey: string): UnlockTier | null {
  return (UNLOCK_MATRIX as Record<string, MatrixEntry>)[actionKey]?.tier ?? null;
}

export function isAlwaysFree(actionKey: string): boolean {
  return getActionTier(actionKey) === "FREE";
}

export function requiresSubscription(actionKey: string): boolean {
  const entry = (UNLOCK_MATRIX as Record<string, MatrixEntry>)[actionKey];
  if (!entry) return false;
  return entry.tier === "HARD_PREMIUM" && !entry.adAllowed;
}
