/**
 * YANGU Social Media — Template Design Service
 * Handles template CRUD, layer management, brand auto-apply, and variation generation.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  DesignTemplate,
  TemplateLayer,
  TemplateColorSlots,
  GeneratedDesign,
  DesignVariation,
  WorkspaceTemplate,
  LayerOverride,
  CreateDesignInput,
} from "@/types/templateDesign";

// ── Template Queries ─────────────────────────────────────

export const templateService = {
  /** Fetch all system templates */
  async listSystemTemplates(): Promise<DesignTemplate[]> {
    const { data, error } = await supabase
      .from("social_design_templates")
      .select("*")
      .eq("is_system", true)
      .order("category", { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as DesignTemplate[];
  },

  /** Fetch a single template with its layers */
  async getTemplateWithLayers(templateId: string): Promise<DesignTemplate & { layers: TemplateLayer[] }> {
    const [templateRes, layersRes] = await Promise.all([
      supabase.from("social_design_templates").select("*").eq("id", templateId).single(),
      supabase.from("social_template_layers").select("*").eq("template_id", templateId).order("sort_order"),
    ]);
    if (templateRes.error) throw templateRes.error;
    if (layersRes.error) throw layersRes.error;
    return {
      ...(templateRes.data as unknown as DesignTemplate),
      layers: (layersRes.data || []) as unknown as TemplateLayer[],
    };
  },

  /** Fetch workspace template selections */
  async getWorkspaceTemplates(workspaceId: string): Promise<WorkspaceTemplate[]> {
    const { data, error } = await supabase
      .from("social_workspace_templates")
      .select("*, template:social_design_templates(*)")
      .eq("workspace_id", workspaceId);
    if (error) throw error;
    return (data || []) as unknown as WorkspaceTemplate[];
  },

  /** Select/deselect a template for a workspace */
  async toggleWorkspaceTemplate(workspaceId: string, templateId: string, enabled: boolean) {
    if (enabled) {
      const { error } = await supabase
        .from("social_workspace_templates")
        .upsert({ workspace_id: workspaceId, template_id: templateId }, { onConflict: "workspace_id,template_id" });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("social_workspace_templates")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("template_id", templateId);
      if (error) throw error;
    }
  },

  /** Favorite/unfavorite */
  async setFavorite(workspaceId: string, templateId: string, isFavorite: boolean) {
    const { error } = await supabase
      .from("social_workspace_templates")
      .update({ is_favorite: isFavorite })
      .eq("workspace_id", workspaceId)
      .eq("template_id", templateId);
    if (error) throw error;
  },
};

// ── Generated Design Service ─────────────────────────────

export const designService = {
  /** Create a new design from a template */
  async createDesign(input: CreateDesignInput & { user_id: string }): Promise<GeneratedDesign> {
    const insertData: Record<string, unknown> = {
      workspace_id: input.workspace_id,
      template_id: input.template_id,
      user_id: input.user_id,
      title: input.title || null,
      layer_overrides: JSON.parse(JSON.stringify(input.layer_overrides || [])),
      color_overrides: JSON.parse(JSON.stringify(input.color_overrides || {})),
      font_overrides: JSON.parse(JSON.stringify(input.font_overrides || {})),
      logo_url: input.logo_url || null,
      aspect_ratio: input.aspect_ratio || "1:1",
      ai_prompt: input.ai_prompt || null,
      status: "draft",
    };
    const { data, error } = await supabase
      .from("social_generated_designs")
      .insert(insertData as any)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as GeneratedDesign;
  },

  /** Get a generated design */
  async getDesign(designId: string): Promise<GeneratedDesign> {
    const { data, error } = await supabase
      .from("social_generated_designs")
      .select("*")
      .eq("id", designId)
      .single();
    if (error) throw error;
    return data as unknown as GeneratedDesign;
  },

  /** Update design overrides */
  async updateDesign(
    designId: string,
    updates: {
      layer_overrides?: LayerOverride[];
      color_overrides?: Partial<TemplateColorSlots>;
      font_overrides?: Record<string, string>;
      logo_url?: string | null;
      title?: string;
      status?: string;
    }
  ) {
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (updates.layer_overrides) {
      updateData.layer_overrides = JSON.parse(JSON.stringify(updates.layer_overrides));
    }
    if (updates.color_overrides) {
      updateData.color_overrides = JSON.parse(JSON.stringify(updates.color_overrides));
    }
    if (updates.font_overrides) {
      updateData.font_overrides = JSON.parse(JSON.stringify(updates.font_overrides));
    }
    const { error } = await supabase
      .from("social_generated_designs")
      .update(updateData as any)
      .eq("id", designId);
    if (error) throw error;
  },

  /** List designs for a workspace */
  async listDesigns(workspaceId: string): Promise<GeneratedDesign[]> {
    const { data, error } = await supabase
      .from("social_generated_designs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as GeneratedDesign[];
  },

  /** Delete a design */
  async deleteDesign(designId: string) {
    const { error } = await supabase
      .from("social_generated_designs")
      .delete()
      .eq("id", designId);
    if (error) throw error;
  },
};

// ── Brand Auto-Apply Engine ──────────────────────────────

export interface BrandConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  titleFont?: string;
  bodyFont?: string;
  logoUrl?: string;
  useLogo?: boolean;
}

/**
 * Apply workspace brand settings to template layers.
 * Returns layer overrides that map brand colors/fonts to template slots.
 */
export function applyBrandToTemplate(
  layers: TemplateLayer[],
  colorSlots: TemplateColorSlots,
  brand: BrandConfig
): { layerOverrides: LayerOverride[]; colorOverrides: Partial<TemplateColorSlots> } {
  const overrides: LayerOverride[] = [];
  const colorOverrides: Partial<TemplateColorSlots> = {};

  // Map brand colors to template color slots
  if (brand.primaryColor) colorOverrides.primary = brand.primaryColor;
  if (brand.secondaryColor) colorOverrides.secondary = brand.secondaryColor;
  if (brand.accentColor) colorOverrides.accent = brand.accentColor;

  for (const layer of layers) {
    if (layer.locked) continue;
    const override: LayerOverride = { layer_id: layer.id };
    let hasChanges = false;

    // Apply font overrides to text layers
    if (layer.layer_type === "text" && layer.role) {
      const isTitle = ["headline", "subheadline", "price"].includes(layer.role);
      const font = isTitle ? brand.titleFont : brand.bodyFont;
      if (font && font !== "Default (Theme Font)") {
        override.style = { ...override.style, fontFamily: font };
        hasChanges = true;
      }
    }

    // Apply brand color to text layers
    if (layer.layer_type === "text" && layer.style?.color) {
      if (layer.role === "headline" && brand.primaryColor) {
        override.style = { ...override.style, color: brand.primaryColor };
        hasChanges = true;
      }
    }

    // Apply logo to logo layers
    if (layer.role === "logo" && brand.useLogo && brand.logoUrl) {
      override.src = brand.logoUrl;
      hasChanges = true;
    }

    if (hasChanges) overrides.push(override);
  }

  return { layerOverrides: overrides, colorOverrides };
}

/**
 * Resolve final layer state by merging base layers with overrides.
 */
export function resolveLayersWithOverrides(
  baseLayers: TemplateLayer[],
  overrides: LayerOverride[]
): TemplateLayer[] {
  const overrideMap = new Map(overrides.map((o) => [o.layer_id, o]));

  return baseLayers.map((layer) => {
    const override = overrideMap.get(layer.id);
    if (!override) return layer;

    return {
      ...layer,
      content: override.content ?? layer.content,
      src: override.src ?? layer.src,
      style: override.style ? { ...layer.style, ...override.style } : layer.style,
    };
  });
}
