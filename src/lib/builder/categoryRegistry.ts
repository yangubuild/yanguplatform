/**
 * CANONICAL CATEGORY REGISTRY — Phase 1.
 * Single source of truth for the six builder categories.
 */
import type { BuilderType, SurfaceType } from "@/types/builders";

export type BuilderCategory = BuilderType;

export interface CategoryDefinition {
  key: BuilderCategory;
  surfaceType: SurfaceType;
  label: string;
  description: string;
  publishDomain: string;
  icon: string;
}

export const CATEGORY_REGISTRY: Readonly<Record<BuilderCategory, Readonly<CategoryDefinition>>> = Object.freeze({
  eshop: Object.freeze({
    key: "eshop",
    surfaceType: "eshop",
    label: "Eshop",
    description: "Online shop for direct-to-consumer products.",
    publishDomain: "yangu.shop",
    icon: "ShoppingBag",
  }),
  estore: Object.freeze({
    key: "estore",
    surfaceType: "store_listing",
    label: "Estore",
    description: "Wholesale, trading, and bulk supplier storefront.",
    publishDomain: "yangu.store",
    icon: "Warehouse",
  }),
  emenu: Object.freeze({
    key: "emenu",
    surfaceType: "emenu",
    label: "Emenu",
    description: "Restaurant, cafe, and food menu builder.",
    publishDomain: "restaurant.yangu.shop",
    icon: "UtensilsCrossed",
  }),
  esite: Object.freeze({
    key: "esite",
    surfaceType: "quick_site",
    label: "Esite",
    description: "Quick site for services, agencies, and professionals.",
    publishDomain: "yangu.site",
    icon: "Globe",
  }),
  influencer: Object.freeze({
    key: "influencer",
    surfaceType: "live_bio",
    label: "Influencer",
    description: "Link-in-bio and creator commerce page.",
    publishDomain: "yangu.live",
    icon: "Sparkles",
  }),
  community: Object.freeze({
    key: "community",
    surfaceType: "community_group",
    label: "Community",
    description: "Community, courses, events, and freelance hubs.",
    publishDomain: "yangu.community",
    icon: "Users",
  }),
});

export const ALL_CATEGORY_KEYS: readonly BuilderCategory[] =
  Object.freeze(Object.keys(CATEGORY_REGISTRY) as BuilderCategory[]);

const SURFACE_TYPE_INDEX: Readonly<Record<string, BuilderCategory>> = Object.freeze(
  ALL_CATEGORY_KEYS.reduce((acc, key) => {
    acc[CATEGORY_REGISTRY[key].surfaceType] = key;
    return acc;
  }, {} as Record<string, BuilderCategory>),
);

export function getCategory(key: string | null | undefined): Readonly<CategoryDefinition> | undefined {
  if (!key) return undefined;
  return CATEGORY_REGISTRY[key as BuilderCategory];
}

export function getCategoryForSurfaceType(
  surfaceType: string | null | undefined,
): Readonly<CategoryDefinition> | undefined {
  if (!surfaceType) return undefined;
  const key = SURFACE_TYPE_INDEX[surfaceType];
  return key ? CATEGORY_REGISTRY[key] : undefined;
}

export function isBuilderCategory(value: unknown): value is BuilderCategory {
  return typeof value === "string" && value in CATEGORY_REGISTRY;
}

/**
 * Runtime guard placed at every flow boundary (chat handoff, template
 * selection, editor mount, asset upload, logo generation, publish).
 * Throws if a flow is handed a category that does not match the surface's
 * locked category. ADA may RECOMMEND a switch but must never mutate the
 * surface — a user-confirmed switch creates a NEW surface.
 */
export function assertCategoryLocked(
  expected: BuilderCategory | undefined | null,
  actual: BuilderCategory | undefined | null,
  context: string,
): void {
  if (!expected || !actual) {
    throw new Error(
      `[CATEGORY LOCK] ${context}: missing category ` +
        `(expected=${expected ?? "null"} actual=${actual ?? "null"}). ` +
        `Every builder flow must run inside BuilderCategoryProvider.`,
    );
  }
  if (expected !== actual) {
    throw new Error(
      `[CATEGORY LOCK VIOLATION] ${context}: surface is locked to ` +
        `"${expected}" but flow received "${actual}". ` +
        `ADA may not silently switch category — create a new surface instead.`,
    );
  }
}