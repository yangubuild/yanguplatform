// YANGU Builder — Template Registry
// Provides visual template presets per engine.
// Each template defines schema patches for core slots (header, hero, main_content, offer, footer).
// No DB changes required — applied client-side via patch merge.

import {
  PLATERIA_MENU_ITEMS, PLATERIA_TESTIMONIALS,
  YUMIX_MENU_ITEMS, YUMIX_CATEGORY_ITEMS, YUMIX_PROMO_BANNERS, YUMIX_STATS, YUMIX_TESTIMONIALS,
  ZOOOM_MENU_ITEMS, ZOOOM_CATEGORY_ITEMS, ZOOOM_TESTIMONIALS,
} from "@/config/emenuDemoContent";
import { assertTemplateOwnership, resolveBuilder } from "@/types/builders";
import type { AnyTemplateKey, BuilderType } from "@/types/builders";
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

  // ─── Uncover — Electronics / Tech ───
  // Reference: https://uncovertemplatesite.framer.website
  {
    key: "eshop_uncover",
    label: "Uncover — Electronics",
    description: "Tech/electronics storefront: discount marquee, centered two-tone hero, 4-up category tiles, popular products grid with stock chips, testimonials grid, about + stats, blogs, newsletter footer.",
    icon: "🎧",
    template_family: "uncover",
    preview_url: "https://uncovertemplatesite.framer.website",
    reference: {
      source: "link",
      url: "https://uncovertemplatesite.framer.website",
      label: "Uncover Framer template",
      sectionOrder: ["banner", "header", "hero", "category_tiles", "products", "testimonials", "about", "stats", "blogs", "newsletter"],
      layoutPatterns: [
        "discount_marquee_top",
        "centered_pill_nav",
        "two_tone_centered_hero",
        "four_category_tiles",
        "tabbed_product_grid_with_stock_chip",
        "three_col_testimonial_cards",
        "about_split_with_feature_cards",
        "four_stat_counters",
        "three_blog_cards",
        "centered_newsletter_footer",
      ],
    },
    patches: {
      header: {
        schema: {
          layout_variant: "nav_center_pill",
          logo_position: "left",
          logo_size: "small",
          show_name: true,
          show_cart_icon: false,
          show_search: false,
          menu_layout_style: "horizontal",
          nav_items: ["Categories", "Products", "Blogs", "Newsletter"],
          background_style: "light",
          top_tagline: "Get a 20% discount  USE CODE 20PD",
        },
      },
      hero: {
        schema: {
          layout_variant: "centered_two_tone",
          alignment: "center",
          background_style: "solid_light",
          headline: "Uncover The Most",
          headline_tail: "Innovative Products.",
          subheadline: "Exploring the tech and design shaping the world of tomorrow.",
          cta_text: "",
          spacing: "spacious",
          typography_style: "display_bold",
          text_color: "dark",
        },
      },
      main_content: {
        schema: {
          display_mode: "grid",
          heading: "Popular Products",
          tabs: ["All Items", "New Products", "Classic"],
          filters_enabled: false,
          sort_enabled: false,
          cards: {
            style: "image_top",
            image_ratio: "square",
            show_price: true,
            show_title: true,
            show_cta: false,
            badge_enabled: true,
            stock_chip_enabled: true,
          },
          grid: { columns_desktop: 4, columns_mobile: 2, gap: "sm" },
          spacing: "comfortable",
          categories: [
            { title: "Outdoor", count: "4 pcs" },
            { title: "Video Gear", count: "4 pcs" },
            { title: "Sound Essentials", count: "4 pcs" },
            { title: "Best Sellers", count: "8 pcs" },
          ],
          items: [
            { title: "R21 Controller", price: "$129", stock: "In Stock", badge: "" },
            { title: "Studio Remote", price: "$84", stock: "In Stock", badge: "" },
            { title: "Retro Charger", price: "$49", stock: "In Stock", badge: "" },
            { title: "OP-1 Field", price: "$1,990", stock: "In Stock", badge: "New" },
            { title: "Wireless Headphones", price: "$249", stock: "In Stock", badge: "" },
            { title: "Mixer TX-6", price: "$1,199", stock: "In Stock", badge: "New" },
            { title: "TP-7 Recorder", price: "$1,290", stock: "In Stock", badge: "" },
            { title: "Motion Controller", price: "$199", stock: "In Stock", badge: "New" },
          ],
        },
      },
      offer: {
        schema: {
          layout_variant: "about_stats_testimonials",
          spacing: "spacious",
          about_heading: "Learn More About Us",
          about_sub: "Discover our story, values, and what we stand for.",
          about_features: [
            { title: "Well-Designed Products", body: "We focus on products where form, function, and thoughtful design come together." },
            { title: "Modern Tech Selection", body: "A curated range of tech products built for everyday use and creative workflows." },
          ],
          stats: [
            { value: "120+", label: "Official Partners" },
            { value: "8K+", label: "Community Members" },
            { value: "2.4K+", label: "Orders This Month" },
            { value: "1.9K+", label: "Reviews" },
          ],
          testimonials: {
            enabled: true,
            heading: "See what our customers think about us and our products",
            items: [
              { quote: "The build quality is excellent and the overall experience feels premium. Setup was straightforward.", name: "Ethan Brooks", role: "Director" },
              { quote: "Everything works as expected and feels well put together. Setup was easy and smooth so far.", name: "Ava Mitchell", role: "Creative Director" },
              { quote: "The overall experience feels balanced and well executed. Worked without issues out of the box.", name: "Ethan Walker", role: "Brand Designer" },
              { quote: "Integrates well into an existing setup and doesn't require much adjustment.", name: "Emily Collins", role: "Sound Designer" },
              { quote: "The quality is immediately noticeable and it feels great to use every single day.", name: "James Walker", role: "Music Producer" },
              { quote: "You can tell right away that this is a well-made product. Reliable and thoughtfully designed.", name: "Isabella Reed", role: "Audio Engineer" },
            ],
          },
        },
      },
      footer: {
        schema: {
          layout_variant: "newsletter_centered",
          background_style: "dark",
          blogs: [
            { title: "Your Tech Setup", excerpt: "Building a setup that works for you starts with clarity, not complexity." },
            { title: "Modern Product Design", excerpt: "Where technology meets intention, simplicity, and long-term value." },
            { title: "About Our Products", excerpt: "Transparent look at the standards, thinking, and philosophy behind products." },
          ],
          newsletter_enabled: true,
          newsletter_heading: "Join our Newsletter",
          newsletter_description: "Get notified about new updates and exclusive offers.",
        },
      },
    },
  },

  // ─── Kanva — Natural skincare / single-brand beauty store ───
  // Reference: https://kanva-template.framer.website
  {
    key: "eshop_kanva",
    label: "Kanva — Beauty",
    description: "Natural skincare storefront: pill nav with center wordmark, serif-italic image hero, 4-up feature highlights, playful ritual headline with inline ingredient images, cleanser tabs + 3-up product cards, Eco-Friendly split, 'Why Your Skin Deserves the Best' 2x2 cards with rating, featured 2-up products, newsletter band, IG 4-up, footer.",
    icon: "🧴",
    template_family: "kanva",
    preview_url: "https://kanva-template.framer.website",
    reference: {
      source: "link",
      url: "https://kanva-template.framer.website",
      label: "Kanva Framer template",
      sectionOrder: ["header", "hero", "features", "ritual", "products", "eco", "why", "featured_pair", "newsletter", "instagram", "footer"],
      layoutPatterns: [
        "pill_nav_center_wordmark",
        "image_hero_serif_italic_overlay",
        "four_up_feature_highlights",
        "ritual_headline_inline_circle_images",
        "cleanser_tabs_three_up_cards_image_swap",
        "eco_friendly_split_card_with_image",
        "why_two_by_two_grid_with_rating_pile",
        "featured_two_up_with_discount_chip",
        "newsletter_centered_band",
        "instagram_four_up",
      ],
    },
    patches: {
      header: {
        schema: {
          layout_variant: "pill_nav_center",
          logo_position: "center",
          logo_size: "small",
          show_name: true,
          show_cart_icon: true,
          show_search: true,
          menu_layout_style: "horizontal",
          nav_items: ["Shop", "Collections", "About", "Blog", "Contact"],
          background_style: "light",
        },
      },
      hero: {
        schema: {
          layout_variant: "image_overlay_serif",
          alignment: "left",
          background_style: "image",
          headline: "Natural",
          headline_tail: "Skincare",
          subheadline: "Start your day with gentle care and nourishing ingredients designed to awaken your skin naturally.",
          cta_text: "Shop Now",
          media: { type: "image", source: "url", url: "", fit: "cover" },
          spacing: "spacious",
          typography_style: "serif_italic_display",
          text_color: "light",
        },
      },
      main_content: {
        schema: {
          display_mode: "grid",
          heading: "Cleansers",
          tabs: ["Cleansers", "Lotions", "Moisturizers"],
          filters_enabled: false,
          sort_enabled: false,
          cards: {
            style: "image_top",
            image_ratio: "square",
            show_price: true,
            show_title: true,
            show_cta: false,
            badge_enabled: true,
            hover_effect: "image_swap",
            card_style: "soft_radius",
          },
          grid: { columns_desktop: 3, columns_mobile: 2, gap: "md" },
          spacing: "comfortable",
          features: [
            { title: "Natural Formula", body: "Crafted with pure, skin-loving ingredients for ultimate care." },
            { title: "Cruelty-Free", body: "Our products are never tested on animals, guaranteed ethical." },
            { title: "Expert Approved", body: "Carefully tested to ensure safety and visible results." },
            { title: "Free Shipping", body: "Delivered to your doorstep with no extra costs worldwide." },
          ],
          items: [
            { title: "Gentle Wash", category: "Cleansers", price: "7,90 €", original_price: "18,90 €", badge: "58% OFF", media: [] },
            { title: "Clay Clean", category: "Cleansers", price: "8,90 €", badge: "", media: [] },
            { title: "Citrus Foam", category: "Cleansers", price: "8,90 €", badge: "", media: [] },
          ],
        },
      },
      offer: {
        schema: {
          layout_variant: "luxury_skincare_blocks",
          background_style: "soft_beige",
          ritual_lead: "Refresh your skin,",
          ritual_mid: "love yourself,",
          ritual_tail: "renew your glow.",
          eco_bullets: ["No Harsh Chemicals", "Plant-Based Goodness", "Ethically Sourced"],
          why_heading: "Why Your Skin",
          why_heading_tail: "Deserves the Best",
          why_rating: "4.7",
          why_review_count: "1,109 reviews",
          why_cards: [
            { eyebrow: "Proven Effectiveness", body: "Every product is carefully crafted to meet the highest quality standards." },
            { eyebrow: "Eco-Friendly · Packaging", body: "Eco-friendly materials designed to care for the planet as much as your skin." },
            { eyebrow: "100% Natural · 100% You", body: "No Harsh Chemicals · Plant-Based Goodness · Ethically Sourced", isBullets: true },
            { eyebrow: "From Jennifer K.", body: "It feels healthier, smoother & more radiant than ever. I love knowing I'm using something natural and effective!", isQuote: true },
          ],
          featured_pair: [
            { title: "Daily Flow", category: "Lotions", price: "7,90 €", badge: "66% OFF" },
            { title: "Glow Milk", category: "Lotions", price: "9,90 €", badge: "57% OFF" },
          ],
        },
      },
      footer: {
        schema: {
          layout_variant: "multi_column_soft",
          background_style: "cream",
          ig_handle: "@kanva",
          columns: [
            { title: "Shop", links: ["All Products", "Cleansers", "Lotions", "Moisturizers"] },
            { title: "Company", links: ["About", "Blog", "Contact"] },
            { title: "Help", links: ["Shipping", "Returns", "FAQ"] },
          ],
        },
      },
    },
  },

  // NOTE: eshop_minna moved to Estore registry as estore_minna per Builder Bible.
  // No Eshop entry remains here — selectTemplate falls back to eshop_visual_a for
  // the "minimal" tone.

  // ─── Mockhub — Mixed merch / digital marketplace (dark + vibrant accent) ───
  {
    key: "eshop_mockhub",
    label: "Mockhub — Merch",
    description: "Dark mixed-merch marketplace: violet promo bar, sticky nav with category pills + search, split hero, and 3-up category sections.",
    icon: "🛍️",
    is_active: true,
    template_family: "mockhub",
    preview_url: "https://mockhub.framer.website",
    reference: {
      source: "link",
      url: "https://mockhub.framer.website",
      label: "Mockhub Framer template",
      sectionOrder: ["promo", "header", "hero_split", "category_device", "category_apparel", "category_product", "features", "testimonials", "footer"],
      layoutPatterns: ["dark_promo_bar", "sticky_nav_pills_search", "split_hero_text_media", "three_up_category_grid", "tag_price_card", "feature_grid_3x2", "testimonial_wall_3col"],
    },
    patches: {
      header: { schema: {
        layout_variant: "dark_pills_search_cta",
        background_style: "dark",
        logo_position: "left",
        logo_size: "small",
        show_name: true,
        show_search: true,
        show_cart_icon: false,
        nav_items: ["Device", "Apparel", "Product", "All Assets"],
        cta_label: "Use for Free",
        promo_text: "Get unlimited access to all products",
      } },
      hero: { schema: {
        layout_variant: "split_text_media",
        background_style: "dark",
        title: "Showcase Your Designs with Ease",
        subtitle: "Discover high-quality mockups to present your work beautifully and effortlessly.",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        spacing: "spacious",
      } },
      main_content: { schema: {
        display_mode: "categorized",
        layout_style: "three_up_per_category",
        columns_desktop: 3,
        columns_mobile: 2,
        cards: { style: "image_top", image_ratio: "landscape", show_price: true, show_title: true, show_cta: false, card_style: "tagged_dark", hover_effect: "zoom" },
        grid: { columns_desktop: 3, columns_mobile: 2, gap: "md" },
        categories: [
          { title: "Device Mockup", cta: "Explore Devices", items: [
            { title: "Colourful monitor", tag: "Device", price: "$32" },
            { title: "Girl showing iPhone 13", tag: "Device", price: "$54" },
            { title: "AI generated monitor", tag: "Device", price: "Free" },
          ] },
          { title: "Apparel Mockup", cta: "Explore Apparel", items: [
            { title: "Girl wearing a t-shirt", tag: "Apparel", price: "Free" },
            { title: "Girl wearing t-shirt and glasses", tag: "Apparel", price: "Free" },
            { title: "Tote bag with t-shirt", tag: "Apparel", price: "$43" },
          ] },
          { title: "Product Mockup", cta: "Explore Products", items: [
            { title: "Open box with bottle", tag: "Product", price: "Free" },
            { title: "Jar and tube mockup", tag: "Product", price: "Free" },
            { title: "Closed box", tag: "Product", price: "$54" },
          ] },
        ],
      } },
      offer: { schema: {
        layout_variant: "feature_grid_plus_testimonials",
        features: [
          { title: "Simple To Modify", body: "Easily change layouts, fonts, and colors to match your brand." },
          { title: "Affordable", body: "Launch a polished website for a small fraction of the cost." },
          { title: "Quality Support", body: "Reach us instantly via live chat whenever you need help." },
          { title: "High-Quality Mockups", body: "Meticulously crafted for stunning, high-quality visuals." },
          { title: "Wide Variety", body: "Explore a vast collection across many categories." },
          { title: "Instant Download", body: "Access your mockups immediately after purchase." },
        ],
        testimonials: [
          { name: "Myron", brand: "Shoply", quote: "I adore the speed and style. Highly scalable — a complete, adjustable design system." },
          { name: "Ezekiel", brand: "Shoply", quote: "Lovely design. Outstanding performance." },
          { name: "Jeff", brand: "Sero", quote: "Exquisitely crafted from the inside out. Incredibly capable." },
          { name: "Jude", brand: "Sero", quote: "Very neat and user-friendly! Helped me launch my portfolio." },
          { name: "Kane", brand: "Shoply", quote: "It's simple to use." },
          { name: "Jane", brand: "Shoply", quote: "Amazing template — opened my store in half the time!" },
        ],
      } },
      footer: { schema: {
        layout_variant: "centered_cta_minimal",
        background_style: "dark",
        copyright: "All rights reserved.",
      } },
    },
  },

  // ─── Lumel — Bottled / wellness products (editorial organic premium) ───
  {
    key: "eshop_lumel",
    label: "Lumel — Bottled",
    description: "Editorial bottled-products store: cream + amber palette, serif wordmark, split hero, ingredient strip, 3-up product grid, story block.",
    icon: "🧃",
    is_active: true,
    template_family: "lumel",
    preview_url: "",
    reference: {
      source: "original",
      label: "Lumel — bottled wellness editorial",
      sectionOrder: ["promo", "header", "hero_split", "ingredients", "products", "story", "testimonial", "footer"],
      layoutPatterns: ["thin_promo_bar", "centered_serif_wordmark_nav", "split_hero_text_bottle", "three_up_ingredient_strip", "editorial_product_grid", "image_left_story_right", "centered_press_quote", "newsletter_footer"],
    },
    patches: {
      header: { schema: {
        layout_variant: "centered_serif_split_nav",
        background_style: "cream",
        logo_position: "center",
        logo_size: "medium",
        show_name: true,
        show_search: false,
        show_cart_icon: true,
        nav_items: ["Shop", "Ingredients", "Our Story", "Journal"],
        promo_text: "Free delivery on orders over $40 — naturally sourced, small batch.",
      } },
      hero: { schema: {
        layout_variant: "split_text_bottle",
        background_style: "cream",
        title: "Pure ingredients,\nbottled with intention.",
        subtitle: "Cold-pressed wellness blends, crafted in small batches from organically grown botanicals.",
        cta_label: "Shop the collection",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        spacing: "spacious",
      } },
      main_content: { schema: {
        display_mode: "grid",
        layout_style: "editorial_three_up",
        columns_desktop: 3,
        columns_mobile: 2,
        cards: { style: "image_top_volume", image_ratio: "portrait", show_price: true, show_title: true, show_cta: true, card_style: "bordered_cream" },
        items: [
          { title: "Golden Tonic", volume: "500ml", price: "$18", note: "Turmeric · Ginger · Honey" },
          { title: "Verde Reset", volume: "500ml", price: "$18", note: "Spinach · Apple · Mint" },
          { title: "Citrus Sun", volume: "500ml", price: "$16", note: "Orange · Carrot · Cayenne" },
          { title: "Berry Glow", volume: "500ml", price: "$19", note: "Blueberry · Beet · Lemon" },
          { title: "Roots Elixir", volume: "350ml", price: "$22", note: "Ginger · Lemon · Cayenne" },
          { title: "Dawn Brew", volume: "350ml", price: "$20", note: "Matcha · Vanilla · Oat" },
        ],
      } },
      offer: { schema: {
        layout_variant: "ingredients_story_testimonial",
        ingredients: [
          { label: "100% Organic", note: "Certified sourcing" },
          { label: "Cold-Pressed", note: "Nutrients preserved" },
          { label: "Glass Bottled", note: "Plastic-free packaging" },
        ],
        story: {
          title: "Bottled with intention.",
          body: "Every batch begins on the farms we partner with. We work with small growers who share our standards for soil, season, and care — then press, blend, and bottle within hours of harvest. Nothing added, nothing taken away.",
          cta: "Read our story",
        },
        testimonial: {
          quote: "Genuinely the cleanest tasting cold-press I have come across. Beautifully packaged too.",
          author: "Vogue Wellness",
        },
      } },
      footer: { schema: {
        layout_variant: "newsletter_minimal",
        background_style: "panel",
        copyright: "All rights reserved.",
      } },
    },
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
  // ─── Placeholder: Yangu Plate (default emenu) — Phases 9–14 will ship real design ───
  {
    key: "emenu_visual_a",
    label: "Yangu Plate",
    description: "Default emenu template — clean menu layout (placeholder).",
    icon: "🍽️",
    patches: {},
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
  // ─── Esite sub-type placeholders (Phase 3 contracts; real designs ship in Phases 9–14) ───
  {
    key: "esite_consultancy_a",
    label: "Shield — Consultancy",
    description: "Consultancy / service business default (placeholder).",
    icon: "🛡️",
    patches: {},
  },
  {
    key: "esite_realestate_a",
    label: "Listing — Real Estate",
    description: "Real estate / property listings (placeholder).",
    icon: "🏘️",
    patches: {},
  },
  {
    key: "esite_hotel_a",
    label: "Luxra — Hotels",
    description: "Hotel / accommodation site (placeholder).",
    icon: "🏨",
    patches: {},
  },
  {
    key: "esite_travel_a",
    label: "Tripset — Travel",
    description: "Travel / tour operator site (placeholder).",
    icon: "✈️",
    patches: {},
  },
  {
    key: "esite_construction_a",
    label: "Build — Construction",
    description: "Construction / contractor site (placeholder).",
    icon: "🏗️",
    patches: {},
  },
  // ───────────────────────────────────────────────────────────────────
  // PRODUCTION ESITE TEMPLATES (11 sub-typed designs scraped from refs)
  // No commerce: inquiry/contact CTAs only. Each tagged by sub-type for
  // selectEsiteTemplateKey() routing. Layouts mirror the reference URLs.
  // ───────────────────────────────────────────────────────────────────
  {
    key: "esite_shieldpro",
    label: "ShieldPro — Consultancy",
    description: "Bold corporate consultancy site: trust-signal hero, services grid, team, inquiry form. Sub-type: consultancy.",
    icon: "🛡️",
    template_family: "esite_consultancy",
    preview_url: "https://shieldpro-theme.framer.website/",
    reference: {
      source: "link",
      url: "https://shieldpro-theme.framer.website/",
      label: "ShieldPro Framer template",
      sectionOrder: ["header", "hero", "services", "about", "team", "testimonials", "contact", "footer"],
      layoutPatterns: ["trust-badge-strip", "service-card-grid", "stat-row", "inquiry-form"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, show_search: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "split",
        headline: "Trusted Business Partner",
        subheadline: "Strategy, operations, and growth consulting for ambitious teams.",
        cta_label: "Book a Consultation",
        cta_link: "#contact",
        alignment: "left",
        background_style: "solid",
        primary_color_hint: "#0000EE",
      } },
      main_content: { schema: {
        heading: "Services",
        layout: "grid",
        accent_color: "#0000EE",
        items: [
          { title: "Strategy", description: "Plans that close the gap between vision and execution.", icon: "🛡️" },
          { title: "Operations", description: "Process design and efficiency programs that scale.", icon: "⚙️" },
          { title: "Growth", description: "Go-to-market and revenue acceleration playbooks.", icon: "📈" },
        ],
      } },
      footer: { schema: { heading: "Get in touch", email: "", phone: "", social: {} } },
    },
  },
  {
    key: "esite_interim",
    label: "Interim — Consultancy",
    description: "Editorial interior-design/consultancy aesthetic: dark green hero, peach accents, refined serif headlines. Sub-type: consultancy.",
    icon: "🪴",
    template_family: "esite_consultancy",
    preview_url: "https://interim.framer.website",
    reference: {
      source: "link",
      url: "https://interim.framer.website",
      label: "Interim Framer template",
      sectionOrder: ["header", "hero", "services", "about", "gallery", "testimonials", "contact", "footer"],
      layoutPatterns: ["serif-display-hero", "image-text-split", "soft-card-grid"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "full",
        headline: "Your Ideas, Our Creative Twist",
        subheadline: "Studio-led consultancy turning briefs into experiences people remember.",
        cta_label: "Start a Project",
        cta_link: "#contact",
        alignment: "left",
        background_style: "solid",
        primary_color_hint: "#1D322D",
        accent_color_hint: "#F3AC85",
      } },
      main_content: { schema: {
        heading: "What we do",
        layout: "grid",
        items: [
          { title: "Discovery", description: "Workshops that surface the real problem worth solving." },
          { title: "Design", description: "Concepts grounded in research and craft." },
          { title: "Delivery", description: "Hands-on execution from brief to launch." },
        ],
      } },
      footer: { schema: { heading: "Let's talk", email: "", phone: "", social: {} } },
    },
  },
  {
    key: "esite_loom",
    label: "Loom — Consultancy",
    description: "Warm artisan / lifestyle consultancy: editorial typography, cream palette, image-led storytelling. Sub-type: consultancy.",
    icon: "🧵",
    template_family: "esite_consultancy",
    preview_url: "https://lovable.dev/templates/websites/ecommerce/loom-artisan-fashion-e-commerce-storefront-template",
    reference: {
      source: "link",
      url: "https://lovable.dev/templates/websites/ecommerce/loom-artisan-fashion-e-commerce-storefront-template",
      label: "Loom artisan template (commerce stripped)",
      sectionOrder: ["header", "hero", "about", "services", "gallery", "testimonials", "contact", "footer"],
      layoutPatterns: ["editorial-hero", "story-image-split", "warm-neutral-palette"],
    },
    patches: {
      header: { schema: { layout_variant: "centered", show_cart_icon: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "full",
        headline: "Craft, considered.",
        subheadline: "A consultancy for makers, brands, and lifestyle ventures.",
        cta_label: "Work With Us",
        cta_link: "#contact",
        alignment: "center",
        background_style: "solid",
        primary_color_hint: "#1E1E1E",
      } },
      main_content: { schema: {
        heading: "Our practice",
        layout: "list",
        items: [
          { title: "Brand", description: "Identity and story that feel inevitable." },
          { title: "Product", description: "Range strategy from idea to shelf." },
          { title: "Studio", description: "Ongoing creative direction." },
        ],
      } },
      footer: { schema: { heading: "Studio", email: "", phone: "", social: {} } },
    },
  },
  {
    key: "esite_maison",
    label: "Maison — Consultancy",
    description: "Home & lifestyle consultancy: soft editorial layout, generous whitespace, large lifestyle photography. Sub-type: consultancy.",
    icon: "🏡",
    template_family: "esite_consultancy",
    preview_url: "https://lovable.dev/templates/websites/ecommerce/maison-artisan-home-lifestyle-store-template",
    reference: {
      source: "link",
      url: "https://lovable.dev/templates/websites/ecommerce/maison-artisan-home-lifestyle-store-template",
      label: "Maison artisan template (commerce stripped)",
      sectionOrder: ["header", "hero", "services", "about", "gallery", "testimonials", "contact", "footer"],
      layoutPatterns: ["serif-hero", "asymmetric-image-text", "soft-card-grid"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "split",
        headline: "Home & lifestyle consultancy",
        subheadline: "Spaces, products, and brands that feel like home.",
        cta_label: "Get in Touch",
        cta_link: "#contact",
        alignment: "left",
        background_style: "solid",
        primary_color_hint: "#1E1E1E",
      } },
      main_content: { schema: {
        heading: "Services",
        layout: "grid",
        items: [
          { title: "Interior Direction", description: "Layouts, palettes, and material curation." },
          { title: "Product Curation", description: "Sourcing pieces with purpose." },
          { title: "Brand Stories", description: "Editorial content that builds trust." },
        ],
      } },
      footer: { schema: { heading: "Maison", email: "", phone: "", social: {} } },
    },
  },
  {
    key: "esite_realisting",
    label: "Realisting — Real Estate",
    description: "Modern realtor site: hero search bar, featured listings grid, agent profiles, inquiry form. Sub-type: real_estate.",
    icon: "🏠",
    template_family: "esite_real_estate",
    preview_url: "https://realisting.framer.website",
    reference: {
      source: "link",
      url: "https://realisting.framer.website",
      label: "Realisting Framer template",
      sectionOrder: ["header", "hero_search", "listings", "agents", "testimonials", "contact", "footer"],
      layoutPatterns: ["hero-search-bar", "property-card-grid", "agent-profile-cards", "filter-chips"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, show_search: true, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "split",
        headline: "Find your next address.",
        subheadline: "Curated homes, transparent prices, agents who answer.",
        cta_label: "Search Listings",
        cta_link: "#listings",
        alignment: "left",
        background_style: "solid",
        show_search_bar: true,
        primary_color_hint: "#0000EE",
        accent_color_hint: "#DFF1C4",
      } },
      main_content: { schema: {
        heading: "Featured listings",
        layout: "grid",
        cards: { style: "image_top", image_ratio: "landscape", show_price: true, show_beds_baths: true, show_area: true },
        items: [],
      } },
      footer: { schema: { heading: "Contact our agents", email: "", phone: "", social: {} } },
    },
  },
  {
    key: "esite_toplistings",
    label: "Top Listings — Real Estate",
    description: "Premium real estate listings: refined neutral palette, serif headlines, large architectural photography. Sub-type: real_estate.",
    icon: "🏘️",
    template_family: "esite_real_estate",
    preview_url: "https://toplistings.framer.website/",
    reference: {
      source: "link",
      url: "https://toplistings.framer.website/",
      label: "Top Listings Framer template",
      sectionOrder: ["header", "hero", "listings", "agents", "testimonials", "contact", "footer"],
      layoutPatterns: ["serif-display-hero", "search-with-feature-image", "muted-neutral-grid"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_center", show_cart_icon: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "full",
        headline: "Luxury homes, unmatched listings.",
        subheadline: "A boutique portfolio of premium properties.",
        cta_label: "Browse Listings",
        cta_link: "#listings",
        alignment: "left",
        background_style: "solid",
        primary_color_hint: "#736959",
        accent_color_hint: "#9B6E12",
      } },
      main_content: { schema: {
        heading: "Latest listings",
        layout: "grid",
        cards: { style: "image_top", image_ratio: "landscape", show_price: true, show_beds_baths: true, show_area: true },
        items: [],
      } },
      footer: { schema: { heading: "Inquire", email: "", phone: "", social: {} } },
    },
  },
  {
    key: "esite_luxra",
    label: "Luxra — Luxury Hotel",
    description: "Luxury hotel site: full-bleed hero, suite cards with per-night rates, amenities, gallery, booking inquiry. Sub-type: hotel.",
    icon: "🏨",
    template_family: "esite_hotel",
    preview_url: "https://luxra.framer.website",
    reference: {
      source: "link",
      url: "https://luxra.framer.website",
      label: "Luxra Framer template",
      sectionOrder: ["header", "hero", "rooms", "amenities", "gallery", "reviews", "contact", "footer"],
      layoutPatterns: ["fullbleed-hero", "room-card-grid", "amenity-icons", "photo-gallery"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "full",
        headline: "Where every stay feels like a homecoming.",
        subheadline: "Boutique suites, private gardens, attentive service.",
        cta_label: "Book Your Stay",
        cta_link: "#contact",
        alignment: "left",
        background_style: "image",
        primary_color_hint: "#9C122A",
        accent_color_hint: "#FFEAD6",
      } },
      main_content: { schema: {
        heading: "Rooms & Suites",
        layout: "grid",
        cards: { style: "image_top", image_ratio: "landscape", show_price: true, price_suffix: "/night" },
        items: [
          { title: "Garden Suite", description: "King bed, terrace, garden views.", price: 220 },
          { title: "Pool Villa", description: "Private plunge pool, lounge area.", price: 380 },
          { title: "Heritage Room", description: "Restored interiors, courtyard view.", price: 160 },
        ],
      } },
      footer: { schema: { heading: "Reservations", email: "", phone: "", address: "", social: {} } },
    },
  },
  {
    key: "esite_telvin",
    label: "Telvin — Boutique Hotel",
    description: "Boutique hotel: warm beige palette, deep teal, serif/sans mix, garden and spa imagery, room cards. Sub-type: hotel.",
    icon: "🛎️",
    template_family: "esite_hotel",
    preview_url: "https://telvin.framer.website",
    reference: {
      source: "link",
      url: "https://telvin.framer.website",
      label: "Telvin Framer template",
      sectionOrder: ["header", "hero", "rooms", "amenities", "gallery", "contact", "footer"],
      layoutPatterns: ["asymmetric-hero", "warm-card-grid", "amenity-icons", "garden-imagery"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "split",
        headline: "Book your room. Slow your day.",
        subheadline: "A boutique retreat with garden suites and a quiet spa.",
        cta_label: "Book Now",
        cta_link: "#contact",
        alignment: "left",
        background_style: "solid",
        primary_color_hint: "#2D6255",
        accent_color_hint: "#FC6213",
      } },
      main_content: { schema: {
        heading: "Stay with us",
        layout: "grid",
        cards: { style: "image_top", image_ratio: "landscape", show_price: true, price_suffix: "/night" },
        items: [],
      } },
      footer: { schema: { heading: "Visit", email: "", phone: "", address: "", social: {} } },
    },
  },
  {
    key: "esite_tripset",
    label: "Tripset — Travel",
    description: "Travel & tour operator: hero with tour search, featured packages with duration and price, destination cards. Sub-type: travel.",
    icon: "✈️",
    template_family: "esite_travel",
    preview_url: "https://tripset.framer.website/",
    reference: {
      source: "link",
      url: "https://tripset.framer.website/",
      label: "Tripset Framer template",
      sectionOrder: ["header", "hero", "tours", "destinations", "testimonials", "contact", "footer"],
      layoutPatterns: ["search-hero", "tour-card-grid", "destination-tiles", "review-strip"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "full",
        headline: "Explore tours, your way.",
        subheadline: "Curated journeys across the continent — book in minutes.",
        cta_label: "Explore Tours",
        cta_link: "#tours",
        alignment: "center",
        background_style: "image",
        primary_color_hint: "#0A0322",
        accent_color_hint: "#FF6321",
      } },
      main_content: { schema: {
        heading: "Featured tours",
        layout: "grid",
        cards: { style: "image_top", image_ratio: "landscape", show_price: true, show_duration: true },
        items: [],
      } },
      footer: { schema: { heading: "Plan a trip", email: "", phone: "", social: {} } },
    },
  },
  {
    key: "esite_key",
    label: "Key — Travel",
    description: "Light, airy travel agency: beach-paradise hero, package cards with prices, destination tiles. Sub-type: travel.",
    icon: "🏝️",
    template_family: "esite_travel",
    preview_url: "https://key-assumptions-833053.framer.app",
    reference: {
      source: "link",
      url: "https://key-assumptions-833053.framer.app",
      label: "Key Assumptions / Travely Framer template",
      sectionOrder: ["header", "hero", "packages", "destinations", "testimonials", "contact", "footer"],
      layoutPatterns: ["paradise-hero", "package-card-grid", "destination-tiles"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_center", show_cart_icon: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "full",
        headline: "Escape to Paradise",
        subheadline: "Hand-picked beach, mountain, and city escapes.",
        cta_label: "Browse Packages",
        cta_link: "#tours",
        alignment: "center",
        background_style: "image",
        primary_color_hint: "#558FFC",
      } },
      main_content: { schema: {
        heading: "Packages",
        layout: "grid",
        cards: { style: "image_top", image_ratio: "landscape", show_price: true, show_duration: true },
        items: [],
      } },
      footer: { schema: { heading: "Plan your escape", email: "", phone: "", social: {} } },
    },
  },
  {
    key: "esite_estatoo",
    label: "Estatoo — Construction",
    description: "Construction company: bold lime accent, hero with site photography, services, project portfolio, stats, Get a Quote. Sub-type: construction.",
    icon: "🏗️",
    template_family: "esite_construction",
    preview_url: "https://estatoo.framer.website",
    reference: {
      source: "link",
      url: "https://estatoo.framer.website",
      label: "Estatoo Framer template",
      sectionOrder: ["header", "hero", "services", "projects", "stats", "team", "certifications", "contact", "footer"],
      layoutPatterns: ["bold-headline-hero", "service-card-grid", "project-portfolio-grid", "stats-row"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true } },
      hero: { schema: {
        layout_variant: "split",
        headline: "Trusted construction, on time, on budget.",
        subheadline: "Commercial and residential builds delivered by an experienced crew.",
        cta_label: "Get a Quote",
        cta_link: "#contact",
        alignment: "left",
        background_style: "solid",
        primary_color_hint: "#AFEB63",
      } },
      main_content: { schema: {
        heading: "Services",
        layout: "grid",
        items: [
          { title: "New Builds", description: "Ground-up commercial and residential construction.", icon: "🏗️" },
          { title: "Renovations", description: "Extensions, refits, and structural upgrades.", icon: "🔨" },
          { title: "Project Management", description: "End-to-end coordination from permits to handover.", icon: "📋" },
        ],
      } },
      footer: { schema: { heading: "Get a Quote", email: "", phone: "", address: "", social: {} } },
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
  // ─── BioBurst — vibrant gradient default link-in-bio ───
  {
    key: "influencer_bioburst",
    label: "BioBurst",
    description: "Vibrant gradient link-in-bio — bold typography, animated highlight cards, magenta→orange palette (ref: bioburst.framer.website)",
    icon: "💥",
    patches: {
      header: { schema: {
        layout_variant: "link_bio_header", logo_position: "center", logo_size: "large",
        show_name: true, name_next_to_logo: false, show_cart_icon: false, show_search: false,
        menu_layout_style: "none", bio_mode: true, avatar_style: "circle_large",
        social_icons_position: "below_name", background_style: "gradient_vibrant",
      } },
      hero: { schema: {
        layout_variant: "link_bio_profile", alignment: "center",
        background_style: "gradient", background_gradient: "linear-gradient(135deg, hsl(330 90% 55%), hsl(25 95% 55%), hsl(45 95% 60%))",
        headline: "", subheadline: "", cta_text: "",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.15, spacing: "comfortable",
        typography_style: "creator_bold", text_color: "light",
        avatar_enabled: true, social_row_enabled: true, search_enabled: false,
      } },
      main_content: { schema: {
        display_mode: "link_buttons", heading: "",
        filters_enabled: false, sort_enabled: false,
        cards: { style: "link_button", card_style: "rounded_full", hover_effect: "glow" },
        spacing: "comfortable", items: [],
      } },
      showcase: { schema: {
        showcase_display: "carousel", heading: "My Picks", showcase_items: [],
      } },
      offer: { schema: {
        layout_variant: "link_bio_gallery", display_mode: "link_bio_gallery",
        heading: "", spacing: "comfortable",
        social_gallery: { enabled: true, platform: "instagram", columns: 3 },
        newsletter: { enabled: false, heading: "", cta_text: "Submit" },
      } },
      footer: { schema: {
        layout_variant: "link_bio_footer", display_mode: "link_bio_footer",
        email: "", social: {},
      } },
    },
  },
  // ─── LinkNest — ultra-minimal clean link page ───
  {
    key: "influencer_linknest",
    label: "LinkNest",
    description: "Ultra-minimal link page — white palette, pill outline buttons, maximum whitespace (ref: framer.com/marketplace/templates/linknest)",
    icon: "🪺",
    patches: {
      header: { schema: {
        layout_variant: "link_bio_header", logo_position: "center", logo_size: "medium",
        show_name: true, name_next_to_logo: false, show_cart_icon: false, show_search: false,
        menu_layout_style: "none", bio_mode: true, avatar_style: "circle_medium",
        social_icons_position: "below_name", background_style: "solid_light",
      } },
      hero: { schema: {
        layout_variant: "link_bio_profile", alignment: "center",
        background_style: "solid_light", background_color: "hsl(0 0% 100%)",
        headline: "", subheadline: "", cta_text: "",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0, spacing: "spacious",
        typography_style: "creator_minimal", text_color: "dark",
        avatar_enabled: true, social_row_enabled: true, search_enabled: false,
      } },
      main_content: { schema: {
        display_mode: "link_buttons", heading: "",
        filters_enabled: false, sort_enabled: false,
        cards: { style: "link_button", card_style: "rounded_full", hover_effect: "subtle", variant: "outline" },
        spacing: "spacious", items: [],
      } },
      showcase: { schema: {
        showcase_display: "list", heading: "", showcase_items: [],
      } },
      offer: { schema: {
        layout_variant: "link_bio_gallery", display_mode: "link_bio_gallery",
        heading: "", spacing: "spacious",
        social_gallery: { enabled: false },
        newsletter: { enabled: false, heading: "", cta_text: "Submit" },
      } },
      footer: { schema: {
        layout_variant: "link_bio_footer", display_mode: "link_bio_footer",
        email: "", social: {},
      } },
    },
  },
  // ─── LinkHunt — bold high-contrast link page ───
  {
    key: "influencer_linkhunt",
    label: "LinkHunt",
    description: "Bold high-contrast link page — dark background, photo-backed link cards, heavy display type (ref: linkhunt.framer.website)",
    icon: "🎯",
    patches: {
      header: { schema: {
        layout_variant: "link_bio_header", logo_position: "center", logo_size: "large",
        show_name: true, name_next_to_logo: false, show_cart_icon: false, show_search: false,
        menu_layout_style: "none", bio_mode: true, avatar_style: "square_large",
        social_icons_position: "below_name", background_style: "solid_dark",
      } },
      hero: { schema: {
        layout_variant: "link_bio_media_hero", alignment: "center",
        background_style: "solid_dark", background_color: "hsl(0 0% 6%)",
        headline: "", subheadline: "", cta_text: "",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.4, spacing: "spacious",
        typography_style: "creator_bold", text_color: "light",
        avatar_enabled: true, social_row_enabled: true, search_enabled: false,
        full_bleed: true,
      } },
      main_content: { schema: {
        display_mode: "link_cards_media", heading: "",
        filters_enabled: false, sort_enabled: false,
        cards: { style: "link_card_image", card_style: "rounded_lg", hover_effect: "lift", variant: "image_bg" },
        spacing: "comfortable", items: [],
      } },
      showcase: { schema: {
        showcase_display: "grid", heading: "Featured", showcase_items: [],
      } },
      offer: { schema: {
        layout_variant: "link_bio_featured", display_mode: "link_bio_featured",
        heading: "", spacing: "comfortable", items: [],
        social_gallery: { enabled: false },
        newsletter: { enabled: false, heading: "", cta_text: "Subscribe" },
      } },
      footer: { schema: {
        layout_variant: "link_bio_footer", display_mode: "link_bio_footer",
        email: "", social: {},
      } },
    },
  },
  // ─── Teespring — creator merch / product-forward link page ───
  {
    key: "influencer_teespring",
    label: "Teespring Merch",
    description: "Creator merch storefront — profile header on top, 2-column product grid below with external buy links (ref: teespring.com creator pages)",
    icon: "👕",
    patches: {
      header: { schema: {
        layout_variant: "link_bio_header", logo_position: "center", logo_size: "medium",
        show_name: true, name_next_to_logo: false, show_cart_icon: false, show_search: false,
        menu_layout_style: "none", bio_mode: true, avatar_style: "circle_medium",
        social_icons_position: "below_name", background_style: "solid_light",
      } },
      hero: { schema: {
        layout_variant: "link_bio_profile", alignment: "center",
        background_style: "solid_light", background_color: "hsl(0 0% 100%)",
        headline: "", subheadline: "", cta_text: "Shop My Merch",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0, spacing: "comfortable",
        typography_style: "creator_centered", text_color: "dark",
        avatar_enabled: true, social_row_enabled: true, search_enabled: false,
      } },
      main_content: { schema: {
        display_mode: "link_buttons", heading: "",
        filters_enabled: false, sort_enabled: false,
        cards: { style: "link_button", card_style: "rounded_lg", hover_effect: "lift" },
        spacing: "compact", items: [],
      } },
      showcase: { schema: {
        showcase_display: "grid", heading: "My Merch",
        columns: 2,
        showcase_items: [
          { title: "Signature Tee", description: "Soft cotton, creator drop", image_url: "", link_url: "", price: "$29" },
          { title: "Logo Hoodie", description: "Heavyweight pullover", image_url: "", link_url: "", price: "$55" },
          { title: "Tour Tee", description: "Limited edition", image_url: "", link_url: "", price: "$32" },
          { title: "Snapback Cap", description: "Embroidered logo", image_url: "", link_url: "", price: "$25" },
        ],
      } },
      offer: { schema: {
        layout_variant: "link_bio_gallery", display_mode: "link_bio_gallery",
        heading: "", spacing: "comfortable",
        social_gallery: { enabled: true, platform: "instagram", columns: 3 },
        newsletter: { enabled: true, heading: "Restock alerts", cta_text: "Notify me" },
      } },
      footer: { schema: {
        layout_variant: "link_bio_footer", display_mode: "link_bio_footer",
        email: "", social: {},
      } },
    },
  },
  // ─── Creator Bio — editorial personal brand ───
  {
    key: "influencer_creatorbio",
    label: "Creator Bio",
    description: "Editorial personal brand page — photo-heavy header, serif display type, refined hierarchy (ref: creator-bio.framer.website)",
    icon: "📷",
    patches: {
      header: { schema: {
        layout_variant: "link_bio_header", logo_position: "center", logo_size: "medium",
        show_name: false, name_next_to_logo: false, show_cart_icon: false, show_search: false,
        menu_layout_style: "none", bio_mode: true, avatar_style: "none",
        social_icons_position: "in_hero", background_style: "solid_cream",
      } },
      hero: { schema: {
        layout_variant: "link_bio_media_hero", alignment: "center",
        background_style: "solid_light", background_color: "hsl(40 30% 96%)",
        headline: "", subheadline: "", cta_text: "",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.1, spacing: "spacious",
        typography_style: "creator_editorial", text_color: "dark",
        avatar_enabled: false, social_row_enabled: true, search_enabled: false,
        full_bleed: true,
      } },
      main_content: { schema: {
        display_mode: "link_buttons", heading: "",
        filters_enabled: false, sort_enabled: false,
        cards: { style: "link_text", card_style: "underline", hover_effect: "underline", variant: "ghost" },
        spacing: "spacious", items: [],
      } },
      showcase: { schema: {
        showcase_display: "list", heading: "Selected Work", showcase_items: [],
      } },
      offer: { schema: {
        layout_variant: "link_bio_gallery", display_mode: "link_bio_gallery",
        heading: "", spacing: "spacious",
        social_gallery: { enabled: true, platform: "instagram", columns: 2 },
        newsletter: { enabled: true, heading: "Subscribe to the Journal", cta_text: "Subscribe" },
      } },
      footer: { schema: {
        layout_variant: "link_bio_footer", display_mode: "link_bio_footer",
        email: "", social: {},
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
  // ───────────────────────────────────────────────────────────────────
  // 11 production community templates across 3 sub-types:
  //   events / courses / freelance
  // Sub-type is carried on `template_family` (community_<subtype>) so the
  // community editor can resolve quick actions + section palette from it.
  // No commerce features — Events CTA = Register, Courses CTA = Enroll,
  // Freelance CTA = Hire Me / Book a Call.
  // ───────────────────────────────────────────────────────────────────
  {
    key: "community_eventverse",
    label: "EventVerse — Conference",
    description: "Large-scale conference layout: bold hero, multi-track schedule, speakers grid, sponsors, inquiry form. Sub-type: events.",
    icon: "🎤",
    template_family: "community_events",
    preview_url: "https://event-verse.framer.website/",
    reference: {
      source: "link",
      url: "https://event-verse.framer.website/?via=basit18",
      label: "EventVerse Framer template",
      sectionOrder: ["header", "hero", "schedule", "speakers", "sponsors", "about", "contact", "footer"],
      layoutPatterns: ["bold-hero", "track-schedule", "speaker-grid", "sponsor-strip", "register-cta"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, show_search: false, name_next_to_logo: true, nav_items: ["Schedule", "Speakers", "Sponsors", "Register"] } },
      hero: { schema: { layout_variant: "fullwidth_center", headline: "The Conference Reimagined", subheadline: "Three days. Four tracks. One unforgettable gathering.", cta_label: "Register Now", cta_link: "#register", alignment: "center", background_style: "solid_dark", primary_color_hint: "#5B2EFF", text_color: "light", typography_style: "bold_uppercase", community_subtype: "events" } },
      main_content: { schema: { heading: "Schedule", layout: "track_schedule", display_mode: "events", accent_color: "#5B2EFF", items: [ { title: "Day 1 — Opening Keynote", description: "09:00 · Main Stage", icon: "🎤" }, { title: "Day 2 — Workshops", description: "All day · Tracks A–D", icon: "🛠️" }, { title: "Day 3 — Closing Panel", description: "16:00 · Main Stage", icon: "🎬" } ] } },
      footer: { schema: { heading: "Get in touch", email: "", phone: "", social: {} } },
    },
  },
  {
    key: "community_wandersolo",
    label: "WanderSolo — Travel Meetup",
    description: "Travel community / meetup vibe: warm destination hero, trip cards, member spotlights. Sub-type: events.",
    icon: "🌄",
    template_family: "community_events",
    preview_url: "https://wandersolotemplate-vaibhavizanwar.framer.website",
    reference: {
      source: "link",
      url: "https://wandersolotemplate-vaibhavizanwar.framer.website",
      label: "WanderSolo Framer template",
      sectionOrder: ["header", "hero", "trips", "about", "testimonials", "contact", "footer"],
      layoutPatterns: ["destination-hero", "trip-card-grid", "warm-earthy-palette"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true, nav_items: ["Trips", "Community", "About", "Join"] } },
      hero: { schema: { layout_variant: "full", headline: "Join the trip", subheadline: "Solo travelers, group adventures. Find your next journey with people who get it.", cta_label: "Register Interest", cta_link: "#register", alignment: "center", background_style: "image_overlay", primary_color_hint: "#E8743B", text_color: "light", community_subtype: "events" } },
      main_content: { schema: { heading: "Upcoming Trips", layout: "grid", display_mode: "events", accent_color: "#E8743B", items: [ { title: "Patagonia Trek", description: "March 2026 · 10 days", icon: "🏔️" }, { title: "Morocco Desert", description: "April 2026 · 7 days", icon: "🐪" }, { title: "Vietnam Loop", description: "May 2026 · 14 days", icon: "🛵" } ] } },
      footer: { schema: { heading: "Wander with us", email: "", social: {} } },
    },
  },
  {
    key: "community_padelix",
    label: "Padelix — Sports Event",
    description: "Energetic high-contrast sports event layout: action hero, tournament schedule, ticket tiers. Sub-type: events.",
    icon: "🎾",
    template_family: "community_events",
    preview_url: "https://padelix.framer.website",
    reference: {
      source: "link",
      url: "https://padelix.framer.website",
      label: "Padelix Framer template",
      sectionOrder: ["header", "hero", "tournament", "schedule", "tickets", "sponsors", "contact", "footer"],
      layoutPatterns: ["high-contrast-hero", "stats-row", "ticket-tier-grid"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true, nav_items: ["Tournament", "Schedule", "Tickets", "Sponsors"] } },
      hero: { schema: { layout_variant: "full", headline: "Feel the Padel", subheadline: "The championship returns. New venue. Bigger prize pool. Same energy.", cta_label: "Get Tickets", cta_link: "#tickets", alignment: "left", background_style: "solid_dark", primary_color_hint: "#E8FF2A", text_color: "light", typography_style: "bold_uppercase", community_subtype: "events" } },
      main_content: { schema: { heading: "Tournament Info", layout: "grid", display_mode: "events", accent_color: "#E8FF2A", items: [ { title: "Day Pass — $89", description: "Access to all courts, one day", icon: "🎟️" }, { title: "Weekend Pass — $189", description: "Full tournament access, all days", icon: "🏆" }, { title: "VIP Lounge — $349", description: "Premium seating + hospitality", icon: "⭐" } ] } },
      footer: { schema: { heading: "See you on court", email: "", social: {} } },
    },
  },
  {
    key: "community_brightmind",
    label: "BrightMind — Online Courses",
    description: "Clean academic course platform: light palette, course grid, instructor profile, enrollment CTA. Sub-type: courses.",
    icon: "🎓",
    template_family: "community_courses",
    preview_url: "https://brightmind-theme.framer.website",
    reference: {
      source: "link",
      url: "https://brightmind-theme.framer.website",
      label: "BrightMind Framer template",
      sectionOrder: ["header", "hero", "courses", "curriculum", "instructor", "testimonials", "faq", "contact", "footer"],
      layoutPatterns: ["clean-academic", "course-card-grid", "syllabus-list", "instructor-profile"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, show_search: true, name_next_to_logo: true, nav_items: ["Courses", "Instructor", "About", "Enroll"] } },
      hero: { schema: { layout_variant: "split", headline: "Online courses that respect your time", subheadline: "Practical, instructor-led learning for working professionals.", cta_label: "Enroll Now", cta_link: "#enroll", alignment: "left", background_style: "solid_light", primary_color_hint: "#3B82F6", community_subtype: "courses" } },
      main_content: { schema: { heading: "Courses", layout: "grid", display_mode: "courses", accent_color: "#3B82F6", items: [ { title: "Foundations", description: "8 modules · Beginner · Self-paced", icon: "📘" }, { title: "Intermediate Track", description: "12 modules · Intermediate · 6 weeks", icon: "📗" }, { title: "Advanced Cohort", description: "Live · Advanced · 8 weeks", icon: "📕" } ] } },
      footer: { schema: { heading: "Questions?", email: "", social: {} } },
    },
  },
  {
    key: "community_gearup",
    label: "GearUp — Skills Training",
    description: "Achievement-oriented skills training: bold dark hero with orange accents, course grid, progress framing. Sub-type: courses.",
    icon: "🛠️",
    template_family: "community_courses",
    preview_url: "https://gearup-template.framer.website",
    reference: {
      source: "link",
      url: "https://gearup-template.framer.website",
      label: "GearUp Framer template",
      sectionOrder: ["header", "hero", "courses", "instructor", "outcomes", "testimonials", "contact", "footer"],
      layoutPatterns: ["dark-bold-hero", "progress-bar-cards", "outcome-stats"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true, nav_items: ["Courses", "Outcomes", "Instructor", "Join"] } },
      hero: { schema: { layout_variant: "full", headline: "Level up your skills", subheadline: "Hands-on training programs built for measurable progress.", cta_label: "Join Course", cta_link: "#enroll", alignment: "left", background_style: "solid_dark", primary_color_hint: "#FF7A1A", text_color: "light", typography_style: "bold_uppercase", community_subtype: "courses" } },
      main_content: { schema: { heading: "Training Tracks", layout: "grid", display_mode: "courses", accent_color: "#FF7A1A", items: [ { title: "Skill Track A", description: "6 weeks · Project-based", icon: "🔧" }, { title: "Skill Track B", description: "8 weeks · Cohort", icon: "⚙️" }, { title: "Mastery Program", description: "12 weeks · Mentor-led", icon: "🏅" } ] } },
      footer: { schema: { heading: "Train with us", email: "", social: {} } },
    },
  },
  {
    key: "community_linkhunt_freelance",
    label: "LinkHunt — Freelance Services",
    description: "Bold high-contrast freelance services page: services list, portfolio thumbnails, Hire Me CTA. Sub-type: freelance.",
    icon: "💼",
    template_family: "community_freelance",
    preview_url: "https://linkhunt.framer.website",
    reference: {
      source: "link",
      url: "https://linkhunt.framer.website",
      label: "LinkHunt Framer template (freelance services adaptation)",
      sectionOrder: ["header", "hero", "services", "portfolio", "process", "testimonials", "contact", "footer"],
      layoutPatterns: ["bold-contrast-hero", "services-list", "portfolio-grid", "hire-me-cta"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true, nav_items: ["Work", "Services", "About", "Contact"] } },
      hero: { schema: { layout_variant: "full", headline: "Freelance, made simple.", subheadline: "Design, build, and ship the things you've been putting off.", cta_label: "Hire Me", cta_link: "#contact", alignment: "left", background_style: "solid_dark", primary_color_hint: "#C9FF2A", text_color: "light", typography_style: "bold_uppercase", community_subtype: "freelance" } },
      main_content: { schema: { heading: "Services", layout: "grid", display_mode: "services", accent_color: "#C9FF2A", items: [ { title: "Brand & Identity", description: "Logo, guidelines, system.", icon: "🎨" }, { title: "Website Design", description: "Marketing sites, end to end.", icon: "🖥️" }, { title: "Product UX", description: "Flows, prototypes, handoff.", icon: "🧩" } ] } },
      footer: { schema: { heading: "Let's work together", email: "", social: {} } },
    },
  },
  {
    key: "community_frederick",
    label: "Frederick — Creative Portfolio",
    description: "Bold asymmetric creative portfolio: editorial typography, large project thumbnails, strong personality. Sub-type: freelance.",
    icon: "🖼️",
    template_family: "community_freelance",
    preview_url: "https://fredericktemplate.framer.website",
    reference: {
      source: "link",
      url: "https://fredericktemplate.framer.website",
      label: "Frederick Framer template",
      sectionOrder: ["header", "hero", "portfolio", "about", "services", "testimonials", "contact", "footer"],
      layoutPatterns: ["asymmetric-grid", "editorial-typography", "large-project-cards", "warm-cream-palette"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true, nav_items: ["Work", "About", "Services", "Contact"] } },
      hero: { schema: { layout_variant: "split", headline: "Feel it. Live it.", subheadline: "Independent creative working with brands who care about craft.", cta_label: "Hire Me", cta_link: "#contact", alignment: "left", background_style: "solid_light", primary_color_hint: "#1A1A1A", accent_color_hint: "#F4C792", community_subtype: "freelance" } },
      main_content: { schema: { heading: "Selected work", layout: "asymmetric_grid", display_mode: "portfolio", accent_color: "#F4C792", items: [ { title: "Project A", description: "Brand · 2025", icon: "🎯" }, { title: "Project B", description: "Web · 2025", icon: "💻" }, { title: "Project C", description: "Print · 2024", icon: "📰" } ] } },
      footer: { schema: { heading: "Say hello", email: "", social: {} } },
    },
  },
  {
    key: "community_linknest_freelance",
    label: "LinkNest — Minimal Services",
    description: "Minimal freelance services page: soft palette, clean service cards, Book a Call CTA. Sub-type: freelance.",
    icon: "🪺",
    template_family: "community_freelance",
    preview_url: "https://www.framer.com/marketplace/templates/linknest/",
    reference: {
      source: "link",
      url: "https://www.framer.com/marketplace/templates/linknest/",
      label: "LinkNest Framer marketplace template (freelance services adaptation)",
      sectionOrder: ["header", "hero", "services", "process", "about", "contact", "footer"],
      layoutPatterns: ["minimal-hero", "soft-card-grid", "book-call-cta"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true, nav_items: ["Services", "About", "Process", "Contact"] } },
      hero: { schema: { layout_variant: "fullwidth_center", headline: "Independent design services", subheadline: "Calm, considered work for thoughtful teams.", cta_label: "Book a Call", cta_link: "#contact", alignment: "center", background_style: "solid_light", primary_color_hint: "#0F172A", community_subtype: "freelance" } },
      main_content: { schema: { heading: "Services", layout: "grid", display_mode: "services", accent_color: "#0F172A", items: [ { title: "Strategy", description: "Positioning and creative direction.", icon: "🧭" }, { title: "Design", description: "Brand, web, and product surfaces.", icon: "✏️" }, { title: "Build", description: "Ship-ready websites and prototypes.", icon: "🚀" } ] } },
      footer: { schema: { heading: "Get in touch", email: "", social: {} } },
    },
  },
  {
    key: "community_porty",
    label: "Porty — Minimal Portfolio",
    description: "Minimal typography-led portfolio: maximum whitespace, monochrome, small project list. Sub-type: freelance.",
    icon: "✒️",
    template_family: "community_freelance",
    preview_url: "https://porty.framer.ai",
    reference: {
      source: "link",
      url: "https://porty.framer.ai",
      label: "Porty Framer template",
      sectionOrder: ["header", "hero", "portfolio", "about", "contact", "footer"],
      layoutPatterns: ["typography-led-hero", "minimal-project-list", "monochrome-palette"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_split", show_cart_icon: false, name_next_to_logo: true, nav_items: ["Work", "About", "Contact"] } },
      hero: { schema: { layout_variant: "fullwidth_center", headline: "Quietly building good things.", subheadline: "Independent designer / developer for hire.", cta_label: "View My Work", cta_link: "#work", alignment: "center", background_style: "solid_light", primary_color_hint: "#0A0A0A", community_subtype: "freelance" } },
      main_content: { schema: { heading: "Work", layout: "list", display_mode: "portfolio", accent_color: "#0A0A0A", items: [ { title: "Project One", description: "2025", icon: "·" }, { title: "Project Two", description: "2024", icon: "·" }, { title: "Project Three", description: "2024", icon: "·" } ] } },
      footer: { schema: { heading: "Email me", email: "", social: {} } },
    },
  },
  {
    key: "community_portfon",
    label: "Portfon — Developer Portfolio",
    description: "Professional developer / designer portfolio: dark mode with blue accents, case studies grid. Sub-type: freelance.",
    icon: "💻",
    template_family: "community_freelance",
    preview_url: "https://portfon.framer.website",
    reference: {
      source: "link",
      url: "https://portfon.framer.website",
      label: "Portfon Framer template",
      sectionOrder: ["header", "hero", "portfolio", "services", "about", "testimonials", "contact", "footer"],
      layoutPatterns: ["dark-mode-hero", "case-study-grid", "stack-row"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true, nav_items: ["Work", "Services", "About", "Contact"] } },
      hero: { schema: { layout_variant: "fullwidth_center", headline: "Designing & building products people use.", subheadline: "Independent product designer & front-end engineer.", cta_label: "Hire Me", cta_link: "#contact", alignment: "center", background_style: "solid_dark", primary_color_hint: "#3B82F6", text_color: "light", community_subtype: "freelance" } },
      main_content: { schema: { heading: "Recent work", layout: "grid", display_mode: "portfolio", accent_color: "#3B82F6", items: [ { title: "Case Study A", description: "Product · 2025", icon: "📊" }, { title: "Case Study B", description: "Web app · 2025", icon: "🧪" }, { title: "Case Study C", description: "Marketing site · 2024", icon: "🌐" } ] } },
      footer: { schema: { heading: "Let's talk", email: "", social: {} } },
    },
  },
  {
    key: "community_porta",
    label: "Porta — Creative Editorial Portfolio",
    description: "Editorial creative portfolio: warm terracotta and cream palette, large project images, elegant serif. Sub-type: freelance.",
    icon: "🏜️",
    template_family: "community_freelance",
    preview_url: "https://porta.framer.ai",
    reference: {
      source: "link",
      url: "https://porta.framer.ai",
      label: "Porta Framer template",
      sectionOrder: ["header", "hero", "portfolio", "about", "services", "contact", "footer"],
      layoutPatterns: ["editorial-serif-hero", "large-image-stack", "warm-earthy-palette"],
    },
    patches: {
      header: { schema: { layout_variant: "nav_right", show_cart_icon: false, name_next_to_logo: true, nav_items: ["Portfolio", "Selected", "About", "Contact"] } },
      hero: { schema: { layout_variant: "split", headline: "A portfolio of considered work.", subheadline: "Independent creative direction & art direction for brands worth caring about.", cta_label: "Get a Quote", cta_link: "#contact", alignment: "left", background_style: "solid_light", primary_color_hint: "#C9542C", accent_color_hint: "#F4E6D6", community_subtype: "freelance" } },
      main_content: { schema: { heading: "Selected", layout: "editorial", display_mode: "portfolio", accent_color: "#C9542C", items: [ { title: "Larapoous", description: "Direction · 2025", icon: "🏛️" }, { title: "Form & Trace", description: "Identity · 2024", icon: "🪨" }, { title: "Other Projects", description: "Various · 2023–24", icon: "📐" } ] } },
      footer: { schema: { heading: "Say hello", email: "", social: {} } },
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

  // ─── Minna — Editorial Fashion (moved from Eshop registry per Builder Bible) ───
  // Reference: https://minna.framer.website
  // Component is unchanged; only the registry category was reassigned and the
  // key was renamed eshop_minna → estore_minna.
  {
    key: "estore_minna",
    label: "Minna — Fashion",
    description: "Editorial fashion store: centered serif wordmark, full-bleed hero, bright marquee strip, minimal 4-up product grid.",
    icon: "👗",
    is_active: true,
    template_family: "minna",
    preview_url: "https://minna.framer.website",
    reference: {
      source: "link",
      url: "https://minna.framer.website",
      label: "Minna Framer template",
      sectionOrder: ["header", "hero_fullbleed", "marquee", "products", "collections", "footer"],
      layoutPatterns: ["centered_serif_wordmark", "hamburger_left_nav", "fullbleed_hero_image", "bright_marquee_strip", "minimal_4col_product_grid", "two_up_collection_blocks"],
    },
    patches: {
      header: { schema: {
        layout_variant: "centered_wordmark_split_nav",
        logo_position: "center",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: false,
        show_cart_icon: true,
        show_search: true,
        nav_left: ["Women", "Men"],
        nav_items: ["Women", "Men"],
        background_style: "light",
      } },
      hero: { schema: {
        layout_variant: "fullbleed_image",
        background_style: "image",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        marquee_words: ["%20 DISCOUNT", "NEW SEASON", "%20 DISCOUNT", "NEW SEASON", "%20 DISCOUNT", "NEW SEASON"],
        spacing: "none",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Products",
        cta_text: "See all",
        layout_style: "grid",
        columns_desktop: 4,
        columns_mobile: 2,
        cards: { style: "image_top", image_ratio: "portrait", show_price: true, show_title: true, show_cta: false, card_style: "minimal", hover_effect: "zoom" },
        grid: { columns_desktop: 4, columns_mobile: 2, gap: "lg" },
        spacing: "spacious",
        items: [
          { title: "Pink Bucket Hat & Jacket", price: "$78" },
          { title: "Yellow Sunglasses Look", price: "$92" },
          { title: "Pink Sunglasses Editorial", price: "$108" },
          { title: "Soft Curls Beauty", price: "$64" },
        ],
      } },
      offer: { schema: {
        layout_variant: "two_up_collections",
        collections: [
          { title: "Women", subtitle: "New Season" },
          { title: "Men", subtitle: "Essentials" },
        ],
      } },
      footer: { schema: {
        layout_variant: "centered_wordmark",
        background_style: "light",
        tagline: "New season, new you. Shop the latest editorial collection.",
        columns: [
          { title: "Shop", links: ["Women", "Men", "New Arrivals", "Sale"] },
          { title: "Help", links: ["Shipping", "Returns", "Size Guide", "Contact"] },
          { title: "About", links: ["Our Story", "Sustainability", "Press"] },
        ],
        copyright: "All rights reserved.",
      } },
    },
  },
];

// ─── Phase 14: B2B Estore additions ───
// Scraped from: monchies.framer.website, html.aqlova.com/bazaro-prev/...
// All retail CTAs ("Add to Cart", "Buy Now", "Shop Now") are replaced
// with B2B equivalents ("Request Quote", "Contact Supplier"). Every
// product card carries an MOQ badge + unit field.
ESTORE_TEMPLATES.push(
  // ─── Monchies — Food & Beverage Wholesale ───
  // Reference: https://monchies.framer.website
  {
    key: "estore_monchies",
    label: "Monchies — Food & Beverage",
    description: "Playful packaged-goods wholesale: cream background, bold Bungee headlines, orange accent, product showcase with MOQ + wholesale prices.",
    icon: "🍪",
    is_active: true,
    template_family: "monchies",
    preview_url: "https://monchies.framer.website",
    reference: {
      source: "link",
      url: "https://monchies.framer.website",
      label: "Monchies Framer template",
      sectionOrder: ["header", "hero", "trust_marquee", "features", "products", "supplier_profile", "contact", "footer"],
      layoutPatterns: ["bold_display_heading", "cream_warm_background", "orange_accent_cta", "rounded_button_pills", "trust_marquee_strip", "feature_icons_row", "packaged_product_cards"],
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
        nav_items: ["Home", "Catalog", "About", "Press", "Contact"],
        background_style: "light",
        background_color: "hsl(45 70% 96%)",
      } },
      hero: { schema: {
        layout_variant: "split",
        alignment: "left",
        background_style: "solid_light",
        background_color: "hsl(45 70% 96%)",
        headline: "Wholesale Snacks Stores Love",
        subheadline: "Trusted Bulk Supplier",
        description: "Naturally delicious smoothies, cookies and snacks — bulk-packed for retailers, supermarkets and distributors. MOQ from 50 cartons.",
        cta_text: "Request Wholesale Quote",
        cta_style: "rounded_pill",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "spacious",
        typography_style: "bold_display",
        text_color: "dark",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Our Wholesale Catalog",
        description: "Ready-to-stock packaged snacks with bulk pricing",
        filters_enabled: true,
        sort_enabled: false,
        cards: {
          style: "image_top",
          image_ratio: "square",
          show_price: true,
          show_title: true,
          show_cta: true,
          card_style: "soft_rounded",
          hover_effect: "lift",
          badge_enabled: true,
          show_moq: true,
          show_unit: true,
          cta_text: "Request Quote",
        },
        grid: { columns_desktop: 3, columns_mobile: 2, gap: "lg" },
        spacing: "spacious",
        items: [
          { title: "Fruit Smoothie Pouches", price: "$1.20 / unit", badge: "MOQ: 100 cartons", description: "12 pouches per carton — strawberry, mango, berry", unit: "carton", moq: 100, media: [] },
          { title: "Butter Shortbread Cookies", price: "$0.80 / unit", badge: "MOQ: 80 cartons", description: "24 packs per carton, shelf-ready display", unit: "carton", moq: 80, media: [] },
          { title: "Veggie Crisp Snacks", price: "$0.95 / unit", badge: "MOQ: 50 cartons", description: "Beetroot, carrot & sweet potato — kid-safe", unit: "carton", moq: 50, media: [] },
          { title: "Yogurt Bites — Mixed", price: "$1.10 / unit", badge: "MOQ: 60 cartons", description: "Freeze-dried, 30g pouches, 20 per carton", unit: "carton", moq: 60, media: [] },
          { title: "Granola Bar Multipack", price: "$1.40 / unit", badge: "MOQ: 100 cartons", description: "Oats + honey, no added sugar, 18 per carton", unit: "carton", moq: 100, media: [] },
          { title: "Fruit Puree Sachets", price: "$0.65 / unit", badge: "MOQ: 120 cartons", description: "100g sachets, 36 per carton, long shelf life", unit: "carton", moq: 120, media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "trust_badges",
        display_mode: "trust_badges",
        spacing: "comfortable",
        heading: "Why Wholesalers Choose Us",
        items: [
          { title: "100% Natural", description: "Real fruit & veg, no nasties", icon: "leaf" },
          { title: "HACCP Certified", description: "Audited food-safety standards", icon: "shield-check" },
          { title: "Bulk Pricing", description: "Better margins at volume", icon: "credit-card" },
          { title: "Reliable Delivery", description: "Pan-regional distribution", icon: "truck" },
        ],
        story_block: {
          enabled: true,
          eyebrow: "ABOUT THE SUPPLIER",
          heading: "A trusted snack manufacturer since 2018",
          description: "We produce packaged, kid-friendly snacks at scale for retailers, distributors and institutional buyers across the region.",
          cta_text: "Contact Sales",
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        background_style: "dark",
        columns: [
          { title: "Catalog", links: ["Smoothies", "Cookies", "Snacks", "Bars"] },
          { title: "Wholesale", links: ["Request Quote", "Pricing Tiers", "Distribution", "Custom Packaging"] },
          { title: "Contact", links: ["sales@monchies.com", "+256 700 000 000", "Kampala, Uganda"] },
        ],
        copyright: "All rights reserved.",
      } },
    },
  },

  // ─── Bazaro Fashion V3 — Fashion Wholesale ───
  // Reference: https://html.aqlova.com/bazaro-prev/bazaro/index-fashion-v3.html
  {
    key: "estore_bazaro_fashion",
    label: "Bazaro — Fashion Wholesale",
    description: "Multi-category fashion wholesale: dense 4-column product grid with MOQ badges, color swatches, category nav and bold red accent.",
    icon: "👔",
    is_active: true,
    template_family: "bazaro_fashion",
    preview_url: "https://html.aqlova.com/bazaro-prev/bazaro/index-fashion-v3.html",
    reference: {
      source: "link",
      url: "https://html.aqlova.com/bazaro-prev/bazaro/index-fashion-v3.html",
      label: "Bazaro Fashion V3",
      sectionOrder: ["header", "hero", "categories", "products", "supplier_profile", "testimonials", "contact_form", "footer"],
      layoutPatterns: ["red_accent_cta", "multi_category_nav", "dense_4col_product_grid", "color_swatch_cards", "wholesale_price_per_unit", "moq_badge_overlay"],
    },
    patches: {
      header: { schema: {
        layout_variant: "nav_right",
        logo_position: "left",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: true,
        show_cart_icon: false,
        show_search: true,
        menu_layout_style: "horizontal",
        nav_items: ["Tops", "Dresses", "Shoes", "Accessories", "Sale", "Contact"],
        background_style: "light",
      } },
      hero: { schema: {
        layout_variant: "fullwidth_center",
        alignment: "center",
        background_style: "solid_light",
        background_color: "hsl(0 0% 98%)",
        headline: "Fashion Wholesale Catalog",
        subheadline: "Multi-Category Apparel Supplier",
        description: "Premium fashion at wholesale prices. Mixed cartons, full size runs, fast restock — trusted by 200+ boutiques and chains.",
        cta_text: "Request Wholesale Pricing",
        cta_style: "solid_red",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "comfortable",
        typography_style: "bold_sans",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Wholesale Collection",
        description: "Filter by category, see MOQ and per-unit wholesale price on every item.",
        filters_enabled: true,
        sort_enabled: true,
        cards: {
          style: "image_top",
          image_ratio: "portrait",
          show_price: true,
          show_title: true,
          show_cta: true,
          show_swatches: true,
          card_style: "clean",
          hover_effect: "fade",
          badge_enabled: true,
          show_moq: true,
          show_unit: true,
          cta_text: "Request Quote",
        },
        grid: { columns_desktop: 4, columns_mobile: 2, gap: "md" },
        spacing: "comfortable",
        items: [
          { title: "Chic Comfy Jacket", price: "$24.00 / piece", badge: "MOQ: 50 pieces", description: "Orange / Sky Blue / Olive — sizes S–XXL", unit: "piece", moq: 50, media: [] },
          { title: "Round Fleck Sunglasses", price: "$12.00 / piece", badge: "MOQ: 100 pieces", description: "Martini / Rifle Green — UV400", unit: "piece", moq: 100, media: [] },
          { title: "Rib Knit Polo Shirt", price: "$8.50 / piece", badge: "MOQ: 100 pieces", description: "Wheat / Cream — full size run", unit: "piece", moq: 100, media: [] },
          { title: "Suede Loafers", price: "$18.00 / pair", badge: "MOQ: 60 pairs", description: "Beige / Echo Blue / Summer Gray", unit: "pair", moq: 60, media: [] },
          { title: "Linen Button-Up", price: "$14.00 / piece", badge: "MOQ: 80 pieces", description: "Cotton-linen blend, 4 colorways", unit: "piece", moq: 80, media: [] },
          { title: "Tailored Trousers", price: "$16.50 / piece", badge: "MOQ: 60 pieces", description: "Slim fit, 5 colors, sizes 28–40", unit: "piece", moq: 60, media: [] },
          { title: "Canvas Sneakers", price: "$11.00 / pair", badge: "MOQ: 100 pairs", description: "Handmade, durable rubber sole", unit: "pair", moq: 100, media: [] },
          { title: "Leather Tote", price: "$22.00 / piece", badge: "MOQ: 40 pieces", description: "Full-grain leather, 2 sizes", unit: "piece", moq: 40, media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "trust_badges",
        display_mode: "trust_badges",
        spacing: "comfortable",
        heading: "Why Buy Wholesale From Us",
        items: [
          { title: "Verified Supplier", description: "Licensed, audited, insured", icon: "shield-check" },
          { title: "Volume Discounts", description: "Tiered pricing 50+ / 200+ / 500+", icon: "credit-card" },
          { title: "Mixed Cartons", description: "Mix sizes and colors per box", icon: "package" },
          { title: "Fast Restock", description: "10–14 day lead times", icon: "truck" },
        ],
        story_block: {
          enabled: true,
          eyebrow: "ABOUT US",
          heading: "Fashion wholesale done right",
          description: "We supply boutiques, online sellers and retail chains with on-trend apparel at competitive bulk pricing — with sample programs and dedicated account managers.",
          cta_text: "Contact Supplier",
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Catalog", links: ["Tops", "Dresses", "Shoes", "Accessories"] },
          { title: "Wholesale", links: ["Request Quote", "Sample Program", "Volume Tiers", "Lead Times"] },
          { title: "Contact", links: ["sales@bazaro.com", "+256 700 000 000", "Kampala, Uganda"] },
        ],
        copyright: "Bazaro Wholesale. All rights reserved.",
      } },
    },
  },

  // ─── Bazaro Classic — General Merchandise Wholesale ───
  // Reference: https://html.aqlova.com/bazaro-prev/bazaro/index.html
  {
    key: "estore_bazaro_classic",
    label: "Bazaro — General Merchandise",
    description: "Versatile mixed-category wholesale catalog with sidebar categories, mega-menu, trust badges and per-unit pricing — fits any B2B niche.",
    icon: "📦",
    is_active: true,
    template_family: "bazaro_classic",
    preview_url: "https://html.aqlova.com/bazaro-prev/bazaro/index.html",
    reference: {
      source: "link",
      url: "https://html.aqlova.com/bazaro-prev/bazaro/index.html",
      label: "Bazaro Classic",
      sectionOrder: ["header", "hero", "categories_sidebar", "products", "trust_badges", "supplier_profile", "contact_form", "footer"],
      layoutPatterns: ["category_sidebar", "hero_banner_red", "mixed_category_grid", "trust_badge_row", "moq_badge_on_card", "wholesale_price_per_unit"],
    },
    patches: {
      header: { schema: {
        layout_variant: "nav_split",
        logo_position: "left",
        logo_size: "medium",
        show_name: true,
        name_next_to_logo: true,
        show_cart_icon: false,
        show_search: true,
        menu_layout_style: "mega",
        nav_items: ["Catalog", "Categories", "Bulk Orders", "About", "Contact"],
        background_style: "light",
      } },
      hero: { schema: {
        layout_variant: "fullwidth_banner",
        alignment: "center",
        background_style: "solid_color",
        background_color: "hsl(359 78% 48%)",
        headline: "Wholesale General Merchandise",
        subheadline: "Bulk Pricing • Mixed Categories",
        description: "One supplier for hardware, home goods, electronics, apparel and FMCG. Volume discounts and quote-based pricing for verified buyers.",
        cta_text: "Get Wholesale Pricing",
        cta_style: "solid_white",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "comfortable",
        typography_style: "bold_sans",
        text_color: "light",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Featured Wholesale Items",
        description: "Browse our most-requested products across every category. All prices are per-unit at MOQ.",
        filters_enabled: true,
        sort_enabled: true,
        layout: "sidebar_left",
        sidebar: {
          enabled: true,
          heading: "Categories",
          items: ["Hardware", "Home Goods", "Electronics", "Food & Beverage", "Apparel", "Stationery", "Personal Care"],
        },
        cards: {
          style: "image_top",
          image_ratio: "square",
          show_price: true,
          show_title: true,
          show_cta: true,
          card_style: "clean",
          hover_effect: "lift",
          badge_enabled: true,
          show_moq: true,
          show_unit: true,
          cta_text: "Contact Supplier",
        },
        grid: { columns_desktop: 4, columns_mobile: 2, gap: "md" },
        spacing: "comfortable",
        items: [
          { title: "LED Bulb 9W (Bulk)", price: "$0.85 / unit", badge: "MOQ: 200 pieces", description: "Warm white, E27, 2 yr warranty", unit: "piece", moq: 200, media: [] },
          { title: "Stainless Cookware Set", price: "$14.00 / set", badge: "MOQ: 30 sets", description: "5-piece set, hotel-grade", unit: "set", moq: 30, media: [] },
          { title: "Wireless Earbuds", price: "$6.50 / pair", badge: "MOQ: 100 pairs", description: "Bluetooth 5.3, retail-ready box", unit: "pair", moq: 100, media: [] },
          { title: "Cotton T-Shirts (Mixed)", price: "$2.20 / piece", badge: "MOQ: 200 pieces", description: "Full size run, 6 colors", unit: "piece", moq: 200, media: [] },
          { title: "Notebook A5 (24-pack)", price: "$0.45 / unit", badge: "MOQ: 500 pieces", description: "80gsm paper, soft cover", unit: "piece", moq: 500, media: [] },
          { title: "Hand Sanitizer 500ml", price: "$1.10 / bottle", badge: "MOQ: 240 bottles", description: "70% alcohol, FDA-compliant", unit: "bottle", moq: 240, media: [] },
          { title: "Power Strip 6-Outlet", price: "$3.40 / unit", badge: "MOQ: 100 pieces", description: "Surge protected, retail box", unit: "piece", moq: 100, media: [] },
          { title: "Kitchen Towel Pack", price: "$1.80 / pack", badge: "MOQ: 150 packs", description: "12 rolls per pack, 2-ply", unit: "pack", moq: 150, media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "trust_badges",
        display_mode: "trust_badges",
        spacing: "comfortable",
        heading: "A Wholesale Partner You Can Rely On",
        items: [
          { title: "Verified Supplier", description: "Licensed & insured", icon: "shield-check" },
          { title: "ISO 9001", description: "Quality-certified operations", icon: "award" },
          { title: "Fast Delivery", description: "Same-week dispatch", icon: "truck" },
          { title: "Quote in 24h", description: "Dedicated sales response", icon: "headphones" },
        ],
        story_block: {
          enabled: true,
          eyebrow: "ABOUT THE SUPPLIER",
          heading: "General merchandise wholesale since 2012",
          description: "We aggregate quality goods across categories and deliver them at competitive bulk pricing to resellers, institutions and retail chains.",
          cta_text: "Request Quote",
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Categories", links: ["Hardware", "Home Goods", "Electronics", "Apparel", "FMCG"] },
          { title: "Wholesale", links: ["Request Quote", "Bulk Pricing", "Partner Accounts", "Logistics"] },
          { title: "Contact", links: ["sales@bazaro.com", "+256 700 000 000", "Kampala, Uganda"] },
        ],
        copyright: "Bazaro Wholesale. All rights reserved.",
      } },
    },
  },
);

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
  // Runtime guard — enforces YANGU_BUILDER_SPEC isolation: a template key
  // explicitly contracted to one builder may never be resolved from another.
  // Unknown / legacy keys are passed through (assertTemplateOwnership is a no-op).
  const builder = resolveBuilder(engineKey);
  if (builder) assertTemplateOwnership(templateKey, builder);
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

// ─── Phase 3: Default 3-variant set per builder ───
// Always exactly 3 keys; repeat the default where only 2 real variants exist.
// Never includes a key that belongs to a different builder
// (assertTemplateOwnership enforces this at runtime).
const DEFAULT_VARIANTS: Record<BuilderType, AnyTemplateKey[]> = {
  eshop:      ['eshop_visual_a',       'eshop_visual_b',     'eshop_aema'],
  // emenu_visual_a is an empty-patches legacy placeholder (Phase 3) — kept
  // registered for back-compat but excluded from the user-facing defaults
  // so the emenu default is always a real scraped design.
  emenu:      ['emenu_plateria',       'emenu_yumix',        'emenu_plateria'],
  esite:      ['esite_shieldpro',      'esite_realisting',   'esite_luxra'],
  estore:     ['estore_minna',         'estore_monchies',    'estore_bazaro_fashion'],
  influencer: ['influencer_bioburst',  'influencer_linknest', 'influencer_linkhunt'],
  community:  ['community_eventverse', 'community_brightmind', 'community_frederick'],
};

export function getDefaultVariantsForBuilder(builder: BuilderType): AnyTemplateKey[] {
  const keys = DEFAULT_VARIANTS[builder];
  if (!keys) {
    throw new Error(`[YANGU] getDefaultVariantsForBuilder: unknown builder "${builder}"`);
  }
  // Validate ownership on every key — catches any accidental cross-builder leak.
  for (const k of keys) assertTemplateOwnership(k, builder);
  return keys;
}

// ─── Phase 3 Step 4: Esite sub-type routing ───
// Maps a free-text business_type / industry string to the correct esite
// template_key. Returns 'esite_shieldpro' as the safe default.
// Routes (per spec):
//   consultancy   → esite_shieldpro
//   real_estate   → esite_realisting
//   hotel         → esite_luxra
//   travel        → esite_tripset
//   construction  → esite_estatoo
export function selectEsiteTemplateKey(businessType: string | null | undefined): AnyTemplateKey {
  const t = (businessType || "").toLowerCase();
  if (/\b(hotel|accommodation|lodging|hostel|resort|inn|bnb|b&b)\b/.test(t)) return 'esite_luxra';
  if (/\b(real\s*estate|property|properties|land|realtor|listing)\b/.test(t)) return 'esite_realisting';
  if (/\b(travel|tourism|tour|tours|trip|safari)\b/.test(t)) return 'esite_tripset';
  if (/\b(construction|contractor|builder|building|civil\s*works)\b/.test(t)) return 'esite_estatoo';
  return 'esite_shieldpro';
}
