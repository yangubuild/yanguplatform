// YANGU Builder — Layout Blueprint Registry v1
// Single source of truth for per-engine layout blueprints.
// Keyed by engine key (engineRegistry.ts).

// ─── Types ───

export interface BlueprintVariants {
  field: string;
  default: string;
  allowed: string[];
}

export interface BlueprintSlot {
  core_slot: string;
  default_section_type: string;
  locked?: boolean;
  allowed_switch_targets?: string[];
  variants?: BlueprintVariants;
}

export interface BlueprintGeneralSection {
  section_type: string;
  core_slot: string;
  optional: boolean;
}

export interface BlueprintCoreContent {
  slot: string;
  default_section_type: string;
}

export interface EngineBlueprint {
  label: string;
  supports: { desktop: boolean; mobile: boolean };
  slots: Record<string, BlueprintSlot>;
  generalSections: BlueprintGeneralSection[];
  coreContent: BlueprintCoreContent;
  metadataDefaults?: Record<string, unknown>;
  /** If set, this engine inherits from another and applies overrides */
  inherits?: string;
}

export interface SectionTypeContract {
  palette: "content" | "general";
  defaultSchema: Record<string, unknown>;
}

export interface BlueprintRegistry {
  version: string;
  engines: Record<string, EngineBlueprint>;
  sectionTypeContracts: Record<string, SectionTypeContract>;
}

// ─── Registry Data ───

const BASE_ENGINES: Record<string, EngineBlueprint> = {
  eshop: {
    label: "Eshop",
    supports: { desktop: true, mobile: true },
    slots: {
      hero: { core_slot: "hero", default_section_type: "hero_banner", locked: false },
      main_content: {
        core_slot: "main_content",
        default_section_type: "product_grid",
        allowed_switch_targets: ["product_grid"],
        variants: {
          field: "schema.display_mode",
          default: "grid",
          allowed: ["grid", "list", "featured_only", "bundle_view"],
        },
      },
      footer: { core_slot: "footer", default_section_type: "footer", locked: false },
    },
    generalSections: [
      { section_type: "announcement_bar", core_slot: "header", optional: true },
      { section_type: "hero_banner", core_slot: "hero", optional: false },
      { section_type: "category_grid", core_slot: "content", optional: false },
      { section_type: "promo_banner", core_slot: "content", optional: true },
      { section_type: "testimonials", core_slot: "content", optional: true },
      { section_type: "footer", core_slot: "footer", optional: false },
    ],
    coreContent: { slot: "main_content", default_section_type: "product_grid" },
    metadataDefaults: { no_shipping: false, no_variants: false },
  },

  esite: {
    label: "E-Site",
    supports: { desktop: true, mobile: true },
    slots: {
      hero: { core_slot: "hero", default_section_type: "hero_banner", locked: false },
      main_content: {
        core_slot: "main_content",
        default_section_type: "services_list",
        allowed_switch_targets: ["services_list", "article_feed", "case_studies_grid", "booking_inventory", "properties"],
        variants: {
          field: "schema.display_mode",
          default: "default",
          allowed: ["default", "mobile_compact", "magazine", "cards"],
        },
      },
      footer: { core_slot: "footer", default_section_type: "footer", locked: false },
    },
    generalSections: [
      { section_type: "announcement_bar", core_slot: "header", optional: true },
      { section_type: "hero_banner", core_slot: "hero", optional: false },
      { section_type: "about", core_slot: "content", optional: true },
      { section_type: "feature_grid", core_slot: "content", optional: true },
      { section_type: "testimonials", core_slot: "content", optional: true },
      { section_type: "contact_form", core_slot: "content", optional: true },
      { section_type: "footer", core_slot: "footer", optional: false },
    ],
    coreContent: { slot: "main_content", default_section_type: "services_list" },
  },

  community: {
    label: "Community",
    supports: { desktop: true, mobile: true },
    slots: {
      hero: { core_slot: "hero", default_section_type: "group_header", locked: true },
      main_content: {
        core_slot: "main_content",
        default_section_type: "community_feed",
        allowed_switch_targets: ["community_feed"],
        variants: {
          field: "schema.display_mode",
          default: "posts",
          allowed: ["posts", "events", "media", "discussions"],
        },
      },
    },
    generalSections: [
      { section_type: "group_header", core_slot: "hero", optional: false },
      { section_type: "group_about", core_slot: "content", optional: true },
      { section_type: "members_preview", core_slot: "content", optional: true },
    ],
    coreContent: { slot: "main_content", default_section_type: "community_feed" },
  },

  influencer: {
    label: "Influencer",
    supports: { desktop: true, mobile: true },
    slots: {
      hero: { core_slot: "hero", default_section_type: "profile_header", locked: true },
      main_content: {
        core_slot: "main_content",
        default_section_type: "media_grid",
        allowed_switch_targets: ["media_grid", "links_grid", "product_grid"],
        variants: {
          field: "schema.display_mode",
          default: "grid",
          allowed: ["grid", "masonry", "reels_first"],
        },
      },
    },
    generalSections: [
      { section_type: "profile_header", core_slot: "hero", optional: false },
      { section_type: "bio", core_slot: "content", optional: true },
      { section_type: "social_icons", core_slot: "content", optional: true },
      { section_type: "highlights", core_slot: "content", optional: true },
    ],
    coreContent: { slot: "main_content", default_section_type: "media_grid" },
  },

  estore: {
    label: "Store Listing / Trading",
    supports: { desktop: true, mobile: true },
    slots: {
      hero: { core_slot: "hero", default_section_type: "hero_banner", locked: false },
      main_content: {
        core_slot: "main_content",
        default_section_type: "listing_grid",
        allowed_switch_targets: ["listing_grid"],
        variants: {
          field: "schema.display_mode",
          default: "grid",
          allowed: ["grid", "list"],
        },
      },
      footer: { core_slot: "footer", default_section_type: "footer", locked: false },
    },
    generalSections: [
      { section_type: "announcement_bar", core_slot: "header", optional: true },
      { section_type: "hero_banner", core_slot: "hero", optional: false },
      { section_type: "category_grid", core_slot: "content", optional: true },
      { section_type: "trust_badges", core_slot: "content", optional: true },
      { section_type: "footer", core_slot: "footer", optional: false },
    ],
    coreContent: { slot: "main_content", default_section_type: "listing_grid" },
  },
};

// ─── Derived engines (inherit + override) ───

function buildEmenu(): EngineBlueprint {
  const parent = BASE_ENGINES.eshop;
  return {
    ...parent,
    label: "E-Menu",
    inherits: "eshop",
    metadataDefaults: { no_shipping: true, no_variants: true },
    slots: {
      ...parent.slots,
      main_content: {
        core_slot: "main_content",
        default_section_type: "product_grid",
        allowed_switch_targets: ["product_grid"],
        variants: {
          field: "schema.display_mode",
          default: "compact_menu",
          allowed: ["compact_menu", "grid", "list"],
        },
      },
    },
    coreContent: { slot: "main_content", default_section_type: "product_grid" },
  };
}

// ─── Section-type contracts ───

const SECTION_TYPE_CONTRACTS: Record<string, SectionTypeContract> = {
  product_grid: {
    palette: "content",
    defaultSchema: {
      display_mode: "grid",
      filters_enabled: true,
      sort_enabled: true,
      cards: { style: "standard" },
    },
  },
  booking_inventory: {
    palette: "content",
    defaultSchema: {
      display_mode: "list",
      date_picker: true,
      guests_picker: true,
      pricing_mode: "per_night",
    },
  },
  services_list: {
    palette: "content",
    defaultSchema: {
      display_mode: "cards",
      cta_style: "inquire",
    },
  },
  article_feed: {
    palette: "content",
    defaultSchema: {
      display_mode: "magazine",
      show_author: true,
      show_date: true,
    },
  },
  case_studies_grid: {
    palette: "content",
    defaultSchema: {
      display_mode: "grid",
      show_tags: true,
    },
  },
  community_feed: {
    palette: "content",
    defaultSchema: {
      display_mode: "posts",
    },
  },
  media_grid: {
    palette: "content",
    defaultSchema: {
      display_mode: "grid",
      show_captions: false,
    },
  },
  listing_grid: {
    palette: "content",
    defaultSchema: {
      display_mode: "grid",
      filters_enabled: true,
    },
  },
  properties: {
    palette: "content",
    defaultSchema: {
      display_mode: "grid",
      heading: "Properties",
      filters_enabled: true,
      show_price: true,
      show_location: true,
      items: [],
    },
  },
  links_grid: {
    palette: "content",
    defaultSchema: {
      display_mode: "grid",
      heading: "Links",
      items: [],
    },
  },
};

// ─── Assembled registry ───

export const BLUEPRINT_REGISTRY: BlueprintRegistry = {
  version: "blueprint_registry_v1",
  engines: {
    ...BASE_ENGINES,
    emenu: buildEmenu(),
  },
  sectionTypeContracts: SECTION_TYPE_CONTRACTS,
};

// ─── Helpers ───

/** Get blueprint for an engine key, returns undefined if unknown */
export function getEngineBlueprint(engineKey: string): EngineBlueprint | undefined {
  return BLUEPRINT_REGISTRY.engines[engineKey];
}

/** Get the allowed switch targets for main_content on a given engine */
export function getAllowedSwitchTargets(engineKey: string): string[] {
  const bp = getEngineBlueprint(engineKey);
  return bp?.slots.main_content?.allowed_switch_targets ?? [];
}

/** Get the default schema for a content section type from contracts */
export function getContentSectionSchema(sectionType: string): Record<string, unknown> {
  return { ...(SECTION_TYPE_CONTRACTS[sectionType]?.defaultSchema ?? {}) };
}

/** Get the default variant value for main_content on a given engine */
export function getDefaultVariant(engineKey: string): string | undefined {
  return getEngineBlueprint(engineKey)?.slots.main_content?.variants?.default;
}

/** Get allowed variant values for main_content on a given engine */
export function getAllowedVariants(engineKey: string): string[] {
  return getEngineBlueprint(engineKey)?.slots.main_content?.variants?.allowed ?? [];
}

/** Map surface_type to engine key for registry lookups */
export function surfaceTypeToEngineKey(surfaceType: string): string {
  const MAP: Record<string, string> = {
    eshop: "eshop",
    emenu: "emenu",
    quick_site: "esite",
    store_listing: "estore",
    community_group: "community",
    community_listing: "community",
    live_bio: "influencer",
    studio_showcase: "influencer",
    live_selling: "eshop",
  };
  const key = MAP[surfaceType];
  if (!key) {
    console.warn(`[BlueprintRegistry] Unknown surface_type "${surfaceType}" — no engine match`);
  }
  return key ?? "";
}

/** Same mapping but with esite fallback (for non-template uses like blueprints) */
export function surfaceTypeToEngineKeyWithFallback(surfaceType: string): string {
  return surfaceTypeToEngineKey(surfaceType) || "esite";
}
