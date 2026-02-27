// YANGU Builder — Template Registry
// Provides visual template presets per engine.
// Each template defines schema patches for core slots (header, hero, main_content, offer, footer).
// No DB changes required — applied client-side via patch merge.

export interface TemplateSlotPatch {
  /** Partial schema merged into the section's existing schema */
  schema: Record<string, unknown>;
}

export interface TemplatePreset {
  key: string;
  label: string;
  description: string;
  /** Emoji or icon hint for UI card */
  icon: string;
  /** Schema patches keyed by core_slot name */
  patches: Partial<Record<"header" | "hero" | "main_content" | "offer" | "footer", TemplateSlotPatch>>;
}

export interface EngineTemplates {
  engineKey: string;
  templates: TemplatePreset[];
}

// ─── Eshop Templates ───

const ESHOP_TEMPLATES: TemplatePreset[] = [
  {
    key: "catalog_store",
    label: "Catalog Store",
    description: "Grid-first product catalog with category navigation",
    icon: "🏪",
    patches: {
      header: { schema: { logo_position: "left", show_name: true, name_next_to_logo: true, menu_layout_style: "grid" } },
      hero: { schema: { headline: "Welcome to Our Store", subheadline: "Discover amazing products at great prices", cta_text: "Shop Now", media: { type: "none", source: "url" } } },
      main_content: { schema: { display_mode: "grid", filters_enabled: true, sort_enabled: true } },
      offer: { schema: { heading: "Today's Deals", description: "Don't miss out on these special offers", items: [] } },
      footer: { schema: { email: "", phone: "", address: "", social: {} } },
    },
  },
  {
    key: "featured_launch",
    label: "Featured Launch",
    description: "Hero-driven layout with featured product rows",
    icon: "🚀",
    patches: {
      header: { schema: { logo_position: "center", logo_size: "large", show_name: false } },
      hero: { schema: { headline: "New Collection", subheadline: "Introducing our latest arrivals — crafted with care", cta_text: "Explore Collection", media: { type: "image", source: "url", url: "", fit: "cover" } } },
      main_content: { schema: { display_mode: "featured_only" } },
      offer: { schema: { heading: "Limited Time Offer", description: "Get 20% off your first order", items: [{ title: "First Order Discount", price: "20% OFF", description: "Use code WELCOME20 at checkout" }] } },
      footer: { schema: { email: "hello@store.com", phone: "", social: { instagram: "", tiktok: "" } } },
    },
  },
];

// ─── Emenu Templates ───

const EMENU_TEMPLATES: TemplatePreset[] = [
  {
    key: "menu_compact",
    label: "Menu Compact",
    description: "Clean compact menu with categories and prices",
    icon: "🍽️",
    patches: {
      header: { schema: { logo_position: "center", logo_size: "medium", show_name: true, primary_color: "#b91c1c" } },
      hero: { schema: { headline: "Our Menu", subheadline: "Fresh ingredients, authentic flavors", cta_text: "Order Now" } },
      main_content: { schema: { display_mode: "compact_menu" } },
      offer: { schema: { heading: "Today's Special", description: "", items: [] } },
      footer: { schema: { email: "", phone: "", address: "", hours: [{ day: "Mon-Fri", hours: "11:00 AM - 10:00 PM" }, { day: "Sat-Sun", hours: "10:00 AM - 11:00 PM" }] } },
    },
  },
  {
    key: "menu_visual",
    label: "Visual Menu",
    description: "Photo-rich menu with large item images",
    icon: "📸",
    patches: {
      header: { schema: { logo_position: "left", logo_size: "medium", menu_layout_style: "grid" } },
      hero: { schema: { headline: "Taste the Difference", subheadline: "Every dish tells a story", cta_text: "View Menu", media: { type: "image", source: "url", url: "", fit: "cover" } } },
      main_content: { schema: { display_mode: "grid" } },
      footer: { schema: { email: "", phone: "", address: "" } },
    },
  },
];

// ─── Esite Templates ───

const ESITE_TEMPLATES: TemplatePreset[] = [
  {
    key: "consultancy",
    label: "Consultancy",
    description: "Professional services site with service cards and contact",
    icon: "💼",
    patches: {
      header: { schema: { logo_position: "left", show_name: true, primary_color: "#1d4ed8" } },
      hero: { schema: { headline: "Expert Solutions for Your Business", subheadline: "We help companies grow with proven strategies", cta_text: "Get Started" } },
      main_content: { schema: { display_mode: "cards", heading: "Our Services", items: [] } },
      offer: { schema: { heading: "Free Consultation", description: "Book a free 30-minute strategy session", items: [] } },
      footer: { schema: { email: "hello@consulting.com", phone: "", address: "", social: { linkedin: "" } } },
    },
  },
  {
    key: "articles_blog",
    label: "Articles / Blog",
    description: "Content-first layout with article feed and author info",
    icon: "📝",
    patches: {
      header: { schema: { logo_position: "left", show_name: true } },
      hero: { schema: { headline: "Insights & Ideas", subheadline: "Thoughts on design, technology, and business", cta_text: "Read Latest" } },
      main_content: { schema: { display_mode: "magazine", show_author: true, show_date: true, heading: "Latest Articles", items: [] } },
      footer: { schema: { email: "", social: { x: "", linkedin: "" } } },
    },
  },
  {
    key: "bookings_hospitality",
    label: "Bookings / Hospitality",
    description: "Hotel or venue site with booking inventory and gallery",
    icon: "🏨",
    patches: {
      header: { schema: { logo_position: "center", logo_size: "large", show_name: true } },
      hero: { schema: { headline: "Your Perfect Stay Awaits", subheadline: "Luxury rooms with breathtaking views", cta_text: "Book Now", media: { type: "image", source: "url", url: "", fit: "cover" } } },
      main_content: { schema: { display_mode: "list", date_picker: true, guests_picker: true, pricing_mode: "per_night", heading: "Available Rooms", items: [] } },
      offer: { schema: { heading: "Special Packages", description: "Exclusive rates for early bookings", items: [] } },
      footer: { schema: { email: "reservations@hotel.com", phone: "", address: "", hours: [{ day: "Check-in", hours: "2:00 PM" }, { day: "Check-out", hours: "11:00 AM" }] } },
    },
  },
];

// ─── Influencer Templates ───

const INFLUENCER_TEMPLATES: TemplatePreset[] = [
  {
    key: "creator_bio",
    label: "Creator Bio",
    description: "Minimal bio page with links and social profiles",
    icon: "✨",
    patches: {
      hero: { schema: { headline: "Hey, I'm [Name]", subheadline: "Creator • Designer • Storyteller", cta_text: "Follow Me" } },
      main_content: { schema: { display_mode: "grid", heading: "Links", items: [] } },
      footer: { schema: { social: { instagram: "", tiktok: "", youtube: "" } } },
    },
  },
  {
    key: "media_portfolio",
    label: "Media Portfolio",
    description: "Visual-first grid showcasing photos and videos",
    icon: "🎬",
    patches: {
      hero: { schema: { headline: "My Work", subheadline: "A collection of moments and stories", cta_text: "View Portfolio" } },
      main_content: { schema: { display_mode: "masonry", show_captions: true, heading: "Portfolio", items: [] } },
      footer: { schema: { email: "collab@creator.com", social: { instagram: "", youtube: "" } } },
    },
  },
  {
    key: "links_shop",
    label: "Links + Shop",
    description: "Link-in-bio with integrated product shelf",
    icon: "🛍️",
    patches: {
      hero: { schema: { headline: "Shop My Favorites", subheadline: "Curated picks and exclusive drops", cta_text: "Shop Now" } },
      main_content: { schema: { display_mode: "grid", heading: "My Links", items: [] } },
      footer: { schema: { social: { instagram: "", tiktok: "" } } },
    },
  },
];

// ─── Community Templates ───

const COMMUNITY_TEMPLATES: TemplatePreset[] = [
  {
    key: "group_feed",
    label: "Group Feed",
    description: "Social feed with posts, reactions, and discussions",
    icon: "💬",
    patches: {
      hero: { schema: { headline: "Welcome to Our Community", subheadline: "Connect, share, and grow together" } },
      main_content: { schema: { display_mode: "posts" } },
      footer: { schema: { email: "", social: {} } },
    },
  },
  {
    key: "events_focus",
    label: "Events Focus",
    description: "Event-driven community with calendar and RSVPs",
    icon: "📅",
    patches: {
      hero: { schema: { headline: "Upcoming Events", subheadline: "Join us for workshops, meetups, and more" } },
      main_content: { schema: { display_mode: "events" } },
      footer: { schema: { email: "events@community.com" } },
    },
  },
  {
    key: "course_coaching",
    label: "Course / Coaching",
    description: "Membership community with courses and coaching listings",
    icon: "🎓",
    patches: {
      hero: { schema: { headline: "Learn & Grow", subheadline: "Expert-led courses and 1:1 coaching", cta_text: "Join Now" } },
      main_content: { schema: { display_mode: "discussions", heading: "Programs", items: [] } },
      offer: { schema: { heading: "Membership Plans", description: "Choose the plan that fits your goals", items: [] } },
      footer: { schema: { email: "support@academy.com" } },
    },
  },
];

// ─── Estore Templates ───

const ESTORE_TEMPLATES: TemplatePreset[] = [
  {
    key: "marketplace_listings",
    label: "Marketplace Listings",
    description: "Grid of product listings with filters and search",
    icon: "🏬",
    patches: {
      header: { schema: { logo_position: "left", show_name: true } },
      hero: { schema: { headline: "Wholesale Marketplace", subheadline: "Source quality products at bulk prices", cta_text: "Browse Listings" } },
      main_content: { schema: { display_mode: "grid", filters_enabled: true, heading: "All Listings", items: [] } },
      footer: { schema: { email: "trade@marketplace.com", phone: "" } },
    },
  },
  {
    key: "deal_board",
    label: "Deal Board",
    description: "Deal-focused layout with promotions and time-limited offers",
    icon: "🔥",
    patches: {
      hero: { schema: { headline: "Hot Deals Today", subheadline: "Limited stock, unbeatable prices", cta_text: "See All Deals" } },
      main_content: { schema: { display_mode: "list", heading: "Active Deals", items: [] } },
      offer: { schema: { heading: "Flash Sale", description: "Ends in 24 hours", items: [] } },
      footer: { schema: { email: "" } },
    },
  },
  {
    key: "inventory_catalog",
    label: "Inventory Catalog",
    description: "Organized catalog with categories and stock levels",
    icon: "📦",
    patches: {
      header: { schema: { logo_position: "left", show_name: true, menu_layout_style: "list" } },
      hero: { schema: { headline: "Our Full Catalog", subheadline: "Everything in stock, ready to ship", cta_text: "View Catalog" } },
      main_content: { schema: { display_mode: "grid", filters_enabled: true, heading: "Catalog", items: [] } },
      footer: { schema: { email: "orders@catalog.com", phone: "" } },
    },
  },
];

// ─── Master Registry ───

const TEMPLATE_REGISTRY: Record<string, EngineTemplates> = {
  eshop: { engineKey: "eshop", templates: ESHOP_TEMPLATES },
  emenu: { engineKey: "emenu", templates: EMENU_TEMPLATES },
  esite: { engineKey: "esite", templates: ESITE_TEMPLATES },
  influencer: { engineKey: "influencer", templates: INFLUENCER_TEMPLATES },
  community: { engineKey: "community", templates: COMMUNITY_TEMPLATES },
  estore: { engineKey: "estore", templates: ESTORE_TEMPLATES },
};

// ─── Safe Merge Logic ───

/** Keys that templates are allowed to overwrite (presentation/style only) */
const STYLE_KEYS = new Set([
  "layout_variant", "display_mode", "logo_position", "logo_size",
  "show_name", "name_next_to_logo", "menu_layout_style", "primary_color",
  "spacing", "padding", "gap", "card_style", "cards",
  "typography_style", "alignment", "background_style", "background_color",
  "filters_enabled", "sort_enabled", "show_author", "show_date",
  "show_captions", "show_tags", "date_picker", "guests_picker",
  "pricing_mode", "cta_style", "show_price", "show_location",
]);

/** Content keys that must never be overwritten if user has data */
const CONTENT_KEYS = new Set([
  "headline", "subheadline", "title", "description", "heading",
  "items", "links", "images", "media", "gallery", "cover",
  "email", "phone", "address", "hours", "social",
  "cta_text", "cta_url",
]);

/**
 * Safely merge a template patch into an existing section schema.
 * - Style/presentation keys: always applied from patch
 * - Content keys: only applied if the existing value is empty/missing
 * - Unknown keys from patch: applied only if not already present
 */
export function mergeTemplateSchema(
  existing: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...existing };

  for (const [key, patchValue] of Object.entries(patch)) {
    if (STYLE_KEYS.has(key)) {
      // Always apply style keys
      result[key] = patchValue;
      continue;
    }

    if (CONTENT_KEYS.has(key)) {
      const existingValue = existing[key];
      // Only apply if existing is empty/missing
      if (existingValue === undefined || existingValue === null || existingValue === "") {
        result[key] = patchValue;
      } else if (Array.isArray(existingValue) && existingValue.length === 0) {
        result[key] = patchValue;
      } else if (typeof existingValue === "object" && !Array.isArray(existingValue) && Object.keys(existingValue as object).length === 0) {
        result[key] = patchValue;
      }
      // Otherwise preserve user data
      continue;
    }

    // Unknown keys: apply only if not already present
    if (!(key in existing)) {
      result[key] = patchValue;
    }
  }

  return result;
}

// ─── Public API ───

/** Get all templates for a given engine key */
export function getTemplatesForEngine(engineKey: string): TemplatePreset[] {
  return TEMPLATE_REGISTRY[engineKey]?.templates ?? [];
}

/** Get a specific template by engine key + template key */
export function getTemplate(engineKey: string, templateKey: string): TemplatePreset | undefined {
  return getTemplatesForEngine(engineKey).find((t) => t.key === templateKey);
}

/** Get all engine keys that have templates */
export function getEngineKeysWithTemplates(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}
