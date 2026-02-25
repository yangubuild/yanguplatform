// YANGU Builder — Per-surface section palettes & default schemas
// Single source of truth for which section types each surface_type supports.

export interface SectionTypeEntry {
  type: string;
  label: string;
  icon: string;
}

// ─── Palettes per surface_type ───
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
    { type: "hero", label: "Hero", icon: "🖼" },
    { type: "menu", label: "Menu", icon: "🍽️" },
    { type: "categories", label: "Categories", icon: "📂" },
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
  offer: { heading: "What We Offer", items: [] },

  // Community
  plans: { heading: "Plans", items: [] },
  rules: { heading: "Community Rules", items: [] },
  join: { label: "Join Now", href: "", description: "" },

  // Commerce
  products: { heading: "Products", items: [] },
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
};

export function getDefaultSchema(sectionType: string): Record<string, unknown> {
  return { ...(DEFAULT_SCHEMAS[sectionType] || {}) };
}
