/**
 * Default schemas for each Builder section type.
 * Used by AI Fill to merge partial AI responses into a complete schema.
 */

const DEFAULTS: Record<string, Record<string, unknown>> = {
  hero: { headline: "", subheadline: "", cta_text: "", cta_href: "", media: { type: "none", source: "url", url: "", alt: "", fit: "contain" } },
  featured: { title: "", items: [] },
  bio: { text: "" },
  text: { heading: "", body: "" },
  about: { heading: "", body: "" },
  links: { items: [] },
  social: { handles: {} },
  cta: { label: "", url: "" },
  join: { label: "", url: "", description: "" },
  video: { url: "" },
  gallery: { items: [] },
  offer: { heading: "", items: [] },
  plans: { heading: "", items: [] },
  faq: { heading: "", items: [] },
  contact: { heading: "", email: "", phone: "", address: "" },
  products: { heading: "", items: [] },
  services: { heading: "", items: [] },
  listings: { heading: "", items: [] },
  menu: { heading: "", categories: [] },
  testimonials: { heading: "", items: [] },
  schedule: { heading: "", items: [] },
  hours: { heading: "", items: [] },
  location: { heading: "", address: "", mapUrl: "" },
  rules: { heading: "", items: [] },
  categories: { heading: "", items: [] },
  filters: { heading: "", keys: [] },
};

/**
 * Returns the default empty schema for a section type.
 */
export function getDefaultSchema(sectionType: string): Record<string, unknown> {
  return structuredClone(DEFAULTS[sectionType] || {});
}

/**
 * Deep-merges AI-generated schema into the default schema so no required keys are dropped.
 * AI values overwrite defaults; missing AI keys keep their default values.
 */
export function mergeIntoDefault(
  sectionType: string,
  aiSchema: Record<string, unknown>
): Record<string, unknown> {
  const base = getDefaultSchema(sectionType);
  return deepMerge(base, aiSchema);
}

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...base };
  for (const key of Object.keys(overlay)) {
    const bVal = base[key];
    const oVal = overlay[key];

    if (
      oVal !== null &&
      oVal !== undefined &&
      typeof oVal === "object" &&
      !Array.isArray(oVal) &&
      typeof bVal === "object" &&
      bVal !== null &&
      !Array.isArray(bVal)
    ) {
      result[key] = deepMerge(
        bVal as Record<string, unknown>,
        oVal as Record<string, unknown>
      );
    } else if (oVal !== undefined) {
      result[key] = oVal;
    }
  }
  return result;
}
