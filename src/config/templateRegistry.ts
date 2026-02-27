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
    description: "Justinmind-style homepage: hero + banners + categories + featured products + trust info",
    icon: "🏪",
    patches: {
      header: { schema: {
        logo_position: "left", show_name: true, name_next_to_logo: true,
        menu_layout_style: "grid",
        show_cart_icon: true, show_search: true,
        layout_variant: "nav_right",
      } },
      hero: { schema: {
        layout_variant: "split",
        cta_text: "Shop Now",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        alignment: "left",
        background_style: "gradient",
      } },
      main_content: { schema: {
        display_mode: "grid",
        filters_enabled: true,
        sort_enabled: true,
        cards: {
          style: "image_top",
          image_ratio: "square",
          show_price: true,
          show_title: true,
          show_cta: true,
        },
        grid: {
          columns_desktop: 3,
          columns_mobile: 2,
        },
        spacing: "comfortable",
      } },
      offer: { schema: {
        layout_variant: "banner_strip",
        display_mode: "banner_strip",
        spacing: "compact",
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
      } },
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

  // ─── Visual Template A: Furniture / Lifestyle Store ───
  {
    key: "eshop_visual_a",
    label: "Lifestyle Store",
    description: "Complete furniture-style storefront: split hero, story section, 4-col product grid, Instagram gallery, testimonials, newsletter footer",
    icon: "🛋️",
    patches: {
      header: { schema: {
        layout_variant: "nav_split",
        logo_position: "center",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: false,
        show_cart_icon: true,
        show_search: true,
        menu_layout_style: "horizontal",
        nav_items_left: ["Home", "Collection", "Cart", "Contact"],
        nav_items_right: ["Shops", "Account"],
      } },
      hero: { schema: {
        layout_variant: "split",
        alignment: "left",
        background_style: "solid_light",
        background_color: "hsl(180 30% 94%)",
        headline: "Embrace Peaceful Oasis",
        subheadline: "Furniture Home",
        description: "Transform your living space with curated furniture designed for comfort and style. Discover pieces that bring serenity to every room.",
        cta_text: "Shop Now",
        cta_style: "dark_rounded",
        media: { type: "image", source: "url", url: "", fit: "contain" },
        overlay_opacity: 0,
        spacing: "spacious",
        typography_style: "editorial_large",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Popular Collection",
        description: "Whether your style is contemporary, classic, or eclectic, let us expertly transform your dreams into stunning reality. Discover the art of creating lovely environments that truly resonate and inspire.",
        filters_enabled: false,
        sort_enabled: false,
        cards: {
          style: "image_top",
          image_ratio: "square",
          show_price: true,
          show_title: true,
          show_cta: false,
          card_style: "minimal",
          hover_effect: "lift",
        },
        grid: {
          columns_desktop: 4,
          columns_mobile: 2,
          gap: "md",
        },
        spacing: "comfortable",
        items: [
          { title: "Modern Sofa", price: "$1,299", description: "Premium comfort for your living room", media: [] },
          { title: "Wooden Dining Table", price: "$899", description: "Solid oak craftsmanship", media: [] },
          { title: "Accent Chair", price: "$549", description: "Statement piece for any corner", media: [] },
          { title: "Floor Lamp", price: "$249", description: "Warm ambient lighting", media: [] },
          { title: "Bookshelf", price: "$699", description: "Elegant storage solution", media: [] },
          { title: "Coffee Table", price: "$449", description: "Minimalist centerpiece", media: [] },
          { title: "Desk Organizer Set", price: "$159", description: "Tidy workspace essentials", media: [] },
          { title: "Throw Pillow Set", price: "$89", description: "Cozy accents in neutral tones", media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "story_block",
        display_mode: "story_block",
        heading: "What We Do",
        description: "Our Focus: Crafting Inspiring Living Spaces. We're dedicated to turning ordinary spaces into visual masterpieces. With a passion for design, we collaborate closely with you to bring your unique vision to life.",
        cta_text: "Learn More",
        background_style: "image_left",
        spacing: "spacious",
        items: [
          { title: "Redefining Living Spaces", description: "They expertly turned my space into a haven of style and comfort. Every design element seemed to reflect my vision, creating an atmosphere that resonated with my dreams.", media: [] },
        ],
        social_gallery: {
          enabled: true,
          platform: "instagram",
          hashtag: "#furniturehome",
          columns: 5,
        },
        newsletter: {
          enabled: true,
          heading: "Subscribe to our newsletter",
          description: "Join our community to get weekly updates and unique gifts every Friday",
          cta_text: "Subscribe",
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Home", links: ["Features", "Pricing", "FAQs", "About"] },
          { title: "Company", links: ["Get started", "Learn", "Case studies", "FAQs"] },
          { title: "Resources", links: ["Discord", "Events", "Blog", "Community"] },
        ],
        copyright: "Your Company, Inc. All rights reserved.",
        newsletter_enabled: true,
      } },
    },
  },

  // ─── Visual Template B: Skincare / Beauty Store ───
  {
    key: "eshop_visual_b",
    label: "Beauty & Essentials",
    description: "Complete skincare-style storefront: bold dark hero, brand story, trust badges, product showcase, testimonials, newsletter footer",
    icon: "✨",
    patches: {
      header: { schema: {
        layout_variant: "nav_right",
        logo_position: "left",
        logo_size: "medium",
        show_name: false,
        show_cart_icon: true,
        show_search: true,
        menu_layout_style: "horizontal",
        nav_items: ["Home", "Products", "Contact"],
        background_style: "dark",
      } },
      hero: { schema: {
        layout_variant: "fullwidth_center",
        alignment: "center",
        background_style: "solid_dark",
        background_color: "hsl(0 0% 5%)",
        headline: "SKINCARE",
        subheadline: "FROM SKINCARE TO MAKEUP AND EVERYTHING IN BETWEEN, OUR ESSENTIALS ARE DESIGNED TO NOURISH, PROTECT, AND ELEVATE YOUR BEAUTY JOURNEY.",
        cta_text: "",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.4,
        spacing: "spacious",
        typography_style: "bold_uppercase",
        text_color: "light",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Latest Products",
        description: "Skin care solutions curated for your daily routine.",
        filters_enabled: false,
        sort_enabled: false,
        cards: {
          style: "image_top",
          image_ratio: "portrait",
          show_price: true,
          show_title: true,
          show_cta: true,
          card_style: "clean",
          hover_effect: "fade",
          badge_enabled: true,
        },
        grid: {
          columns_desktop: 4,
          columns_mobile: 2,
          gap: "lg",
        },
        spacing: "spacious",
        items: [
          { title: "Makeup Brushes", price: "$38.50", description: "Professional quality set", badge: "Free Shipping", media: [] },
          { title: "Fresh Fragrance", price: "$72.00", description: "Light and refreshing scent", badge: "25% OFF", media: [] },
          { title: "Highlighter Palette", price: "$45.00", description: "Luminous glow collection", badge: "Free Shipping", media: [] },
          { title: "Hydrating Serum", price: "$58.00", description: "Deep moisture complex", badge: "New", media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "trust_badges",
        display_mode: "trust_badges",
        spacing: "comfortable",
        heading: "From Us To You",
        items: [
          { title: "Free Shipping & Returns", description: "On all orders over $50", icon: "truck" },
          { title: "Outstanding Premium Support", description: "24/7 customer service", icon: "headphones" },
          { title: "Flexible Payment", description: "Multiple payment options", icon: "credit-card" },
          { title: "Order Tracking", description: "Real-time delivery updates", icon: "map-pin" },
        ],
        story_block: {
          enabled: true,
          eyebrow: "OUR STORY",
          heading: "Founded with a passion for enhancing natural beauty and promoting self-confidence",
          description: "Our journey started with a commitment to quality, innovation, and ethical practices, aiming to empower individuals to embrace their unique beauty.",
          cta_text: "Learn More",
        },
        testimonials: {
          enabled: true,
          heading: "Clients Review",
          subheading: "Testimonials",
          items: [
            { name: "Alley Holzer", location: "New York", quote: "After one month, my skin is so much smoother and complexion has become clear and bright.", label: "Genius Products" },
            { name: "Martha Smith", location: "California", quote: "I've been feeling really confident without makeup lately. My hair has grown back, skin is clearing, and I can't stop getting compliments!", label: "Incredible Experience" },
          ],
        },
        social_gallery: {
          enabled: true,
          platform: "instagram",
          heading: "Latest Products",
          subheading: "Recently Released",
          columns: 4,
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Home", links: ["Features", "Pricing", "FAQs", "About"] },
          { title: "Company", links: ["Get started", "Learn", "Case studies", "FAQs"] },
          { title: "Resources", links: ["Discord", "Events", "Blog", "Community"] },
        ],
        copyright: "Your Company, Inc. All rights reserved.",
        newsletter_enabled: true,
        newsletter_heading: "Subscribe to our newsletter",
        newsletter_description: "Join our community to get weekly updates and unique gifts every Friday",
      } },
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
  "spacing", "padding", "gap", "card_style", "cards", "grid",
  "typography_style", "alignment", "background_style", "background_color",
  "filters_enabled", "sort_enabled", "show_author", "show_date",
  "show_captions", "show_tags", "date_picker", "guests_picker",
  "pricing_mode", "cta_style", "show_price", "show_location",
  "show_cart_icon", "show_search",
  // Visual template keys
  "overlay_opacity", "text_color", "hover_effect", "badge_enabled",
  "nav_items", "nav_items_left", "nav_items_right",
  "social_gallery", "newsletter", "newsletter_enabled",
  "newsletter_heading", "newsletter_description",
  "story_block", "testimonials", "columns",
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
