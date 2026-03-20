// YANGU Builder — starter section definitions + shared section normalization.
// Starter sections are defaults for new pages, but users can freely move or delete them.

import { CONTENT_SECTIONS } from "@/config/builderSectionPalettes";

export interface CoreSectionDef {
  type: string;
  label: string;
  icon: string;
  /** If true, this section maps to a category-specific content type */
  categorySpecific?: boolean;
}

/** Default starter sections shown on new single-page builder surfaces */
export const CORE_SECTIONS: CoreSectionDef[] = [
  { type: "header", label: "Header / Logo", icon: "🏷️" },
  { type: "hero", label: "Hero Banner", icon: "🖼" },
  { type: "main_content", label: "Main Content", icon: "📦", categorySpecific: true },
  { type: "offer", label: "Offers", icon: "🏷️" },
  { type: "footer", label: "Footer", icon: "📋" },
];

/** Set of starter slot names (for quick lookup) */
export const CORE_SECTION_TYPES = new Set(CORE_SECTIONS.map((s) => s.type));

/** All possible content section types across all surfaces (for main_content slot detection) */
export const CONTENT_SECTION_TYPES: Set<string> = new Set(
  Object.values(CONTENT_SECTIONS).flatMap((entries) => entries.map((e) => e.type))
);

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

type NormalizableSection = {
  id: string;
  section_type: string;
  schema: Record<string, unknown>;
  position: number;
  is_visible?: boolean;
  core_slot?: string | null;
};

type NormalizedSection<T extends NormalizableSection> = T & {
  isCore: boolean;
  isMissing?: boolean;
  core_slot?: string | null;
  is_visible: boolean;
};

function inferStarterSlot(section: NormalizableSection, surfaceType: string): string | null {
  if (section.core_slot && CORE_SECTION_TYPES.has(section.core_slot)) {
    return section.core_slot;
  }

  for (const starter of CORE_SECTIONS) {
    const resolvedType = resolveCoreSectionType(starter.type, surfaceType);
    if (section.section_type === resolvedType) {
      return starter.type;
    }
  }

  if (CONTENT_SECTION_TYPES.has(section.section_type)) {
    return "main_content";
  }

  return null;
}

/**
 * Shared canonical section normalization for editor + published rendering.
 * - preserves the user's saved order
 * - removes duplicate starter-slot rows (keeps the strongest/latest candidate)
 * - removes exact stale collisions sharing the same section_type + position
 * - does NOT recreate missing starter sections or force footer-last behavior
 */
export function enforceCoreSectionOrder<T extends NormalizableSection>(
  rawSections: T[],
  surfaceType: string
): Array<NormalizedSection<T>> {
  const ordered = rawSections
    .map((section, index) => ({ ...section, __index: index }))
    .sort((a, b) => a.position - b.position || a.__index - b.__index);

  const canonicalSlotCandidates = new Map<string, { id: string; score: number; order: number }>();

  ordered.forEach((section, order) => {
    const slot = inferStarterSlot(section, surfaceType);
    if (!slot) return;

    const score = section.core_slot === slot ? 2 : 1;
    const existing = canonicalSlotCandidates.get(slot);
    if (!existing || score > existing.score || (score === existing.score && order > existing.order)) {
      canonicalSlotCandidates.set(slot, { id: section.id, score, order });
    }
  });

  const seenTypePosition = new Set<string>();
  const normalized: Array<NormalizedSection<T>> = [];

  for (const section of ordered) {
    const dedupeKey = `${section.section_type}::${section.position}`;
    if (seenTypePosition.has(dedupeKey)) continue;

    const slot = inferStarterSlot(section, surfaceType);
    if (slot) {
      const canonical = canonicalSlotCandidates.get(slot);
      if (!canonical || canonical.id !== section.id) continue;
    }

    seenTypePosition.add(dedupeKey);
    normalized.push({
      ...(section as T),
      is_visible: section.is_visible ?? true,
      isCore: !!slot,
      core_slot: section.core_slot || slot || null,
    });
  }

  return normalized;
}

export function normalizePublishedSections(
  rawSections: Array<{
    id: string;
    section_type: string;
    schema: Record<string, unknown>;
    position: number;
    core_slot?: string | null;
  }>,
  surfaceType: string
): Array<{
  id: string;
  section_type: string;
  schema: Record<string, unknown>;
  position: number;
  isCore: boolean;
  core_slot?: string | null;
}> {
  return enforceCoreSectionOrder(
    rawSections.map((section) => ({ ...section, is_visible: true })),
    surfaceType
  ).map(({ is_visible: _isVisible, ...section }) => section);
}

/** Layout presets — Layout A and Layout B simply control visual arrangement */
export type LayoutPreset = "layout_a" | "layout_b";

export interface PageEditSettings {
  layout: LayoutPreset;
  theme_mode: "light" | "dark" | "both";
  background_color: string;
  font_family: string;
  font_color: string;
  floating_cta: boolean;
  floating_cta_channel?: "whatsapp" | "yangu";
  floating_cta_whatsapp?: string;
}

export const DEFAULT_PAGE_SETTINGS: PageEditSettings = {
  layout: "layout_a",
  theme_mode: "light",
  background_color: "",
  font_family: "",
  font_color: "",
  floating_cta: false,
  floating_cta_channel: "whatsapp",
  floating_cta_whatsapp: "",
};
