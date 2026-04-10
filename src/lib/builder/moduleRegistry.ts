/**
 * Module Registry — maps editorModule strings to UI metadata.
 * Used by EditorToolsPanel to render category-specific tool groups.
 */

import {
  Type, Image, Palette, LayoutGrid, Plus, Trash2,
  ArrowUp, ArrowDown, Copy, Settings2,
  UtensilsCrossed, Tag, Clock, Truck, Phone, Share2,
  ShoppingBag, Grid3X3, Percent, ShoppingCart, CreditCard, Star, Gift, Mail,
  Layers, FileText, Quote, HelpCircle, BookOpen,
  Users, Calendar, GraduationCap, FolderOpen, MessageCircle, Lock,
  Link, Video, Heart, Zap, DollarSign,
  Building, ClipboardList, Package,
  type LucideIcon,
} from "lucide-react";

export interface EditorModule {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  /** Which tool group this belongs to */
  group: "content" | "layout" | "page" | "commerce" | "social" | "community";
}

/** Master registry of all known editor modules */
const MODULE_DEFINITIONS: Record<string, EditorModule> = {
  // ─── Emenu ────────────────────────────────────────────
  menu_categories: { id: "menu_categories", label: "Categories", icon: Tag, description: "Manage menu categories", group: "content" },
  menu_items: { id: "menu_items", label: "Menu Items", icon: UtensilsCrossed, description: "Add and edit menu items", group: "content" },
  food_image_ai: { id: "food_image_ai", label: "Food Image AI", icon: Image, description: "Generate food images with AI", group: "content" },
  hours: { id: "hours", label: "Hours", icon: Clock, description: "Set business hours", group: "content" },
  order_settings: { id: "order_settings", label: "Commerce & Orders", icon: Truck, description: "Ordering, delivery, payments", group: "commerce" },
  commerce_config: { id: "commerce_config", label: "Commerce & Orders", icon: CreditCard, description: "Ordering, delivery, payments", group: "commerce" },
  contact: { id: "contact", label: "Contact Info", icon: Phone, description: "Phone, email, address", group: "content" },
  social: { id: "social", label: "Social Links", icon: Share2, description: "Add social media links", group: "social" },

  // ─── Eshop ────────────────────────────────────────────
  products: { id: "products", label: "Products", icon: ShoppingBag, description: "Manage your products", group: "content" },
  collections: { id: "collections", label: "Collections", icon: Grid3X3, description: "Group products into collections", group: "content" },
  discount_rules: { id: "discount_rules", label: "Discounts", icon: Percent, description: "Set discount rules", group: "commerce" },
  cart: { id: "cart", label: "Cart", icon: ShoppingCart, description: "Shopping cart settings", group: "commerce" },
  checkout: { id: "checkout", label: "Checkout", icon: CreditCard, description: "Checkout flow settings", group: "commerce" },
  review_settings: { id: "review_settings", label: "Reviews", icon: Star, description: "Customer review settings", group: "social" },
  promos: { id: "promos", label: "Promotions", icon: Gift, description: "Promo codes and offers", group: "commerce" },

  // ─── Estore (extends eshop) ───────────────────────────
  catalog: { id: "catalog", label: "Catalog", icon: Layers, description: "Manage product catalog", group: "content" },
  bulk_pricing: { id: "bulk_pricing", label: "Bulk Pricing", icon: Package, description: "Volume and wholesale pricing", group: "commerce" },
  quote_request: { id: "quote_request", label: "Quotes", icon: ClipboardList, description: "Request-for-quote forms", group: "commerce" },
  large_inventory: { id: "large_inventory", label: "Inventory", icon: Building, description: "Large inventory management", group: "commerce" },
  supplier_info: { id: "supplier_info", label: "Supplier Info", icon: Building, description: "Supplier and dealer details", group: "content" },

  // ─── Esite ────────────────────────────────────────────
  hero: { id: "hero", label: "Hero Section", icon: Image, description: "Edit hero banner", group: "content" },
  text: { id: "text", label: "Text Blocks", icon: Type, description: "Edit text content", group: "content" },
  services: { id: "services", label: "Services", icon: Settings2, description: "Manage services list", group: "content" },
  team: { id: "team", label: "Team", icon: Users, description: "Team member profiles", group: "content" },
  testimonials: { id: "testimonials", label: "Testimonials", icon: Quote, description: "Customer testimonials", group: "content" },
  faq: { id: "faq", label: "FAQ", icon: HelpCircle, description: "Frequently asked questions", group: "content" },
  blog: { id: "blog", label: "Blog", icon: BookOpen, description: "Blog posts", group: "content" },

  // ─── Community ────────────────────────────────────────
  member_signup: { id: "member_signup", label: "Membership", icon: Users, description: "Member signup settings", group: "community" },
  events: { id: "events", label: "Events", icon: Calendar, description: "Manage events", group: "community" },
  programs: { id: "programs", label: "Programs", icon: GraduationCap, description: "Courses and programs", group: "community" },
  resources: { id: "resources", label: "Resources", icon: FolderOpen, description: "Shared resources", group: "community" },
  private_posts: { id: "private_posts", label: "Posts", icon: Lock, description: "Members-only posts", group: "community" },
  directory: { id: "directory", label: "Directory", icon: Users, description: "Member directory", group: "community" },
  messaging: { id: "messaging", label: "Messaging", icon: MessageCircle, description: "Group messaging", group: "community" },

  // ─── Influencer ───────────────────────────────────────
  bio: { id: "bio", label: "Bio", icon: Type, description: "Edit your bio", group: "content" },
  links: { id: "links", label: "Links", icon: Link, description: "Manage link-in-bio", group: "content" },
  media: { id: "media", label: "Media", icon: Video, description: "Photos and videos", group: "content" },
  affiliate: { id: "affiliate", label: "Affiliate", icon: DollarSign, description: "Affiliate links", group: "commerce" },
  live_product_pins: { id: "live_product_pins", label: "Product Pins", icon: Zap, description: "Live product pins", group: "commerce" },
  tips: { id: "tips", label: "Tips / Donate", icon: Heart, description: "Accept tips", group: "commerce" },
};

/** Shared tools available in ALL categories */
export const SHARED_LAYOUT_TOOLS: EditorModule[] = [
  { id: "add_section", label: "Add Section", icon: Plus, description: "Insert a new section", group: "layout" },
  { id: "move_up", label: "Move Up", icon: ArrowUp, description: "Move section up", group: "layout" },
  { id: "move_down", label: "Move Down", icon: ArrowDown, description: "Move section down", group: "layout" },
  { id: "remove_section", label: "Remove", icon: Trash2, description: "Delete section", group: "layout" },
  { id: "duplicate_section", label: "Duplicate", icon: Copy, description: "Copy section", group: "layout" },
  { id: "section_settings", label: "Settings", icon: Settings2, description: "Section options", group: "layout" },
];

export const SHARED_PAGE_TOOLS: EditorModule[] = [
  { id: "change_colors", label: "Colors", icon: Palette, description: "Brand colors", group: "page" },
  { id: "toggle_grid", label: "Grid / List", icon: LayoutGrid, description: "Switch layout", group: "page" },
];

/**
 * Resolve editorModules strings into full EditorModule objects.
 * Unknown module keys are silently skipped.
 */
export function resolveModules(moduleKeys: string[]): EditorModule[] {
  return moduleKeys
    .map((key) => MODULE_DEFINITIONS[key])
    .filter(Boolean);
}

/**
 * Group resolved modules by their group label.
 */
export function groupModules(modules: EditorModule[]): Record<string, EditorModule[]> {
  const groups: Record<string, EditorModule[]> = {};
  for (const mod of modules) {
    const label = mod.group.charAt(0).toUpperCase() + mod.group.slice(1);
    if (!groups[label]) groups[label] = [];
    groups[label].push(mod);
  }
  return groups;
}
