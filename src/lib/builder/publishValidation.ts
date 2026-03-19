/**
 * Client-side publish validation for multi-page builders.
 * Runs before the RPC call to give immediate feedback.
 */

import type { BuilderSurfaceType } from "@/types/builder";

export interface PublishPage {
  id: string;
  slug: string;
  title: string;
  sections: { id: string; section_type: string; page_id?: string }[];
}

export interface PublishValidationError {
  code: string;
  message: string;
}

// Required primary page slug per surface type
const REQUIRED_PRIMARY_SLUGS: Record<string, string[]> = {
  eshop: ["home"],
  store_listing: ["home"],
  quick_site: ["home"],
  community_group: ["home"],
  community_listing: ["home"],
  emenu: ["menu", "home"],
  live_bio: ["home", "links"],
  live_selling: ["home"],
  studio_showcase: ["home"],
};

// Reserved slugs that cannot be used as page slugs
const RESERVED_SLUGS = new Set(["api", "admin", "auth", "login", "signup", "404", "500", "_next", "static"]);

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validate pages for publish readiness.
 * Returns an array of errors (empty = valid).
 */
export function validatePagesForPublish(
  pages: PublishPage[],
  surfaceType: BuilderSurfaceType | string,
  surfaceId: string
): PublishValidationError[] {
  const errors: PublishValidationError[] = [];

  // 1. Must have at least one page
  if (!pages || pages.length === 0) {
    errors.push({
      code: "no_pages",
      message: "Add at least one page before publishing.",
    });
    return errors; // No point checking further
  }

  // 2. Required primary page must exist
  const requiredSlugs = REQUIRED_PRIMARY_SLUGS[surfaceType] || ["home"];
  const pageSlugsNormalized = pages.map((p) => normalizeSlug(p.slug));
  const pageTitlesNormalized = pages.map((p) => p.title.toLowerCase().trim());
  const hasPrimary = requiredSlugs.some(
    (req) => pageSlugsNormalized.includes(req) || pageTitlesNormalized.includes(req)
  );
  if (!hasPrimary) {
    const label = requiredSlugs[0].charAt(0).toUpperCase() + requiredSlugs[0].slice(1);
    errors.push({
      code: "missing_primary_page",
      message: `A "${label}" page is required for this builder type.`,
    });
  }

  // 3 & 4. Validate each page slug and check uniqueness
  const seenSlugs = new Map<string, string>(); // normalized -> original title
  for (const page of pages) {
    const norm = normalizeSlug(page.slug);

    if (!norm) {
      errors.push({
        code: "empty_slug",
        message: `Page "${page.title || "(untitled)"}" has an empty or invalid slug.`,
      });
      continue;
    }

    if (RESERVED_SLUGS.has(norm)) {
      errors.push({
        code: "reserved_slug",
        message: `Page slug "${norm}" is reserved and cannot be used.`,
      });
    }

    if (seenSlugs.has(norm)) {
      errors.push({
        code: "duplicate_slug",
        message: `Pages "${seenSlugs.get(norm)}" and "${page.title}" have the same slug "${norm}".`,
      });
    } else {
      seenSlugs.set(norm, page.title);
    }
  }

  // 5. Required primary page cannot be empty
  for (const req of requiredSlugs) {
    const primaryPage = pages.find(
      (p) => normalizeSlug(p.slug) === req || p.title.toLowerCase().trim() === req
    );
    if (primaryPage) {
      const visibleSections = primaryPage.sections.filter(
        (s) => s.section_type !== "header" && s.section_type !== "footer"
      );
      if (visibleSections.length === 0) {
        errors.push({
          code: "empty_primary_page",
          message: `Primary page "${primaryPage.title}" must have content before publishing.`,
        });
      }
      break; // Only check the first matched primary
    }
  }

  // 8. Orphan section protection — sections must belong to valid pages
  const validPageIds = new Set(pages.map((p) => p.id));
  for (const page of pages) {
    for (const section of page.sections) {
      if (section.page_id && !validPageIds.has(section.page_id)) {
        errors.push({
          code: "orphan_section",
          message: `A section is attached to a missing page.`,
        });
        break; // One error is enough
      }
    }
  }

  return errors;
}

/**
 * Filter out truly empty optional pages from publish payload.
 * Required pages are never filtered — they produce errors instead.
 */
export function filterEmptyOptionalPages(
  pages: PublishPage[],
  surfaceType: BuilderSurfaceType | string
): PublishPage[] {
  const requiredSlugs = REQUIRED_PRIMARY_SLUGS[surfaceType] || ["home"];
  
  return pages.filter((page) => {
    const norm = normalizeSlug(page.slug);
    const isRequired = requiredSlugs.includes(norm) || requiredSlugs.includes(page.title.toLowerCase().trim());
    if (isRequired) return true;

    // Optional page: include only if it has non-header/footer sections
    const contentSections = page.sections.filter(
      (s) => s.section_type !== "header" && s.section_type !== "footer"
    );
    return contentSections.length > 0;
  });
}
