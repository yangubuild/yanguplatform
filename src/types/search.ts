/**
 * Canonical searchable entity types for YANGU platform search & explore.
 * These mirror the DB enums and are the single source of truth
 * for all search, explore, landing, and detail page routing.
 */

// ── Entity type classification ──
export type SearchableEntityType =
  | 'product'
  | 'service'
  | 'business'
  | 'creator'
  | 'organization'
  | 'community'
  | 'project';

// ── Creator/org subtypes for fine filtering ──
export type EntitySubtype =
  | 'influencer'
  | 'freelancer'
  | 'coach'
  | 'consultant'
  | 'leader'
  | 'church'
  | 'ministry'
  | 'faith_org'
  | 'ngo'
  | 'school'
  | 'institution'
  | 'professional_network'
  | 'general';

// ── Visibility tiers for explore ranking ──
export type VisibilityTier = 'free' | 'verified' | 'paid' | 'premium';

// ── Surface type → entity type mapping (mirrors derive_entity_type SQL) ──
export const SURFACE_TO_ENTITY: Record<string, SearchableEntityType> = {
  // builder_surface_type values
  eshop: 'business',
  emenu: 'business',
  quick_site: 'business',
  store_listing: 'business',
  live_bio: 'creator',
  live_selling: 'creator',
  community_group: 'community',
  community_listing: 'community',
  studio_showcase: 'project',
  // domain-level surface_type values
  shop: 'business',
  store: 'business',
  site: 'business',
  live: 'creator',
  community: 'community',
  studio: 'project',
};

// ── Entity type display config ──
export const ENTITY_TYPE_CONFIG: Record<SearchableEntityType, {
  label: string;
  icon: string;
  detailRoute: string;
}> = {
  product: { label: 'Product', icon: 'Package', detailRoute: '/product' },
  service: { label: 'Service', icon: 'Wrench', detailRoute: '/service' },
  business: { label: 'Business', icon: 'Building2', detailRoute: '/business' },
  creator: { label: 'Creator', icon: 'Star', detailRoute: '/creator' },
  organization: { label: 'Organization', icon: 'Landmark', detailRoute: '/org' },
  community: { label: 'Community', icon: 'Users', detailRoute: '/community' },
  project: { label: 'Project', icon: 'Palette', detailRoute: '/project' },
};

// ── Subtype display labels ──
export const ENTITY_SUBTYPE_LABELS: Record<EntitySubtype, string> = {
  influencer: 'Influencer',
  freelancer: 'Freelancer',
  coach: 'Coach / Mentor',
  consultant: 'Consultant',
  leader: 'Community Leader',
  church: 'Church',
  ministry: 'Ministry',
  faith_org: 'Faith Organization',
  ngo: 'NGO / Nonprofit',
  school: 'School / Education',
  institution: 'Institution',
  professional_network: 'Professional Network',
  general: 'General',
};

// ── Search result shape (mirrors search_entities RPC) ──
export interface SearchEntityResult {
  id: string;
  entity_type: SearchableEntityType;
  entity_subtype: EntitySubtype;
  title: string;
  short_description: string | null;
  primary_category: string | null;
  tags: string[];
  visibility_tier: VisibilityTier;
  is_verified: boolean;
  domain_host: string | null;
  slug: string | null;
  industry: string | null;
  surface_type: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  relevance_score: number;
  trust_score?: number | null;
}

// ── Search params (mirrors search_entities RPC args) ──
export interface SearchEntitiesParams {
  query?: string;
  entity_type?: SearchableEntityType;
  entity_subtype?: EntitySubtype;
  category?: string;
  visibility_tier?: VisibilityTier;
  verified_only?: boolean;
  limit?: number;
  offset?: number;
}
