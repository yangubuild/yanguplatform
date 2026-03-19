/**
 * Default schemas for each Builder section type.
 * Used by AI Fill to merge partial AI responses into a complete schema.
 */

const DEFAULTS: Record<string, Record<string, unknown>> = {
  header: { logo_url: "", show_name: true, name_next_to_logo: true },
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
  gallery: { heading: "", items: [] },
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
  footer: { heading: "Footer", email: "", phone: "", address: "" },
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
 * Applies safe field normalization to prevent crashes from malformed AI output.
 */
export function mergeIntoDefault(
  sectionType: string,
  aiSchema: Record<string, unknown>
): Record<string, unknown> {
  const base = getDefaultSchema(sectionType);
  const sanitized = sanitizeAiSchema(sectionType, aiSchema);
  return deepMerge(base, sanitized);
}

/**
 * Sanitize AI-generated schema to ensure type safety.
 * - Arrays stay arrays (or become empty arrays)
 * - Strings stay strings (or become empty strings)
 * - Objects stay objects
 * - Unknown fields are passed through safely
 */
function sanitizeAiSchema(
  sectionType: string,
  schema: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...schema };

  // Ensure array fields are arrays
  const arrayFields = ["items", "categories", "keys", "handles", "hours"];
  for (const field of arrayFields) {
    if (result[field] !== undefined && !Array.isArray(result[field])) {
      // If it's an object but not an array, try to preserve it for 'handles'
      if (field === "handles" && typeof result[field] === "object" && result[field] !== null) {
        continue;
      }
      result[field] = [];
    }
  }

  // Ensure string fields are strings
  const stringFields = [
    "heading", "headline", "subheadline", "body", "text", "label",
    "description", "title", "url", "href", "cta_text", "cta_href",
    "email", "phone", "address", "mapUrl", "name", "price",
  ];
  for (const field of stringFields) {
    if (result[field] !== undefined && typeof result[field] !== "string") {
      result[field] = String(result[field] ?? "");
    }
  }

  // Sanitize nested items arrays
  if (Array.isArray(result.items)) {
    result.items = (result.items as unknown[]).filter(
      (item) => item !== null && item !== undefined && typeof item === "object"
    ).map((item) => sanitizeItem(item as Record<string, unknown>));
  }

  // Sanitize menu categories
  if (Array.isArray(result.categories)) {
    result.categories = (result.categories as unknown[]).filter(
      (cat) => cat !== null && cat !== undefined && typeof cat === "object"
    ).map((cat) => {
      const c = cat as Record<string, unknown>;
      if (c.items !== undefined && !Array.isArray(c.items)) {
        c.items = [];
      }
      if (Array.isArray(c.items)) {
        c.items = (c.items as unknown[]).filter(
          (item) => item !== null && item !== undefined && typeof item === "object"
        ).map((item) => sanitizeItem(item as Record<string, unknown>));
      }
      if (c.name !== undefined && typeof c.name !== "string") {
        c.name = String(c.name ?? "");
      }
      return c;
    });
  }

  // Ensure media object is valid
  if (result.media !== undefined) {
    if (typeof result.media !== "object" || result.media === null || Array.isArray(result.media)) {
      result.media = { type: "none", source: "url", url: "", alt: "", fit: "contain" };
    }
  }

  return result;
}

/**
 * Sanitize individual item objects within arrays.
 */
function sanitizeItem(item: Record<string, unknown>): Record<string, unknown> {
  const result = { ...item };
  const itemStringFields = [
    "name", "title", "description", "price", "label", "url", "href",
    "src", "image_url", "alt", "icon", "quote", "question", "answer",
    "day", "time", "hours",
  ];
  for (const field of itemStringFields) {
    if (result[field] !== undefined && typeof result[field] !== "string") {
      result[field] = String(result[field] ?? "");
    }
  }
  return result;
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