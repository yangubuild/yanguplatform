// YANGU Builder — Template Registry
// Provides visual template presets per engine.
// Each template defines schema patches for core slots (header, hero, main_content, offer, footer).
// No DB changes required — applied client-side via patch merge.
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
];
// ─── Emenu Templates ───

const EMENU_TEMPLATES: TemplatePreset[] = [
  // ─── Simple Template A: Sweet Sips (Café / Juice / Dessert) ───
  {
    key: "emenu_sweet_sips",
    label: "Sweet Sips",
    description: "Playful café/juice bar: warm hero, popular items carousel, rewards CTA, seasonal specials",
    icon: "🧋",
    reference: {
      source: "image",
      label: "Pastries & Ice Cream reference",
      sectionOrder: ["header", "hero", "menu_grid", "rewards_cta", "seasonal_specials", "footer"],
      layoutPatterns: ["split_hero", "3col_food_grid", "story_block_cta", "warm_gradient_bg"],
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
        nav_items: ["Menu", "Locations", "About"],
        background_style: "warm",
      } },
      hero: { schema: {
        layout_variant: "split",
        alignment: "left",
        background_style: "gradient",
        background_color: "hsl(330 60% 85%)",
        headline: "Sip Something Sweet Today",
        subheadline: "Treat Yourself",
        cta_text: "Order Now",
        cta_style: "warm_rounded",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "spacious",
        typography_style: "editorial_large",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Most Popular Sips",
        description: "Find your favorite flavor",
        show_images: true,
        show_badges: true,
        show_dietary: true,
        layout_style: "grid",
        columns_desktop: 3,
        columns_mobile: 2,
        filters_enabled: false,
        sort_enabled: false,
        cards: { style: "image_top", image_ratio: "square", show_price: true, show_title: true, show_cta: false, card_style: "rounded", hover_effect: "lift" },
        grid: { columns_desktop: 3, columns_mobile: 2, gap: "lg" },
        spacing: "comfortable",
        items: [
          { title: "Thai Bubble Tea", price: "8,000", badges: ["popular"], description: "Classic milk tea with tapioca pearls", media: [] },
          { title: "Lychee Bubble Tea", price: "9,000", badges: ["new"], description: "Fresh lychee with crystal boba", media: [] },
          { title: "Strawberry Bubble Tea", price: "9,500", badges: ["new"], description: "Blended strawberry with cream", media: [] },
          { title: "Mango Bubble Tea", price: "8,500", description: "Tropical mango with coconut jelly", media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "story_block",
        display_mode: "story_block",
        heading: "Sip More, Earn More",
        description: "Join our rewards program and treat yourself to free drinks and sweet perks!",
        cta_text: "Join the Club",
        spacing: "comfortable",
        items: [
          { title: "Cherry Blossom Milk Tea", description: "Chinese New Year Special — limited time only", media: [] },
          { title: "Mocha Coconut Milk Tea", description: "Rich mocha blended with fresh coconut", media: [] },
        ],
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Menu", links: ["Home", "Menu", "Rewards", "News"] },
          { title: "Info", links: ["About", "Locations", "Careers", "Contact"] },
        ],
        copyright: "Your Café. All rights reserved.",
      } },
    },
  },
  // ─── Simple Template B: Sunday Bite (Small Restaurant / Bistro) ───
  {
    key: "emenu_sunday_bite",
    label: "Sunday Bite",
    description: "Clean bistro menu: bold hero, featured dishes, testimonials, opening hours & location",
    icon: "🍔",
    reference: {
      source: "image",
      label: "Food & Restaurant Service Website reference",
      sectionOrder: ["header", "hero", "menu_grid", "testimonials", "about_story", "hours_location", "footer"],
      layoutPatterns: ["split_hero", "3col_food_cards", "trust_badges_testimonials", "story_block_about"],
    },
    patches: {
      header: { schema: {
        layout_variant: "nav_right",
        logo_position: "left",
        logo_size: "small",
        show_name: false,
        show_cart_icon: false,
        show_search: false,
        menu_layout_style: "horizontal",
        nav_items: ["Menu", "About", "Contact"],
        background_style: "light",
      } },
      hero: { schema: {
        layout_variant: "split",
        alignment: "left",
        background_style: "solid_light",
        background_color: "hsl(0 0% 98%)",
        headline: "Delicious Food for Every Mood",
        subheadline: "The Sunday Bite",
        cta_text: "Order Now",
        cta_style: "dark_rounded",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "spacious",
        typography_style: "bold_uppercase",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "What We Offer",
        description: "Curious? Here are our most popular menu items.",
        show_images: true,
        show_badges: true,
        show_dietary: false,
        layout_style: "grid",
        columns_desktop: 3,
        columns_mobile: 1,
        filters_enabled: false,
        sort_enabled: false,
        cards: { style: "image_top", image_ratio: "square", show_price: true, show_title: true, show_cta: false, card_style: "clean", hover_effect: "lift" },
        grid: { columns_desktop: 3, columns_mobile: 1, gap: "md" },
        spacing: "comfortable",
        items: [
          { title: "Gourmet Burgers", price: "18,000", badges: ["popular"], description: "Hand-pressed patties with artisan buns", media: [] },
          { title: "Chicken Wings", price: "15,000", description: "Crispy wings with signature sauce", media: [] },
          { title: "Fresh Juices", price: "8,000", description: "Freshly squeezed daily", media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "trust_badges",
        display_mode: "trust_badges",
        spacing: "comfortable",
        heading: "What Our Clients Say",
        items: [
          { title: "The Online Food Hub", description: "Testimonials are short quotes from people who love your brand.", icon: "star" },
          { title: "Food Pyramid Co.", description: "It's a great way to convince customers to try your services.", icon: "star" },
          { title: "Jul & Sons Co.", description: "Amazing food, fast delivery, always fresh!", icon: "star" },
        ],
        story_block: {
          enabled: true,
          eyebrow: "ABOUT US",
          heading: "All About Our Kitchen",
          description: "We have been serving irresistible comfort food since 1999. Our mission is to keep you smiling with every bite.",
          cta_text: "Learn More",
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Opening Hours", links: ["Mon–Fri 7am–10pm", "Saturday 8am–10pm", "Sunday 8am–11pm"] },
          { title: "Location", links: ["123 Anywhere St, Any City", "ST 12345"] },
          { title: "Follow Us On", links: ["Instagram", "Facebook", "Twitter"] },
        ],
        copyright: "Your Restaurant. All rights reserved.",
      } },
    },
  },
  // ─── Visual Template A: Restaurant Menu Classic ───
  {
    key: "emenu_visual_a",
    label: "Restaurant Classic",
    description: "Elegant restaurant menu: hero banner, category tabs, menu items with images, sticky action bar, hours & location",
    icon: "🍽️",
    reference: {
      source: "image",
      label: "FlavorNest marketplace-style menu reference",
      sectionOrder: ["header_dark", "hero_fullwidth", "menu_categories", "trust_badges", "story_block", "hours_contact", "footer"],
      layoutPatterns: ["fullwidth_dark_hero", "2col_menu_grid", "trust_badges_row", "story_block_about"],
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
        nav_items: ["Menu", "About", "Contact"],
        background_style: "dark",
      } },
      hero: { schema: {
        layout_variant: "fullwidth_center",
        alignment: "center",
        background_style: "solid_dark",
        background_color: "hsl(25 30% 12%)",
        headline: "Welcome to Our Restaurant",
        subheadline: "A culinary experience that delights every palate. Fresh ingredients, authentic flavors, unforgettable moments.",
        cta_text: "View Menu",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0.5,
        spacing: "spacious",
        typography_style: "bold_uppercase",
        text_color: "light",
      } },
      main_content: { schema: {
        display_mode: "compact_menu",
        heading: "Our Menu",
        description: "Carefully crafted dishes using the freshest local ingredients",
        filters_enabled: false,
        sort_enabled: false,
        cards: {
          style: "image_top",
          image_ratio: "square",
          show_price: true,
          show_title: true,
          show_cta: false,
          card_style: "clean",
          hover_effect: "lift",
        },
        grid: { columns_desktop: 2, columns_mobile: 1, gap: "md" },
        spacing: "comfortable",
        items: [
          { title: "Grilled Salmon", price: "$28", description: "Fresh Atlantic salmon with herbs", media: [] },
          { title: "Pasta Carbonara", price: "$18", description: "Classic Italian with crispy pancetta", media: [] },
          { title: "Caesar Salad", price: "$14", description: "Crisp romaine, parmesan, house croutons", media: [] },
          { title: "Tiramisu", price: "$12", description: "Traditional Italian coffee dessert", media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "trust_badges",
        display_mode: "trust_badges",
        spacing: "comfortable",
        heading: "Why Dine With Us",
        items: [
          { title: "Fresh Ingredients", description: "Locally sourced daily", icon: "truck" },
          { title: "Expert Chefs", description: "Award-winning culinary team", icon: "headphones" },
          { title: "Cozy Ambiance", description: "Perfect for every occasion", icon: "map-pin" },
          { title: "Quick Service", description: "Ready in 15 minutes or less", icon: "credit-card" },
        ],
        story_block: {
          enabled: true,
          eyebrow: "OUR STORY",
          heading: "A passion for great food since 2010",
          description: "What started as a small kitchen has grown into a beloved dining destination. We believe every meal should be an experience worth savoring.",
          cta_text: "Learn More",
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Visit Us", links: ["123 Main Street", "Open Daily 11am–10pm"] },
          { title: "Contact", links: ["Call: (555) 123-4567", "Email: hello@restaurant.com"] },
          { title: "Follow Us", links: ["Instagram", "Facebook", "TikTok"] },
        ],
        copyright: "Your Restaurant. All rights reserved.",
      } },
    },
  },
  // ─── Visual Template B: Modern Food Grid ───
  {
    key: "emenu_visual_b",
    label: "Modern Food Grid",
    description: "Photo-forward food grid: full-width hero, featured dishes grid, category sections, about & hours block",
    icon: "📸",
    patches: {
      header: { schema: {
        layout_variant: "nav_split",
        logo_position: "center",
        logo_size: "large",
        show_name: true,
        name_next_to_logo: false,
        show_cart_icon: false,
        show_search: false,
        menu_layout_style: "horizontal",
        nav_items_left: ["Menu", "Specials"],
        nav_items_right: ["About", "Order"],
      } },
      hero: { schema: {
        layout_variant: "split",
        alignment: "left",
        background_style: "solid_light",
        background_color: "hsl(35 40% 95%)",
        headline: "Taste the Difference",
        subheadline: "Fresh & Local",
        description: "Every dish tells a story — from farm to table, we craft meals that celebrate local flavors and seasonal ingredients.",
        cta_text: "Explore Menu",
        cta_style: "dark_rounded",
        media: { type: "image", source: "url", url: "", fit: "cover" },
        overlay_opacity: 0,
        spacing: "spacious",
        typography_style: "editorial_large",
      } },
      main_content: { schema: {
        display_mode: "grid",
        heading: "Featured Dishes",
        description: "Our chef's selection of signature plates",
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
        grid: { columns_desktop: 3, columns_mobile: 2, gap: "lg" },
        spacing: "spacious",
        items: [
          { title: "Avocado Toast", price: "$16", description: "Sourdough, smashed avo, poached egg", media: [] },
          { title: "Wagyu Burger", price: "$24", description: "House-ground wagyu, brioche bun", media: [] },
          { title: "Acai Bowl", price: "$14", description: "Fresh berries, granola, honey drizzle", media: [] },
          { title: "Lobster Roll", price: "$32", description: "Maine lobster, butter, toasted roll", media: [] },
          { title: "Matcha Latte", price: "$7", description: "Ceremonial grade, oat milk", media: [] },
          { title: "Chocolate Fondant", price: "$15", description: "Warm center, vanilla ice cream", media: [] },
        ],
      } },
      offer: { schema: {
        layout_variant: "story_block",
        display_mode: "story_block",
        heading: "Our Kitchen",
        description: "We believe food is more than fuel — it's culture, craft, and community. Every ingredient is hand-selected, every recipe is tested to perfection.",
        cta_text: "Our Story",
        background_style: "image_left",
        spacing: "spacious",
        items: [
          { title: "Farm to Fork", description: "We partner with 12 local farms to bring you the freshest seasonal produce every single day.", media: [] },
        ],
        social_gallery: {
          enabled: true,
          platform: "instagram",
          hashtag: "#ourfood",
          columns: 4,
        },
      } },
      footer: { schema: {
        layout_variant: "multi_column",
        display_mode: "multi_column",
        columns: [
          { title: "Hours", links: ["Mon–Fri: 8am–10pm", "Sat–Sun: 9am–11pm"] },
          { title: "Location", links: ["456 Food Street", "Downtown District"] },
          { title: "Connect", links: ["Instagram", "Facebook", "WhatsApp"] },
        ],
        copyright: "Your Food Place. All rights reserved.",
      } },
    },
  },
  // ─── Reservation Template: Gusto (Fine Dining / Hotel) ───
  {
    key: "emenu_gusto_reservation",
    label: "Gusto Reservation",
    description: "Elegant fine dining: dark cinematic hero, reservation form, menu display-only, restaurant gallery, testimonials, opening hours",
    icon: "🍷",
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
