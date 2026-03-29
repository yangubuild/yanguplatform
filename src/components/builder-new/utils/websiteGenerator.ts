/**
 * Generates multiple website HTML variants with truly different layouts.
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
  bg: string; text: string; accent: string; accentText: string;
  secondary: string; heroGradient: string; cardBg: string;
  borderColor: string; fontHeading: string; fontBody: string;
}

// ─── Unsplash image URLs by category ──────────────────────────────────
const CATEGORY_IMAGES: Record<string, Record<string, string[]>> = {
  emenu: {
    hero: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
    ],
    menu: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    ],
    about: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80"],
    gallery: [
      "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80",
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80",
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80",
    ],
  },
  eshop: {
    hero: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80",
      "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80",
    ],
    products: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    ],
  },
  esite: {
    hero: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1200&q=80",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80",
    ],
    services: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&q=80",
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&q=80",
    ],
  },
  influencer: {
    hero: [
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
    ],
    content: [
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80",
      "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&q=80",
      "https://images.unsplash.com/photo-1616469829167-0bd76a80c913?w=400&q=80",
    ],
  },
  community: {
    hero: [
      "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=1200&q=80",
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80",
    ],
    programs: [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80",
    ],
  },
  estore: {
    hero: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80",
    ],
    products: [
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80",
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80",
    ],
  },
};

function getCategoryImage(category: string, section: string, index: number): string {
  const cat = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.esite;
  const sectionImages = cat[section] || cat.hero || CATEGORY_IMAGES.esite.hero;
  return sectionImages[index % sectionImages.length];
}

// ─── Style themes ─────────────────────────────────────────────────────

const STYLE_THEMES: Record<string, StyleTheme> = {
  modern: { bg: "#FAFAFA", text: "#1A1A1A", accent: "#F97316", accentText: "#FFFFFF", secondary: "#F3F4F6", heroGradient: "linear-gradient(135deg, #1A1A1A 0%, #374151 100%)", cardBg: "#FFFFFF", borderColor: "#E5E7EB", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  bold: { bg: "#FFFBEB", text: "#1C1917", accent: "#EF4444", accentText: "#FFFFFF", secondary: "#FEF3C7", heroGradient: "linear-gradient(135deg, #EF4444 0%, #F97316 50%, #EAB308 100%)", cardBg: "#FFFFFF", borderColor: "#FCD34D", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  warm: { bg: "#FFF8F0", text: "#3E2723", accent: "#D97706", accentText: "#FFFFFF", secondary: "#FDE8CD", heroGradient: "linear-gradient(135deg, #92400E 0%, #B45309 50%, #D97706 100%)", cardBg: "#FFFFFF", borderColor: "#E8C9A0", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif" },
  clean: { bg: "#FFFFFF", text: "#111827", accent: "#2563EB", accentText: "#FFFFFF", secondary: "#F9FAFB", heroGradient: "linear-gradient(135deg, #111827 0%, #1F2937 100%)", cardBg: "#FFFFFF", borderColor: "#E5E7EB", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  premium: { bg: "#0F0F0F", text: "#F5F5F5", accent: "#D4A853", accentText: "#0F0F0F", secondary: "#1A1A1A", heroGradient: "linear-gradient(135deg, #0F0F0F 0%, #1F1F1F 50%, #2D2D2D 100%)", cardBg: "#1A1A1A", borderColor: "#333333", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif" },
  playful: { bg: "#FFF5F7", text: "#1A1A2E", accent: "#EC4899", accentText: "#FFFFFF", secondary: "#FCE7F3", heroGradient: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #06B6D4 100%)", cardBg: "#FFFFFF", borderColor: "#FBCFE8", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  vibrant_pop: { bg: "#FFFDE7", text: "#1A1A1A", accent: "#FF1744", accentText: "#FFFFFF", secondary: "#FFECB3", heroGradient: "linear-gradient(135deg, #FF1744 0%, #FF9100 50%, #FFEA00 100%)", cardBg: "#FFFFFF", borderColor: "#FFD54F", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  neon_glow: { bg: "#0A0A1A", text: "#E0E0FF", accent: "#00E5FF", accentText: "#0A0A1A", secondary: "#12122A", heroGradient: "linear-gradient(135deg, #0A0A1A 0%, #1A0A2E 50%, #0A1A2E 100%)", cardBg: "#12122A", borderColor: "#1E1E3F", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  street_bold: { bg: "#F5F5F0", text: "#1A1A1A", accent: "#FF3D00", accentText: "#FFFFFF", secondary: "#E0E0D8", heroGradient: "linear-gradient(135deg, #212121 0%, #424242 100%)", cardBg: "#FFFFFF", borderColor: "#BDBDAD", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  rustic_wood: { bg: "#FAF3E8", text: "#3E2723", accent: "#8D6E63", accentText: "#FFFFFF", secondary: "#EFEBE0", heroGradient: "linear-gradient(135deg, #4E342E 0%, #6D4C41 50%, #8D6E63 100%)", cardBg: "#FFFFFF", borderColor: "#D7CCC8", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif" },
  golden_hour: { bg: "#FFFCF5", text: "#3E2723", accent: "#F59E0B", accentText: "#FFFFFF", secondary: "#FEF3C7", heroGradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)", cardBg: "#FFFFFF", borderColor: "#FDE68A", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif" },
  heritage: { bg: "#FFF8E7", text: "#5D4037", accent: "#BF360C", accentText: "#FFFFFF", secondary: "#FFECB3", heroGradient: "linear-gradient(135deg, #BF360C 0%, #D84315 100%)", cardBg: "#FFFDF5", borderColor: "#D7A86E", fontHeading: "'Georgia', serif", fontBody: "'Georgia', serif" },
  swiss_minimal: { bg: "#FFFFFF", text: "#000000", accent: "#FF0000", accentText: "#FFFFFF", secondary: "#F5F5F5", heroGradient: "linear-gradient(135deg, #000000 0%, #1A1A1A 100%)", cardBg: "#FFFFFF", borderColor: "#E0E0E0", fontHeading: "'Helvetica', sans-serif", fontBody: "'Helvetica', sans-serif" },
  soft_pastel: { bg: "#FFF5F8", text: "#4A4A6A", accent: "#F472B6", accentText: "#FFFFFF", secondary: "#FCE4EC", heroGradient: "linear-gradient(135deg, #F9A8D4 0%, #C4B5FD 50%, #93C5FD 100%)", cardBg: "#FFFFFF", borderColor: "#F3E8FF", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  mono_sharp: { bg: "#FFFFFF", text: "#000000", accent: "#000000", accentText: "#FFFFFF", secondary: "#F5F5F5", heroGradient: "linear-gradient(135deg, #000000 0%, #111111 100%)", cardBg: "#FFFFFF", borderColor: "#222222", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  dark_gold: { bg: "#0A0A0A", text: "#F5F5F5", accent: "#D4A853", accentText: "#0A0A0A", secondary: "#141414", heroGradient: "linear-gradient(135deg, #0A0A0A 0%, #1A1A0A 50%, #1A1A1A 100%)", cardBg: "#141414", borderColor: "#2A2A1A", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif" },
  marble_lux: { bg: "#F8F6F3", text: "#2C2C2C", accent: "#8B7355", accentText: "#FFFFFF", secondary: "#EDEBE6", heroGradient: "linear-gradient(135deg, #2C2C2C 0%, #4A4A3A 100%)", cardBg: "#FFFFFF", borderColor: "#D4CFC5", fontHeading: "'Georgia', serif", fontBody: "'Inter', sans-serif" },
  noir_class: { bg: "#121212", text: "#E8E8E8", accent: "#CFBFA7", accentText: "#121212", secondary: "#1E1E1E", heroGradient: "linear-gradient(135deg, #121212 0%, #1E1E1E 50%, #2A2A2A 100%)", cardBg: "#1E1E1E", borderColor: "#333333", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  tropical_burst: { bg: "#F0FFF4", text: "#1A3C34", accent: "#10B981", accentText: "#FFFFFF", secondary: "#D1FAE5", heroGradient: "linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)", cardBg: "#FFFFFF", borderColor: "#A7F3D0", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  candy_pop: { bg: "#FFF0F6", text: "#4A1942", accent: "#D946EF", accentText: "#FFFFFF", secondary: "#FAE8FF", heroGradient: "linear-gradient(135deg, #D946EF 0%, #EC4899 50%, #F472B6 100%)", cardBg: "#FFFFFF", borderColor: "#F5D0FE", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
  retro_fun: { bg: "#1A0A2E", text: "#F5F5F5", accent: "#FACC15", accentText: "#1A0A2E", secondary: "#2D1B69", heroGradient: "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #FACC15 100%)", cardBg: "#2D1B69", borderColor: "#4C1D95", fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif" },
};

// ─── Section content generators ──────────────────────────────────────

interface SectionContent {
  key: string;
  title: string;
  subtitle: string;
  items?: string[];
  images?: string[];
}

function getSectionContent(section: string, category: Category, businessName: string, location: string, userIdea: string): SectionContent | null {
  const name = businessName || "My Website";
  const loc = location || "Dubai, UAE";
  const desc = userIdea || `${name} in ${loc}`;

  const sectionMap: Record<string, () => SectionContent> = {
    hero: () => ({ key: "hero", title: name, subtitle: desc, images: [getCategoryImage(category, "hero", 0)] }),
    menu: () => ({ key: "menu", title: "Our Menu", subtitle: "Explore our handcrafted dishes", items: ["Classic Burger — $12", "Crispy Fries — $5", "Fried Chicken — $10", "Fresh Salad — $8", "Milkshake — $6", "Combo Meal — $15"], images: CATEGORY_IMAGES[category]?.menu || [] }),
    about: () => ({ key: "about", title: "About Us", subtitle: `${name} is dedicated to delivering the best experience with passion and quality.`, images: [getCategoryImage(category, "about", 0)] }),
    contact: () => ({ key: "contact", title: "Get in Touch", subtitle: `📧 hello@${name.toLowerCase().replace(/\s/g, "")}.com\n📍 ${loc}\n📞 +971 XX XXX XXXX` }),
    testimonials: () => ({ key: "testimonials", title: "What People Say", subtitle: "Reviews from our happy customers", items: ['"Absolutely amazing experience!" — Sarah K.', '"Best in town, hands down!" — Ahmed M.', '"Highly recommend to everyone." — Lisa R.'] }),
    gallery: () => ({ key: "gallery", title: "Gallery", subtitle: "A glimpse of what we do", images: CATEGORY_IMAGES[category]?.gallery || CATEGORY_IMAGES[category]?.hero || [] }),
    location: () => ({ key: "location", title: "Find Us", subtitle: `📍 ${loc}\n🕐 Open Daily: 10:00 AM – 11:00 PM` }),
    delivery: () => ({ key: "delivery", title: "Order Now", subtitle: "Get your favorites delivered", items: ["Talabat", "Deliveroo", "Careem", "Noon Food"] }),
    products: () => ({ key: "products", title: "Our Products", subtitle: "Browse our collection", items: ["Product A — $29", "Product B — $49", "Product C — $79", "Product D — $39"], images: CATEGORY_IMAGES[category]?.products || [] }),
    services: () => ({ key: "services", title: "Our Services", subtitle: "Expert solutions tailored for you", items: ["Consulting", "Strategy", "Implementation", "Support & Maintenance"], images: CATEGORY_IMAGES[category]?.services || [] }),
    results: () => ({ key: "results", title: "Our Results", subtitle: "Success stories from our clients" }),
    content: () => ({ key: "content", title: "Latest Content", subtitle: "Check out my recent work", images: CATEGORY_IMAGES[category]?.content || [] }),
    bio: () => ({ key: "bio", title: "About Me", subtitle: `Hey! I'm ${name}. ${desc}` }),
    links: () => ({ key: "links", title: "My Links", subtitle: "Connect with me everywhere", items: ["YouTube", "Instagram", "TikTok", "Twitter", "Spotify"] }),
    support: () => ({ key: "support", title: "Support My Work", subtitle: "Join the community and get exclusive content" }),
    programs: () => ({ key: "programs", title: "Our Programs", subtitle: "Explore our offerings", items: ["Beginner Course", "Advanced Track", "Workshop Series", "1-on-1 Coaching"], images: CATEGORY_IMAGES[category]?.programs || [] }),
    events: () => ({ key: "events", title: "Upcoming Events", subtitle: "Don't miss our next gathering" }),
    faq: () => ({ key: "faq", title: "FAQ", subtitle: "Frequently asked questions", items: ["How do I place an order?", "What's your return policy?", "Do you ship internationally?"] }),
  };

  const generator = sectionMap[section];
  return generator ? generator() : null;
}

// ─── Layout variants ─────────────────────────────────────────────────

type LayoutVariant = "classic" | "split" | "cards-first";

const LAYOUT_CONFIGS: Record<LayoutVariant, {
  heroStyle: string;
  sectionStyle: (i: number) => string;
  itemsStyle: string;
  imageLayout: string;
}> = {
  classic: {
    heroStyle: "min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;",
    sectionStyle: (i) => i % 2 === 0 ? "alt-bg" : "",
    itemsStyle: "grid-template-columns:repeat(auto-fill,minmax(200px,1fr));",
    imageLayout: "block",
  },
  split: {
    heroStyle: "min-height:80vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:48px;",
    sectionStyle: (i) => i % 2 === 0 ? "reverse-grid" : "",
    itemsStyle: "grid-template-columns:repeat(2,1fr);",
    imageLayout: "side",
  },
  "cards-first": {
    heroStyle: "min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;padding:80px 24px 60px;",
    sectionStyle: () => "",
    itemsStyle: "grid-template-columns:repeat(auto-fill,minmax(240px,1fr));",
    imageLayout: "cards",
  },
};

function buildSectionHTML(section: SectionContent, isHero: boolean, theme: StyleTheme, layout: LayoutVariant, index: number, nextSection?: string): string {
  const layoutCfg = LAYOUT_CONFIGS[layout];

  if (isHero) {
    const heroImg = section.images?.[0];
    if (layout === "split" && heroImg) {
      return `
      <section id="${section.key}" style="${layoutCfg.heroStyle}background:${theme.heroGradient};color:#fff;">
        <div>
          <h1 style="font-family:${theme.fontHeading};font-size:clamp(2.2rem,4.5vw,3.5rem);font-weight:800;margin-bottom:16px;line-height:1.1;">${section.title}</h1>
          <p style="font-size:1.05rem;opacity:0.85;margin-bottom:28px;line-height:1.7;">${section.subtitle}</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <a href="#" style="display:inline-block;padding:14px 32px;border-radius:8px;background:${theme.accent};color:${theme.accentText};text-decoration:none;font-weight:600;font-size:14px;">Explore</a>
            <a href="#" style="display:inline-block;padding:14px 32px;border-radius:8px;background:transparent;color:#fff;border:1px solid #fff4;text-decoration:none;font-weight:500;font-size:14px;">Contact</a>
          </div>
        </div>
        <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/3;">
          <img src="${heroImg}" alt="${section.title}" style="width:100%;height:100%;object-fit:cover;"/>
        </div>
      </section>`;
    }

    const bgStyle = heroImg
      ? `background:${theme.heroGradient};position:relative;`
      : `background:${theme.heroGradient};`;
    const overlayImg = heroImg
      ? `<div style="position:absolute;inset:0;opacity:0.15;"><img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;" alt=""/></div>`
      : "";

    return `
    <section id="${section.key}" style="${layoutCfg.heroStyle}${bgStyle}color:#fff;">
      ${overlayImg}
      <div style="position:relative;z-index:1;max-width:680px;">
        <h1 style="font-family:${theme.fontHeading};font-size:clamp(2.5rem,5vw,4rem);font-weight:800;margin-bottom:16px;line-height:1.1;">${section.title}</h1>
        <p style="font-size:1.1rem;opacity:0.85;margin-bottom:32px;line-height:1.7;">${section.subtitle}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="#" style="display:inline-block;padding:14px 32px;border-radius:8px;background:${theme.accent};color:${theme.accentText};text-decoration:none;font-weight:600;font-size:14px;">Explore</a>
          <a href="#" style="display:inline-block;padding:14px 32px;border-radius:8px;background:transparent;color:#fff;border:1px solid #fff4;text-decoration:none;font-weight:500;font-size:14px;">Contact</a>
        </div>
      </div>
    </section>`;
  }

  // Non-hero section
  const altBg = index % 2 === 0 ? `background:${theme.secondary};` : "";
  
  let itemsHtml = "";
  if (section.items) {
    const hasImages = section.images && section.images.length > 0;
    itemsHtml = `<div style="display:grid;${layoutCfg.itemsStyle}gap:16px;margin-top:24px;">
      ${section.items.map((item, ii) => {
        const img = hasImages && section.images![ii % section.images!.length]
          ? `<img src="${section.images![ii % section.images!.length]}" alt="${item}" style="width:100%;height:140px;object-fit:cover;border-radius:8px 8px 0 0;"/>`
          : "";
        return `<div style="background:${theme.cardBg};border:1px solid ${theme.borderColor};border-radius:12px;overflow:hidden;transition:transform 0.2s;">
          ${img}
          <div style="padding:${img ? "12px 16px" : "20px 16px"};text-align:center;font-weight:500;">${item}</div>
        </div>`;
      }).join("")}
    </div>`;
  } else if (section.images && section.images.length > 0) {
    itemsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:24px;">
      ${section.images.map(src => `<div style="border-radius:12px;overflow:hidden;aspect-ratio:4/3;"><img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;"/></div>`).join("")}
    </div>`;
  }

  // Links section for influencer
  if (section.key === "links" && section.items) {
    itemsHtml = `<div style="display:flex;flex-direction:column;gap:12px;max-width:400px;margin:24px auto 0;">
      ${section.items.map(item => `<a href="#" style="display:block;padding:16px 24px;border-radius:12px;background:${theme.cardBg};border:1px solid ${theme.borderColor};text-align:center;font-weight:600;text-decoration:none;color:${theme.text};transition:transform 0.2s;">${item}</a>`).join("")}
    </div>`;
  }

  return `
  <section id="${section.key}" style="padding:72px 24px;${altBg}">
    <div style="max-width:900px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${theme.fontHeading};font-size:1.8rem;font-weight:700;margin-bottom:12px;color:${theme.text};">${section.title}</h2>
      <p style="font-size:0.95rem;color:${theme.text}bb;margin-bottom:24px;line-height:1.7;">${section.subtitle.replace(/\n/g, "<br/>")}</p>
      ${itemsHtml}
    </div>
  </section>`;
}

function buildHTML(config: GeneratorConfig, theme: StyleTheme, layout: LayoutVariant, variantLabel: string): string {
  const domain = CATEGORY_CONFIGS[config.category]?.domain || ".site";
  const slug = (config.businessName || "my-site").toLowerCase().replace(/\s+/g, "-");

  // Only build sections the user selected
  const sectionsToRender = config.sections.length > 0 ? config.sections : ["hero"];
  
  const sectionContents = sectionsToRender
    .map(s => getSectionContent(s, config.category, config.businessName, config.location, config.userIdea))
    .filter(Boolean) as SectionContent[];

  // Navigation
  const navLinks = sectionContents.map(s => `<a href="#${s.key}" style="text-decoration:none;font-size:13px;color:${theme.text}aa;font-weight:500;">${s.title}</a>`).join("\n");

  const sectionsHTML = sectionContents.map((s, i) =>
    buildSectionHTML(s, i === 0, theme, layout, i, sectionContents[i + 1]?.key)
  ).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${config.businessName || "My Website"} — ${variantLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Georgia&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: ${theme.fontBody}; background: ${theme.bg}; color: ${theme.text}; line-height: 1.6; }
    img { max-width: 100%; }
    @media (max-width: 768px) {
      section[style*="grid-template-columns:1fr 1fr"] { grid-template-columns: 1fr !important; }
    }
  </style>
</head>
<body>
  <nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${theme.bg}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${theme.borderColor};padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:52px;">
    <a href="#" style="font-weight:700;font-size:18px;color:${theme.accent};text-decoration:none;">${config.businessName || "My Site"}</a>
    <div style="display:flex;gap:20px;">${navLinks}</div>
  </nav>

  ${sectionsHTML}

  <footer style="text-align:center;padding:36px 24px;border-top:1px solid ${theme.borderColor};font-size:13px;color:${theme.text}88;">
    <p>${config.businessName || "My Website"} — Built with <a href="#" style="color:${theme.accent};text-decoration:none;">Yangu</a></p>
    <p>${slug}${domain}</p>
  </footer>
</body>
</html>`;
}

/** Generate 3 truly different website HTML variants */
export function generateWebsiteVariants(config: GeneratorConfig): string[] {
  const themeKey = config.styleSpecific || config.style || "modern";
  const baseTheme = STYLE_THEMES[themeKey] || STYLE_THEMES[config.style] || STYLE_THEMES.modern;
  
  const layouts: LayoutVariant[] = ["classic", "split", "cards-first"];
  const labels = ["Classic Layout", "Split Layout", "Cards Layout"];

  // Create 3 variants with different layouts AND slight color shifts
  return layouts.map((layout, i) => {
    const theme = i === 0 ? baseTheme : {
      ...baseTheme,
      accent: shiftColor(baseTheme.accent, i === 1 ? 15 : -20),
      heroGradient: baseTheme.heroGradient.replace("135deg", i === 1 ? "160deg" : "100deg"),
    };
    return buildHTML(config, theme, layout, labels[i]);
  });
}

/** Generate a single website HTML */
export function generateWebsiteHTML(config: GeneratorConfig): string {
  const themeKey = config.styleSpecific || config.style || "modern";
  const theme = STYLE_THEMES[themeKey] || STYLE_THEMES[config.style] || STYLE_THEMES.modern;
  return buildHTML(config, theme, "classic", "Original");
}

function shiftColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
