// YANGU Builder — Client-side type definitions
// These mirror the DB schema for type-safe RPC calls

export type BuilderSurfaceType =
  | 'live_bio'
  | 'live_selling'
  | 'quick_site'
  | 'emenu'
  | 'eshop'
  | 'community_group'
  | 'store_listing'
  | 'studio_showcase';

export interface BuilderSurface {
  id: string;
  user_id: string;
  org_id: string | null;
  surface_type: BuilderSurfaceType;
  slug: string;
  title: string;
  description: string | null;
  theme: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BuilderPage {
  id: string;
  surface_id: string;
  slug: string;
  title: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BuilderSection {
  id: string;
  page_id: string;
  section_type: string;
  schema: Record<string, unknown>;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface BuilderPublish {
  id: string;
  surface_id: string;
  domain_id: string;
  slug: string;
  published_schema: BuilderPublishedSchema;
  state: 'draft' | 'published' | 'unpublished';
  published_at: string | null;
  unpublished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuilderPublishedSchema {
  surface: {
    id: string;
    surface_type: BuilderSurfaceType;
    title: string;
    description: string | null;
    theme: Record<string, unknown>;
  };
  pages: BuilderPublishedPage[];
}

export interface BuilderPublishedPage {
  slug: string;
  title: string;
  sections: BuilderPublishedSection[];
}

export interface BuilderPublishedSection {
  section_type: string;
  schema: Record<string, unknown>;
  position: number;
}

// RPC response wrappers
export interface BuilderRpcOk<T = unknown> {
  ok: true;
  [key: string]: T | boolean;
}

export interface BuilderRpcError {
  ok: false;
  error: string;
}

export type BuilderRpcResult<T = unknown> = BuilderRpcOk<T> | BuilderRpcError;

// Editor state from builder_get_editor_state
export interface BuilderEditorState {
  ok: true;
  surface: BuilderSurface;
  pages: Array<{
    id: string;
    slug: string;
    title: string;
    sections: Array<{
      id: string;
      section_type: string;
      schema: Record<string, unknown>;
      position: number;
      is_visible: boolean;
    }>;
  }>;
}

// Public schema from builder_get_public_schema
export interface BuilderPublicSchemaResult {
  ok: true;
  publish_id: string;
  published_schema: BuilderPublishedSchema;
  published_at: string;
}

// Section types registry (for UI later)
export const BUILDER_SECTION_TYPES = [
  'hero',
  'bio',
  'links',
  'social',
  'gallery',
  'video',
  'cta',
  'text',
  'products',
  'services',
  'testimonials',
  'contact',
  'faq',
  'menu',
  'schedule',
] as const;

export type BuilderSectionTypeName = typeof BUILDER_SECTION_TYPES[number];
