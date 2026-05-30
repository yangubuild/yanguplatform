// ─────────────────────────────────────────────────────────────────
// YANGU BUILDER TYPE CONTRACTS
// Source of truth: YANGU_BUILDER_SPEC.md
// WARNING: Do not add surface_type values here without updating
// YANGU_BUILDER_SPEC.md, BuilderEditorRouter, and selectTemplate.
// ─────────────────────────────────────────────────────────────────

export type SurfaceType =
  | 'eshop'
  | 'emenu'
  | 'quick_site'
  | 'store_listing'
  | 'live_bio'
  | 'community_group';

export type BuilderType =
  | 'eshop'
  | 'emenu'
  | 'esite'
  | 'estore'
  | 'influencer'
  | 'community';

// Maps each surface_type to its owning builder
export const SURFACE_TO_BUILDER: Record<SurfaceType, BuilderType> = {
  eshop:            'eshop',
  emenu:            'emenu',
  quick_site:       'esite',
  store_listing:    'estore',
  live_bio:         'influencer',
  community_group:  'community',
};

// Eshop template keys — ONLY valid in eshop editor
export type EshopTemplateKey =
  | 'eshop_visual_a'
  | 'eshop_visual_b'
  | 'eshop_visual_c';

// Emenu template keys — ONLY valid in emenu editor
export type EmenuTemplateKey =
  | 'emenu_visual_a'
  | 'emenu_visual_b'
  | 'emenu_visual_c';

// Esite template keys — ONLY valid in esite editor
export type EsiteTemplateKey =
  | 'esite_consultancy_a'
  | 'esite_realestate_a'
  | 'esite_hotel_a'
  | 'esite_travel_a'
  | 'esite_construction_a';

// Estore template keys — ONLY valid in estore editor
export type EstoreTemplateKey =
  | 'estore_visual_a'
  | 'estore_minna';

// Influencer template keys — ONLY valid in influencer editor
export type InfluencerTemplateKey =
  | 'influencer_layout_a'
  | 'influencer_layout_b';

// Community template keys — ONLY valid in community editor
export type CommunityTemplateKey =
  | 'community_visual_a'
  | 'community_visual_b';

// Union of all template keys (for functions that accept any)
export type AnyTemplateKey =
  | EshopTemplateKey
  | EmenuTemplateKey
  | EsiteTemplateKey
  | EstoreTemplateKey
  | InfluencerTemplateKey
  | CommunityTemplateKey;

// Typed template selection result
export interface TemplateSelection {
  surface_type: SurfaceType;
  builder: BuilderType;
  template_key: AnyTemplateKey;
  engine: string;
}

// Guard: throws at runtime if a template key is used with the wrong builder.
// NOTE: keys not present in OWNERSHIP are treated as legacy/unknown and
// allowed through (no-op). This preserves the live registry while still
// blocking misuse of any key explicitly contracted above.
export function assertTemplateOwnership(
  templateKey: string,
  expectedBuilder: BuilderType
): void {
  const OWNERSHIP: Record<string, BuilderType> = {
    eshop_visual_a: 'eshop', eshop_visual_b: 'eshop', eshop_visual_c: 'eshop',
    emenu_visual_a: 'emenu', emenu_visual_b: 'emenu', emenu_visual_c: 'emenu',
    esite_consultancy_a: 'esite', esite_realestate_a: 'esite',
    esite_hotel_a: 'esite', esite_travel_a: 'esite', esite_construction_a: 'esite',
    estore_visual_a: 'estore', estore_minna: 'estore',
    influencer_layout_a: 'influencer', influencer_layout_b: 'influencer',
    community_visual_a: 'community', community_visual_b: 'community',
  };
  const owner = OWNERSHIP[templateKey];
  if (owner && owner !== expectedBuilder) {
    throw new Error(
      `[YANGU CONTRACT VIOLATION] Template "${templateKey}" belongs to ` +
      `"${owner}" builder but was used in "${expectedBuilder}" builder. ` +
      `This is a builder isolation breach. Fix selectTemplate.ts immediately.`
    );
  }
}

// Helper: map a legacy engine key (e.g. "estore", "influencer") OR a raw
// surface_type ("store_listing", "live_bio") to its owning BuilderType.
const ENGINE_KEY_TO_BUILDER: Record<string, BuilderType> = {
  eshop: 'eshop',
  emenu: 'emenu',
  esite: 'esite',
  estore: 'estore',
  influencer: 'influencer',
  community: 'community',
};

export function resolveBuilder(input: string): BuilderType | undefined {
  if (input in SURFACE_TO_BUILDER) {
    return SURFACE_TO_BUILDER[input as SurfaceType];
  }
  return ENGINE_KEY_TO_BUILDER[input];
}