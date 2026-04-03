/**
 * Generates multiple website HTML variants with truly different layouts.
 */

import type { Category } from "../types/builder.types";
import { CATEGORY_CONFIGS } from "../types/builder.types";
import { getTemplate, type TemplatePreset } from "@/config/templateRegistry";

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
  /** User-uploaded assets (override defaults when provided) */
  userLogoUrl?: string;
  userBrandColors?: string[];
  userImages?: Array<{ url: string; purpose: string }>;
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

function getCategoryImage(category: string, section: string, index: number, config?: GeneratorConfig): string {
  // Prioritize user-uploaded images when available
  if (config?.userImages && config.userImages.length > 0) {
    // Try to find purpose-matched images first
    const purposeMap: Record<string, string[]> = { hero: ["page", "interior"], menu: ["menu"], about: ["team", "interior"], gallery: ["menu", "interior", "page", "other"] };
    const purposes = purposeMap[section] || ["page", "other"];
    const matched = config.userImages.filter(img => purposes.includes(img.purpose));
    if (matched.length > 0) return matched[index % matched.length].url;
    // Fallback: any user image
    return config.userImages[index % config.userImages.length].url;
  }
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

function getSectionContent(section: string, category: Category, businessName: string, location: string, userIdea: string, config?: GeneratorConfig): SectionContent | null {
  const name = businessName || "My Website";
  const loc = location || "Dubai, UAE";
  const desc = userIdea || `${name} in ${loc}`;

  // Delivery items: use ONLY user-selected apps (never inject extras)
  const deliveryItems = config?.deliveryApps && config.deliveryApps.length > 0
    ? config.deliveryApps.map(app => {
        const labels: Record<string, string> = { talabat: "Talabat", deliveroo: "Deliveroo", noon_food: "Noon Food", careem: "Careem", zomato: "Zomato", ubereats: "Uber Eats", self_delivery: "Self Delivery", pickup_only: "Pickup Only", hungerstation: "HungerStation", jahez: "Jahez", toyou: "ToYou", elmenus: "Elmenus", doordash: "DoorDash", grubhub: "Grubhub" };
        return labels[app] || app;
      })
    : ["Order Online"];

  const getImg = (sec: string, idx: number) => getCategoryImage(category, sec, idx, config);

  const sectionMap: Record<string, () => SectionContent> = {
    hero: () => ({ key: "hero", title: name, subtitle: desc, images: [getImg("hero", 0)] }),
    menu: () => ({ key: "menu", title: "Our Menu", subtitle: "Explore our handcrafted dishes", items: ["Classic Burger — $12", "Crispy Fries — $5", "Fried Chicken — $10", "Fresh Salad — $8", "Milkshake — $6", "Combo Meal — $15"], images: config?.userImages?.filter(i => i.purpose === "menu").map(i => i.url) || CATEGORY_IMAGES[category]?.menu || [] }),
    about: () => ({ key: "about", title: "About Us", subtitle: `${name} is dedicated to delivering the best experience with passion and quality.`, images: [getImg("about", 0)] }),
    contact: () => ({ key: "contact", title: "Get in Touch", subtitle: `📧 hello@${name.toLowerCase().replace(/\s/g, "")}.com\n📍 ${loc}\n📞 +971 XX XXX XXXX` }),
    testimonials: () => ({ key: "testimonials", title: "What People Say", subtitle: "Reviews from our happy customers", items: ['"Absolutely amazing experience!" — Sarah K.', '"Best in town, hands down!" — Ahmed M.', '"Highly recommend to everyone." — Lisa R.'] }),
    gallery: () => ({ key: "gallery", title: "Gallery", subtitle: "A glimpse of what we do", images: config?.userImages?.map(i => i.url) || CATEGORY_IMAGES[category]?.gallery || CATEGORY_IMAGES[category]?.hero || [] }),
    location: () => ({ key: "location", title: "Find Us", subtitle: `📍 ${loc}\n🕐 Open Daily: 10:00 AM – 11:00 PM` }),
    delivery: () => ({ key: "delivery", title: "Order Now", subtitle: "Get your favorites delivered", items: deliveryItems }),
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
  // Apply user brand colors if provided (override theme accent)
  if (config.userBrandColors && config.userBrandColors.length > 0) {
    theme = { ...theme, accent: config.userBrandColors[0] };
    if (config.userBrandColors.length > 1) {
      theme.heroGradient = `linear-gradient(135deg, ${config.userBrandColors[0]} 0%, ${config.userBrandColors[1] || config.userBrandColors[0]} 100%)`;
    }
  }
  const domain = CATEGORY_CONFIGS[config.category]?.domain || ".site";
  const slug = (config.businessName || "my-site").toLowerCase().replace(/\s+/g, "-");

  // Only build sections the user selected
  const sectionsToRender = config.sections.length > 0 ? config.sections : ["hero"];
  
  const sectionContents = sectionsToRender
    .map(s => getSectionContent(s, config.category, config.businessName, config.location, config.userIdea, config))
    .filter(Boolean) as SectionContent[];

  // Navigation
  const navLinks = sectionContents.map(s => `<a href="#${s.key}" style="text-decoration:none;font-size:13px;color:${theme.text}aa;font-weight:500;">${s.title}</a>`).join("\n");

  const sectionsHTML = sectionContents.map((s, i) =>
    buildSectionHTML(s, i === 0, theme, layout, i, sectionContents[i + 1]?.key)
  ).join("\n");

  const logoHtml = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${config.businessName}" style="height:28px;width:auto;"/>`
    : `<span style="font-weight:700;font-size:18px;color:${theme.accent};">${config.businessName || "My Site"}</span>`;

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
    <a href="#" style="text-decoration:none;display:flex;align-items:center;">${logoHtml}</a>
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

// ─── Emenu template-aware generation ────────────────────────────────────

/**
 * Build HTML from a real saved emenu template preset.
 * This enforces structural fidelity to the chosen template.
 */
function buildEmenuTemplateHTML(config: GeneratorConfig, preset: TemplatePreset, variantIndex: number): string {
  const heroSchema = (preset.patches?.hero?.schema || {}) as Record<string, any>;
  const headerSchema = (preset.patches?.header?.schema || {}) as Record<string, any>;
  const mainSchema = (preset.patches?.main_content?.schema || {}) as Record<string, any>;
  const offerSchema = (preset.patches?.offer?.schema || {}) as Record<string, any>;
  const footerSchema = (preset.patches?.footer?.schema || {}) as Record<string, any>;

  // Theme from template
  const isDark = heroSchema.background_style?.includes("dark") || heroSchema.text_color === "light";
  const bgColor = heroSchema.background_color || (isDark ? "hsl(40 20% 8%)" : "hsl(0 0% 98%)");
  const pageBg = isDark ? "#0F0F0F" : "#FAFAFA";
  const pageText = isDark ? "#F5F5F5" : "#1A1A1A";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const borderColor = isDark ? "#333" : "#E5E7EB";
  const accentColor = config.userBrandColors?.[0] || (isDark ? "#D4A853" : "#F97316");
  const accentText = isDark ? "#0F0F0F" : "#FFFFFF";
  const fontHeading = headerSchema.background_style === "warm" || heroSchema.typography_style?.includes("serif") ? "'Georgia', serif" : "'Inter', sans-serif";

  // Gradient
  let heroGradient = isDark
    ? `linear-gradient(135deg, ${bgColor} 0%, hsl(40 15% 15%) 100%)`
    : `linear-gradient(135deg, ${bgColor} 0%, hsl(35 30% 92%) 100%)`;
  if (config.userBrandColors && config.userBrandColors.length > 1) {
    heroGradient = `linear-gradient(135deg, ${config.userBrandColors[0]} 0%, ${config.userBrandColors[1]} 100%)`;
  }
  // Slight variant shift
  if (variantIndex === 1) heroGradient = heroGradient.replace("135deg", "160deg");
  if (variantIndex === 2) heroGradient = heroGradient.replace("135deg", "100deg");

  const businessName = config.businessName || "My Website";
  const heroImg = getCategoryImage(config.category, "hero", variantIndex, config);
  const menuImages = config.userImages?.filter(i => i.purpose === "menu").map(i => i.url) || [];

  // Logo
  const logoHtml = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${businessName}" style="height:28px;width:auto;"/>`
    : `<span style="font-weight:700;font-size:18px;color:${accentColor};">${businessName}</span>`;

  // Nav items from template
  const navItems = (headerSchema.nav_items as string[]) || ["Home", "Menu", "About"];
  const navLinks = navItems.map(n => `<a href="#" style="text-decoration:none;font-size:13px;color:${isDark ? "#fff9" : pageText + "aa"};font-weight:500;">${n}</a>`).join("\n");
  const navBg = isDark ? (headerSchema.background_color || "#0F0F0F") : (headerSchema.background_color || pageBg);

  // CTA button in header
  const headerCta = headerSchema.cta_button
    ? `<a href="#" style="padding:8px 18px;border-radius:20px;background:${accentColor};color:${accentText};text-decoration:none;font-size:12px;font-weight:600;">${headerSchema.cta_button.text || "Contact"}</a>`
    : "";

  // Hero
  const heroLayout = heroSchema.layout_variant || "split";
  const headline = heroSchema.headline || businessName;
  const subheadline = heroSchema.subheadline || config.userIdea || "";
  const description = heroSchema.description || "";
  const ctaText = heroSchema.cta_text || "Explore";
  const heroTextColor = isDark ? "#fff" : pageText;

  let heroHTML = "";
  if (heroLayout === "split") {
    heroHTML = `
    <section style="min-height:80vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:48px;background:${heroGradient};color:${heroTextColor};">
      <div>
        ${subheadline ? `<p style="font-size:14px;text-transform:uppercase;letter-spacing:2px;opacity:0.7;margin-bottom:12px;">${subheadline}</p>` : ""}
        <h1 style="font-family:${fontHeading};font-size:clamp(2.2rem,4.5vw,3.5rem);font-weight:800;margin-bottom:16px;line-height:1.1;">${headline}</h1>
        ${description ? `<p style="font-size:1rem;opacity:0.8;margin-bottom:28px;line-height:1.7;">${description}</p>` : ""}
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <a href="#menu" style="display:inline-block;padding:14px 32px;border-radius:8px;background:${accentColor};color:${accentText};text-decoration:none;font-weight:600;font-size:14px;">${ctaText}</a>
        </div>
        ${heroSchema.social_proof ? `<div style="margin-top:20px;display:flex;align-items:center;gap:8px;opacity:0.7;"><span style="font-size:13px;">⭐ ${heroSchema.social_proof.rating || 4.5} on ${heroSchema.social_proof.platform || "Google"}</span></div>` : ""}
      </div>
      <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/3;">
        <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
      </div>
    </section>`;
  } else {
    heroHTML = `
    <section style="min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;background:${heroGradient};color:${heroTextColor};position:relative;">
      <div style="position:absolute;inset:0;opacity:0.15;"><img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;" alt=""/></div>
      <div style="position:relative;z-index:1;max-width:680px;">
        ${subheadline ? `<p style="font-size:14px;text-transform:uppercase;letter-spacing:2px;opacity:0.7;margin-bottom:12px;">${subheadline}</p>` : ""}
        <h1 style="font-family:${fontHeading};font-size:clamp(2.5rem,5vw,4rem);font-weight:800;margin-bottom:16px;line-height:1.1;">${headline}</h1>
        ${description ? `<p style="font-size:1.05rem;opacity:0.85;margin-bottom:32px;line-height:1.7;">${description}</p>` : ""}
        <a href="#menu" style="display:inline-block;padding:14px 32px;border-radius:8px;background:${accentColor};color:${accentText};text-decoration:none;font-weight:600;font-size:14px;">${ctaText}</a>
      </div>
    </section>`;
  }

  // Menu section from template items
  const menuItems = (mainSchema.items as any[]) || [];
  const menuHeading = mainSchema.heading || "Our Menu";
  const menuDesc = mainSchema.description || "";
  const cols = mainSchema.columns_desktop || mainSchema.grid?.columns_desktop || 3;
  const cardStyle = mainSchema.cards?.card_style || "clean";
  const itemCardBg = cardStyle === "dark_overlay" ? "rgba(0,0,0,0.6)" : cardBg;
  const itemTextColor = cardStyle === "dark_overlay" ? "#fff" : pageText;

  const menuItemsHTML = menuItems.map((item: any, idx: number) => {
    const imgSrc = menuImages[idx % Math.max(menuImages.length, 1)] || getCategoryImage(config.category, "menu", idx, config);
    const badge = item.badges?.[0] ? `<span style="position:absolute;top:8px;left:8px;padding:3px 10px;border-radius:12px;background:${accentColor};color:${accentText};font-size:10px;font-weight:600;text-transform:uppercase;">${item.badges[0]}</span>` : "";
    return `<div style="background:${itemCardBg};border:1px solid ${borderColor};border-radius:12px;overflow:hidden;transition:transform 0.2s;position:relative;">
      ${badge}
      <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:180px;object-fit:cover;"/>
      <div style="padding:14px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;font-size:14px;color:${itemTextColor};">${item.title}</span>
          <span style="font-weight:700;font-size:14px;color:${accentColor};">${item.price || ""}</span>
        </div>
        ${item.description ? `<p style="font-size:12px;color:${itemTextColor}99;margin-top:4px;">${item.description}</p>` : ""}
      </div>
    </div>`;
  }).join("");

  const menuHTML = menuItems.length > 0 ? `
  <section id="menu" style="padding:72px 24px;background:${pageBg};">
    <div style="max-width:1000px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${fontHeading};font-size:1.8rem;font-weight:700;margin-bottom:8px;color:${pageText};">${menuHeading}</h2>
      ${menuDesc ? `<p style="font-size:0.95rem;color:${pageText}99;margin-bottom:32px;">${menuDesc}</p>` : ""}
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:20px;">
        ${menuItemsHTML}
      </div>
    </div>
  </section>` : "";

  // Category showcase (if present in template)
  const catShowcase = mainSchema.category_showcase;
  let categoryHTML = "";
  if (catShowcase?.enabled && catShowcase.items) {
    const catCols = catShowcase.columns || 4;
    categoryHTML = `
    <section style="padding:60px 24px;background:${isDark ? "#141414" : "#F3F4F6"};">
      <div style="max-width:1000px;margin:0 auto;text-align:center;">
        <h2 style="font-family:${fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:8px;color:${pageText};">${catShowcase.heading || "Categories"}</h2>
        ${catShowcase.description ? `<p style="font-size:0.9rem;color:${pageText}99;margin-bottom:24px;">${catShowcase.description}</p>` : ""}
        <div style="display:grid;grid-template-columns:repeat(${catCols},1fr);gap:16px;">
          ${catShowcase.items.map((cat: any) => `
            <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:12px;padding:24px 16px;text-align:center;">
              <span style="font-weight:600;font-size:14px;color:${pageText};">${cat.title}</span>
              <br/><span style="font-size:12px;color:${pageText}88;">${cat.count || ""}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </section>`;
  }

  // Offer / trust / about section
  let offerHTML = "";
  const offerHeading = offerSchema.heading || "";
  const offerDesc = offerSchema.description || "";
  const offerItems = (offerSchema.items as any[]) || [];
  const stats = (offerSchema.stats as any[]) || [];
  const promos = (offerSchema.promo_banners as any[]) || [];
  const testimonials = offerSchema.testimonials as any;
  const storyBlock = offerSchema.story_block as any;
  const catering = offerSchema.catering as any;
  const newsletter = offerSchema.newsletter as any;

  // Promo banners
  if (promos.length > 0) {
    offerHTML += `
    <section style="padding:48px 24px;background:${isDark ? "#141414" : "#FEF3C7"};">
      <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(${Math.min(promos.length, 2)},1fr);gap:20px;">
        ${promos.map((p: any) => `
          <div style="background:${accentColor}18;border:1px solid ${accentColor}44;border-radius:12px;padding:28px 24px;">
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;color:${pageText};">${p.heading}</h3>
            <p style="font-size:0.9rem;color:${pageText}99;margin-bottom:16px;">${p.description}</p>
            ${p.cta_text ? `<a href="#" style="padding:10px 24px;border-radius:8px;background:${accentColor};color:${accentText};text-decoration:none;font-size:13px;font-weight:600;">${p.cta_text}</a>` : ""}
          </div>
        `).join("")}
      </div>
    </section>`;
  }

  // Trust badges / why choose us
  if (offerItems.length > 0) {
    offerHTML += `
    <section style="padding:60px 24px;background:${pageBg};">
      <div style="max-width:1000px;margin:0 auto;text-align:center;">
        ${offerHeading ? `<h2 style="font-family:${fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:8px;color:${pageText};">${offerHeading}</h2>` : ""}
        ${offerDesc ? `<p style="font-size:0.9rem;color:${pageText}99;margin-bottom:28px;">${offerDesc}</p>` : ""}
        <div style="display:grid;grid-template-columns:repeat(${Math.min(offerItems.length, 4)},1fr);gap:20px;">
          ${offerItems.map((item: any) => `
            <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:12px;padding:24px 16px;text-align:center;">
              <span style="font-size:1.5rem;">${item.icon === "chef-hat" ? "👨‍🍳" : item.icon === "shield" ? "🛡️" : item.icon === "headphones" ? "🎧" : item.icon === "tag" ? "🏷️" : "✅"}</span>
              <h4 style="font-weight:600;font-size:14px;margin-top:8px;color:${pageText};">${item.title}</h4>
              <p style="font-size:12px;color:${pageText}88;margin-top:4px;">${item.description}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>`;
  }

  // Stats row
  if (stats.length > 0) {
    offerHTML += `
    <section style="padding:48px 24px;background:${isDark ? "#1A1A1A" : "#F3F4F6"};">
      <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap;gap:24px;">
        ${stats.map((s: any) => `
          <div>
            <div style="font-size:2rem;font-weight:800;color:${accentColor};">${s.value}</div>
            <div style="font-size:13px;color:${pageText}88;margin-top:4px;">${s.label}</div>
          </div>
        `).join("")}
      </div>
    </section>`;
  }

  // Story block
  if (storyBlock?.enabled) {
    offerHTML += `
    <section style="padding:72px 24px;background:${pageBg};">
      <div style="max-width:700px;margin:0 auto;text-align:center;">
        ${storyBlock.eyebrow ? `<p style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:${accentColor};margin-bottom:8px;">${storyBlock.eyebrow}</p>` : ""}
        <h2 style="font-family:${fontHeading};font-size:1.6rem;font-weight:700;margin-bottom:12px;color:${pageText};">${storyBlock.heading || ""}</h2>
        <p style="font-size:0.95rem;color:${pageText}99;line-height:1.7;">${storyBlock.description || ""}</p>
        ${storyBlock.cta_text ? `<a href="#" style="display:inline-block;margin-top:20px;padding:12px 28px;border-radius:8px;background:${accentColor};color:${accentText};text-decoration:none;font-weight:600;font-size:14px;">${storyBlock.cta_text}</a>` : ""}
      </div>
    </section>`;
  }

  // Catering section
  if (catering?.enabled && catering.items) {
    offerHTML += `
    <section style="padding:60px 24px;background:${isDark ? "#141414" : "#F9FAFB"};">
      <div style="max-width:900px;margin:0 auto;text-align:center;">
        <h2 style="font-family:${fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:8px;color:${pageText};">${catering.heading || "Catering"}</h2>
        ${catering.description ? `<p style="font-size:0.9rem;color:${pageText}99;margin-bottom:24px;">${catering.description}</p>` : ""}
        <div style="display:grid;grid-template-columns:repeat(${Math.min(catering.items.length, 3)},1fr);gap:20px;">
          ${catering.items.map((c: any) => `
            <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:12px;padding:28px 16px;">
              <h4 style="font-weight:600;font-size:15px;color:${pageText};">${c.title}</h4>
              <span style="font-size:12px;color:${accentColor};font-weight:600;">${c.count || ""}</span>
              ${c.description ? `<p style="font-size:12px;color:${pageText}88;margin-top:6px;">${c.description}</p>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    </section>`;
  }

  // Testimonials
  if (testimonials?.enabled && testimonials.items?.length > 0) {
    offerHTML += `
    <section style="padding:60px 24px;background:${pageBg};">
      <div style="max-width:1000px;margin:0 auto;text-align:center;">
        <h2 style="font-family:${fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:8px;color:${pageText};">${testimonials.heading || "Reviews"}</h2>
        ${testimonials.subheading ? `<p style="font-size:0.9rem;color:${accentColor};margin-bottom:24px;">${testimonials.subheading}</p>` : ""}
        <div style="display:grid;grid-template-columns:repeat(${Math.min(testimonials.items.length, 3)},1fr);gap:20px;">
          ${testimonials.items.slice(0, 3).map((t: any) => `
            <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:12px;padding:24px 20px;text-align:left;">
              <p style="font-size:14px;color:${pageText};line-height:1.6;font-style:italic;">"${t.quote}"</p>
              <div style="margin-top:12px;">
                <span style="font-weight:600;font-size:13px;color:${pageText};">${t.name}</span>
                ${t.role ? `<br/><span style="font-size:11px;color:${pageText}88;">${t.role}</span>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>`;
  }

  // Newsletter
  if (newsletter?.enabled) {
    offerHTML += `
    <section style="padding:48px 24px;background:${isDark ? "#1A1A1A" : "#F3F4F6"};">
      <div style="max-width:500px;margin:0 auto;text-align:center;">
        <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:12px;color:${pageText};">${newsletter.heading || "Subscribe"}</h3>
        <div style="display:flex;gap:8px;">
          <input type="email" placeholder="Your email" style="flex:1;padding:12px 16px;border-radius:8px;border:1px solid ${borderColor};background:${cardBg};color:${pageText};font-size:14px;"/>
          <button style="padding:12px 24px;border-radius:8px;background:${accentColor};color:${accentText};border:none;font-weight:600;font-size:14px;cursor:pointer;">${newsletter.cta_text || "Subscribe"}</button>
        </div>
      </div>
    </section>`;
  }

  // Delivery section (only the user-selected apps)
  let deliveryHTML = "";
  if (config.deliveryApps && config.deliveryApps.length > 0 && config.sections.includes("delivery")) {
    const labels: Record<string, string> = { talabat: "Talabat", deliveroo: "Deliveroo", noon_food: "Noon Food", careem: "Careem", zomato: "Zomato", ubereats: "Uber Eats", self_delivery: "Self Delivery", pickup_only: "Pickup Only", hungerstation: "HungerStation", jahez: "Jahez", toyou: "ToYou", elmenus: "Elmenus", doordash: "DoorDash", grubhub: "Grubhub" };
    deliveryHTML = `
    <section style="padding:48px 24px;background:${isDark ? "#141414" : "#FEF3C7"};">
      <div style="max-width:600px;margin:0 auto;text-align:center;">
        <h2 style="font-size:1.4rem;font-weight:700;margin-bottom:16px;color:${pageText};">Order Now</h2>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          ${config.deliveryApps.map(app => `<a href="#" style="padding:12px 24px;border-radius:8px;background:${accentColor};color:${accentText};text-decoration:none;font-weight:600;font-size:14px;">${labels[app] || app}</a>`).join("")}
        </div>
      </div>
    </section>`;
  }

  // Location section
  let locationHTML = "";
  if (config.sections.includes("location")) {
    locationHTML = `
    <section style="padding:60px 24px;background:${pageBg};">
      <div style="max-width:700px;margin:0 auto;text-align:center;">
        <h2 style="font-family:${fontHeading};font-size:1.4rem;font-weight:700;margin-bottom:12px;color:${pageText};">Find Us</h2>
        <p style="font-size:0.95rem;color:${pageText}99;">📍 ${config.location || "Our Location"}<br/>🕐 Open Daily</p>
      </div>
    </section>`;
  }

  // About section
  let aboutHTML = "";
  if (config.sections.includes("about")) {
    const aboutImg = getCategoryImage(config.category, "about", 0, config);
    aboutHTML = `
    <section style="padding:60px 24px;background:${isDark ? "#0F0F0F" : "#F9FAFB"};">
      <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;">
        <div>
          <h2 style="font-family:${fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:12px;color:${pageText};">About Us</h2>
          <p style="font-size:0.95rem;color:${pageText}99;line-height:1.7;">${businessName} is dedicated to delivering the best experience with passion and quality.</p>
        </div>
        <div style="border-radius:12px;overflow:hidden;"><img src="${aboutImg}" alt="About" style="width:100%;height:280px;object-fit:cover;"/></div>
      </div>
    </section>`;
  }

  // Footer from template
  const footerCols = (footerSchema.columns as any[]) || [];
  const footerBg = footerSchema.background_color || (isDark ? "#0A0A0A" : pageBg);
  const footerColsHTML = footerCols.map((col: any) => `
    <div>
      <h4 style="font-weight:600;font-size:13px;margin-bottom:8px;color:${pageText};">${col.title}</h4>
      ${(col.links as string[]).map((l: string) => `<p style="font-size:12px;color:${pageText}88;margin-bottom:4px;">${l}</p>`).join("")}
    </div>
  `).join("");

  const domain = CATEGORY_CONFIGS[config.category]?.domain || ".shop";
  const slug = businessName.toLowerCase().replace(/\s+/g, "-");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${businessName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Georgia&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; background: ${pageBg}; color: ${pageText}; line-height: 1.6; }
    img { max-width: 100%; }
    @media (max-width: 768px) {
      section[style*="grid-template-columns:1fr 1fr"] { grid-template-columns: 1fr !important; }
      section[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
      [style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
      [style*="grid-template-columns:repeat(3"] { grid-template-columns: repeat(1, 1fr) !important; }
    }
  </style>
</head>
<body>
  <nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${navBg}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${borderColor};padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:52px;">
    <a href="#" style="text-decoration:none;display:flex;align-items:center;">${logoHtml}</a>
    <div style="display:flex;gap:20px;align-items:center;">${navLinks}${headerCta}</div>
  </nav>

  ${heroHTML}
  ${categoryHTML}
  ${menuHTML}
  ${deliveryHTML}
  ${aboutHTML}
  ${offerHTML}
  ${locationHTML}

  <footer style="padding:48px 24px;background:${footerBg};border-top:1px solid ${borderColor};">
    <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:24px;">
      ${footerColsHTML}
    </div>
    <p style="text-align:center;font-size:12px;color:${pageText}66;margin-top:32px;">${footerSchema.copyright || `${businessName} — All rights reserved.`}<br/>${slug}${domain}</p>
  </footer>
</body>
</html>`;
}

/** Generate 3 truly different website HTML variants */
export function generateWebsiteVariants(config: GeneratorConfig): string[] {
  // If an emenu template key is selected, use template-aware generation
  if (config.style && config.style.startsWith("emenu_")) {
    const preset = getTemplate("emenu", config.style);
    if (preset) {
      return [0, 1, 2].map(i => buildEmenuTemplateHTML(config, preset, i));
    }
  }

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
