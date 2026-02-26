// YANGU Builder — Per-surface section palettes & default schemas
// Single source of truth for which section types each surface_type supports.

export interface SectionTypeEntry {
  type: string;
  label: string;
  icon: string;
}

// ─── Content sections (swappable main content types per surface) ───
export const CONTENT_SECTIONS: Record<string, SectionTypeEntry[]> = {
  quick_site: [
    { type: "services", label: "Services", icon: "⚙️" },
    { type: "properties", label: "Properties", icon: "🏠" },
    { type: "rooms", label: "Rooms", icon: "🛏️" },
    { type: "booking_calendar", label: "Booking Calendar", icon: "📅" },
    { type: "programs", label: "Programs", icon: "📚" },
    { type: "tours", label: "Tours", icon: "🗺️" },
    { type: "team", label: "Team", icon: "👥" },
    { type: "services_pricing", label: "Services & Pricing", icon: "💰" },
  ],
  eshop: [
    { type: "products", label: "Products", icon: "🛍️" },
    { type: "featured_products", label: "Featured Products", icon: "⭐" },
    { type: "deals", label: "Deals", icon: "🔥" },
    { type: "flash_sale", label: "Flash Sale", icon: "⚡" },
    { type: "reviews", label: "Reviews", icon: "⭐" },
  ],
  store_listing: [
    { type: "listings", label: "Listings", icon: "📋" },
    { type: "supplier_catalog", label: "Supplier Catalog", icon: "📦" },
    { type: "bulk_products", label: "Bulk Products", icon: "📦" },
    { type: "agriculture_produce", label: "Agriculture Produce", icon: "🌾" },
    { type: "manufacturer_products", label: "Manufacturer Products", icon: "🏭" },
  ],
  community_group: [
    { type: "about", label: "About", icon: "ℹ️" },
    { type: "coaching", label: "Coaching", icon: "🎯" },
    { type: "courses", label: "Courses", icon: "📖" },
    { type: "live_webinars", label: "Live Webinars", icon: "📹" },
    { type: "workshops", label: "Workshops", icon: "🔧" },
    { type: "mentorship", label: "Mentorship", icon: "🤝" },
    { type: "resources", label: "Resources", icon: "📁" },
    { type: "discussions", label: "Discussions", icon: "💬" },
  ],
  live_bio: [
    { type: "links", label: "Links", icon: "🔗" },
    { type: "live_stream", label: "Live Stream", icon: "📺" },
    { type: "live_selling", label: "Live Selling", icon: "🛒" },
    { type: "affiliate_products", label: "Affiliate Products", icon: "🤝" },
    { type: "media_feed", label: "Media Feed", icon: "📱" },
    { type: "merch", label: "Merch", icon: "👕" },
    { type: "tips_support", label: "Tips & Support", icon: "💝" },
    { type: "collabs", label: "Collabs", icon: "🤝" },
  ],
  emenu: [
    { type: "menu", label: "Menu", icon: "🍽️" },
  ],
  live_selling: [
    { type: "products", label: "Products", icon: "🛍️" },
  ],
  studio_showcase: [
    { type: "gallery", label: "Gallery", icon: "🖼️" },
  ],
  community_listing: [
    { type: "text", label: "Text", icon: "📄" },
  ],
};

// ─── General sections (shared, addable to any surface) ───
export const GENERAL_SECTIONS: SectionTypeEntry[] = [
  { type: "text", label: "Text", icon: "📄" },
  { type: "gallery", label: "Gallery", icon: "🖼️" },
  { type: "testimonials", label: "Testimonials", icon: "💬" },
  { type: "faq", label: "FAQ", icon: "❓" },
  { type: "contact", label: "Contact", icon: "✉️" },
  { type: "cta", label: "Call to Action", icon: "📣" },
  { type: "video", label: "Video", icon: "🎬" },
  { type: "schedule", label: "Schedule", icon: "📅" },
];

// ─── Legacy palettes (kept for backward compat with old popover) ───
const PALETTES: Record<string, SectionTypeEntry[]> = {
  live_bio: [
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "bio", label: "Bio", icon: "📝" },
    { type: "links", label: "Links", icon: "🔗" },
    { type: "social", label: "Socials", icon: "📱" },
    { type: "cta", label: "Call to Action", icon: "📣" },
    { type: "video", label: "Video", icon: "🎬" },
    { type: "gallery", label: "Gallery", icon: "🖼️" },
  ],
  community_listing: [
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "text", label: "Text", icon: "📄" },
    { type: "offer", label: "Offer", icon: "🏷️" },
    { type: "testimonials", label: "Testimonials", icon: "💬" },
    { type: "faq", label: "FAQ", icon: "❓" },
    { type: "cta", label: "Call to Action", icon: "📣" },
    { type: "gallery", label: "Gallery", icon: "🖼️" },
    { type: "contact", label: "Contact", icon: "✉️" },
  ],
  community_group: [
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "text", label: "Text", icon: "📄" },
    { type: "about", label: "About", icon: "ℹ️" },
    { type: "plans", label: "Plans", icon: "💎" },
    { type: "rules", label: "Rules", icon: "📋" },
    { type: "schedule", label: "Schedule", icon: "📅" },
    { type: "faq", label: "FAQ", icon: "❓" },
    { type: "join", label: "Join", icon: "🚪" },
    { type: "cta", label: "Call to Action", icon: "📣" },
  ],
  eshop: [
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "products", label: "Products", icon: "🛍️" },
    { type: "banners_ads", label: "Banners & Ads", icon: "📢" },
    { type: "categories", label: "Categories", icon: "📂" },
    { type: "testimonials", label: "Testimonials", icon: "💬" },
    { type: "faq", label: "FAQ", icon: "❓" },
    { type: "cta", label: "Call to Action", icon: "📣" },
    { type: "contact", label: "Contact", icon: "✉️" },
  ],
  store_listing: [
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "listings", label: "Listings", icon: "📋" },
    { type: "filters", label: "Filters", icon: "🔍" },
    { type: "faq", label: "FAQ", icon: "❓" },
    { type: "cta", label: "Call to Action", icon: "📣" },
    { type: "contact", label: "Contact", icon: "✉️" },
  ],
  emenu: [
    { type: "header", label: "Header / Logo", icon: "🏷️" },
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "menu", label: "Menu", icon: "🍽️" },
    { type: "featured", label: "Featured", icon: "⭐" },
    { type: "offer", label: "Offers", icon: "🏷️" },
    { type: "hours", label: "Hours", icon: "🕐" },
    { type: "location", label: "Location", icon: "📍" },
    { type: "contact", label: "Contact", icon: "✉️" },
    { type: "cta", label: "Call to Action", icon: "📣" },
  ],
  quick_site: [
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "text", label: "Text", icon: "📄" },
    { type: "services", label: "Services", icon: "⚙️" },
    { type: "gallery", label: "Gallery", icon: "🖼️" },
    { type: "testimonials", label: "Testimonials", icon: "💬" },
    { type: "faq", label: "FAQ", icon: "❓" },
    { type: "contact", label: "Contact", icon: "✉️" },
    { type: "cta", label: "Call to Action", icon: "📣" },
  ],
  live_selling: [
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "products", label: "Products", icon: "🛍️" },
    { type: "video", label: "Video", icon: "🎬" },
    { type: "schedule", label: "Schedule", icon: "📅" },
    { type: "cta", label: "Call to Action", icon: "📣" },
  ],
  studio_showcase: [
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "gallery", label: "Gallery", icon: "🖼️" },
    { type: "services", label: "Services", icon: "⚙️" },
    { type: "testimonials", label: "Testimonials", icon: "💬" },
    { type: "contact", label: "Contact", icon: "✉️" },
    { type: "cta", label: "Call to Action", icon: "📣" },
  ],
};

const FALLBACK_PALETTE: SectionTypeEntry[] = [
  { type: "text", label: "Text", icon: "📄" },
  { type: "cta", label: "Call to Action", icon: "📣" },
];

export function getSectionPalette(surfaceType: string): SectionTypeEntry[] {
  return PALETTES[surfaceType] || FALLBACK_PALETTE;
}

/** Get content section alternatives for the main_content slot */
export function getContentSections(surfaceType: string): SectionTypeEntry[] {
  return CONTENT_SECTIONS[surfaceType] || [];
}

/** Get general (non-content) sections available for adding */
export function getGeneralSections(): SectionTypeEntry[] {
  return GENERAL_SECTIONS;
}

// ─── Default schemas for ALL section types ───
const DEFAULT_SCHEMAS: Record<string, Record<string, unknown>> = {
  // Existing (live_bio)
  hero: { headline: "Welcome to my page", subheadline: "" },
  bio: { text: "" },
  links: { items: [] },
  social: { handles: {} },
  cta: { label: "Contact", href: "" },
  video: { url: "" },
  gallery: { items: [] },

  // Text / content
  text: { heading: "", body: "" },
  about: { heading: "About Us", body: "" },
  offer: { heading: "What We Offer", description: "", banner: { type: "none", source: "url", url: "" }, items: [] },
  header: { logo_url: "", logo_position: "left", logo_size: "medium", show_name: true, name_next_to_logo: true },

  // Community
  plans: { heading: "Plans", items: [] },
  rules: { heading: "Community Rules", items: [] },
  join: { label: "Join Now", href: "", description: "" },

  // Commerce
  products: { heading: "Products", currency: "UGX", categories: [], products: [] },
  banners_ads: {
    announcement_bar: { enabled: false, text: "", link_url: "", link_label: "Shop Now", bg_color: "#e11d48", text_color: "#ffffff" },
    hero_banner: { enabled: true, layout: "full_width", slides: [], autoplay: true, interval_seconds: 5 },
    featured_categories: { enabled: true, heading: "Shop by Category", layout: "grid", items: [] },
    middle_banner: { enabled: false, banners: [] },
  },
  categories: { heading: "Categories", items: [] },
  listings: { heading: "Listings", items: [] },
  filters: { heading: "Filters", keys: [] },
  services: { heading: "Services", items: [] },

  // Info
  testimonials: { heading: "Testimonials", items: [] },
  faq: { heading: "FAQ", items: [] },
  contact: { heading: "Contact", email: "", phone: "", address: "" },
  schedule: { heading: "Schedule", items: [] },
  menu: { heading: "Menu", categories: [] },
  hours: { heading: "Opening Hours", items: [] },
  location: { heading: "Location", address: "", mapUrl: "" },
  footer: {
    heading: "Footer",
    email: "",
    phone: "",
    address: "",
    hours: [],
    social: {},
  },

  // ─── New content section types ───
  // Esite
  properties: { heading: "Properties", items: [] },
  rooms: { heading: "Rooms", items: [] },
  booking_calendar: { heading: "Book an Appointment", description: "", slots: [] },
  programs: { heading: "Programs", items: [] },
  tours: { heading: "Tours", items: [] },
  team: { heading: "Our Team", members: [] },
  services_pricing: { heading: "Services & Pricing", items: [] },

  // Eshop
  featured_products: { heading: "Featured Products", items: [] },
  deals: { heading: "Deals", items: [] },
  flash_sale: { heading: "Flash Sale", ends_at: "", items: [] },
  reviews: { heading: "Customer Reviews", items: [] },

  // Estore
  supplier_catalog: { heading: "Supplier Catalog", items: [] },
  bulk_products: { heading: "Bulk Products", items: [] },
  agriculture_produce: { heading: "Agriculture Produce", items: [] },
  manufacturer_products: { heading: "Manufacturer Products", items: [] },

  // Community
  coaching: { heading: "Coaching", items: [] },
  courses: { heading: "Courses", items: [] },
  live_webinars: { heading: "Live Webinars", items: [] },
  workshops: { heading: "Workshops", items: [] },
  mentorship: { heading: "Mentorship", items: [] },
  resources: { heading: "Resources", items: [] },
  discussions: { heading: "Discussions", items: [] },

  // Influencer
  live_stream: { heading: "Live Stream", url: "", description: "" },
  live_selling: { heading: "Live Selling", items: [] },
  affiliate_products: { heading: "Affiliate Products", items: [] },
  media_feed: { heading: "Media Feed", items: [] },
  merch: { heading: "Merch", items: [] },
  tips_support: { heading: "Tips & Support", description: "", link: "" },
  collabs: { heading: "Collabs", items: [] },
};

export function getDefaultSchema(sectionType: string): Record<string, unknown> {
  return { ...(DEFAULT_SCHEMAS[sectionType] || {}) };
}
