// YANGU Builder — Template Registry
// Provides visual template presets per engine.
// Each template defines schema patches for core slots (header, hero, main_content, offer, footer).
// No DB changes required — applied client-side via patch merge.

import {
  PLATERIA_MENU_ITEMS, PLATERIA_TESTIMONIALS,
  YUMIX_MENU_ITEMS, YUMIX_CATEGORY_ITEMS, YUMIX_PROMO_BANNERS, YUMIX_STATS, YUMIX_TESTIMONIALS,
  ZOOOM_MENU_ITEMS, ZOOOM_CATEGORY_ITEMS, ZOOOM_TESTIMONIALS,
} from "@/config/emenuDemoContent";
//
// TEMPLATE REFERENCE RULE:
// Every template must record its provenance via the `reference` field.
// When generating from a saved template, the output must stay structurally
// close to the saved source — only branding, colors, content, and images
// are swapped per the user's business.

export interface TemplateSlotPatch {
  /** Partial schema merged into the section's existing schema */
  schema: Record<string, unknown>;
}

/** Source provenance for a template — tracks where the design came from */
export interface TemplateReference {
  /** "link" = extracted from a live URL, "image" = from screenshot/upload, "mixed" = both */
  source: "link" | "image" | "mixed" | "original";
  /** The live URL used for structure extraction (if any) */
  url?: string;
  /** Short label for the reference design (e.g. "Gusto Framer template") */
  label?: string;
  /** Section ordering extracted from the reference */
  sectionOrder: string[];
  /** Key layout patterns preserved from the reference */
  layoutPatterns: string[];
}

export interface TemplatePreset {
  key: string;
  label: string;
  description: string;
  /** Emoji or icon hint for UI card */
  icon: string;
  /** Whether this template is available for selection. Defaults to true if omitted. */
  is_active?: boolean;
  /** Locked template family identifier — generation must not drift away from this */
  template_family?: string;
  /** Live preview URL for iframe/screenshot-based preview (reference sites) */
  preview_url?: string;
  /** Source provenance — where this template was derived from */
  reference?: TemplateReference;
  /** Schema patches keyed by core_slot name */
  patches: Partial<Record<"header" | "hero" | "main_content" | "offer" | "footer" | "showcase", TemplateSlotPatch>>;
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

  // ─── Aema — Minimal editorial fashion store ───
  // Reference: https://aema-template.framer.website
  {
    key: "eshop_aema",
    label: "Aema — Editorial Fashion",
    description: "Minimal editorial clothing store: tagline marquee, sticky nav, split hero with thumb strip, category tabs, 4-col product grid with size chips & badges, 2-up collections, IG gallery, footer.",
    icon: "👕",
    template_family: "aema",
    preview_url: "https://aema-template.framer.website",
    reference: {
      source: "link",
      url: "https://aema-template.framer.website",
      label: "Aema Framer template",
      sectionOrder: ["tagline", "header", "hero", "tabs", "products", "collections", "social_gallery", "footer"],
      layoutPatterns: [
        "marquee_tagline_top",
        "sticky_nav_3col",
        "split_hero_with_thumb_strip",
        "category_tabs_underline",
        "product_grid_4col_with_sizes_and_badges",
        "two_up_collection_blocks",
        "instagram_4_up_gallery",
        "minimal_dark_footer",
      ],
    },
    patches: {
      header: {
        schema: {
          layout_variant: "nav_center",
          logo_position: "left",
          logo_size: "small",
          show_name: true,
          show_cart_icon: true,
          show_search: true,
          menu_layout_style: "horizontal",
          nav_items: ["Shop", "Sale", "New Arrivals", "Collections", "Blog"],
          background_style: "light",
          top_tagline: "FREE DELIVERY OVER 50€",
        },
      },
      hero: {
        schema: {
          layout_variant: "split_with_thumbs",
          alignment: "left",
          background_style: "solid_light",
          headline: "Basic Collection",
          subheadline: "Timeless everyday essentials designed for comfort, simplicity, and effortless wear.",
          cta_text: "SHOP NOW",
          media: { type: "image", source: "url", url: "", fit: "cover" },
          spacing: "spacious",
          typography_style: "editorial",
          text_color: "dark",
        },
      },
      main_content: {
        schema: {
          display_mode: "grid",
          heading: "Our Favorites",
          tabs: ["Our Favorites", "Best Sellers", "Sale"],
          filters_enabled: false,
          sort_enabled: false,
          cards: {
            style: "image_top",
            image_ratio: "portrait",
            show_price: true,
            show_title: true,
            show_cta: false,
            badge_enabled: true,
            size_chips_enabled: true,
            hover_effect: "image_swap",
          },
          grid: {
            columns_desktop: 4,
            columns_mobile: 2,
            gap: "md",
          },
          spacing: "comfortable",
          items: [
            { title: "T-Shirt Black", price: "19.90 EUR", badges: ["NEW"], sizes: ["S", "M", "L", "XL"], media: [] },
            { title: "Jeans Blue", price: "49.90 EUR", badges: [], sizes: ["30", "32", "34", "36"], media: [] },
            { title: "Sweater Gray", price: "39.90 EUR", badges: [], sizes: ["S", "M", "L", "XL"], media: [] },
            { title: "Hoodie Gray", price: "39.90 EUR", original_price: "49.90 EUR", badges: ["20% OFF"], sizes: ["S", "M", "L", "XL"], media: [] },
            { title: "Polo Beige", price: "24.90 EUR", badges: ["NEW"], sizes: ["S", "M", "L", "XL"], media: [] },
            { title: "Trousers Brown", price: "59.90 EUR", badges: [], sizes: ["30", "32", "34", "36"], media: [] },
            { title: "T-Shirt White", price: "14.90 EUR", original_price: "19.90 EUR", badges: ["25% OFF"], sizes: ["S", "M", "L", "XL"], media: [] },
            { title: "Jeans Light", price: "49.90 EUR", badges: ["NEW"], sizes: ["30", "32", "34", "36"], media: [] },
          ],
        },
      },
      offer: {
        schema: {
          layout_variant: "collections_and_social",
          display_mode: "collection_blocks",
          spacing: "spacious",
          collections: [
            { title: "Shirts", cta: "Shop Now" },
            { title: "Pants", cta: "Shop Now" },
          ],
          social_gallery: {
            enabled: true,
            platform: "instagram",
            handle: "@aema",
            heading: "Follow Us on Instagram",
            columns: 4,
            items: [{ handle: "@aema" }, { handle: "@aema" }, { handle: "@aema" }, { handle: "@aema" }],
          },
        },
      },
      footer: {
        schema: {
          layout_variant: "minimal_dark",
          display_mode: "minimal_dark",
          tagline: "Timeless everyday essentials designed for comfort, simplicity, and effortless wear.",
          columns: [
            { title: "Shop", links: ["All", "New", "Sale"] },
            { title: "Help", links: ["Contact", "Shipping", "Returns"] },
            { title: "About", links: ["Story", "Journal", "Careers"] },
          ],
          copyright: `© ${new Date().getFullYear()} Your Brand — All rights reserved.`,
          newsletter_enabled: false,
        },
      },
    },
  },

  // ─── Uncover — Electronics / Tech (pending full rebuild) ───
  {
    key: "eshop_uncover",
    label: "Uncover — Electronics",
    description: "Tech/electronics storefront: discount banner, popular products grid, testimonials carousel, stats counters, about section.",
    icon: "🎧",
    template_family: "uncover",
    preview_url: "https://uncovertemplatesite.framer.website",
    reference: { source: "link", url: "https://uncovertemplatesite.framer.website", label: "Uncover Framer template", sectionOrder: ["banner", "header", "hero", "products", "testimonials", "stats", "about", "footer"], layoutPatterns: ["discount_banner_top", "popular_products_grid", "testimonials_carousel", "stats_counters"] },
    patches: {},
  },

  // ─── Kanva — Beauty / Single product (pending full rebuild) ───
  {
    key: "eshop_kanva",
    label: "Kanva — Beauty",
    description: "Single-product beauty brand: hero with one SKU, feature highlights, soft luxury palette, Framer Commerce ready.",
    icon: "🧴",
    template_family: "kanva",
    preview_url: "https://www.framer.com/marketplace/templates/kanva/",
    reference: { source: "link", url: "https://www.framer.com/marketplace/templates/kanva/", label: "Kanva Framer template", sectionOrder: ["header", "hero", "features", "about", "footer"], layoutPatterns: ["single_product_hero", "feature_highlights_row"] },
    patches: {},
  },

  // ─── Minna — Clothing (pending full rebuild) ───
  {
    key: "eshop_minna",
    label: "Minna — Fashion",
    description: "Fashion-focused clothing layout: editorial split hero, collection displays, hover product cards.",
    icon: "👗",
    template_family: "minna",
    preview_url: "https://minna.framer.website",
    reference: { source: "link", url: "https://minna.framer.website", label: "Minna Framer template", sectionOrder: ["header", "hero", "products", "collections", "footer"], layoutPatterns: ["editorial_split_hero", "minimal_product_cards"] },
    patches: {},
  },

  // ─── Mockhub — Mixed merch (pending full rebuild) ───
  {
    key: "eshop_mockhub",
    label: "Mockhub — Merch",
    description: "Mixed-product merchandise store: devices + clothing + accessories with versatile product cards.",
    icon: "🛍️",
    template_family: "mockhub",
    preview_url: "https://mockhub.framer.website",
    reference: { source: "link", url: "https://mockhub.framer.website", label: "Mockhub Framer template", sectionOrder: ["header", "hero", "categories", "products", "footer"], layoutPatterns: ["collage_hero", "versatile_product_grid"] },
    patches: {},
  },

  // ─── Lumel — Bottled products (pending full rebuild) ───
  {
    key: "eshop_lumel",
    label: "Lumel — Bottled",
    description: "Bottled products showcase for beauty, juice, spices, beverages: ingredient highlights, premium organic feel.",
    icon: "🧃",
    template_family: "lumel",
    preview_url: "https://lumel-framlix.framer.website",
    reference: { source: "link", url: "https://lumel-framlix.framer.website", label: "Lumel Framer template", sectionOrder: ["header", "hero", "products", "ingredients", "footer"], layoutPatterns: ["bottle_hero_showcase", "ingredient_highlights"] },
    patches: {},
  },
];
// ─── Emenu Templates ───

const EMENU_TEMPLATES: TemplatePreset[] = [
  // ═══ TOP 3 REFERENCE TEMPLATES (ACTIVE) ═══

  // ─── Plateria: Elegant dark food menu ───
  {
    key: "emenu_plateria",
    label: "Plateria",
    description: "Elegant dark-theme restaurant: split hero with food photography, menu grid cards, warm accents on dark background",
    icon: "🍽️",
    is_active: true,
    template_family: "plateria",
    preview_url: "https://plateria.framer.website",
    reference: {
      source: "link",
      url: "https://plateria.framer.website",
      label: "Plateria Framer template",
      sectionOrder: ["header", "hero", "menu_grid", "about_story", "testimonials", "footer"],
      layoutPatterns: ["dark_bg", "split_hero", "card_grid_menu", "elegant_typography"],
    },
    patches: {
      header: { schema: {
        layout_variant: "nav_right",
        logo_position: "left",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: true,
        show_cart_icon: false,
        show_search: false,
        menu_layout_style: "horizontal",
        nav_items: ["Home", "Menu", "About", "Contact"],
        background_style: "dark",
      } },
      hero: { schema: {
        layout_variant: "split",
        alignment: "left",
        background_style: "solid_dark",
        background_color: "hsl(0 0% 5%)",
        headline: "Finest Culinary Experience",
        subheadline: "Fresh Ingredients, Bold Flavors",
        cta_text: "View Menu",
        cta_style: "warm_rounded",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "spacious",
        typography_style: "editorial_large",
        text_color: "light",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Our Menu",
        description: "Carefully crafted dishes for every palate",
        show_images: true,
        show_badges: true,
        show_dietary: true,
        layout_style: "grid",
        columns_desktop: 3,
        columns_mobile: 2,
        filters_enabled: true,
        sort_enabled: false,
        cards: { style: "image_top", image_ratio: "square", show_price: true, show_title: true, show_cta: false, card_style: "clean", hover_effect: "lift" },
        grid: { columns_desktop: 3, columns_mobile: 2, gap: "md" },
        spacing: "comfortable",
        items: PLATERIA_MENU_ITEMS,
      } },
      offer: { schema: {
        layout_variant: "story_block",
        display_mode: "story_block",
        heading: "Our Story",
        description: "A passion for great food, served with love since day one. From humble beginnings to a celebrated kitchen, we craft every plate with care, sourcing the finest ingredients from local farms and trusted purveyors.",
        cta_text: "Learn More",
        spacing: "spacious",
        background_style: "dark",
        story_block: {
          enabled: true,
          eyebrow: "EST. 2018",
          heading: "Our Story",
          description: "A passion for great food, served with love since day one. From humble beginnings to a celebrated kitchen, we craft every plate with care.",
          cta_text: "Learn More",
        },
        testimonials: {
          enabled: true,
          heading: "What Our Guests Say",
          subheading: "Hear from our community",
          items: PLATERIA_TESTIMONIALS,
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        background_style: "dark",
        columns: [
          { title: "Navigation", links: ["Home", "Menu", "About", "Contact"] },
          { title: "Hours", links: ["Mon-Fri 11am-10pm", "Sat-Sun 10am-11pm"] },
        ],
        copyright: "All rights reserved.",
      } },
    },
  },

  // ─── Yumix: Bold dark food brand ───
  {
    key: "emenu_yumix",
    label: "Yumix",
    description: "Bold dark food brand: cinematic hero with discount badge, category cards, featured grid, promo banners, testimonials",
    icon: "🔥",
    is_active: true,
    template_family: "yumix",
    preview_url: "https://yumix.framer.website/?via=design93",
    reference: {
      source: "link",
      url: "https://yumix.framer.website/?via=design93",
      label: "Yumix Framer template",
      sectionOrder: ["header", "hero", "category_cards", "featured_grid", "promo_banner", "stats", "testimonials", "newsletter", "footer"],
      layoutPatterns: ["dark_cinematic_hero", "4col_category_cards", "promo_dual_banners", "stats_row", "testimonials_carousel"],
    },
    patches: {
      header: { schema: {
        layout_variant: "nav_right",
        logo_position: "left",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: true,
        show_cart_icon: true,
        show_search: true,
        menu_layout_style: "horizontal",
        nav_items: ["Home", "Menu", "Deals", "About", "Contact"],
        background_style: "dark",
      } },
      hero: { schema: {
        layout_variant: "fullwidth",
        alignment: "left",
        background_style: "image",
        background_color: "hsl(30 10% 8%)",
        headline: "Delicious Food For Every Mood",
        subheadline: "Fresh • Fast • Flavorful",
        cta_text: "Order Now",
        cta_style: "warm_rounded",
        media: { type: "image", source: "url", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80", fit: "cover" },
        overlay_opacity: 0.6,
        spacing: "spacious",
        typography_style: "bold_uppercase",
        text_color: "light",
        badge: { text: "30% OFF", style: "accent" },
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Featured Dishes",
        description: "Our most-loved menu items",
        show_images: true,
        show_badges: true,
        show_dietary: true,
        layout_style: "grid",
        columns_desktop: 3,
        columns_mobile: 2,
        filters_enabled: true,
        sort_enabled: true,
        cards: { style: "image_top", image_ratio: "landscape", show_price: true, show_title: true, show_cta: true, card_style: "rounded", hover_effect: "lift", badge_enabled: true },
        grid: { columns_desktop: 3, columns_mobile: 2, gap: "lg" },
        spacing: "comfortable",
        items: YUMIX_MENU_ITEMS,
        category_showcase: {
          enabled: true,
          heading: "Browse Categories",
          description: "Find what you're craving",
          columns: 4,
          items: YUMIX_CATEGORY_ITEMS,
        },
      } },
      offer: { schema: {
        layout_variant: "trust_badges",
        display_mode: "trust_badges",
        spacing: "comfortable",
        heading: "Why Choose Us",
        items: [
          { title: "Fast Delivery", description: "30 minutes or less", icon: "truck" },
          { title: "Fresh Ingredients", description: "Locally sourced daily", icon: "leaf" },
          { title: "Best Prices", description: "Unbeatable value", icon: "tag" },
        ],
        promo_banners: YUMIX_PROMO_BANNERS,
        stats: YUMIX_STATS,
        testimonials: {
          enabled: true,
          heading: "What People Say",
          subheading: "Trusted by thousands",
          items: YUMIX_TESTIMONIALS,
        },
        newsletter: {
          enabled: true,
          heading: "Get Exclusive Deals",
          cta_text: "Subscribe",
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        background_style: "dark",
        background_color: "hsl(30 10% 6%)",
        columns: [
          { title: "Menu", links: ["Home", "Menu", "Deals", "About"] },
          { title: "Contact", links: ["Email", "Phone", "Location"] },
        ],
        newsletter: { enabled: true, heading: "Subscribe for deals" },
        copyright: "All rights reserved.",
      } },
    },
  },

  // ─── Zooom: Clean bright modern food site ───
  {
    key: "emenu_zooom",
    label: "Zooom",
    description: "Clean modern food site: bright hero with large photography, scrollable categories, minimalist typography, delivery & pickup",
    icon: "⚡",
    is_active: true,
    template_family: "zooom",
    preview_url: "https://zooom.framer.website",
    reference: {
      source: "link",
      url: "https://zooom.framer.website",
      label: "Zooom Framer template",
      sectionOrder: ["header", "hero", "categories", "menu_grid", "delivery_info", "about", "footer"],
      layoutPatterns: ["bright_hero", "horizontal_categories", "clean_grid", "delivery_pickup_toggle", "minimalist_typography"],
    },
    patches: {
      header: { schema: {
        layout_variant: "nav_right",
        logo_position: "left",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: true,
        show_cart_icon: true,
        show_search: true,
        menu_layout_style: "horizontal",
        nav_items: ["Home", "Menu", "Delivery", "Pickup", "Contact"],
        background_style: "light",
      } },
      hero: { schema: {
        layout_variant: "split",
        alignment: "left",
        background_style: "solid_light",
        background_color: "hsl(0 0% 100%)",
        headline: "Your Favorite Food, Delivered Fast",
        subheadline: "Fresh Meals • Quick Delivery",
        cta_text: "Order Now",
        cta_style: "accent_rounded",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "spacious",
        typography_style: "editorial_large",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Browse Our Menu",
        description: "Find exactly what you're craving",
        show_images: true,
        show_badges: true,
        show_dietary: true,
        layout_style: "grid",
        columns_desktop: 4,
        columns_mobile: 2,
        filters_enabled: true,
        sort_enabled: true,
        cards: { style: "image_top", image_ratio: "square", show_price: true, show_title: true, show_cta: true, card_style: "clean", hover_effect: "lift" },
        grid: { columns_desktop: 4, columns_mobile: 2, gap: "md" },
        spacing: "comfortable",
        items: ZOOOM_MENU_ITEMS,
        category_showcase: {
          enabled: true,
          heading: "Categories",
          description: "Quick browse by type",
          columns: 4,
          items: ZOOOM_CATEGORY_ITEMS,
        },
      } },
      offer: { schema: {
        layout_variant: "story_block",
        display_mode: "story_block",
        heading: "About Us",
        description: "We believe great food brings people together. Fresh, healthy, and always made with care — that's the Zooom promise.",
        cta_text: "Learn More",
        spacing: "comfortable",
        story_block: {
          enabled: true,
          eyebrow: "OUR MISSION",
          heading: "Fresh Food, Fast Delivery",
          description: "We partner with local farms and producers to bring you the freshest ingredients, prepared with love and delivered to your door.",
          cta_text: "Learn More",
        },
        testimonials: {
          enabled: true,
          heading: "What Our Customers Say",
          subheading: "Real reviews from real people",
          items: ZOOOM_TESTIMONIALS,
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Menu", links: ["Home", "Menu", "Delivery", "Pickup"] },
          { title: "Info", links: ["About", "Contact", "FAQ"] },
        ],
        copyright: "All rights reserved.",
      } },
    },
  },

  // ─── Sofra: Elegant Serif Restaurant ───
  {
    key: "emenu_sofra",
    label: "Sofra",
    description: "Elegant serif restaurant: dark green palette, copper accents, hero with leaf accents, about with stats, 3-col categories, menu with tabs, event booking, testimonials, reservation form, gallery, large-letter footer",
    icon: "🍽️",
    is_active: true,
    template_family: "sofra",
    reference: {
      source: "link",
      url: "https://sofra.framer.website/",
      label: "Sofra Framer restaurant template",
      sectionOrder: ["header", "hero_center", "about_stats", "feature_categories", "why_choose", "menu_tabs", "event_booking", "testimonials", "reservation_form", "gallery", "footer_large_letter"],
      layoutPatterns: ["serif_elegant_typography", "dark_green_bg", "copper_accent", "stats_grid", "menu_tabs_list", "large_letter_footer"],
    },
    patches: {
      header: { schema: {
        layout_variant: "nav_split",
        logo_position: "left",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: true,
        show_cart_icon: false,
        show_search: false,
        menu_layout_style: "horizontal",
        nav_items: ["Home", "About Us", "Why Choose", "Book a Table"],
        background_style: "dark",
        background_color: "hsl(150 22% 13%)",
      } },
      hero: { schema: {
        layout_variant: "fullwidth_center",
        alignment: "center",
        background_style: "solid_dark",
        background_color: "hsl(150 22% 13%)",
        headline: "Savor Every Moment with Every Bite",
        subheadline: "",
        description: "Delight in flavors crafted to bring joy, comfort, and unforgettable dining experiences every time.",
        cta_text: "BOOK YOUR TABLE",
        cta_style: "accent_solid",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "spacious",
        typography_style: "serif_elegant",
        text_color: "light",
      } },
      main_content: { schema: {
        display_mode: "list",
        heading: "Best Catering Menus",
        description: "Explore our menu options",
        show_images: false,
        show_badges: false,
        show_dietary: false,
        layout_style: "list",
        columns_desktop: 1,
        columns_mobile: 1,
        filters_enabled: false,
        sort_enabled: false,
        cards: { style: "horizontal_row", image_ratio: "square", show_price: true, show_title: true, show_cta: false, card_style: "minimal_dark", hover_effect: "none" },
        grid: { columns_desktop: 1, columns_mobile: 1, gap: "md" },
        spacing: "comfortable",
        categories: [
          { name: "Main", items: [
            { name: "Herb-Infused Grilled Prawns", price: "$75.00", description: "Tender prawns, flame-grilled and brushed with garlic butter, served with sautéed greens." },
            { name: "Seared Tuna Bites", price: "$55.00", description: "Layers of chia pudding, fresh mango, toasted coconut flakes, and a drizzle of honey." },
            { name: "Truffle Mushroom Risotto Balls", price: "$48.00", description: "Creamy risotto balls infused with truffle oil and parmesan." },
            { name: "Citrus-Glazed Salmon Fillet", price: "$35.00", description: "Al dente pasta tossed with basil pesto, cherry tomatoes, and parmesan shavings." },
            { name: "Tropical Coconut Chia Parfait", price: "$40.00", description: "Golden roasted chicken with crispy skin, served over prosciutto salad." },
          ]},
        ],
      } },
      offer: { schema: {
        layout_variant: "story_block",
        display_mode: "story_block",
        heading: "About",
        description: "Every Celebration Remarkable",
        cta_text: "BOOK YOUR TABLE",
        spacing: "spacious",
        story_block: {
          enabled: true,
          eyebrow: "ABOUT",
          heading: "Every Celebration Remarkable",
          description: "At Sofra Restaurant, dining is more than just a meal—it's an experience of flavor, tradition, and hospitality. Inspired by the rich heritage of culinary artistry, Sofra brings together authentic recipes, fresh ingredients, and modern presentation to create dishes that delight every sense.",
          cta_text: "BOOK YOUR TABLE",
        },
        testimonials: {
          enabled: true,
          heading: "What Our Guests Are Saying",
          items: [
            { quote: "Sofra Restaurant never disappoints. From the attentive service to the fresh ingredients, every dish tells a story. The grilled salmon is a must-try!", author: "Ronald Richards", rating: 5 },
          ],
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        background_style: "dark",
        background_color: "hsl(150 22% 13%)",
        columns: [
          { title: "Menu", links: ["Home", "About", "Menu", "Gallery"] },
          { title: "Contact", links: ["+888 999 5555 4444", "hello@sofra.com", "555 12th Ave, New York"] },
        ],
        copyright: "All rights reserved.",
      } },
    },
  },

  // ─── Qitchen: Cinematic Dark Sushi Restaurant ───
  {
    key: "emenu_qitchen",
    label: "Qitchen",
    description: "Cinematic dark sushi restaurant: ultra-dark palette, gold/cream serif text, hero with large display text, 3 feature cards, menu with dotted separators, about with review badges, our story block",
    icon: "🍣",
    is_active: true,
    template_family: "qitchen",
    reference: {
      source: "link",
      url: "https://qitchen.framer.website/",
      label: "Qitchen Framer sushi template",
      sectionOrder: ["header_floating", "hero_cinematic_cards", "menu_categories_dotted", "about_badges_story", "footer_minimal"],
      layoutPatterns: ["cinematic_dark_hero", "floating_pill_nav", "dotted_menu_separators", "diamond_category_headers", "review_badge_grid"],
    },
    patches: {
      header: { schema: {
        layout_variant: "nav_floating",
        logo_position: "left",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: false,
        show_cart_icon: false,
        show_search: false,
        menu_layout_style: "horizontal",
        nav_items: ["Menu", "About", "Book a Table"],
        background_style: "dark",
        background_color: "hsl(0 0% 4%)",
      } },
      hero: { schema: {
        layout_variant: "fullwidth_center",
        alignment: "left",
        background_style: "image_dark",
        background_color: "hsl(0 0% 4%)",
        headline: "Sushi Sensation",
        subheadline: "",
        description: "",
        cta_text: "",
        cta_style: "none",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.5,
        spacing: "spacious",
        typography_style: "serif_display_large",
        text_color: "light",
      } },
      main_content: { schema: {
        display_mode: "list",
        heading: "Menu",
        description: "",
        show_images: true,
        show_badges: false,
        show_dietary: true,
        layout_style: "list",
        columns_desktop: 1,
        columns_mobile: 1,
        filters_enabled: false,
        sort_enabled: false,
        cards: { style: "horizontal_row", image_ratio: "square", show_price: true, show_title: true, show_cta: false, card_style: "minimal_dark", hover_effect: "none" },
        grid: { columns_desktop: 1, columns_mobile: 1, gap: "md" },
        spacing: "comfortable",
        categories: [
          { name: "Maki", items: [
            { name: "Salmon Maki", price: "$5", description: "Shiitake mushrooms, avocado, and pickled daikon radish nestle within a roll of seasoned rice, coated with nutty sesame seeds." },
            { name: "Tuna Maki", price: "$5", description: "A vibrant assortment of julienned carrots, bell peppers, and cucumber, tightly encased in a nori-wrapped rice roll." },
          ]},
          { name: "Uramaki", items: [
            { name: "Volcano Delight", price: "$12", description: "Creamy crab salad, avocado, and cucumber rolled inside, topped with spicy tuna and fiery sriracha sauce." },
            { name: "Rainbow Fusion", price: "$12", description: "A colorful blend of fresh tuna, salmon, yellowtail, and avocado, enveloping a core of cucumber and crab stick." },
            { name: "Dragon Elegance", price: "$12", description: "Tempura shrimp and cucumber rolled inside, crowned with sliced avocado resembling dragon scales." },
          ]},
        ],
      } },
      offer: { schema: {
        layout_variant: "story_block",
        display_mode: "story_block",
        heading: "About",
        description: "Sushi Artistry Redefined",
        cta_text: "",
        spacing: "spacious",
        story_block: {
          enabled: true,
          eyebrow: "OUR STORY",
          heading: "Sushi Artistry Redefined",
          description: "Founded with a passion for culinary excellence, Qitchen's journey began in the heart of Prague. Over years, it evolved into a haven for sushi enthusiasts, celebrated for its artful mastery and devotion to redefining the dining experience.",
        },
        testimonials: { enabled: false, heading: "", items: [] },
      } },
      footer: { schema: {
        layout_variant: "minimal",
        display_mode: "minimal",
        background_style: "dark",
        background_color: "hsl(0 0% 4%)",
        columns: [],
        copyright: "All rights reserved.",
      } },
    },
  },

  // ─── Reservation Template: Gusto (Fine Dining / Hotel) ───
  {
    key: "emenu_gusto_reservation",
    label: "Gusto Reservation",
    description: "Elegant fine dining: dark cinematic hero, reservation form, menu display-only, restaurant gallery, testimonials, opening hours",
    icon: "🍷",
    is_active: true,
    template_family: "gusto_reservation",
    reference: {
      source: "link",
      url: "https://gusto-template.framer.website/",
      label: "Gusto Framer fine dining template",
      sectionOrder: ["header_dark", "hero_fullwidth_cinematic", "menu_display_only", "reservation_form", "gallery", "testimonials", "story_block", "hours", "footer_dark"],
      layoutPatterns: ["cinematic_dark_hero", "serif_elegant_typography", "reservation_form_grid", "horizontal_menu_rows", "gallery_grid", "star_rating_testimonials"],
    },
    patches: {
      header: { schema: {
        layout_variant: "nav_split",
        logo_position: "left",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: true,
        show_cart_icon: false,
        show_search: false,
        menu_layout_style: "horizontal",
        nav_items: ["Menu", "Reservation", "About", "Restaurant"],
        background_style: "dark",
        background_color: "hsl(30 10% 8%)",
      } },
      hero: { schema: {
        layout_variant: "fullwidth_center",
        alignment: "center",
        background_style: "solid_dark",
        background_color: "hsl(30 10% 8%)",
        headline: "An Authentic Culinary Experience",
        subheadline: "Since 1997",
        description: "Savor the authentic taste of Italy with dishes crafted from the finest ingredients, in an atmosphere that transports you to the heart of the Mediterranean.",
        cta_text: "Book a Table",
        cta_style: "outline_light",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.4,
        spacing: "spacious",
        typography_style: "serif_elegant",
        text_color: "light",
      } },
      main_content: { schema: {
        display_mode: "reservation_menu",
        heading: "Menu",
        description: "Explore our menu of authentic dishes crafted with the finest ingredients.",
        show_images: true,
        show_badges: false,
        show_dietary: true,
        layout_style: "list",
        columns_desktop: 1,
        columns_mobile: 1,
        filters_enabled: false,
        sort_enabled: false,
        cards: {
          style: "horizontal_row",
          image_ratio: "square",
          show_price: true,
          show_title: true,
          show_cta: false,
          card_style: "minimal_dark",
          hover_effect: "none",
        },
        grid: { columns_desktop: 1, columns_mobile: 1, gap: "md" },
        spacing: "comfortable",
        reservation_mode: true,
        categories: [
          { name: "Pasta", items: [
            { name: "Pappardelle al Ragù", price: "$15", description: "Wide pappardelle tossed in a slow-cooked meat ragù, topped with Parmesan and fresh basil leaves." },
            { name: "Spaghetti Pomodoro", price: "$12", description: "Classic Italian pasta with al dente spaghetti, fresh tomato sauce, basil, garlic, and grated Parmesan cheese.", dietary_tags: ["vegetarian"] },
            { name: "Seafood Lasagna", price: "$18", description: "Layers of fresh pasta with shrimp, crab, and béchamel sauce." },
          ]},
          { name: "Main Courses", items: [
            { name: "Osso Buco", price: "$28", description: "Braised veal shanks with gremolata and saffron risotto." },
            { name: "Branzino al Forno", price: "$24", description: "Oven-roasted sea bass with herbs, lemon, and capers." },
          ]},
          { name: "Desserts", items: [
            { name: "Tiramisu", price: "$10", description: "Traditional Italian coffee-flavored dessert with mascarpone." },
            { name: "Panna Cotta", price: "$9", description: "Silky vanilla cream with seasonal berry compote." },
          ]},
        ],
      } },
      offer: { schema: {
        layout_variant: "reservation_block",
        display_mode: "reservation_block",
        spacing: "spacious",
        heading: "Book a Table",
        description: "Book your table and savor the authentic taste of Italy. We look forward to welcoming you to an unforgettable dining experience!",
        reservation_form: {
          fields: [
            { key: "name", label: "Name", type: "text", placeholder: "Jane Smith", required: true },
            { key: "email", label: "Email", type: "email", placeholder: "jane@email.com", required: true },
            { key: "phone", label: "Phone Number", type: "tel", placeholder: "+420 123 456 789" },
            { key: "guests", label: "People", type: "number", placeholder: "1-10" },
            { key: "date", label: "Date", type: "date", placeholder: "mm/dd/yyyy", required: true },
            { key: "time", label: "Time", type: "time", placeholder: "--:-- --", required: true },
          ],
          submit_label: "Make Reservation",
        },
        gallery: {
          enabled: true,
          heading: "Our Restaurant",
          items: [],
        },
        testimonials: {
          enabled: true,
          heading: "",
          items: [
            { quote: "The Best Pasta Outside of Italy", body: "I'm Italian, and let me tell you, this pasta tastes like home. The sauces are rich, the pasta is cooked to perfection, and the ambiance is fantastic. Highly recommend this place!", author: "Guest Reviews", rating: 4.8, review_count: 1240 },
          ],
        },
        story_block: {
          enabled: true,
          eyebrow: "OUR STORY",
          heading: "A Passion for Authentic Italian Cuisine",
          description: "Since 1997, we have been dedicated to bringing the true flavors of Italy to every plate. Our chefs use only the freshest ingredients, traditional recipes passed down through generations.",
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        background_style: "dark",
        background_color: "hsl(30 10% 8%)",
        columns: [
          { title: "Opening Hours", links: ["Monday: Closed", "Tue–Thu: 16:00–22:00", "Friday: 17:00–22:00", "Sat–Sun: 17:00–22:00"] },
          { title: "Menu", links: ["Home", "Menu", "About", "Reservation"] },
        ],
        social: { twitter: "", instagram: "" },
        copyright: "© Since 1997. All rights reserved.",
      } },
    },
  },
];

// ─── Esite Templates ───

const ESITE_TEMPLATES: TemplatePreset[] = [
  // ─── Visual Template A: Service Business Pro ───
  {
    key: "esite_visual_a",
    label: "Service Business Pro",
    description: "Professional services site: hero + CTA, services grid, about section, testimonials, contact block",
    icon: "💼",
    patches: {
      header: { schema: {
        layout_variant: "nav_right",
        logo_position: "left",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: true,
        show_cart_icon: false,
        show_search: false,
        menu_layout_style: "horizontal",
        nav_items: ["Home", "Services", "About", "Contact"],
      } },
      hero: { schema: {
        layout_variant: "split",
        alignment: "left",
        background_style: "solid_light",
        background_color: "hsl(220 30% 96%)",
        headline: "Expert Solutions for Your Business",
        subheadline: "Professional Services",
        description: "We help companies grow with proven strategies, modern tools, and dedicated expertise. Let's build something great together.",
        cta_text: "Get Started",
        cta_style: "dark_rounded",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "spacious",
        typography_style: "editorial_large",
      } },
      main_content: { schema: {
        display_mode: "cards",
        heading: "Our Services",
        description: "Comprehensive solutions tailored to your needs",
        filters_enabled: false,
        sort_enabled: false,
        cards: {
          style: "image_top",
          image_ratio: "square",
          show_price: false,
          show_title: true,
          show_cta: false,
          card_style: "clean",
          hover_effect: "lift",
        },
        grid: { columns_desktop: 3, columns_mobile: 1, gap: "lg" },
        spacing: "spacious",
        items: [
          { title: "Strategy Consulting", description: "Data-driven growth strategies for your business", media: [] },
          { title: "Digital Marketing", description: "SEO, social media, and content marketing", media: [] },
          { title: "Brand Design", description: "Visual identity that sets you apart", media: [] },
          { title: "Web Development", description: "Custom websites and web applications", media: [] },
          { title: "Business Analytics", description: "Insights that drive better decisions", media: [] },
          { title: "Training & Coaching", description: "Upskill your team with expert guidance", media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "trust_badges",
        display_mode: "trust_badges",
        spacing: "comfortable",
        heading: "Why Choose Us",
        items: [
          { title: "10+ Years Experience", description: "Industry-proven expertise", icon: "truck" },
          { title: "500+ Projects Delivered", description: "Across multiple industries", icon: "headphones" },
          { title: "24/7 Support", description: "Always here when you need us", icon: "credit-card" },
          { title: "100% Satisfaction", description: "Results-driven approach", icon: "map-pin" },
        ],
        story_block: {
          enabled: true,
          eyebrow: "ABOUT US",
          heading: "We believe every business deserves world-class solutions",
          description: "Founded by industry veterans, our team combines deep expertise with a passion for innovation. We don't just deliver projects — we build partnerships.",
          cta_text: "Learn More",
        },
        testimonials: {
          enabled: true,
          heading: "What Our Clients Say",
          subheading: "Testimonials",
          items: [
            { name: "Sarah Chen", location: "CEO, TechVenture", quote: "They transformed our digital presence completely. Revenue grew 40% in 6 months.", label: "Outstanding Results" },
            { name: "James Okonkwo", location: "Director, BuildFast", quote: "Professional, responsive, and incredibly creative. Best agency we've worked with.", label: "Top-Tier Service" },
          ],
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Services", links: ["Consulting", "Marketing", "Design", "Development"] },
          { title: "Company", links: ["About", "Team", "Careers", "Blog"] },
          { title: "Contact", links: ["hello@company.com", "+1 (555) 000-0000"] },
        ],
        copyright: "Your Company. All rights reserved.",
        newsletter_enabled: true,
        newsletter_heading: "Stay Updated",
        newsletter_description: "Get insights and tips delivered to your inbox",
      } },
    },
  },
  // ─── Visual Template B: Premium Company ───
  {
    key: "esite_visual_b",
    label: "Premium Company",
    description: "Bold corporate site: dark hero, stats row, team section, case studies, footer CTA",
    icon: "🏢",
    patches: {
      header: { schema: {
        layout_variant: "nav_right",
        logo_position: "left",
        logo_size: "medium",
        show_name: false,
        show_cart_icon: false,
        show_search: false,
        menu_layout_style: "horizontal",
        nav_items: ["Home", "Work", "Team", "Contact"],
        background_style: "dark",
      } },
      hero: { schema: {
        layout_variant: "fullwidth_center",
        alignment: "center",
        background_style: "solid_dark",
        background_color: "hsl(220 20% 8%)",
        headline: "We Build What Matters",
        subheadline: "A premium agency delivering exceptional digital experiences for ambitious brands worldwide.",
        cta_text: "View Our Work",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.4,
        spacing: "spacious",
        typography_style: "bold_uppercase",
        text_color: "light",
      } },
      main_content: { schema: {
        display_mode: "cards",
        heading: "Our Work",
        description: "Selected projects and case studies",
        filters_enabled: false,
        sort_enabled: false,
        cards: {
          style: "image_top",
          image_ratio: "portrait",
          show_price: false,
          show_title: true,
          show_cta: false,
          card_style: "clean",
          hover_effect: "fade",
          badge_enabled: true,
        },
        grid: { columns_desktop: 3, columns_mobile: 1, gap: "lg" },
        spacing: "spacious",
        items: [
          { title: "Brand Redesign — Luxe Co.", badge: "Branding", description: "Complete visual identity overhaul", media: [] },
          { title: "E-Commerce Platform", badge: "Development", description: "Custom storefront with 50K+ products", media: [] },
          { title: "Marketing Campaign", badge: "Strategy", description: "3x ROI in 90 days", media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "trust_badges",
        display_mode: "trust_badges",
        spacing: "comfortable",
        heading: "By the Numbers",
        items: [
          { title: "200+", description: "Projects Completed", icon: "truck" },
          { title: "50+", description: "Team Members", icon: "headphones" },
          { title: "15", description: "Countries Served", icon: "map-pin" },
          { title: "98%", description: "Client Satisfaction", icon: "credit-card" },
        ],
        story_block: {
          enabled: true,
          eyebrow: "OUR TEAM",
          heading: "A global team of designers, developers, and strategists",
          description: "We bring together diverse perspectives and deep expertise to solve complex challenges. Every project gets senior-level attention.",
          cta_text: "Meet the Team",
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Work", links: ["Case Studies", "Industries", "Process"] },
          { title: "Company", links: ["About", "Careers", "Press"] },
          { title: "Connect", links: ["LinkedIn", "Twitter", "Dribbble"] },
        ],
        copyright: "Premium Agency. All rights reserved.",
        newsletter_enabled: true,
        newsletter_heading: "Let's work together",
        newsletter_description: "Tell us about your next project",
      } },
    },
  },
];

// ─── Influencer Templates (Link-Bio System) ───

const INFLUENCER_TEMPLATES: TemplatePreset[] = [
  // ─── Layout A: Profile Stack (Linktree-style) ───
  {
    key: "influencer_layout_a",
    label: "Profile Stack",
    description: "Classic link-in-bio: centered avatar, name, bio, social icons, stacked link buttons, gallery grid",
    icon: "🌟",
    patches: {
      header: { schema: {
        layout_variant: "link_bio_header",
        logo_position: "center",
        logo_size: "large",
        show_name: true,
        name_next_to_logo: false,
        show_cart_icon: false,
        show_search: true,
        menu_layout_style: "none",
        bio_mode: true,
        avatar_style: "circle_large",
        social_icons_position: "below_name",
        background_style: "gradient_warm",
      } },
      hero: { schema: {
        layout_variant: "link_bio_profile",
        alignment: "center",
        background_style: "themed",
        headline: "",
        subheadline: "",
        cta_text: "",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.3,
        spacing: "comfortable",
        typography_style: "creator_centered",
        text_color: "auto",
        avatar_enabled: true,
        social_row_enabled: true,
        search_enabled: true,
      } },
      main_content: { schema: {
        display_mode: "link_buttons",
        heading: "",
        filters_enabled: false,
        sort_enabled: false,
        cards: {
          style: "link_button",
          card_style: "rounded_full",
          hover_effect: "lift",
        },
        spacing: "comfortable",
        items: [],
      } },
      showcase: { schema: {
        showcase_display: "carousel",
        heading: "My Picks",
        showcase_items: [
          { title: "Creator Kit", description: "Everything you need to start", image_url: "", link_url: "", price: "$29" },
          { title: "Ring Light Pro", description: "Studio-quality lighting", image_url: "", link_url: "", price: "$45" },
          { title: "Wireless Mic", description: "Crystal clear audio", image_url: "", link_url: "", price: "$65" },
          { title: "Tripod Stand", description: "Stable shots every time", image_url: "", link_url: "", price: "$35" },
        ],
      } },
      offer: { schema: {
        layout_variant: "link_bio_gallery",
        display_mode: "link_bio_gallery",
        heading: "",
        spacing: "comfortable",
        social_gallery: {
          enabled: true,
          platform: "instagram",
          columns: 3,
        },
        newsletter: {
          enabled: true,
          heading: "Let's stay in touch",
          description: "",
          cta_text: "Submit",
        },
      } },
      footer: { schema: {
        layout_variant: "link_bio_footer",
        display_mode: "link_bio_footer",
        email: "",
        phone: "",
        social: {},
      } },
    },
  },
  // ─── Layout B: Creator Hub (Feature-rich) ───
  {
    key: "influencer_layout_b",
    label: "Creator Hub",
    description: "Media-first creator page: full-bleed hero, social bar, featured product cards, content grid, newsletter",
    icon: "🎬",
    patches: {
      header: { schema: {
        layout_variant: "link_bio_header",
        logo_position: "center",
        logo_size: "large",
        show_name: false,
        show_cart_icon: false,
        show_search: true,
        menu_layout_style: "none",
        bio_mode: true,
        avatar_style: "none",
        social_icons_position: "in_hero",
        background_style: "solid_dark",
      } },
      hero: { schema: {
        layout_variant: "link_bio_media_hero",
        alignment: "center",
        background_style: "solid_dark",
        background_color: "hsl(220 15% 12%)",
        headline: "",
        subheadline: "",
        cta_text: "",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.2,
        spacing: "spacious",
        typography_style: "creator_bold",
        text_color: "light",
        avatar_enabled: false,
        social_row_enabled: true,
        search_enabled: true,
        full_bleed: true,
      } },
      main_content: { schema: {
        display_mode: "link_buttons",
        heading: "",
        filters_enabled: false,
        sort_enabled: false,
        cards: {
          style: "link_button",
          card_style: "outlined",
          hover_effect: "lift",
        },
        spacing: "comfortable",
        items: [],
      } },
      showcase: { schema: {
        showcase_display: "carousel",
        heading: "Featured",
        showcase_items: [
          { title: "New Collection", description: "Just dropped — limited edition", image_url: "", link_url: "", price: "$49" },
          { title: "Merch Drop", description: "Exclusive creator merch", image_url: "", link_url: "", price: "$25" },
          { title: "Digital Pack", description: "Presets, templates & more", image_url: "", link_url: "", price: "$19" },
          { title: "Collab Item", description: "Special collaboration piece", image_url: "", link_url: "", price: "$55" },
        ],
      } },
      offer: { schema: {
        layout_variant: "link_bio_featured",
        display_mode: "link_bio_featured",
        heading: "Featured Product",
        spacing: "comfortable",
        items: [],
        social_gallery: {
          enabled: true,
          platform: "instagram",
          columns: 2,
        },
        newsletter: {
          enabled: true,
          heading: "Join the Newsletter",
          description: "Be the first one to receive the latest news",
          cta_text: "Subscribe",
        },
      } },
      footer: { schema: {
        layout_variant: "link_bio_footer",
        display_mode: "link_bio_footer",
        email: "",
        social: {},
      } },
    },
  },
  // ─── Layout C: Outdoor Creator (Blog + Gear style) ───
  {
    key: "influencer_layout_c",
    label: "Outdoor Creator",
    description: "Adventure-style bio page: tall hero image, creator name overlay, social icons, blog post carousel, gear list accordion",
    icon: "🏔️",
    patches: {
      header: { schema: {
        layout_variant: "link_bio_header",
        logo_position: "center",
        logo_size: "large",
        show_name: true,
        name_next_to_logo: false,
        show_cart_icon: false,
        show_search: false,
        menu_layout_style: "none",
        bio_mode: true,
        avatar_style: "none",
        social_icons_position: "below_name",
        background_style: "gradient_nature",
      } },
      hero: { schema: {
        layout_variant: "link_bio_media_hero",
        alignment: "center",
        background_style: "solid_dark",
        background_color: "hsl(150 20% 18%)",
        headline: "Adventure Awaits",
        subheadline: "Explore the wild. Share the journey.",
        cta_text: "Follow My Trail",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.35,
        spacing: "spacious",
        typography_style: "creator_bold",
        text_color: "light",
        avatar_enabled: false,
        social_row_enabled: true,
        search_enabled: false,
        full_bleed: true,
      } },
      main_content: { schema: {
        display_mode: "link_buttons",
        heading: "Latest Blog Posts",
        filters_enabled: false,
        sort_enabled: false,
        cards: {
          style: "link_button",
          card_style: "rounded_lg",
          hover_effect: "lift",
        },
        spacing: "comfortable",
        items: [
          { title: "🏔️ Summit Diaries — Mt. Rwenzori", url: "", description: "My 5-day trek through the Mountains of the Moon" },
          { title: "🎒 What's In My Pack (2026 Edition)", url: "", description: "Gear breakdown for ultralight backpacking" },
          { title: "🌍 Top 10 Hidden Trails in East Africa", url: "", description: "Off-the-beaten-path routes you need to try" },
          { title: "📸 Photography Tips for the Trail", url: "", description: "Capture stunning shots with just your phone" },
        ],
      } },
      showcase: { schema: {
        showcase_display: "carousel",
        heading: "My Travel Gear",
        showcase_items: [
          { title: "Hiking Boots", description: "Trail-tested & waterproof", image_url: "", link_url: "", price: "$120" },
          { title: "Backpack 45L", description: "Ultralight for long treks", image_url: "", link_url: "", price: "$89" },
          { title: "Camp Stove", description: "Compact & reliable", image_url: "", link_url: "", price: "$40" },
          { title: "Water Filter", description: "Drink from any stream", image_url: "", link_url: "", price: "$35" },
          { title: "Headlamp", description: "1000 lumens, rechargeable", image_url: "", link_url: "", price: "$28" },
        ],
      } },
      offer: { schema: {
        layout_variant: "link_bio_featured",
        display_mode: "link_bio_featured",
        heading: "My Travel Gear",
        spacing: "comfortable",
        items: [],
        social_gallery: {
          enabled: false,
        },
        newsletter: {
          enabled: true,
          heading: "Join my adventure updates",
          description: "Get trail guides, gear reviews, and stories from the road",
          cta_text: "Subscribe",
        },
      } },
      footer: { schema: {
        layout_variant: "link_bio_footer",
        display_mode: "link_bio_footer",
        email: "",
        social: {},
      } },
    },
  },
];

// ─── Community Templates ───

const COMMUNITY_TEMPLATES: TemplatePreset[] = [
  {
    key: "community_visual_a",
    label: "Community Listing",
    description: "Community landing: hero with join CTA, member highlights, featured posts, events section",
    icon: "🌐",
    patches: {
      header: { schema: { layout_variant: "nav_right", logo_position: "left", logo_size: "medium", show_name: true, name_next_to_logo: true, show_cart_icon: false, show_search: false, menu_layout_style: "horizontal", nav_items: ["Home", "Members", "Events", "About"] } },
      hero: { schema: { layout_variant: "fullwidth_center", alignment: "center", background_style: "solid_dark", background_color: "hsl(260 30% 15%)", headline: "Welcome to Our Community", subheadline: "Connect with like-minded people, share ideas, and grow together. Join thousands of members building something meaningful.", cta_text: "Join Now", media: { type: "image", source: "url", url: "", fit: "cover" }, overlay_opacity: 0.5, spacing: "spacious", typography_style: "bold_uppercase", text_color: "light" } },
      main_content: { schema: { display_mode: "posts", heading: "Featured Updates", description: "Latest from our community", filters_enabled: false, sort_enabled: false, cards: { style: "image_top", image_ratio: "square", show_price: false, show_title: true, show_cta: false, card_style: "clean", hover_effect: "lift" }, grid: { columns_desktop: 3, columns_mobile: 1, gap: "lg" }, spacing: "spacious", items: [ { title: "Community Meetup — March 2026", description: "Join us for our monthly networking event", media: [] }, { title: "New Learning Resources Available", description: "Free guides and templates for members", media: [] }, { title: "Member Spotlight: Success Stories", description: "How our members are making an impact", media: [] } ] } },
      offer: { schema: { layout_variant: "trust_badges", display_mode: "trust_badges", spacing: "comfortable", heading: "Why Join Us", items: [ { title: "500+ Members", description: "Active and growing community", icon: "headphones" }, { title: "Weekly Events", description: "Meetups, workshops, webinars", icon: "map-pin" }, { title: "Free Resources", description: "Guides, templates, tools", icon: "truck" }, { title: "Direct Access", description: "Connect with industry leaders", icon: "credit-card" } ], story_block: { enabled: true, eyebrow: "ABOUT US", heading: "A community built on shared values and real connections", description: "We started as a small group of passionate individuals. Today, we're a thriving community supporting each other's growth.", cta_text: "Learn More" } } },
      footer: { schema: { layout_variant: "multi_column", display_mode: "multi_column", columns: [ { title: "Community", links: ["About", "Rules", "FAQ"] }, { title: "Programs", links: ["Events", "Courses", "Mentorship"] }, { title: "Connect", links: ["Discord", "WhatsApp", "Twitter"] } ], copyright: "Your Community. All rights reserved." } },
    },
  },
  {
    key: "community_visual_b",
    label: "Community Feed",
    description: "Modern feed layout: header tabs, feed cards, pinned info sidebar, member directory preview",
    icon: "💬",
    patches: {
      header: { schema: { layout_variant: "nav_split", logo_position: "center", logo_size: "large", show_name: true, name_next_to_logo: false, show_cart_icon: false, show_search: true, menu_layout_style: "horizontal", nav_items_left: ["Feed", "Members"], nav_items_right: ["Events", "Resources"] } },
      hero: { schema: { layout_variant: "split", alignment: "left", background_style: "solid_light", background_color: "hsl(250 25% 95%)", headline: "Your Community Hub", subheadline: "Stay Connected", description: "Discover discussions, events, resources, and connect with fellow members.", cta_text: "Explore", cta_style: "dark_rounded", media: { type: "image", source: "url", url: "", fit: "cover" }, overlay_opacity: 0, spacing: "spacious", typography_style: "editorial_large" } },
      main_content: { schema: { display_mode: "posts", heading: "Community Feed", description: "What's happening in the community", filters_enabled: false, sort_enabled: false, cards: { style: "image_top", image_ratio: "square", show_price: false, show_title: true, show_cta: false, card_style: "minimal", hover_effect: "lift" }, grid: { columns_desktop: 2, columns_mobile: 1, gap: "lg" }, spacing: "spacious", items: [ { title: "Welcome New Members!", description: "Introduce yourself and tell us what you're working on", media: [] }, { title: "Weekly Discussion Thread", description: "This week's topic: Building in public", media: [] }, { title: "Resource Share: Design Tools", description: "Our top picks for design tools in 2026", media: [] }, { title: "AMA with Guest Speaker", description: "Live Q&A session this Friday at 3pm", media: [] } ] } },
      offer: { schema: { layout_variant: "story_block", display_mode: "story_block", heading: "Community Guidelines", description: "We're committed to creating a safe, inclusive, and supportive space for everyone.", cta_text: "Read Full Guidelines", background_style: "image_left", spacing: "spacious", items: [ { title: "Our Mission", description: "To build the most supportive community where members help each other succeed.", media: [] } ], social_gallery: { enabled: true, platform: "instagram", hashtag: "#ourcommunity", columns: 4 } } },
      footer: { schema: { layout_variant: "multi_column", display_mode: "multi_column", columns: [ { title: "Explore", links: ["Feed", "Members", "Events", "Resources"] }, { title: "Support", links: ["Help Center", "Contact Admin", "Report Issue"] }, { title: "Social", links: ["Twitter", "Discord", "LinkedIn"] } ], copyright: "Your Community Hub. All rights reserved.", newsletter_enabled: true, newsletter_heading: "Weekly Digest", newsletter_description: "Get the top community highlights delivered every Monday" } },
    },
  },
];

// ─── Estore Templates ───

const ESTORE_TEMPLATES: TemplatePreset[] = [
  {
    key: "estore_visual_a",
    label: "Modern Marketplace",
    description: "Marketplace layout: search + category chips, product grid with filters, promo banner, trust badges",
    icon: "🏬",
    patches: {
      header: { schema: { layout_variant: "nav_right", logo_position: "left", logo_size: "medium", show_name: true, name_next_to_logo: true, show_cart_icon: true, show_search: true, menu_layout_style: "horizontal", nav_items: ["Products", "Bulk Orders", "About", "Contact"] } },
      hero: { schema: { layout_variant: "split", alignment: "left", background_style: "solid_light", background_color: "hsl(170 25% 94%)", headline: "Wholesale Marketplace", subheadline: "Trusted Supplier", description: "Source quality products at competitive bulk prices. Trusted by 500+ businesses.", cta_text: "Browse Products", cta_style: "dark_rounded", media: { type: "image", source: "url", url: "", fit: "cover" }, overlay_opacity: 0, spacing: "spacious", typography_style: "editorial_large" } },
      main_content: { schema: { display_mode: "grid", heading: "Product Catalog", description: "Browse our full range of wholesale products", filters_enabled: true, sort_enabled: true, cards: { style: "image_top", image_ratio: "square", show_price: true, show_title: true, show_cta: true, card_style: "clean", hover_effect: "lift", badge_enabled: true }, grid: { columns_desktop: 4, columns_mobile: 2, gap: "md" }, spacing: "comfortable", items: [ { title: "Industrial Cement (50kg)", price: "UGX 32,000", badge: "Bulk", description: "Grade 42.5, per bag", media: [] }, { title: "Steel Rebar Bundle", price: "UGX 180,000", badge: "Popular", description: "12mm x 12m, 10 pieces", media: [] }, { title: "Maize Flour (25kg)", price: "UGX 75,000", badge: "", description: "Premium grade, per sack", media: [] }, { title: "Cooking Oil (20L)", price: "UGX 95,000", badge: "Deal", description: "Refined vegetable oil", media: [] }, { title: "Roofing Sheets", price: "UGX 45,000", badge: "", description: "Gauge 30, per sheet", media: [] }, { title: "PVC Pipes (4in)", price: "UGX 28,000", badge: "", description: "Class D, 6m length", media: [] } ] } },
      offer: { schema: { layout_variant: "trust_badges", display_mode: "trust_badges", spacing: "comfortable", heading: "Why Trade With Us", items: [ { title: "Verified Supplier", description: "Licensed & certified business", icon: "truck" }, { title: "Bulk Discounts", description: "Better prices at volume", icon: "credit-card" }, { title: "Fast Delivery", description: "Next-day delivery available", icon: "map-pin" }, { title: "Quality Guarantee", description: "Returns on defective items", icon: "headphones" } ], story_block: { enabled: true, eyebrow: "ABOUT US", heading: "Your trusted wholesale partner since 2015", description: "We connect manufacturers with retailers, offering competitive pricing on quality products with reliable delivery.", cta_text: "Request Quote" } } },
      footer: { schema: { layout_variant: "multi_column", display_mode: "multi_column", columns: [ { title: "Products", links: ["Building Materials", "Food & Agri", "Industrial", "Hardware"] }, { title: "Services", links: ["Bulk Orders", "Custom Quotes", "Delivery", "Financing"] }, { title: "Contact", links: ["sales@store.com", "+256 700 000 000", "Kampala, Uganda"] } ], copyright: "Your Store. All rights reserved." } },
    },
  },
  {
    key: "estore_visual_b",
    label: "Fashion Minimal",
    description: "Editorial store layout: bold hero, featured collections, clean product grid, newsletter footer",
    icon: "👗",
    patches: {
      header: { schema: { layout_variant: "nav_right", logo_position: "left", logo_size: "medium", show_name: false, show_cart_icon: true, show_search: true, menu_layout_style: "horizontal", nav_items: ["Collections", "New Arrivals", "Sale", "About"], background_style: "dark" } },
      hero: { schema: { layout_variant: "fullwidth_center", alignment: "center", background_style: "solid_dark", background_color: "hsl(0 0% 6%)", headline: "NEW COLLECTION", subheadline: "DISCOVER OUR LATEST CURATED SELECTION OF PREMIUM FASHION AND LIFESTYLE ESSENTIALS.", cta_text: "Shop Collection", media: { type: "image", source: "url", url: "", fit: "cover" }, overlay_opacity: 0.4, spacing: "spacious", typography_style: "bold_uppercase", text_color: "light" } },
      main_content: { schema: { display_mode: "grid", heading: "Featured Products", description: "Handpicked styles for the season", filters_enabled: false, sort_enabled: false, cards: { style: "image_top", image_ratio: "portrait", show_price: true, show_title: true, show_cta: false, card_style: "minimal", hover_effect: "fade", badge_enabled: true }, grid: { columns_desktop: 4, columns_mobile: 2, gap: "lg" }, spacing: "spacious", items: [ { title: "Linen Shirt", price: "UGX 85,000", badge: "New", description: "Premium cotton-linen blend", media: [] }, { title: "Tailored Trousers", price: "UGX 120,000", badge: "", description: "Slim fit, multiple colors", media: [] }, { title: "Canvas Sneakers", price: "UGX 65,000", badge: "Popular", description: "Handmade, durable sole", media: [] }, { title: "Leather Tote", price: "UGX 180,000", badge: "", description: "Full grain leather", media: [] } ] } },
      offer: { schema: { layout_variant: "story_block", display_mode: "story_block", heading: "Our Philosophy", description: "We believe in slow fashion — timeless pieces made with care, designed to last.", cta_text: "Our Story", background_style: "image_left", spacing: "spacious", items: [ { title: "Sustainable Materials", description: "We use organic cotton, recycled fabrics, and responsibly sourced leather.", media: [] } ], newsletter: { enabled: true, heading: "Join the List", description: "Be the first to know about new drops and exclusive offers", cta_text: "Subscribe" } } },
      footer: { schema: { layout_variant: "multi_column", display_mode: "multi_column", columns: [ { title: "Shop", links: ["New Arrivals", "Best Sellers", "Sale", "Gift Cards"] }, { title: "Help", links: ["Shipping", "Returns", "Size Guide", "Contact"] }, { title: "Follow", links: ["Instagram", "TikTok", "Pinterest"] } ], copyright: "Your Fashion Store. All rights reserved.", newsletter_enabled: true, newsletter_heading: "Stay in the loop", newsletter_description: "New releases and exclusive offers, straight to your inbox" } },
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

/** Get all active templates for a given engine key (filters out is_active === false) */
export function getTemplatesForEngine(engineKey: string): TemplatePreset[] {
  const all = TEMPLATE_REGISTRY[engineKey]?.templates ?? [];
  return all.filter((t) => t.is_active !== false);
}

/** Get ALL templates including inactive (for internal lookups) */
export function getAllTemplatesForEngine(engineKey: string): TemplatePreset[] {
  return TEMPLATE_REGISTRY[engineKey]?.templates ?? [];
}

/** Get a specific template by engine key + template key (searches all, including inactive) */
export function getTemplate(engineKey: string, templateKey: string): TemplatePreset | undefined {
  return getAllTemplatesForEngine(engineKey).find((t) => t.key === templateKey);
}

/**
 * Template integrity guard: validates that a generated output matches the selected template family.
 * Returns true if the template_key belongs to the expected family, false if it drifted.
 */
export function validateTemplateFamily(engineKey: string, selectedKey: string, outputKey: string): boolean {
  const selected = getTemplate(engineKey, selectedKey);
  const output = getTemplate(engineKey, outputKey);
  if (!selected || !output) return selectedKey === outputKey;
  // If template_family is set, both must match
  if (selected.template_family && output.template_family) {
    return selected.template_family === output.template_family;
  }
  // Fallback: keys must match exactly
  return selectedKey === outputKey;
}

/** Get all engine keys that have templates */
export function getEngineKeysWithTemplates(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

/** Get the section ordering from a template's reference (for structural fidelity during generation) */
export function getTemplateSectionOrder(engineKey: string, templateKey: string): string[] {
  const t = getTemplate(engineKey, templateKey);
  return t?.reference?.sectionOrder ?? [];
}

/** Get layout patterns from a template's reference */
export function getTemplateLayoutPatterns(engineKey: string, templateKey: string): string[] {
  const t = getTemplate(engineKey, templateKey);
  return t?.reference?.layoutPatterns ?? [];
}

/** Find templates by reference source type */
export function getTemplatesBySource(engineKey: string, source: "link" | "image" | "mixed" | "original"): TemplatePreset[] {
  return getTemplatesForEngine(engineKey).filter((t) => t.reference?.source === source);
}
