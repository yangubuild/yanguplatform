// YANGU Builder — Core page structure definition
// Every generated page MUST include these sections in this fixed order.
// Core sections cannot be deleted (only hidden).
// Custom sections can be added below the footer.

export interface CoreSectionDef {
  type: string;
  label: string;
  icon: string;
  /** If true, this section maps to a category-specific content type */
  categorySpecific?: boolean;
}

/** Fixed ordered list of core sections for every single-page builder surface */
export const CORE_SECTIONS: CoreSectionDef[] = [
  { type: "header", label: "Header / Logo", icon: "🏷️" },
  { type: "hero", label: "Hero Banner", icon: "🖼" },
  { type: "main_content", label: "Main Content", icon: "📦", categorySpecific: true },
  { type: "offer", label: "Offers", icon: "🏷️" },
  { type: "footer", label: "Footer", icon: "📋" },
];

/** Set of core section types (for quick lookup) */
export const CORE_SECTION_TYPES = new Set(CORE_SECTIONS.map((s) => s.type));

/** Maps surface_type → the actual section_type used for "main_content" */
export const MAIN_CONTENT_MAP: Record<string, string> = {
  emenu: "menu",
  eshop: "products",
  live_selling: "products",
  quick_site: "services",
  live_bio: "links",
  community_listing: "text",
  community_group: "about",
  store_listing: "listings",
  studio_showcase: "gallery",
};

/** Resolve the actual section_type for a core section given the surface type */
export function resolveCoreSectionType(coreSectionType: string, surfaceType: string): string {
  if (coreSectionType === "main_content") {
    return MAIN_CONTENT_MAP[surfaceType] || "services";
  }
  return coreSectionType;
}

/** 
 * Given raw sections from DB and a surface type, returns sections in enforced core order.
 * Missing core sections get stub entries (is_visible: false).
 * Custom (non-core) sections appear after footer.
 */
export function enforceCoreSectionOrder(
  rawSections: Array<{
    id: string;
    section_type: string;
    schema: Record<string, unknown>;
    position: number;
    is_visible: boolean;
  }>,
  surfaceType: string
): Array<{
  id: string;
  section_type: string;
  schema: Record<string, unknown>;
  position: number;
  is_visible: boolean;
  isCore: boolean;
  isMissing?: boolean;
}> {
  // Build a lookup by section_type (first occurrence wins for dedup)
  const sectionsByType = new Map<string, typeof rawSections[0]>();
  const customSections: typeof rawSections = [];
  const allowMultiple = new Set(["text", "cta", "gallery", "products", "services", "listings"]);

  // Resolve which actual types are core
  const coreActualTypes = new Set(
    CORE_SECTIONS.map((cs) => resolveCoreSectionType(cs.type, surfaceType))
  );

  for (const s of rawSections) {
    if (coreActualTypes.has(s.section_type)) {
      if (!sectionsByType.has(s.section_type)) {
        sectionsByType.set(s.section_type, s);
      }
      // skip duplicates
    } else {
      customSections.push(s);
    }
  }

  // Build ordered result
  const result: Array<typeof rawSections[0] & { isCore: boolean; isMissing?: boolean }> = [];
  let pos = 0;

  for (const coreDef of CORE_SECTIONS) {
    const actualType = resolveCoreSectionType(coreDef.type, surfaceType);
    const existing = sectionsByType.get(actualType);
    if (existing) {
      result.push({ ...existing, position: pos, isCore: true });
    } else {
      // Stub for missing core section
      result.push({
        id: `_missing_${actualType}`,
        section_type: actualType,
        schema: {},
        position: pos,
        is_visible: false,
        isCore: true,
        isMissing: true,
      });
    }
    pos++;
  }

  // Append custom sections after footer
  for (const cs of customSections) {
    // Dedup: if allowMultiple doesn't include it and we've already seen it, skip
    if (!allowMultiple.has(cs.section_type)) {
      const alreadyInResult = result.some((r) => r.section_type === cs.section_type && !r.isMissing);
      if (alreadyInResult) continue;
    }
    result.push({ ...cs, position: pos, isCore: false });
    pos++;
  }

  return result;
}

/** Layout presets — Layout A and Layout B simply control visual arrangement */
export type LayoutPreset = "layout_a" | "layout_b";

export interface PageEditSettings {
  layout: LayoutPreset;
  theme_mode: "light" | "dark" | "both";
  background_color: string;
  floating_cta: boolean;
  floating_cta_channel?: "whatsapp" | "yangu";
  floating_cta_whatsapp?: string;
}

export const DEFAULT_PAGE_SETTINGS: PageEditSettings = {
  layout: "layout_a",
  theme_mode: "light",
  background_color: "",
  floating_cta: false,
  floating_cta_channel: "whatsapp",
  floating_cta_whatsapp: "",
};
