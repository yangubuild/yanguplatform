/**
 * Generates multiple website HTML variants with different theme variations.
 */

import type { Category } from "../types/builder.types";
import { CATEGORY_CONFIGS } from "../types/builder.types";

export interface GeneratorConfig {
  category: Category;
  businessName: string;
  location: string;
  scope: string;
  style: string;
  styleSpecific: string;
  sections: string[];
  deliveryApps: string[];
  userIdea: string;
}

interface StyleTheme {
  bg: string;
  text: string;
  accent: string;
  accentText: string;
  secondary: string;
  heroGradient: string;
  cardBg: string;
  borderColor: string;
  fontHeading: string;
  fontBody: string;
}

const STYLE_THEMES: Record<string, StyleTheme> = {
  modern: {
    bg: "#FAFAFA", text: "#1A1A1A", accent: "#F97316", accentText: "#FFFFFF",
    secondary: "#F3F4F6", heroGradient: "linear-gradient(135deg, #1A1A1A 0%, #374151 100%)",
    cardBg: "#FFFFFF", borderColor: "#E5E7EB", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  bold: {
    bg: "#FFFBEB", text: "#1C1917", accent: "#EF4444", accentText: "#FFFFFF",
    secondary: "#FEF3C7", heroGradient: "linear-gradient(135deg, #EF4444 0%, #F97316 50%, #EAB308 100%)",
    cardBg: "#FFFFFF", borderColor: "#FCD34D", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  warm: {
    bg: "#FFF8F0", text: "#3E2723", accent: "#D97706", accentText: "#FFFFFF",
    secondary: "#FDE8CD", heroGradient: "linear-gradient(135deg, #92400E 0%, #B45309 50%, #D97706 100%)",
    cardBg: "#FFFFFF", borderColor: "#E8C9A0", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif",
  },
  clean: {
    bg: "#FFFFFF", text: "#111827", accent: "#2563EB", accentText: "#FFFFFF",
    secondary: "#F9FAFB", heroGradient: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
    cardBg: "#FFFFFF", borderColor: "#E5E7EB", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  premium: {
    bg: "#0F0F0F", text: "#F5F5F5", accent: "#D4A853", accentText: "#0F0F0F",
    secondary: "#1A1A1A", heroGradient: "linear-gradient(135deg, #0F0F0F 0%, #1F1F1F 50%, #2D2D2D 100%)",
    cardBg: "#1A1A1A", borderColor: "#333333", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  playful: {
    bg: "#FFF5F7", text: "#1A1A2E", accent: "#EC4899", accentText: "#FFFFFF",
    secondary: "#FCE7F3", heroGradient: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #06B6D4 100%)",
    cardBg: "#FFFFFF", borderColor: "#FBCFE8", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  // Specific sub-styles
  vibrant_pop: {
    bg: "#FFFDE7", text: "#1A1A1A", accent: "#FF1744", accentText: "#FFFFFF",
    secondary: "#FFECB3", heroGradient: "linear-gradient(135deg, #FF1744 0%, #FF9100 50%, #FFEA00 100%)",
    cardBg: "#FFFFFF", borderColor: "#FFD54F", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  neon_glow: {
    bg: "#0A0A1A", text: "#E0E0FF", accent: "#00E5FF", accentText: "#0A0A1A",
    secondary: "#12122A", heroGradient: "linear-gradient(135deg, #0A0A1A 0%, #1A0A2E 50%, #0A1A2E 100%)",
    cardBg: "#12122A", borderColor: "#1E1E3F", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  street_bold: {
    bg: "#F5F5F0", text: "#1A1A1A", accent: "#FF3D00", accentText: "#FFFFFF",
    secondary: "#E0E0D8", heroGradient: "linear-gradient(135deg, #212121 0%, #424242 100%)",
    cardBg: "#FFFFFF", borderColor: "#BDBDAD", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  rustic_wood: {
    bg: "#FAF3E8", text: "#3E2723", accent: "#8D6E63", accentText: "#FFFFFF",
    secondary: "#EFEBE0", heroGradient: "linear-gradient(135deg, #4E342E 0%, #6D4C41 50%, #8D6E63 100%)",
    cardBg: "#FFFFFF", borderColor: "#D7CCC8", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif",
  },
  golden_hour: {
    bg: "#FFFCF5", text: "#3E2723", accent: "#F59E0B", accentText: "#FFFFFF",
    secondary: "#FEF3C7", heroGradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)",
    cardBg: "#FFFFFF", borderColor: "#FDE68A", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif",
  },
  heritage: {
    bg: "#FFF8E7", text: "#5D4037", accent: "#BF360C", accentText: "#FFFFFF",
    secondary: "#FFECB3", heroGradient: "linear-gradient(135deg, #BF360C 0%, #D84315 100%)",
    cardBg: "#FFFDF5", borderColor: "#D7A86E", fontHeading: "'Georgia', serif", fontBody: "'Georgia', serif",
  },
  swiss_minimal: {
    bg: "#FFFFFF", text: "#000000", accent: "#FF0000", accentText: "#FFFFFF",
    secondary: "#F5F5F5", heroGradient: "linear-gradient(135deg, #000000 0%, #1A1A1A 100%)",
    cardBg: "#FFFFFF", borderColor: "#E0E0E0", fontHeading: "'Helvetica', 'Inter', sans-serif", fontBody: "'Helvetica', 'Inter', sans-serif",
  },
  soft_pastel: {
    bg: "#FFF5F8", text: "#4A4A6A", accent: "#F472B6", accentText: "#FFFFFF",
    secondary: "#FCE4EC", heroGradient: "linear-gradient(135deg, #F9A8D4 0%, #C4B5FD 50%, #93C5FD 100%)",
    cardBg: "#FFFFFF", borderColor: "#F3E8FF", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  mono_sharp: {
    bg: "#FFFFFF", text: "#000000", accent: "#000000", accentText: "#FFFFFF",
    secondary: "#F5F5F5", heroGradient: "linear-gradient(135deg, #000000 0%, #111111 100%)",
    cardBg: "#FFFFFF", borderColor: "#222222", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  dark_gold: {
    bg: "#0A0A0A", text: "#F5F5F5", accent: "#D4A853", accentText: "#0A0A0A",
    secondary: "#141414", heroGradient: "linear-gradient(135deg, #0A0A0A 0%, #1A1A0A 50%, #1A1A1A 100%)",
    cardBg: "#141414", borderColor: "#2A2A1A", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif",
  },
  marble_lux: {
    bg: "#F8F6F3", text: "#2C2C2C", accent: "#8B7355", accentText: "#FFFFFF",
    secondary: "#EDEBE6", heroGradient: "linear-gradient(135deg, #2C2C2C 0%, #4A4A3A 100%)",
    cardBg: "#FFFFFF", borderColor: "#D4CFC5", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif",
  },
  noir_class: {
    bg: "#121212", text: "#E8E8E8", accent: "#CFBFA7", accentText: "#121212",
    secondary: "#1E1E1E", heroGradient: "linear-gradient(135deg, #121212 0%, #1E1E1E 50%, #2A2A2A 100%)",
    cardBg: "#1E1E1E", borderColor: "#333333", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  tropical_burst: {
    bg: "#F0FFF4", text: "#1A3C34", accent: "#10B981", accentText: "#FFFFFF",
    secondary: "#D1FAE5", heroGradient: "linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)",
    cardBg: "#FFFFFF", borderColor: "#A7F3D0", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  candy_pop: {
    bg: "#FFF0F6", text: "#4A1942", accent: "#D946EF", accentText: "#FFFFFF",
    secondary: "#FAE8FF", heroGradient: "linear-gradient(135deg, #D946EF 0%, #EC4899 50%, #F472B6 100%)",
    cardBg: "#FFFFFF", borderColor: "#F5D0FE", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
  retro_fun: {
    bg: "#1A0A2E", text: "#F5F5F5", accent: "#FACC15", accentText: "#1A0A2E",
    secondary: "#2D1B69", heroGradient: "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #FACC15 100%)",
    cardBg: "#2D1B69", borderColor: "#4C1D95", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
  },
};

// Variant theme modifiers — create slight variations from a base theme
const VARIANT_MODIFIERS = [
  { label: "Original", accentShift: 0, bgShift: "", heroAngle: 135 },
  { label: "Variation A", accentShift: 20, bgShift: "lighter", heroAngle: 160 },
  { label: "Variation B", accentShift: -15, bgShift: "warmer", heroAngle: 100 },
];

function shiftColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function getThemeVariant(baseKey: string, modIndex: number): StyleTheme {
  const base = STYLE_THEMES[baseKey] || STYLE_THEMES.modern;
  if (modIndex === 0) return base;

  const mod = VARIANT_MODIFIERS[modIndex] || VARIANT_MODIFIERS[0];
  return {
    ...base,
    accent: shiftColor(base.accent, mod.accentShift),
    heroGradient: base.heroGradient.replace("135deg", `${mod.heroAngle}deg`),
    secondary: mod.bgShift === "lighter" ? shiftColor(base.secondary, 10) : shiftColor(base.secondary, -8),
  };
}

function getPageContent(category: Category, businessName: string, location: string, userIdea: string) {
  const pages = CATEGORY_CONFIGS[category].pages;
  const desc = userIdea || `${businessName} in ${location}`;

  const contentMap: Record<Category, Record<string, { title: string; subtitle: string; items?: string[] }>> = {
    emenu: {
      Hero: { title: businessName || "Delicious Food", subtitle: `The best food experience in ${location || "your city"}. Fresh ingredients, bold flavors.` },
      Menu: { title: "Our Menu", subtitle: "Explore our handcrafted dishes", items: ["Classic Burger — $12", "Crispy Fries — $5", "Fried Chicken — $10", "Fresh Salad — $8", "Milkshake — $6", "Combo Meal — $15"] },
      About: { title: "Our Story", subtitle: `Born from a passion for great food, ${businessName} brings you the finest flavors crafted with love and the freshest ingredients.` },
      Location: { title: "Find Us", subtitle: `📍 ${location || "Dubai, UAE"}\n🕐 Open Daily: 10:00 AM – 11:00 PM\n📞 +971 XX XXX XXXX` },
      Delivery: { title: "Order Now", subtitle: "Get your favorites delivered to your door", items: ["Talabat", "Deliveroo", "Careem"] },
    },
    eshop: {
      Hero: { title: businessName || "Shop Now", subtitle: `Discover our curated collection. ${desc}` },
      Products: { title: "Our Products", subtitle: "Browse our latest collection", items: ["Product 1 — $29", "Product 2 — $49", "Product 3 — $79", "Product 4 — $39"] },
      About: { title: "About Us", subtitle: `${businessName} is dedicated to bringing you the best products with quality and care.` },
      Contact: { title: "Contact Us", subtitle: `📧 info@${(businessName || "shop").toLowerCase().replace(/\s/g, "")}.com\n📍 ${location || "Online"}` },
      Order: { title: "Place Your Order", subtitle: "Ready to shop? Browse our collection and checkout securely." },
    },
    estore: {
      Hero: { title: businessName || "Wholesale Solutions", subtitle: `Industrial-grade products and wholesale distribution. ${desc}` },
      "Products/Catalog": { title: "Product Catalog", subtitle: "Browse our industrial catalog", items: ["Category A — Bulk pricing", "Category B — MOQ 100+", "Category C — Custom orders", "Category D — Wholesale only"] },
      About: { title: "About Our Company", subtitle: `With years of experience in the industry, ${businessName} delivers reliable wholesale solutions.` },
      Contact: { title: "Contact Sales", subtitle: `📧 sales@${(businessName || "store").toLowerCase().replace(/\s/g, "")}.com\n📞 Business hours: 8AM-6PM` },
      "Wholesale/Inquiry": { title: "Request a Quote", subtitle: "Fill out our inquiry form for bulk pricing and custom orders." },
    },
    esite: {
      Hero: { title: businessName || "Professional Services", subtitle: `Expert solutions for your needs. ${desc}` },
      Services: { title: "Our Services", subtitle: "What we offer", items: ["Consulting", "Strategy", "Implementation", "Support & Maintenance"] },
      About: { title: "About Us", subtitle: `${businessName} brings expertise and dedication to every project.` },
      Contact: { title: "Get in Touch", subtitle: `📧 hello@${(businessName || "services").toLowerCase().replace(/\s/g, "")}.com\n📍 ${location || "Your City"}` },
      Results: { title: "Our Results", subtitle: "Success stories and case studies from our clients." },
    },
    influencer: {
      Hero: { title: businessName || "Welcome", subtitle: `Creator • Storyteller • Entertainer. ${desc}` },
      "Content/Gallery": { title: "Latest Content", subtitle: "Check out my recent work", items: ["Video 1", "Video 2", "Photo Gallery", "Podcast Episode"] },
      Bio: { title: "About Me", subtitle: `Hey! I'm ${businessName || "a content creator"} sharing my passion with the world.` },
      Contact: { title: "Work With Me", subtitle: "Business inquiries, sponsorships, and collaborations welcome." },
      Support: { title: "Support My Work", subtitle: "Join the community and get exclusive content." },
    },
    community: {
      Hero: { title: businessName || "Join Our Community", subtitle: `Learn, grow, and connect. ${desc}` },
      "Programs/Courses": { title: "Our Programs", subtitle: "Explore our offerings", items: ["Course 1 — Beginner", "Course 2 — Advanced", "Workshop Series", "1-on-1 Coaching"] },
      About: { title: "Our Mission", subtitle: `${businessName} is building a community of learners and achievers.` },
      Contact: { title: "Join Us", subtitle: "Sign up for our next session or reach out with questions." },
      Events: { title: "Upcoming Events", subtitle: "Don't miss our next gathering." },
    },
  };

  return pages.map((page) => ({
    name: page,
    ...(contentMap[category]?.[page] || { title: page, subtitle: `Content for ${page}` }),
  }));
}

function buildHTML(config: GeneratorConfig, theme: StyleTheme, variantLabel: string): string {
  const pages = getPageContent(config.category, config.businessName, config.location, config.userIdea);
  const domain = CATEGORY_CONFIGS[config.category]?.domain || ".site";

  const navLinks = pages.map((p) => `<a href="#${p.name.toLowerCase().replace(/[\s/]/g, "-")}" class="nav-link">${p.name}</a>`).join("\n            ");

  const sectionsHTML = pages
    .map((page, i) => {
      const id = page.name.toLowerCase().replace(/[\s/]/g, "-");
      const isHero = i === 0;

      const itemsHtml = page.items
        ? `<div class="items-grid">${page.items.map((item) => `<div class="item-card"><span>${item}</span></div>`).join("")}</div>`
        : "";

      if (isHero) {
        return `
      <section id="${id}" class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">${page.title}</h1>
          <p class="hero-subtitle">${page.subtitle}</p>
          <div class="hero-actions">
            <a href="#${pages[1] ? pages[1].name.toLowerCase().replace(/[\s/]/g, "-") : ""}" class="btn-primary">Explore</a>
            <a href="#${pages[pages.length - 1].name.toLowerCase().replace(/[\s/]/g, "-")}" class="btn-secondary">Contact</a>
          </div>
        </div>
      </section>`;
      }

      return `
      <section id="${id}" class="content-section ${i % 2 === 0 ? "alt-bg" : ""}">
        <div class="section-inner">
          <h2 class="section-title">${page.title}</h2>
          <p class="section-subtitle">${page.subtitle.replace(/\n/g, "<br/>")}</p>
          ${itemsHtml}
        </div>
      </section>`;
    })
    .join("\n");

  const slug = (config.businessName || "my-site").toLowerCase().replace(/\s+/g, "-");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${config.businessName || "My Website"} — ${variantLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    
    body {
      font-family: ${theme.fontBody};
      background: ${theme.bg};
      color: ${theme.text};
      line-height: 1.6;
    }
    
    .site-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: ${theme.bg}ee;
      backdrop-filter: blur(12px);
      border-bottom: 1px solid ${theme.borderColor};
      padding: 0 24px;
      display: flex; align-items: center; justify-content: space-between;
      height: 56px;
    }
    .nav-brand { font-weight: 700; font-size: 18px; color: ${theme.accent}; text-decoration: none; }
    .nav-links { display: flex; gap: 20px; }
    .nav-link { text-decoration: none; font-size: 13px; color: ${theme.text}aa; font-weight: 500; transition: color 0.2s; }
    .nav-link:hover { color: ${theme.accent}; }
    
    .hero-section {
      min-height: 80vh; display: flex; align-items: center; justify-content: center;
      background: ${theme.heroGradient};
      color: #fff; text-align: center; padding: 120px 24px 80px;
    }
    .hero-content { max-width: 680px; }
    .hero-title { font-family: ${theme.fontHeading}; font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; margin-bottom: 16px; line-height: 1.1; }
    .hero-subtitle { font-size: 1.1rem; opacity: 0.85; margin-bottom: 32px; line-height: 1.7; }
    .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    
    .btn-primary {
      display: inline-block; padding: 14px 32px; border-radius: 8px;
      background: ${theme.accent}; color: ${theme.accentText};
      text-decoration: none; font-weight: 600; font-size: 14px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px ${theme.accent}44; }
    
    .btn-secondary {
      display: inline-block; padding: 14px 32px; border-radius: 8px;
      background: transparent; color: #fff; border: 1px solid #fff4;
      text-decoration: none; font-weight: 500; font-size: 14px;
      transition: background 0.2s;
    }
    .btn-secondary:hover { background: #fff1; }
    
    .content-section { padding: 80px 24px; }
    .content-section.alt-bg { background: ${theme.secondary}; }
    .section-inner { max-width: 900px; margin: 0 auto; text-align: center; }
    .section-title { font-family: ${theme.fontHeading}; font-size: 2rem; font-weight: 700; margin-bottom: 12px; }
    .section-subtitle { font-size: 1rem; color: ${theme.text}bb; margin-bottom: 40px; line-height: 1.7; }
    
    .items-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px; margin-top: 24px;
    }
    .item-card {
      background: ${theme.cardBg}; border: 1px solid ${theme.borderColor};
      border-radius: 12px; padding: 24px; text-align: center;
      font-weight: 500; transition: transform 0.2s, box-shadow 0.2s;
    }
    .item-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px #0001; }
    
    .site-footer {
      text-align: center; padding: 40px 24px; border-top: 1px solid ${theme.borderColor};
      font-size: 13px; color: ${theme.text}88;
    }
    .site-footer a { color: ${theme.accent}; text-decoration: none; }
    
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .hero-title { font-size: 2rem; }
      .items-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <nav class="site-nav">
    <a href="#" class="nav-brand">${config.businessName || "My Site"}</a>
    <div class="nav-links">
      ${navLinks}
    </div>
  </nav>

  ${sectionsHTML}

  <footer class="site-footer">
    <p>${config.businessName || "My Website"} — Built with <a href="#">Yangu</a></p>
    <p>${slug}${domain}</p>
  </footer>
</body>
</html>`;
}

/** Generate a single website HTML */
export function generateWebsiteHTML(config: GeneratorConfig): string {
  const themeKey = config.styleSpecific || config.style || "modern";
  const theme = STYLE_THEMES[themeKey] || STYLE_THEMES[config.style] || STYLE_THEMES.modern;
  return buildHTML(config, theme, "Original");
}

/** Generate 3 website HTML variants with theme variations */
export function generateWebsiteVariants(config: GeneratorConfig): string[] {
  const themeKey = config.styleSpecific || config.style || "modern";
  return VARIANT_MODIFIERS.map((mod, i) => {
    const theme = getThemeVariant(themeKey, i);
    return buildHTML(config, theme, mod.label);
  });
}
