/**
 * Seller Editor Mode Configuration
 * Maps each seller surface_type to its mode-specific UI config.
 *
 * Real DB surface_type values:
 *   emenu → Menu Mode
 *   eshop → Shop Mode
 *   store_listing → Catalog Mode
 *   quick_site → Service Mode
 */

export interface SellerQuickAction {
  label: string;
  icon: string; // lucide icon name
  action: string; // action key for handler
}

export interface SellerModeConfig {
  /** Internal mode key */
  mode: "menu" | "shop" | "catalog" | "service";
  /** User-facing label shown in the sidebar header */
  sidebarTitle: string;
  /** Category badge label */
  categoryBadge: string;
  /** Section list heading */
  sectionListTitle: string;
  /** Helper text under sections */
  sectionListHint: string;
  /** Preview empty-state heading */
  previewEmptyTitle: string;
  /** Preview empty-state description */
  previewEmptyDescription: string;
  /** Quick actions shown at the top of the left panel */
  quickActions: SellerQuickAction[];
  /** Priority section types — shown first in add-section palette */
  prioritySections: string[];
  /** Editor modules relevant to this mode (from engine config) */
  relevantModules: string[];
}

const MENU_MODE: SellerModeConfig = {
  mode: "menu",
  sidebarTitle: "Menu Editor",
  categoryBadge: "Emenu",
  sectionListTitle: "Menu Sections",
  sectionListHint: "Organize your menu categories, items, and offers",
  previewEmptyTitle: "Your menu is empty",
  previewEmptyDescription: "Add menu categories and items to get started",
  quickActions: [
    { label: "Add Menu Category", icon: "UtensilsCrossed", action: "add_menu_category" },
    { label: "Add Featured Item", icon: "Star", action: "add_featured_item" },
    { label: "Set Hours", icon: "Clock", action: "set_hours" },
  ],
  prioritySections: ["menu", "featured", "hours", "offers", "hero", "gallery", "reviews", "qr"],
  relevantModules: ["menu_categories", "menu_items", "food_image_ai", "hours", "order_settings", "contact", "social"],
};

const SHOP_MODE: SellerModeConfig = {
  mode: "shop",
  sidebarTitle: "Shop Editor",
  categoryBadge: "Eshop",
  sectionListTitle: "Shop Sections",
  sectionListHint: "Manage your products, collections, and storefront",
  previewEmptyTitle: "Your shop is empty",
  previewEmptyDescription: "Add products and collections to start selling",
  quickActions: [
    { label: "Add Product", icon: "Package", action: "add_product" },
    { label: "Add Collection", icon: "Grid3X3", action: "add_collection" },
    { label: "Add Promo Banner", icon: "Tag", action: "add_promo" },
  ],
  prioritySections: ["products", "collections", "promo", "hero", "reviews", "cta", "gallery", "contact"],
  relevantModules: ["products", "collections", "discount_rules", "cart", "checkout", "review_settings", "promos", "contact"],
};

const CATALOG_MODE: SellerModeConfig = {
  mode: "catalog",
  sidebarTitle: "Catalog Editor",
  categoryBadge: "Estore",
  sectionListTitle: "Catalog Sections",
  sectionListHint: "Manage your catalog, pricing tiers, and supplier info",
  previewEmptyTitle: "Your catalog is empty",
  previewEmptyDescription: "Add product listings and bulk pricing to your catalog",
  quickActions: [
    { label: "Add Listing", icon: "ListPlus", action: "add_listing" },
    { label: "Bulk Pricing Table", icon: "Table", action: "add_bulk_pricing" },
    { label: "Quote Request Form", icon: "FileQuestion", action: "add_quote_form" },
  ],
  prioritySections: ["products", "bulk_pricing", "quote", "supplier", "hero", "gallery", "cta", "contact"],
  relevantModules: ["products", "catalog", "bulk_pricing", "quote_request", "large_inventory", "supplier_info", "contact"],
};

const SERVICE_MODE: SellerModeConfig = {
  mode: "service",
  sidebarTitle: "Site Editor",
  categoryBadge: "Esite",
  sectionListTitle: "Site Sections",
  sectionListHint: "Manage your services, team, and business content",
  previewEmptyTitle: "Your website is empty",
  previewEmptyDescription: "Add services, team info, and business content",
  quickActions: [
    { label: "Add Service", icon: "Briefcase", action: "add_service" },
    { label: "Add Team Member", icon: "Users", action: "add_team" },
    { label: "Add Testimonial", icon: "MessageSquareQuote", action: "add_testimonial" },
  ],
  prioritySections: ["services", "team", "testimonials", "hero", "about", "faq", "blog", "contact", "cta", "gallery"],
  relevantModules: ["hero", "text", "services", "team", "testimonials", "contact", "faq", "blog"],
};

/**
 * Map real DB surface_type → SellerModeConfig
 */
const SURFACE_TYPE_TO_MODE: Record<string, SellerModeConfig> = {
  emenu: MENU_MODE,
  eshop: SHOP_MODE,
  store_listing: CATALOG_MODE,
  quick_site: SERVICE_MODE,
};

export function getSellerMode(surfaceType: string): SellerModeConfig {
  return SURFACE_TYPE_TO_MODE[surfaceType] || SERVICE_MODE;
}

/** Get ordered section types for the add-section palette */
export function getSectionPalette(surfaceType: string, allSections: string[]): string[] {
  const mode = getSellerMode(surfaceType);
  const priority = mode.prioritySections;
  const prioritized = priority.filter((s) => allSections.includes(s));
  const rest = allSections.filter((s) => !priority.includes(s));
  return [...prioritized, ...rest];
}
