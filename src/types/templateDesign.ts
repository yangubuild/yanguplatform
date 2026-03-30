/**
 * YANGU Template Design System — Core Types
 * Editable template layers, color slots, generated designs, and variations.
 */

// ── Layer Types ──────────────────────────────────────────

export type TemplateLayerType =
  | "text"
  | "image"
  | "shape"
  | "background"
  | "icon"
  | "cta";

export type TemplateLayerRole =
  | "headline"
  | "subheadline"
  | "body"
  | "price"
  | "cta"
  | "logo"
  | "product_image"
  | "person_image"
  | "background"
  | "accent";

export type TemplateAspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

export type DesignStatus = "draft" | "ready" | "rendered" | "published";

// ── Layer Style ──────────────────────────────────────────

export interface TemplateLayerStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  opacity?: number;
  textAlign?: string;
  borderRadius?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
}

// ── Template Layer ───────────────────────────────────────

export interface TemplateLayer {
  id: string;
  template_id: string;
  layer_type: TemplateLayerType;
  role?: TemplateLayerRole | null;
  sort_order: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  style?: TemplateLayerStyle;
  content?: string | null;
  src?: string | null;
  locked: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ── Color Slots ──────────────────────────────────────────

export interface TemplateColorSlots {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  textPrimary?: string;
  textSecondary?: string;
}

// ── Design Template ──────────────────────────────────────

export interface DesignTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  aspect_ratio: TemplateAspectRatio;
  preview_image_url: string;
  base_image_url: string;
  is_system: boolean;
  workspace_id?: string | null;
  user_id?: string | null;
  color_slots: TemplateColorSlots;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  layers?: TemplateLayer[];
}

// ── Workspace Template Selection ─────────────────────────

export interface WorkspaceTemplate {
  id: string;
  workspace_id: string;
  template_id: string;
  is_favorite: boolean;
  brand_overrides?: Record<string, unknown>;
  created_at: string;
  // Joined
  template?: DesignTemplate;
}

// ── Layer Override (for generated designs) ────────────────

export interface LayerOverride {
  layer_id: string;
  content?: string;
  src?: string;
  style?: Partial<TemplateLayerStyle>;
}

// ── Generated Design ─────────────────────────────────────

export interface GeneratedDesign {
  id: string;
  workspace_id: string;
  template_id: string;
  post_id?: string | null;
  user_id: string;
  title?: string | null;
  layer_overrides: LayerOverride[];
  color_overrides: Partial<TemplateColorSlots>;
  font_overrides?: Record<string, string>;
  logo_url?: string | null;
  aspect_ratio: TemplateAspectRatio;
  rendered_image_url?: string | null;
  variation_index: number;
  ai_prompt?: string | null;
  status: DesignStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  template?: DesignTemplate;
}

// ── Design Variation ─────────────────────────────────────

export interface DesignVariation {
  id: string;
  parent_design_id: string;
  variation_index: number;
  layer_overrides: LayerOverride[];
  color_overrides: Partial<TemplateColorSlots>;
  rendered_image_url?: string | null;
  caption?: string | null;
  status: DesignStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ── AI Template Edit Request ─────────────────────────────

export interface TemplateEditRequest {
  mode: "template_edit";
  template_id: string;
  workspace_id: string;
  instructions: string;
  brand_colors: TemplateColorSlots;
  fonts: Record<string, string>;
  logo_url?: string;
  topic?: string;
  goal?: string;
  variation_index?: number;
}

// ── Input Types ──────────────────────────────────────────

export interface CreateDesignInput {
  workspace_id: string;
  template_id: string;
  title?: string;
  layer_overrides?: LayerOverride[];
  color_overrides?: Partial<TemplateColorSlots>;
  font_overrides?: Record<string, string>;
  logo_url?: string;
  aspect_ratio?: TemplateAspectRatio;
  ai_prompt?: string;
}

export interface GenerateVariationsInput {
  design_id: string;
  count: number;
  instructions?: string;
  topic?: string;
}
