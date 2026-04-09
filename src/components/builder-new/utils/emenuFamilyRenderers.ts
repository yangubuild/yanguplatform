/**
 * Template-family-aware renderers for emenu templates.
 * Each family produces 3 genuinely distinct variants:
 *   Variant 0 = "Classic" — the default family style
 *   Variant 1 = "Alternate" — different layout, shifted palette, different card style
 *   Variant 2 = "Bold" — inverted/contrasting layout, strong accent shift
 * DO NOT touch reservation flow — it remains in websiteGenerator.ts.
 */

import type { GeneratorConfig } from "./websiteGenerator";
import type { TemplatePreset } from "@/config/templateRegistry";

interface RenderContext {
  config: GeneratorConfig;
  preset: TemplatePreset;
  variantIndex: number;
}

// ─── Shared Utilities ───

/** Map a nav label to a section anchor id */
function navHref(label: string): string {
  const map: Record<string, string> = {
    home: "#hero", menu: "#menu", about: "#about", contact: "#contact",
    deals: "#deals", delivery: "#menu", reviews: "#reviews", gallery: "#gallery",
    story: "#about", subscribe: "#newsletter", order: "#menu",
  };
  return map[label.toLowerCase().trim()] || `#${label.toLowerCase().replace(/\s+/g, "-")}`;
}

function getImageUrl(config: GeneratorConfig, section: string, index: number): string {
  if (config.userImages?.length) {
    const purposeMap: Record<string, string[]> = {
      hero: ["page", "interior"],
      menu: ["menu"],
      about: ["team", "interior"],
    };
    const purposes = purposeMap[section] || ["page"];
    const matched = config.userImages.filter(i => purposes.includes(i.purpose));
    if (matched.length > 0) return matched[index % matched.length].url;
    return config.userImages[index % config.userImages.length].url;
  }
  const fallbacks: Record<string, string[]> = {
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
      "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80",
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80",
    ],
    about: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80"],
  };
  const arr = fallbacks[section] || fallbacks.menu;
  return arr[index % arr.length];
}

function baseStyles(isDark: boolean, pageText: string, pageBg: string): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; background: ${pageBg}; color: ${pageText}; line-height: 1.6; }
    img { max-width: 100%; }
    @media (max-width: 768px) {
      section[style*="grid-template-columns:1fr 1fr"] { grid-template-columns: 1fr !important; }
      section[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
      [style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
      [style*="grid-template-columns:repeat(3"] { grid-template-columns: repeat(2, 1fr) !important; }
      [style*="min-height:80vh"] { min-height: 60vh !important; padding-top: 80px !important; }
      [style*="min-height:85vh"] { min-height: 60vh !important; padding-top: 80px !important; }
    }
  `;
}

// ─── Variant palettes ───

interface VariantTheme {
  accent: string;
  accentText: string;
  pageBg: string;
  pageText: string;
  cardBg: string;
  borderColor: string;
  fontHeading: string;
  heroLayout: "split" | "fullwidth" | "centered";
  cardStyle: "rounded" | "sharp" | "pill";
  buttonRadius: string;
  menuCols: number;
  cardImageHeight: string;
}

// ═══════════════════════════════════════════════════════════════════
// PLATERIA — Elegant restaurant
// ═══════════════════════════════════════════════════════════════════

const PLATERIA_VARIANTS: VariantTheme[] = [
  {
    accent: "#D4A853", accentText: "#0A0A0A", pageBg: "#0A0A0A", pageText: "#F5F0E8",
    cardBg: "#151515", borderColor: "#2A2520", fontHeading: "'Playfair Display', serif",
    heroLayout: "split", cardStyle: "rounded", buttonRadius: "6px", menuCols: 3, cardImageHeight: "200px",
  },
  {
    accent: "#E8C77B", accentText: "#0A0A0A", pageBg: "#121618", pageText: "#ECE6DA",
    cardBg: "#1B1F22", borderColor: "#2E3438", fontHeading: "'Outfit', sans-serif",
    heroLayout: "fullwidth", cardStyle: "sharp", buttonRadius: "0px", menuCols: 2, cardImageHeight: "240px",
  },
  {
    accent: "#C47A5A", accentText: "#FFFFFF", pageBg: "#0E0B08", pageText: "#F0E8DC",
    cardBg: "#1A1510", borderColor: "#2D2518", fontHeading: "'Playfair Display', serif",
    heroLayout: "centered", cardStyle: "pill", buttonRadius: "28px", menuCols: 3, cardImageHeight: "180px",
  },
];

export function renderPlateria(ctx: RenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as any;
  const headerS = (s.header?.schema || {}) as any;
  const mainS = (s.main_content?.schema || {}) as any;
  const offerS = (s.offer?.schema || {}) as any;
  const footerS = (s.footer?.schema || {}) as any;

  const t = PLATERIA_VARIANTS[variantIndex] || PLATERIA_VARIANTS[0];
  const name = config.businessName || "Restaurant";
  const heroImg = getImageUrl(config, "hero", variantIndex);
  const items = (mainS.items as any[]) || [];
  const story = offerS.story_block || {};
  const testimonials = offerS.testimonials || {};
  const footerCols = (footerS.columns as any[]) || [];
  const navItems = (headerS.nav_items as string[]) || ["Home", "Menu", "About", "Contact"];
  const headline = heroS.headline || "Finest Culinary Experience";
  const subheadline = heroS.subheadline || "";
  const description = heroS.description || "";
  const ctaText = heroS.cta_text || "View Menu";

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:30px;"/>`
    : `<span style="font-family:${t.fontHeading};font-weight:700;font-size:20px;color:${t.accent};letter-spacing:0.05em;">${name}</span>`;

  const cardRadius = t.cardStyle === "sharp" ? "4px" : t.cardStyle === "pill" ? "20px" : "12px";
  const btnStyle = `padding:14px 36px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};text-decoration:none;font-weight:600;font-size:14px;display:inline-block;`;

  // Hero section varies by layout
  let heroHTML = "";
  if (t.heroLayout === "split") {
    heroHTML = `
    <section id="hero" style="min-height:85vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:56px;background:linear-gradient(135deg, ${t.pageBg} 0%, #1A1510 100%);">
      <div>
        ${subheadline ? `<p style="font-size:13px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};margin-bottom:16px;font-weight:500;">${subheadline}</p>` : ""}
        <h1 style="font-family:${t.fontHeading};font-size:clamp(2.5rem,5vw,3.8rem);font-weight:700;margin-bottom:20px;line-height:1.08;color:${t.pageText};">${headline}</h1>
        ${description ? `<p style="font-size:1rem;color:${t.pageText}88;margin-bottom:32px;line-height:1.8;max-width:440px;">${description}</p>` : ""}
        <a href="#menu" style="${btnStyle}">${ctaText}</a>
      </div>
      <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;">
        <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
      </div>
    </section>`;
  } else if (t.heroLayout === "fullwidth") {
    heroHTML = `
    <section style="min-height:90vh;position:relative;display:flex;align-items:flex-end;padding:0;">
      <div style="position:absolute;inset:0;"><img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;" alt=""/></div>
      <div style="position:absolute;inset:0;background:linear-gradient(to top, ${t.pageBg} 0%, transparent 60%);"></div>
      <div style="position:relative;z-index:1;padding:0 48px 72px;max-width:640px;">
        ${subheadline ? `<p style="font-size:13px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};margin-bottom:12px;">${subheadline}</p>` : ""}
        <h1 style="font-family:${t.fontHeading};font-size:clamp(2.8rem,6vw,4.2rem);font-weight:800;margin-bottom:16px;line-height:1.05;color:#FFFFFF;">${headline}</h1>
        ${description ? `<p style="font-size:1rem;color:#ffffffbb;margin-bottom:28px;max-width:480px;">${description}</p>` : ""}
        <a href="#menu" style="${btnStyle}">${ctaText}</a>
      </div>
    </section>`;
  } else {
    heroHTML = `
    <section id="hero" style="min-height:85vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;background:radial-gradient(ellipse at center, #1A1510 0%, ${t.pageBg} 70%);">
      <div style="width:180px;height:180px;border-radius:50%;overflow:hidden;margin-bottom:32px;border:3px solid ${t.accent}33;">
        <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
      </div>
      ${subheadline ? `<p style="font-size:13px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};margin-bottom:14px;">${subheadline}</p>` : ""}
      <h1 style="font-family:${t.fontHeading};font-size:clamp(2.4rem,5vw,3.6rem);font-weight:700;margin-bottom:20px;line-height:1.08;color:${t.pageText};max-width:600px;">${headline}</h1>
      ${description ? `<p style="font-size:1rem;color:${t.pageText}88;margin-bottom:32px;max-width:480px;">${description}</p>` : ""}
      <a href="#menu" style="${btnStyle}">${ctaText}</a>
    </section>`;
  }

  // Menu grid
  const menuHTML = `
  <section id="menu" style="padding:80px 32px;background:${t.pageBg};">
    <div style="max-width:1000px;margin:0 auto;text-align:center;">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};margin-bottom:8px;">MENU</p>
      <h2 style="font-family:${t.fontHeading};font-size:2rem;font-weight:700;margin-bottom:40px;color:${t.pageText};">${mainS.heading || "Our Menu"}</h2>
      <div style="display:grid;grid-template-columns:repeat(${t.menuCols},1fr);gap:24px;">
        ${items.map((item: any, idx: number) => {
          const imgSrc = getImageUrl(config, "menu", idx);
          const badge = item.badges?.[0] ? `<span style="position:absolute;top:10px;left:10px;padding:4px 12px;border-radius:${t.cardStyle === "sharp" ? "2px" : "12px"};background:${t.accent};color:${t.accentText};font-size:10px;font-weight:600;text-transform:uppercase;">${item.badges[0]}</span>` : "";
          return `<div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};overflow:hidden;position:relative;">
            ${badge}
            <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:${t.cardImageHeight};object-fit:cover;"/>
            <div style="padding:16px 18px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;font-size:14px;color:${t.pageText};">${item.title}</span>
                <span style="font-weight:700;font-size:14px;color:${t.accent};">${item.price || ""}</span>
              </div>
              ${item.description ? `<p style="font-size:12px;color:${t.pageText}66;margin-top:6px;line-height:1.5;">${item.description}</p>` : ""}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
  </section>`;

  // Story
  const storyHTML = story.enabled ? `
  <section id="about" style="padding:80px 32px;background:#0E0E0E;">
    <div style="max-width:640px;margin:0 auto;text-align:center;">
      ${story.eyebrow ? `<p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};margin-bottom:10px;">${story.eyebrow}</p>` : ""}
      <h2 style="font-family:${t.fontHeading};font-size:1.8rem;font-weight:700;margin-bottom:16px;color:${t.pageText};">${story.heading || ""}</h2>
      <p style="font-size:0.95rem;color:${t.pageText}88;line-height:1.8;">${story.description || ""}</p>
    </div>
  </section>` : "";

  // Testimonials
  const testimonialsHTML = testimonials.enabled && testimonials.items?.length ? `
  <section id="reviews" style="padding:72px 32px;background:${t.pageBg};">
    <div style="max-width:1000px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${t.fontHeading};font-size:1.6rem;font-weight:700;margin-bottom:32px;color:${t.pageText};">${testimonials.heading || "Reviews"}</h2>
      <div style="display:grid;grid-template-columns:repeat(${Math.min(testimonials.items.length, 3)},1fr);gap:20px;">
        ${testimonials.items.slice(0, 3).map((r: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:28px 22px;text-align:left;">
            <p style="font-size:14px;color:${t.pageText}cc;line-height:1.7;font-style:italic;">"${r.quote}"</p>
            <div style="margin-top:14px;"><span style="font-weight:600;font-size:13px;color:${t.pageText};">${r.name}</span></div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>` : "";

  // Footer
  const footerHTML = `
  <footer id="contact" style="padding:48px 32px;background:#050505;border-top:1px solid ${t.borderColor};">
    <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:32px;">
      ${footerCols.map((col: any) => `<div><h4 style="font-weight:600;font-size:13px;margin-bottom:10px;color:${t.accent};">${col.title}</h4>${(col.links as string[]).map((l: string) => `<p style="font-size:12px;color:${t.pageText}66;margin-bottom:4px;">${l}</p>`).join("")}</div>`).join("")}
    </div>
    <p style="text-align:center;font-size:11px;color:${t.pageText}44;margin-top:32px;">${footerS.copyright || `${name} — All rights reserved.`}</p>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(true, t.pageText, t.pageBg)}</style></head><body>
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${t.pageBg}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${t.borderColor};padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:56px;">
  ${logo}
  <div style="display:flex;gap:24px;align-items:center;">
    ${navItems.map(n => `<a href="${navHref(n)}" style="text-decoration:none;font-size:13px;color:${t.pageText}99;font-weight:400;letter-spacing:0.03em;">${n}</a>`).join("")}
  </div>
</nav>
${heroHTML}${menuHTML}${storyHTML}${testimonialsHTML}${footerHTML}
</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// YUMIX — Bold dark food brand (scraped from yumix.framer.website)
// Yellow accent on dark background, full-width hero, 4-col categories,
// 3x2 menu grid, about+stats, why-choose, catering, testimonials,
// FAQ accordion, newsletter, footer with social links.
// ═══════════════════════════════════════════════════════════════════

const YUMIX_VARIANTS: VariantTheme[] = [
  {
    accent: "#FFD700", accentText: "#0A0A0A", pageBg: "#0F0D0A", pageText: "#F5F0E8",
    cardBg: "#1A1714", borderColor: "#2D2A25", fontHeading: "'DM Sans', sans-serif",
    heroLayout: "fullwidth", cardStyle: "rounded", buttonRadius: "8px", menuCols: 3, cardImageHeight: "200px",
  },
  {
    accent: "#EF4444", accentText: "#FFFFFF", pageBg: "#0A0A0F", pageText: "#E8E8F0",
    cardBg: "#14141A", borderColor: "#25253A", fontHeading: "'Poppins', sans-serif",
    heroLayout: "fullwidth", cardStyle: "sharp", buttonRadius: "4px", menuCols: 3, cardImageHeight: "200px",
  },
  {
    accent: "#FBBF24", accentText: "#0A0A0A", pageBg: "#0D0F0A", pageText: "#F0F5E8",
    cardBg: "#171A14", borderColor: "#2A2D25", fontHeading: "'Outfit', sans-serif",
    heroLayout: "fullwidth", cardStyle: "pill", buttonRadius: "24px", menuCols: 3, cardImageHeight: "200px",
  },
];

export function renderYumix(ctx: RenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as any;
  const headerS = (s.header?.schema || {}) as any;
  const mainS = (s.main_content?.schema || {}) as any;
  const offerS = (s.offer?.schema || {}) as any;
  const footerS = (s.footer?.schema || {}) as any;

  const t = YUMIX_VARIANTS[variantIndex] || YUMIX_VARIANTS[0];
  const name = config.businessName || "Restaurant";
  const heroImg = getImageUrl(config, "hero", variantIndex);
  const items = (mainS.items as any[]) || [];
  const catShowcase = mainS.category_showcase;
  const promos = (offerS.promo_banners as any[]) || [];
  const stats = (offerS.stats as any[]) || [
    { value: "205+", label: "Unique Menu Items" },
    { value: "1950+", label: "Satisfied Customers" },
    { value: "500+", label: "5-Star Reviews" },
    { value: "40+", label: "Expert Chefs" },
  ];
  const testimonials = offerS.testimonials || {};
  const newsletter = offerS.newsletter || {};
  const story = offerS.story_block || {};
  const footerCols = (footerS.columns as any[]) || [];
  const navItems = (headerS.nav_items as string[]) || ["Home", "Menu", "About", "Blog"];
  const headline = heroS.headline || "Satisfy Your Cravings, Delight Your Tastebuds";
  const subheadline = heroS.subheadline || `${name} - Best Food Forever`;
  const description = heroS.description || `At ${name}, we expertly whip up every single meal using only the freshest ingredients and the most delicious flavors, crafted just for you!`;
  const ctaText = heroS.cta_text || "Explore Menu";
  const badge = heroS.badge;
  const cardRadius = t.cardStyle === "sharp" ? "4px" : t.cardStyle === "pill" ? "20px" : "16px";

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:28px;"/>`
    : `<span style="font-family:${t.fontHeading};font-weight:800;font-size:22px;color:${t.pageText};">${name}</span>`;

  const btnStyle = `padding:16px 32px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};text-decoration:none;font-weight:700;font-size:15px;display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer;`;
  const btnOutline = `padding:12px 28px;border-radius:${t.buttonRadius};border:1px solid ${t.borderColor};background:transparent;color:${t.pageText};text-decoration:none;font-weight:600;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;`;

  // ─── NAV ───
  const navHTML = `
  <nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${t.pageBg}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${t.borderColor};padding:0 48px;display:flex;align-items:center;justify-content:space-between;height:64px;">
    <div style="display:flex;align-items:center;gap:8px;">
      ${logo}
    </div>
    <div style="display:flex;gap:28px;align-items:center;">
      ${navItems.map((n, i) => `<a href="${navHref(n)}" style="text-decoration:none;font-size:14px;color:${i === 0 ? t.accent : t.pageText + '99'};font-weight:500;">${n}</a>`).join("")}
    </div>
    <a href="#contact" style="padding:10px 24px;border-radius:${t.buttonRadius};border:1px solid ${t.pageText}44;color:${t.pageText};text-decoration:none;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:6px;">Contact Us →</a>
  </nav>`;

  // ─── HERO — Full-width bg image, left-aligned content, badge, Google rating ───
  const heroHTML = `
  <section id="hero" style="min-height:100vh;position:relative;display:flex;align-items:center;padding:0 48px;">
    <div style="position:absolute;inset:0;"><img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;" alt=""/></div>
    <div style="position:absolute;inset:0;background:linear-gradient(90deg, ${t.pageBg}ee 0%, ${t.pageBg}88 50%, transparent 100%);"></div>
    <div style="position:relative;z-index:1;max-width:560px;padding-top:80px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid ${t.accent};">
          <img src="${getImageUrl(config, "menu", 0)}" style="width:100%;height:100%;object-fit:cover;" alt=""/>
        </div>
        <span style="font-size:14px;color:${t.accent};font-weight:500;">${subheadline}</span>
      </div>
      <h1 style="font-family:${t.fontHeading};font-size:clamp(2.8rem,5vw,3.8rem);font-weight:800;margin-bottom:20px;line-height:1.08;color:${t.pageText};">${headline}</h1>
      <p style="font-size:15px;color:${t.pageText}99;margin-bottom:32px;line-height:1.7;max-width:480px;">${description}</p>
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
        <a href="#menu" style="${btnStyle}">${ctaText} →</a>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-weight:700;font-size:14px;color:${t.pageText};">Google</span>
          <span style="color:${t.accent};font-size:14px;">★★★★★</span>
          <span style="font-size:13px;color:${t.pageText}88;">4.5/5</span>
        </div>
      </div>
    </div>
    ${badge ? `<div style="position:absolute;top:50%;right:15%;transform:translateY(-50%);width:160px;height:160px;border-radius:50%;background:${t.pageText};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:2;">
      <span style="font-size:11px;color:${t.pageBg}88;font-weight:500;">Limited Offer</span>
      <span style="font-size:2.5rem;font-weight:800;color:${t.pageBg};line-height:1;">${badge.text || "50%"}</span>
      <span style="font-size:11px;color:${t.pageBg}88;font-weight:500;">Discount</span>
    </div>` : ""}
  </section>`;

  // ─── CATEGORY GRID — 4-column with food images ───
  const defaultCats = [
    { title: "Main Dishes", count: "16 Items" },
    { title: "Beverages", count: "12 Items" },
    { title: "Desserts", count: "10 Items" },
    { title: "Appetizers", count: "14 Items" },
  ];
  const catItems = catShowcase?.enabled && catShowcase.items?.length ? catShowcase.items : defaultCats;
  const catHTML = `
  <section id="categories" style="padding:80px 48px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:48px;">
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.4rem);font-weight:800;margin-bottom:16px;color:${t.pageText};">Discover Our Food Category</h2>
        <p style="font-size:15px;color:${t.pageText}77;max-width:600px;margin:0 auto;line-height:1.7;">From sizzling starters to satisfying mains and sweet endings — our menu is thoughtfully organized into categories.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:32px;">
        ${catItems.map((cat: any, i: number) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};overflow:hidden;position:relative;">
            <div style="aspect-ratio:4/3;overflow:hidden;">
              <img src="${getImageUrl(config, "menu", i)}" alt="${cat.title}" style="width:100%;height:100%;object-fit:cover;"/>
            </div>
            <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span style="font-weight:700;font-size:15px;color:${t.pageText};">${cat.title}</span>
                <br/><span style="font-size:12px;color:${t.pageText}66;">${cat.count || ""}</span>
              </div>
              <span style="color:${t.accent};font-size:16px;">→</span>
            </div>
          </div>
        `).join("")}
      </div>
      <div style="text-align:center;">
        <a href="#menu" style="font-size:14px;color:${t.accent};text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:6px;">Browse More Categories →</a>
      </div>
    </div>
  </section>`;

  // ─── PROMO BANNERS — 2 cards side by side ───
  const defaultPromos = [
    { heading: "🔥 Delicious Deals Await!", description: "Enjoy Buy 1 Get 1 FREE on selected items every Friday!", cta_text: "Explore Menu" },
    { heading: "🔥 20% OFF Your First Order!", description: "Use code YUM20 at checkout and enjoy the savings!", cta_text: "Explore Menu" },
  ];
  const promoItems = promos.length ? promos : defaultPromos;
  const promoHTML = `
  <section id="deals" style="padding:64px 48px;background:#141210;">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(2,1fr);gap:24px;">
      ${promoItems.slice(0, 2).map((p: any) => `
        <div style="background:linear-gradient(135deg, ${t.accent}22 0%, ${t.accent}08 100%);border:1px solid ${t.accent}33;border-radius:${cardRadius};padding:36px 28px;position:relative;overflow:hidden;">
          <h3 style="font-family:${t.fontHeading};font-size:1.3rem;font-weight:800;margin-bottom:10px;color:${t.pageText};">${p.heading}</h3>
          <p style="font-size:14px;color:${t.pageText}88;margin-bottom:20px;line-height:1.6;">${p.description}</p>
          ${p.cta_text ? `<a href="#menu" style="font-size:14px;color:${t.accent};text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:6px;">${p.cta_text} →</a>` : ""}
        </div>
      `).join("")}
    </div>
  </section>`;

  // ─── MENU GRID — 3×2 with price, category, name, description ───
  const menuHTML = `
  <section id="menu" style="padding:80px 48px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;">
        <div>
          <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.4rem);font-weight:800;margin-bottom:12px;color:${t.pageText};">Find Your Best Delicious Flavor</h2>
          <p style="font-size:15px;color:${t.pageText}77;max-width:480px;line-height:1.7;">Scroll, select, and savor — our diverse menu brings together the best of local favorites and global flavors.</p>
        </div>
        <a href="#" style="font-size:14px;color:${t.accent};text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">Browse More Dishes →</a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(${t.menuCols},1fr);gap:24px;">
        ${items.map((item: any, idx: number) => {
          const imgSrc = getImageUrl(config, "menu", idx);
          const category = item.category || (idx % 2 === 0 ? "Spicy & Zesty" : "Classic Flavor");
          return `<div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};overflow:hidden;">
            <div style="aspect-ratio:16/10;overflow:hidden;">
              <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;"/>
            </div>
            <div style="padding:20px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-weight:800;font-size:18px;color:${t.accent};">${item.price || ""}</span>
                <span style="font-size:12px;color:${t.pageText}66;">${category}</span>
              </div>
              <h3 style="font-weight:700;font-size:16px;color:${t.pageText};margin-bottom:6px;">${item.title}</h3>
              ${item.description ? `<p style="font-size:13px;color:${t.pageText}77;line-height:1.6;">${item.description}</p>` : ""}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
  </section>`;

  // ─── ABOUT + STATS — "More Than Just Food" ───
  const aboutHTML = `
  <section id="about" style="padding:80px 48px;background:#141210;">
    <div style="max-width:1200px;margin:0 auto;text-align:center;margin-bottom:56px;">
      <h2 style="font-family:${t.fontHeading};font-size:clamp(2rem,4vw,2.8rem);font-weight:800;margin-bottom:16px;color:${t.pageText};">More Than Just Food – It's a Flavor Story</h2>
      <p style="font-size:15px;color:${t.pageText}77;max-width:640px;margin:0 auto;line-height:1.7;">${story.description || `At ${name}, we offer bold flavors and fresh ingredients. From juicy burgers to refreshing drinks, every bite satisfies your cravings.`}</p>
    </div>
    <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center;">
      ${stats.map((st: any) => `
        <div>
          <div style="font-family:${t.fontHeading};font-size:2.5rem;font-weight:800;color:${t.accent};line-height:1;">${st.value}</div>
          <div style="font-size:13px;color:${t.pageText}77;margin-top:8px;">${st.label}</div>
        </div>
      `).join("")}
    </div>
  </section>`;

  // ─── WHY CHOOSE US — 4 feature cards ───
  const defaultFeatures = [
    { title: "Expertly Crafted Recipes", desc: "Our chefs mix creativity with flavor to deliver dishes that are both innovative and satisfying." },
    { title: "Hygiene & Safety First", desc: "Strict standards ensure every dish is prepared in the cleanest, safest environment." },
    { title: "Made with Premium Ingredients", desc: "We source only the freshest, highest-quality ingredients for an exceptional dining experience." },
    { title: "Served with Love & Care", desc: "Every dish is plated beautifully and served with genuine warmth and attention." },
  ];
  const features = (offerS.features as any[]) || defaultFeatures;
  const whyHTML = `
  <section style="padding:80px 48px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">
        ${features.slice(0, 4).map((f: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:28px 22px;">
            <div style="width:44px;height:44px;border-radius:12px;background:${t.accent}15;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="color:${t.accent};font-size:18px;">✦</span>
            </div>
            <h3 style="font-size:15px;font-weight:700;margin-bottom:8px;color:${t.pageText};">${f.title}</h3>
            <p style="font-size:13px;color:${t.pageText}77;line-height:1.6;">${f.desc || f.description || ""}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;

  // ─── CATERING — 3 event cards ───
  const cateringHTML = `
  <section style="padding:80px 48px;background:#141210;">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:48px;align-items:start;">
        <div>
          <h2 style="font-family:${t.fontHeading};font-size:clamp(1.6rem,3vw,2.2rem);font-weight:800;margin-bottom:16px;color:${t.pageText};">Catering Cravings for Every Celebration</h2>
          <p style="font-size:14px;color:${t.pageText}77;line-height:1.7;margin-bottom:24px;">From intimate gatherings to grand celebrations, ${name} delivers delicious food options that impress every guest.</p>
          <a href="#menu" style="font-size:14px;color:${t.accent};text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:6px;">Explore Menu →</a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
          ${["Social Event", "Corporate", "Wedding"].map((ev, i) => `
            <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};overflow:hidden;text-align:center;">
              <div style="aspect-ratio:1/1;overflow:hidden;">
                <img src="${getImageUrl(config, "menu", i + 3)}" alt="${ev}" style="width:100%;height:100%;object-fit:cover;"/>
              </div>
              <div style="padding:16px;">
                <h4 style="font-weight:700;font-size:15px;color:${t.pageText};margin-bottom:4px;">${ev}</h4>
                <span style="font-size:12px;color:${t.pageText}66;">80+ Packages Available</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  </section>`;

  // ─── TESTIMONIALS — 3 review cards ───
  const testimonialsHTML = testimonials.enabled && testimonials.items?.length ? `
  <section id="reviews" style="padding:80px 48px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;">
        <div>
          <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.4rem);font-weight:800;margin-bottom:12px;color:${t.pageText};">Here's What Our Foodies Are Raving About!</h2>
          <p style="font-size:14px;color:${t.pageText}77;max-width:440px;line-height:1.7;">We serve happiness, flavor, and unforgettable experiences. Here's what our customers say.</p>
        </div>
        <div style="text-align:right;">
          <div style="font-family:${t.fontHeading};font-size:1.4rem;font-weight:800;color:${t.pageText};">12K+ Happy Customers</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
        ${testimonials.items.slice(0, 3).map((r: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:28px 24px;">
            <div style="color:${t.accent};font-size:14px;margin-bottom:16px;">★★★★★</div>
            <p style="font-size:14px;color:${t.pageText}cc;line-height:1.7;margin-bottom:20px;">"${r.quote}"</p>
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:40px;height:40px;border-radius:50%;background:${t.accent}22;display:flex;align-items:center;justify-content:center;font-weight:700;color:${t.accent};font-size:16px;">${(r.name || "G")[0]}</div>
              <div>
                <span style="font-weight:600;font-size:14px;color:${t.pageText};display:block;">${r.name}</span>
                <span style="font-size:12px;color:${t.pageText}66;">Food Lover</span>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>` : "";

  // ─── FAQ ACCORDION — 2-column layout ───
  const faqItems = (offerS.faq as any[]) || [
    { q: "What kind of food do you offer?", a: "We offer a wide range of dishes from local favorites to global flavors, all made fresh daily." },
    { q: "Do you offer delivery?", a: "Yes! We deliver to your doorstep. Order through our menu section above." },
    { q: "Can I customize my order?", a: "Absolutely! Let us know your preferences and dietary requirements." },
    { q: "What are your opening hours?", a: "We're open daily from 10 AM to 11 PM. Check our contact section for details." },
  ];
  const faqHTML = faqItems.length ? `
  <section id="faq" style="padding:80px 48px;background:#141210;">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:48px;">
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.4rem);font-weight:800;color:${t.pageText};">Frequently Asked Questions</h2>
        <p style="font-size:14px;color:${t.pageText}77;max-width:500px;margin:8px auto 0;line-height:1.7;">Curious about ${name}? We've answered the most common questions about delivery, customization, and payment!</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:48px;align-items:start;">
        <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:28px;">
          <div style="aspect-ratio:4/3;overflow:hidden;border-radius:12px;margin-bottom:16px;">
            <img src="${getImageUrl(config, "about", 0)}" alt="FAQ" style="width:100%;height:100%;object-fit:cover;"/>
          </div>
          <p style="font-size:13px;color:${t.pageText}77;line-height:1.6;">Still have questions? Don't worry — our team is ready to help.</p>
          <a href="#contact" style="margin-top:12px;font-size:14px;color:${t.accent};text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:6px;">Contact Us →</a>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${faqItems.map((faq: any) => `
            <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:20px 24px;">
              <h4 style="font-weight:600;font-size:15px;color:${t.pageText};margin-bottom:8px;">${faq.q}</h4>
              <p style="font-size:13px;color:${t.pageText}77;line-height:1.6;">${faq.a}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  </section>` : "";

  // ─── NEWSLETTER — Email subscription CTA ───
  const newsletterHTML = `
  <section id="newsletter" style="padding:80px 48px;background:${t.pageBg};position:relative;overflow:hidden;">
    <div style="max-width:600px;margin:0 auto;text-align:center;">
      <p style="font-size:14px;color:${t.accent};font-weight:600;margin-bottom:12px;">${newsletter.eyebrow || "Subscribe now and get 10% off your first order!"}</p>
      <h2 style="font-family:${t.fontHeading};font-size:clamp(1.6rem,3vw,2.2rem);font-weight:800;margin-bottom:12px;color:${t.pageText};">${newsletter.heading || "Sign Up for Tasty Updates"}</h2>
      <p style="font-size:14px;color:${t.pageText}77;margin-bottom:28px;line-height:1.6;">Be the first to know about our newest dishes, exclusive discounts, seasonal specials, and foodie tips.</p>
      <div style="display:flex;gap:0;max-width:480px;margin:0 auto;background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${t.buttonRadius};overflow:hidden;">
        <input type="email" placeholder="Enter your email" style="flex:1;padding:14px 20px;border:none;background:transparent;color:${t.pageText};font-size:14px;outline:none;"/>
        <button style="padding:14px 28px;background:${t.accent};color:${t.accentText};border:none;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:6px;">${newsletter.cta_text || "Subscribe"} →</button>
      </div>
    </div>
  </section>`;

  // ─── FOOTER — Logo + description + social + 3 columns ───
  const footerHTML = `
  <footer id="contact" style="padding:64px 48px 32px;background:#0A0908;border-top:1px solid ${t.borderColor};">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;">
      <div>
        ${logo}
        <p style="font-size:13px;color:${t.pageText}66;margin-top:16px;line-height:1.7;max-width:280px;">${description}</p>
        <div style="margin-top:20px;">
          <span style="font-size:13px;color:${t.pageText}88;display:block;margin-bottom:10px;">Follow us on</span>
          <div style="display:flex;gap:10px;">
            ${["IG", "X", "IN", "FB"].map(s => `<div style="width:34px;height:34px;border-radius:50%;border:1px solid ${t.borderColor};display:flex;align-items:center;justify-content:center;font-size:11px;color:${t.pageText}88;">${s}</div>`).join("")}
          </div>
        </div>
      </div>
      ${footerCols.length ? footerCols.map((col: any) => `
        <div>
          <h4 style="font-weight:700;font-size:14px;margin-bottom:16px;color:${t.accent};">${col.title}</h4>
          ${(col.links as string[]).map((l: string) => `<p style="font-size:13px;color:${t.pageText}55;margin-bottom:8px;">${l}</p>`).join("")}
        </div>
      `).join("") : `
        <div>
          <h4 style="font-weight:700;font-size:14px;margin-bottom:16px;color:${t.accent};">Useful Links</h4>
          <p style="font-size:13px;color:${t.pageText}55;margin-bottom:8px;">Contact Us</p>
          <p style="font-size:13px;color:${t.pageText}55;margin-bottom:8px;">Terms & Conditions</p>
          <p style="font-size:13px;color:${t.pageText}55;margin-bottom:8px;">Privacy Policy</p>
        </div>
        <div>
          <h4 style="font-weight:700;font-size:14px;margin-bottom:16px;color:${t.accent};">Quick Links</h4>
          <p style="font-size:13px;color:${t.pageText}55;margin-bottom:8px;">Home</p>
          <p style="font-size:13px;color:${t.pageText}55;margin-bottom:8px;">Food Menu</p>
          <p style="font-size:13px;color:${t.pageText}55;margin-bottom:8px;">About Us</p>
        </div>
        <div>
          <h4 style="font-weight:700;font-size:14px;margin-bottom:16px;color:${t.accent};">Get in Touch</h4>
          <p style="font-size:13px;color:${t.pageText}55;margin-bottom:8px;">${(config as any).phone || "+1 234 567 890"}</p>
          <p style="font-size:13px;color:${t.pageText}55;margin-bottom:8px;">${(config as any).email || "hello@restaurant.com"}</p>
        </div>
      `}
    </div>
    <div style="max-width:1200px;margin:40px auto 0;padding-top:20px;border-top:1px solid ${t.borderColor};">
      <p style="text-align:center;font-size:12px;color:${t.pageText}33;">${footerS.copyright || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}</p>
    </div>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(true, t.pageText, t.pageBg)}
  @media (max-width: 768px) {
    [style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
    [style*="grid-template-columns:repeat(3"] { grid-template-columns: 1fr !important; }
    [style*="grid-template-columns:1fr 1.5fr"] { grid-template-columns: 1fr !important; }
    [style*="grid-template-columns:1fr 2fr"] { grid-template-columns: 1fr !important; }
    [style*="grid-template-columns:2fr 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
    nav { padding: 0 16px !important; }
    section { padding-left: 20px !important; padding-right: 20px !important; }
    footer { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style></head><body>
${navHTML}
${heroHTML}${catHTML}${promoHTML}${menuHTML}${aboutHTML}${whyHTML}${cateringHTML}${testimonialsHTML}${faqHTML}${newsletterHTML}${footerHTML}
</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// ZOOOM — Plateria-inspired premium restaurant template
// ═══════════════════════════════════════════════════════════════════

const ZOOOM_VARIANTS: VariantTheme[] = [
  {
    accent: "#F97316", accentText: "#FFFFFF", pageBg: "#FFFFFF", pageText: "#1A1A1A",
    cardBg: "#FFFFFF", borderColor: "#E5E7EB", fontHeading: "'Playfair Display', serif",
    heroLayout: "centered", cardStyle: "rounded", buttonRadius: "999px", menuCols: 4, cardImageHeight: "200px",
  },
  {
    accent: "#D97706", accentText: "#FFFFFF", pageBg: "#FFFDF8", pageText: "#1C1917",
    cardBg: "#FFFFFF", borderColor: "#E7E5E4", fontHeading: "'Playfair Display', serif",
    heroLayout: "centered", cardStyle: "rounded", buttonRadius: "999px", menuCols: 3, cardImageHeight: "220px",
  },
  {
    accent: "#EA580C", accentText: "#FFFFFF", pageBg: "#FFF7ED", pageText: "#171717",
    cardBg: "#FFFFFF", borderColor: "#FED7AA", fontHeading: "'Playfair Display', serif",
    heroLayout: "centered", cardStyle: "rounded", buttonRadius: "999px", menuCols: 4, cardImageHeight: "200px",
  },
];

export function renderZooom(ctx: RenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as any;
  const headerS = (s.header?.schema || {}) as any;
  const mainS = (s.main_content?.schema || {}) as any;
  const offerS = (s.offer?.schema || {}) as any;
  const footerS = (s.footer?.schema || {}) as any;

  const t = ZOOOM_VARIANTS[variantIndex] || ZOOOM_VARIANTS[0];
  const name = config.businessName || "Restaurant";
  const heroImg = getImageUrl(config, "hero", variantIndex);
  const items = (mainS.items as any[]) || [];
  const catShowcase = mainS.category_showcase;
  const story = offerS.story_block || {};
  const testimonials = offerS.testimonials || {};
  const footerCols = (footerS.columns as any[]) || [];
  const navItems = (headerS.nav_items as string[]) || ["About", "Menu", "Gallery", "Contact"];
  const headline = heroS.headline || "Where every meal is a chef masterpiece";
  const subheadline = heroS.subheadline || "We bring you the finest flavors, carefully crafted with the freshest ingredients";
  const ctaText = heroS.cta_text || "Book a table";
  const warmBg = "#FFF8F2";

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:32px;"/>`
    : `<span style="font-family:${t.fontHeading};font-weight:700;font-size:22px;color:${t.pageText};">${name}</span>`;

  const btnPrimary = `padding:14px 36px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};text-decoration:none;font-weight:600;font-size:15px;display:inline-block;border:none;cursor:pointer;`;
  const btnOutline = `padding:14px 36px;border-radius:${t.buttonRadius};background:transparent;color:${t.pageText};text-decoration:none;font-weight:500;font-size:15px;border:1px solid ${t.borderColor};display:inline-block;`;

  // NAV — Plateria style: logo left, nav links center, CTA right
  const navHTML = `
  <nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${t.pageBg}ee;backdrop-filter:blur(16px);padding:0 48px;display:flex;align-items:center;justify-content:space-between;height:72px;">
    <div style="flex-shrink:0;">${logo}</div>
    <div style="display:flex;gap:32px;align-items:center;">
      ${navItems.map(n => `<a href="${navHref(n)}" style="text-decoration:none;font-size:15px;color:${t.pageText};font-weight:500;padding:6px 12px;border-radius:999px;transition:background 0.2s;">${n}</a>`).join("")}
    </div>
    <a href="#menu" style="${btnPrimary}font-size:14px;padding:12px 28px;">${ctaText}</a>
  </nav>`;

  // HERO — Plateria centered style with tagline
  const heroTagline = heroS.tagline || "PREMIUM RESTAURANT";
  const heroHTML = `
  <section id="hero" style="min-height:90vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:140px 24px 60px;background:${warmBg};">
    <div style="max-width:1200px;margin:0 auto;width:100%;">
      <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:24px;">${heroTagline}</p>
      <h1 style="font-family:${t.fontHeading};font-size:clamp(2.6rem,5vw,4rem);font-weight:700;margin-bottom:24px;line-height:1.15;color:${t.pageText};max-width:700px;margin-left:auto;margin-right:auto;">${headline}</h1>
      <p style="font-size:16px;color:${t.pageText}99;max-width:500px;margin:0 auto 32px;line-height:1.7;">${subheadline}</p>
      <div style="display:flex;gap:16px;justify-content:center;align-items:center;">
        <a href="#menu" style="${btnPrimary}">${ctaText}</a>
        <span style="font-size:14px;color:${t.pageText}88;">(4.9/5)</span>
        <span style="color:${t.accent};font-size:16px;">★★★★★</span>
      </div>
    </div>
  </section>`;

  // FEATURE CARDS — "Best dining experience" section
  const featureItems = (offerS.features as any[]) || [
    { number: "01", title: "Authentic Flavors", desc: "We take pride in offering an array of dishes made with love & quality" },
    { number: "02", title: "Cozy Ambiance", desc: "Our restaurant provides the perfect setting to enjoy your food" },
    { number: "03", title: "Exceptional Service", desc: "Our team is dedicated to making your dining experience smooth" },
  ];
  const featuresHTML = `
  <section id="about" style="padding:80px 24px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:48px;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:16px;">Best Dining Experience</p>
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.4rem);font-weight:700;color:${t.pageText};max-width:600px;margin:0 auto;">Best dining experience with every dish</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:48px;">
        ${featureItems.slice(0,3).map((f: any, i: number) => `
          <div style="text-align:center;padding:32px 24px;">
            <div style="font-family:${t.fontHeading};font-size:3rem;font-weight:700;color:${t.pageText}15;margin-bottom:12px;">0${i + 1}</div>
            <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;color:${t.pageText};">${f.title}</h3>
            <p style="font-size:14px;color:${t.pageText}77;line-height:1.6;">${f.desc}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;

  // MENU — Category tabs + grid
  const categories = catShowcase?.items?.map((c: any) => c.title) || ["Full Menu", "Courses", "Desserts", "Starters"];
  const menuHTML = `
  <section id="menu" style="padding:80px 24px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:16px;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:16px;">This is what we serve you</p>
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.4rem);font-weight:700;color:${t.pageText};max-width:600px;margin:0 auto 32px;">Discover the perfect meal for every taste</h2>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:40px;">
        ${categories.map((cat: string, i: number) => `<button style="padding:10px 24px;border-radius:999px;border:1px solid ${i === 0 ? t.accent : t.borderColor};background:${i === 0 ? t.accent : 'transparent'};color:${i === 0 ? t.accentText : t.pageText};font-size:14px;font-weight:500;cursor:pointer;">${cat}</button>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(${t.menuCols},1fr);gap:20px;">
        ${items.map((item: any, idx: number) => {
          const imgSrc = getImageUrl(config, "menu", idx);
          return `<a href="#" style="text-decoration:none;color:inherit;background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:16px;overflow:hidden;transition:box-shadow 0.2s;">
            <div style="aspect-ratio:1/1;overflow:hidden;">
              <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;"/>
            </div>
            <div style="padding:16px;">
              <div style="font-weight:600;font-size:15px;color:${t.pageText};margin-bottom:4px;">${item.title}</div>
              <div style="font-weight:600;font-size:14px;color:${t.pageText}88;">${item.price || ""}</div>
            </div>
          </a>`;
        }).join("")}
      </div>
    </div>
  </section>`;

  // WHY CHOOSE US — 6 icon cards
  const whyItems = (offerS.why_choose as any[]) || [
    { title: "Fresh Ingredients", desc: "Only the freshest ingredients are used in our dishes daily" },
    { title: "Creative Plating", desc: "Every meal is beautifully plated, showcasing our culinary art" },
    { title: "Artisan Recipes", desc: "Each dish is made with our unique, handcrafted artisan recipes" },
    { title: "Locally Sourced", desc: "We work with local farmers to bring the best ingredients" },
    { title: "Sustainable Practices", desc: "We focus on reducing food waste while supporting sustainability" },
    { title: "Exceptional Service", desc: "Delivering personalized service for an unforgettable dining experience" },
  ];
  const whyHTML = `
  <section style="padding:80px 24px;background:${warmBg};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:48px;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:16px;">Discover what makes us special</p>
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.4rem);font-weight:700;color:${t.pageText};max-width:600px;margin:0 auto;">Why choose ${name} for your dining experience</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
        ${whyItems.slice(0,6).map((w: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:16px;padding:28px 24px;">
            <div style="width:40px;height:40px;border-radius:12px;background:${t.accent}15;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="color:${t.accent};font-size:18px;">✦</span>
            </div>
            <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;color:${t.pageText};">${w.title}</h3>
            <p style="font-size:14px;color:${t.pageText}77;line-height:1.6;">${w.desc}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;

  // STORY / About
  const storyHTML = story.enabled ? `
  <section style="padding:80px 24px;background:${t.pageBg};">
    <div style="max-width:800px;margin:0 auto;text-align:center;">
      ${story.eyebrow ? `<p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:16px;">${story.eyebrow}</p>` : ""}
      <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.4rem);font-weight:700;margin-bottom:20px;color:${t.pageText};">${story.heading || ""}</h2>
      <p style="font-size:16px;color:${t.pageText}88;line-height:1.8;">${story.description || ""}</p>
    </div>
  </section>` : "";

  // TESTIMONIALS — Review cards
  const testimonialsHTML = testimonials.enabled && testimonials.items?.length ? `
  <section id="reviews" style="padding:80px 24px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:48px;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:16px;">Real experiences, real satisfaction</p>
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.4rem);font-weight:700;color:${t.pageText};">Customer reviews that speak for themselves</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
        ${testimonials.items.slice(0, 3).map((r: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:16px;padding:28px 24px;">
            <div style="color:${t.accent};font-size:14px;margin-bottom:16px;">★★★★★</div>
            <p style="font-size:15px;color:${t.pageText}bb;line-height:1.7;margin-bottom:20px;">"${r.quote}"</p>
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:40px;height:40px;border-radius:50%;background:${t.accent}20;display:flex;align-items:center;justify-content:center;font-weight:600;color:${t.accent};font-size:16px;">${(r.name || "G")[0]}</div>
              <span style="font-weight:600;font-size:14px;color:${t.pageText};">${r.name}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>` : "";

  // CTA BANNER — Orange full-width
  const ctaBannerHTML = `
  <section style="background:${t.accent};padding:80px 24px;position:relative;overflow:hidden;">
    <div style="max-width:700px;margin:0 auto;text-align:center;position:relative;z-index:1;">
      <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${t.accentText}cc;font-weight:600;margin-bottom:16px;">Reserve your spot today</p>
      <h2 style="font-family:${t.fontHeading};font-size:clamp(2rem,4vw,3rem);font-weight:700;color:${t.accentText};margin-bottom:20px;">Ready to indulge in a memorable meal?</h2>
      <p style="font-size:16px;color:${t.accentText}cc;margin-bottom:32px;line-height:1.7;">Reserve your table now and enjoy a delightful dining experience with exceptional flavors</p>
      <div style="display:flex;gap:16px;justify-content:center;align-items:center;">
        <a href="#menu" style="padding:14px 36px;border-radius:${t.buttonRadius};background:${t.accentText};color:${t.accent};text-decoration:none;font-weight:600;font-size:15px;">${ctaText}</a>
        <span style="font-size:14px;color:${t.accentText}88;">(4.9/5)</span>
        <span style="color:${t.accentText};font-size:16px;">★★★★★</span>
      </div>
    </div>
  </section>`;

  // FOOTER — Plateria 4-column style
  const footerHTML = `
  <footer id="contact" style="padding:64px 24px 48px;background:${t.pageBg};border-top:1px solid ${t.borderColor};">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;">
      <div>
        ${logo}
        <p style="font-size:14px;color:${t.pageText}77;margin-top:16px;line-height:1.7;max-width:280px;">${footerS.description || `A modern restaurant with premium dining experiences`}</p>
        <div style="display:flex;gap:12px;margin-top:20px;">
          ${["X", "IG", "FB", "TT"].map(s => `<div style="width:36px;height:36px;border-radius:50%;border:1px solid ${t.borderColor};display:flex;align-items:center;justify-content:center;font-size:11px;color:${t.pageText}88;">${s}</div>`).join("")}
        </div>
      </div>
      ${footerCols.length ? footerCols.map((col: any) => `
        <div>
          <h4 style="font-weight:600;font-size:15px;margin-bottom:16px;color:${t.pageText};">${col.title}</h4>
          ${(col.links as string[]).map((l: string) => `<p style="font-size:14px;color:${t.pageText}77;margin-bottom:10px;">${l}</p>`).join("")}
        </div>
      `).join("") : `
        <div>
          <h4 style="font-weight:600;font-size:15px;margin-bottom:16px;color:${t.pageText};">Menu</h4>
          <p style="font-size:14px;color:${t.pageText}77;margin-bottom:10px;">Home</p>
          <p style="font-size:14px;color:${t.pageText}77;margin-bottom:10px;">About</p>
          <p style="font-size:14px;color:${t.pageText}77;margin-bottom:10px;">Menu</p>
          <p style="font-size:14px;color:${t.pageText}77;margin-bottom:10px;">Gallery</p>
        </div>
        <div>
          <h4 style="font-weight:600;font-size:15px;margin-bottom:16px;color:${t.pageText};">Contact</h4>
          <p style="font-size:14px;color:${t.pageText}77;margin-bottom:10px;">${(config as any).phone || "+123 456 789"}</p>
          <p style="font-size:14px;color:${t.pageText}77;margin-bottom:10px;">${(config as any).email || "hello@restaurant.com"}</p>
          <p style="font-size:14px;color:${t.pageText}77;margin-bottom:10px;">${(config as any).address || "Los Angeles"}</p>
        </div>
      `}
    </div>
    <div style="max-width:1200px;margin:40px auto 0;padding-top:24px;border-top:1px solid ${t.borderColor};">
      <p style="text-align:center;font-size:13px;color:${t.pageText}55;">${footerS.copyright || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}</p>
    </div>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(false, t.pageText, t.pageBg)}
  @media (max-width: 768px) {
    [style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
    [style*="grid-template-columns:repeat(3"] { grid-template-columns: repeat(2, 1fr) !important; }
    [style*="grid-template-columns:2fr 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
    nav { padding: 0 16px !important; }
    nav > div:nth-child(2) { display: none !important; }
  }
</style></head><body>
${navHTML}
${heroHTML}${featuresHTML}${menuHTML}${whyHTML}${storyHTML}${testimonialsHTML}${ctaBannerHTML}${footerHTML}
</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// SOFRA — Elegant serif restaurant (scraped from sofra.framer.website)
// Dark green bg, copper/gold accent, serif typography, hero with
// leaf accents, about with stats grid, 3-col categories, why-choose,
// menu with tabs, event booking, testimonials, reservation form,
// gallery grid, large-letter footer.
// ═══════════════════════════════════════════════════════════════════

const SOFRA_VARIANTS: VariantTheme[] = [
  {
    accent: "#C49A6C", accentText: "#FFFFFF", pageBg: "#1A2820", pageText: "#F5F0E8",
    cardBg: "#223830", borderColor: "#2E4A3C", fontHeading: "'Playfair Display', serif",
    heroLayout: "fullwidth", cardStyle: "rounded", buttonRadius: "4px", menuCols: 1, cardImageHeight: "200px",
  },
  {
    accent: "#D4A853", accentText: "#FFFFFF", pageBg: "#0E1A14", pageText: "#ECE6DA",
    cardBg: "#182A20", borderColor: "#2A3E30", fontHeading: "'Playfair Display', serif",
    heroLayout: "split", cardStyle: "sharp", buttonRadius: "0px", menuCols: 1, cardImageHeight: "220px",
  },
  {
    accent: "#B8845A", accentText: "#FFFFFF", pageBg: "#1C2E24", pageText: "#F0E8DC",
    cardBg: "#253C30", borderColor: "#3A5446", fontHeading: "'Playfair Display', serif",
    heroLayout: "centered", cardStyle: "rounded", buttonRadius: "28px", menuCols: 1, cardImageHeight: "200px",
  },
];

export function renderSofra(ctx: RenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const t = SOFRA_VARIANTS[variantIndex % SOFRA_VARIANTS.length];
  const name = config.businessName || "Sofra";
  const heroImg = getImageUrl(config, "hero", variantIndex);
  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:40px;"/>`
    : `<span style="font-family:${t.fontHeading};font-size:28px;font-weight:700;color:${t.accent};">${name}</span>`;

  const navLinks = preset.patches?.header?.schema?.nav_items || ["Home", "About Us", "Why Choose", "Book a Table"];
  const sections = preset.patches || {};
  const heroS = sections.hero?.schema || {};
  const mainS = sections.main_content?.schema || {};
  const offerS = sections.offer?.schema || {};
  const footerS = sections.footer?.schema || {};
  const footerCols = footerS.columns || [];

  // NAV
  const navHTML = `
  <nav style="display:flex;align-items:center;justify-content:space-between;padding:20px 48px;background:${t.pageBg};border-bottom:1px solid ${t.borderColor};position:sticky;top:0;z-index:100;">
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="color:${t.accent};font-size:24px;">✕</span>
      ${logo}
    </div>
    <div style="display:flex;gap:32px;">
      ${navLinks.map((l: string) => `<a href="${navHref(l)}" style="color:${t.pageText};text-decoration:none;font-size:14px;letter-spacing:2px;text-transform:uppercase;font-family:'Inter',sans-serif;">${l}</a>`).join("")}
    </div>
    <a href="#menu" style="display:inline-block;padding:14px 28px;background:${t.accent};color:${t.accentText};text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;border-radius:${t.buttonRadius};">VIEW MENU</a>
  </nav>`;

  // HERO
  const headline = heroS.headline || "Savor Every Moment with Every Bite";
  const heroDesc = heroS.description || "Delight in flavors crafted to bring joy, comfort, and unforgettable dining experiences every time.";
  const heroCTA = heroS.cta_text || "BOOK YOUR TABLE";
  // Split headline — last two words in accent
  const words = headline.split(" ");
  const lastTwo = words.slice(-2).join(" ");
  const firstPart = words.slice(0, -2).join(" ");

  const heroHTML = `
  <section id="hero" style="position:relative;min-height:85vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 48px 80px;background:${t.pageBg};overflow:hidden;">
    <div style="position:relative;z-index:2;max-width:900px;">
      <h1 style="font-family:${t.fontHeading};font-size:clamp(2.5rem,5.5vw,4.5rem);font-weight:400;color:${t.pageText};line-height:1.15;margin-bottom:24px;">
        ${firstPart} <span style="color:${t.accent};font-style:italic;">${lastTwo}</span>
      </h1>
      <p style="font-size:16px;color:${t.pageText}AA;max-width:620px;margin:0 auto 40px;line-height:1.7;">${heroDesc}</p>
      <a href="#contact" style="display:inline-block;padding:18px 40px;background:${t.accent};color:${t.accentText};text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;border-radius:${t.buttonRadius};">${heroCTA}</a>
    </div>
  </section>
  <div style="display:flex;justify-content:center;padding:0 48px 80px;background:${t.pageBg};">
    <img src="${heroImg}" alt="Featured dish" style="width:100%;max-width:900px;border-radius:12px;object-fit:cover;height:500px;"/>
  </div>`;

  // ABOUT + STATS
  const aboutDesc = offerS.story_block?.description || "At Sofra Restaurant, dining is more than just a meal—it's an experience of flavor, tradition, and hospitality. Inspired by the rich heritage of culinary artistry, we bring together authentic recipes, fresh ingredients, and modern presentation to create dishes that delight every sense.";
  const stats = [
    { num: "110+", label: "Seasonal Delights to Enjoy Fresh flavors" },
    { num: "30+", label: "Years of Exceptional Dining Experiences" },
    { num: "120+", label: "Healthy Choices with Nutritious options" },
    { num: "100+", label: "Outstanding Customers Reviews" },
  ];
  const aboutHTML = `
  <section id="about" style="padding:80px 48px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start;">
      <div>
        <p style="color:${t.accent};font-size:14px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">About</p>
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.8rem);font-weight:500;color:${t.pageText};margin-bottom:24px;">Every Celebration Remarkable</h2>
        <p style="font-size:15px;color:${t.pageText}AA;line-height:1.8;margin-bottom:32px;">${aboutDesc}</p>
        <a href="#contact" style="display:inline-block;padding:16px 36px;background:${t.accent};color:${t.accentText};text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;border-radius:${t.buttonRadius};">BOOK YOUR TABLE</a>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        ${stats.map(s => `
          <div style="padding:24px;background:${t.cardBg};border-radius:12px;border:1px solid ${t.borderColor};">
            <div style="font-family:${t.fontHeading};font-size:2.2rem;font-weight:700;color:${t.accent};margin-bottom:8px;">${s.num}</div>
            <p style="font-size:13px;color:${t.pageText}99;line-height:1.5;">${s.label}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;

  // 3-COLUMN FEATURE CATEGORIES
  const featureCategories = [
    { title: "Pasta & Noodles", desc: "An indulgent collection of Italian pastas and Asian noodles with rich sauces." },
    { title: "Desserts & Sweet", desc: "Indulge in irresistible cakes, pastries, & traditional sweets to end on a high." },
    { title: "Chef's Specials", desc: "Exclusive dishes prepared with passion & creativity, available for a limited time." },
  ];
  const featCatHTML = `
  <section style="padding:80px 48px;background:${t.cardBg};">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
      ${featureCategories.map((c, i) => `
        <div style="text-align:center;">
          <img src="${getImageUrl(config, "menu", i)}" alt="${c.title}" style="width:100%;height:240px;object-fit:cover;border-radius:12px;margin-bottom:20px;"/>
          <h3 style="font-family:${t.fontHeading};font-size:1.4rem;color:${t.pageText};margin-bottom:10px;">${c.title}</h3>
          <p style="font-size:14px;color:${t.pageText}99;line-height:1.6;">${c.desc}</p>
        </div>
      `).join("")}
    </div>
  </section>`;

  // WHY CHOOSE US
  const whyFeatures = [
    { title: "Fresh & Authentic Ingredients" },
    { title: "Healthy & Flavorful Options" },
    { title: "Perfect for Every Occasion" },
  ];
  const whyHTML = `
  <section style="padding:80px 48px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start;">
      <div>
        <p style="color:${t.accent};font-size:14px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Why Choose Us?</p>
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.8rem);font-weight:500;color:${t.pageText};margin-bottom:40px;">More Than Dining It's ${name}</h2>
        ${whyFeatures.map((f, i) => `
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding:16px 20px;background:${t.cardBg};border-radius:10px;border:1px solid ${t.borderColor};">
            <div style="width:48px;height:48px;border-radius:50%;background:${t.accent}22;display:flex;align-items:center;justify-content:center;">
              <img src="${getImageUrl(config, "menu", i + 3)}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;"/>
            </div>
            <span style="font-family:${t.fontHeading};font-size:1.1rem;color:${t.pageText};">${f.title}</span>
          </div>
        `).join("")}
      </div>
      <div style="position:relative;">
        <img src="${getImageUrl(config, "about", 0)}" alt="Why choose us" style="width:100%;height:400px;object-fit:cover;border-radius:12px;"/>
        <div style="position:absolute;bottom:20px;right:20px;background:${t.accent};padding:20px 28px;border-radius:10px;text-align:center;">
          <p style="font-size:12px;color:${t.accentText};letter-spacing:1px;">Established Since</p>
          <p style="font-family:${t.fontHeading};font-size:2.2rem;font-weight:700;color:${t.accentText};">1970</p>
        </div>
      </div>
    </div>
  </section>`;

  // MENU SECTION
  const menuItems = mainS.categories?.[0]?.items || [
    { name: "Herb-Infused Grilled Prawns", price: "$75.00", description: "Tender prawns, flame-grilled and brushed with garlic butter, served with sautéed greens." },
    { name: "Seared Tuna Bites", price: "$55.00", description: "Layers of chia pudding, fresh mango, toasted coconut flakes, and a drizzle of honey." },
    { name: "Truffle Mushroom Risotto Balls", price: "$48.00", description: "Creamy risotto balls infused with truffle oil and parmesan." },
    { name: "Citrus-Glazed Salmon Fillet", price: "$35.00", description: "Al dente pasta tossed with basil pesto, cherry tomatoes, and parmesan shavings." },
    { name: "Tropical Coconut Chia Parfait", price: "$40.00", description: "Golden roasted chicken with crispy skin, served over prosciutto salad." },
  ];
  const menuStats = [
    { num: "2K", label: "Our Daily Order" },
    { num: "15+", label: "Specialist Chef" },
    { num: "150+", label: "Our Menu Dish" },
    { num: "2K", label: "Won Awards" },
  ];
  const menuHTML = `
  <section id="menu" style="padding:80px 48px;background:${t.cardBg};">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;">
      <div>
        <p style="color:${t.accent};font-size:14px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Explore Menu Option</p>
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.8rem);font-weight:500;color:${t.pageText};margin-bottom:32px;">Best Catering Menus</h2>
        <div style="display:flex;gap:20px;margin-bottom:32px;">
          ${["Breakfast", "Brunch", "Lunch", "Dinner"].map((tab, i) => `<span style="font-size:14px;padding:8px 16px;border-radius:20px;cursor:pointer;${i === 0 ? `background:${t.accent};color:${t.accentText};` : `color:${t.pageText}88;border:1px solid ${t.borderColor};`}">${tab}</span>`).join("")}
        </div>
        ${menuItems.map((item: any) => `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:20px 0;border-bottom:1px solid ${t.borderColor};">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
                <span style="font-family:${t.fontHeading};font-size:1.1rem;color:${t.pageText};">${item.name}</span>
                <span style="font-size:1rem;font-weight:600;color:${t.accent};">${item.price}</span>
              </div>
              <p style="font-size:13px;color:${t.pageText}77;line-height:1.5;">${item.description}</p>
            </div>
          </div>
        `).join("")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-content:start;">
        ${menuStats.map(s => `
          <div style="padding:28px;background:${t.pageBg};border-radius:12px;border:1px solid ${t.borderColor};text-align:center;">
            <div style="font-family:${t.fontHeading};font-size:2rem;font-weight:700;color:${t.accent};margin-bottom:6px;">${s.num}</div>
            <p style="font-size:13px;color:${t.pageText}99;">${s.label}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;

  // EVENT BOOKING / OPENING HOURS
  const eventHTML = `
  <section style="padding:80px 48px;background:${t.pageBg};">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start;">
      <div>
        <p style="color:${t.accent};font-size:14px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Event Booking</p>
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.8rem);font-weight:500;color:${t.pageText};margin-bottom:32px;">Planning a Party or Special Event?</h2>
        <div style="margin-bottom:32px;">
          <p style="font-family:${t.fontHeading};font-size:1.2rem;color:${t.pageText};margin-bottom:16px;">Opening Hour</p>
          ${[
            { day: "Monday - Saturday", time: "7.30 am - 10.30 pm" },
            { day: "Sunday", time: "7.30 am - 11.30 pm" },
            { day: "Happy Hour", time: "5.30 am - 09.30 pm" },
          ].map(h => `
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid ${t.borderColor};">
              <span style="font-size:14px;color:${t.pageText};">${h.day}</span>
              <span style="font-size:14px;color:${t.pageText}AA;">${h.time}</span>
            </div>
          `).join("")}
        </div>
        <p style="font-size:14px;color:${t.pageText}99;margin-bottom:8px;">Just Call for Reservation</p>
        <p style="font-family:${t.fontHeading};font-size:1.5rem;color:${t.accent};margin-bottom:24px;">${(config as any).phone || "+01234 555 999"}</p>
        <a href="#contact" style="display:inline-block;padding:16px 36px;background:${t.accent};color:${t.accentText};text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;border-radius:${t.buttonRadius};">BOOK YOUR TABLE</a>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <img src="${getImageUrl(config, "menu", 0)}" alt="Event food" style="width:100%;height:300px;object-fit:cover;border-radius:12px;"/>
        <img src="${getImageUrl(config, "menu", 1)}" alt="Event food" style="width:100%;height:300px;object-fit:cover;border-radius:12px;"/>
      </div>
    </div>
  </section>`;

  // TESTIMONIALS
  const testimonialItems = offerS.testimonials?.items || [
    { quote: "Sofra Restaurant never disappoints.", body: "From the attentive service to the fresh ingredients, every dish tells a story. The grilled salmon is a must-try!", author: "Ronald Richards", rating: 5 },
  ];
  const testimonialsHTML = `
  <section style="padding:80px 48px;background:${t.cardBg};">
    <div style="max-width:1200px;margin:0 auto;text-align:center;">
      <p style="color:${t.accent};font-size:14px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Testimonial</p>
      <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.8rem);font-weight:500;color:${t.pageText};margin-bottom:48px;">What Our Guests Are Saying</h2>
      <div style="max-width:700px;margin:0 auto;">
        ${testimonialItems.map((t2: any) => `
          <div style="padding:40px;background:${t.pageBg};border-radius:16px;border:1px solid ${t.borderColor};">
            <div style="font-size:48px;color:${t.accent};margin-bottom:16px;">"</div>
            <p style="font-family:${t.fontHeading};font-size:1.1rem;color:${t.pageText};line-height:1.7;font-style:italic;margin-bottom:24px;">"${t2.quote || t2.body}"</p>
            <p style="font-size:15px;font-weight:600;color:${t.pageText};">${t2.author}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;

  // RESERVATION FORM
  const reservationHTML = `
  <section id="contact" style="padding:80px 48px;background:${t.pageBg};">
    <div style="max-width:800px;margin:0 auto;text-align:center;">
      <p style="color:${t.accent};font-size:14px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Book your Table</p>
      <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,3vw,2.8rem);font-weight:500;color:${t.pageText};margin-bottom:48px;">Make A Reservation</h2>
      <form style="display:grid;grid-template-columns:1fr 1fr;gap:20px;text-align:left;">
        ${[
          { label: "Booking Name", type: "text", placeholder: "Your name" },
          { label: "Phone Number", type: "tel", placeholder: "+1 234 567 890" },
          { label: "Date", type: "date", placeholder: "mm/dd/yyyy" },
          { label: "Time", type: "time", placeholder: "--:-- --" },
        ].map(f => `
          <div>
            <label style="font-size:13px;color:${t.pageText}AA;display:block;margin-bottom:8px;">${f.label}</label>
            <input type="${f.type}" placeholder="${f.placeholder}" style="width:100%;padding:14px 16px;background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:8px;color:${t.pageText};font-size:14px;outline:none;"/>
          </div>
        `).join("")}
        <div style="grid-column:1/-1;">
          <label style="font-size:13px;color:${t.pageText}AA;display:block;margin-bottom:8px;">Number of Guests</label>
          <input type="number" placeholder="2" min="1" max="20" style="width:100%;padding:14px 16px;background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:8px;color:${t.pageText};font-size:14px;outline:none;"/>
        </div>
        <div style="grid-column:1/-1;text-align:center;margin-top:16px;">
          <button type="submit" style="padding:18px 48px;background:${t.accent};color:${t.accentText};border:none;cursor:pointer;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;border-radius:${t.buttonRadius};">BOOK YOUR TABLE</button>
        </div>
      </form>
    </div>
  </section>`;

  // IMAGE GALLERY
  const galleryHTML = `
  <section style="padding:80px 48px;background:${t.cardBg};">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
      ${[0,1,2,3].map(i => `<img src="${getImageUrl(config, "menu", i)}" alt="Gallery" style="width:100%;height:200px;object-fit:cover;border-radius:10px;"/>`).join("")}
    </div>
  </section>`;

  // FOOTER — large letter branding
  const footerHTML = `
  <footer style="padding:80px 48px 40px;background:${t.pageBg};border-top:1px solid ${t.borderColor};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;align-items:center;margin-bottom:48px;">
        <h3 style="font-family:${t.fontHeading};font-size:1.6rem;color:${t.pageText};line-height:1.4;">Plan Ahead — Book a Table at ${name} Restaurant</h3>
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:48px;height:48px;border-radius:50%;background:${t.accent}22;display:flex;align-items:center;justify-content:center;color:${t.accent};font-size:20px;">📍</div>
          <div>
            <p style="font-family:${t.fontHeading};font-size:1rem;color:${t.pageText};">Location</p>
            <p style="font-size:13px;color:${t.pageText}99;">${(config as any).address || "555 12th Ave, New York"}</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:48px;height:48px;border-radius:50%;background:${t.accent}22;display:flex;align-items:center;justify-content:center;color:${t.accent};font-size:20px;">📞</div>
          <div>
            <p style="font-family:${t.fontHeading};font-size:1rem;color:${t.pageText};">Phone No</p>
            <p style="font-size:13px;color:${t.accent};">${(config as any).phone || "+888 999 5555 4444"}</p>
          </div>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:40px;">
        <div style="font-family:${t.fontHeading};font-size:clamp(4rem,12vw,10rem);font-weight:700;letter-spacing:0.1em;background:linear-gradient(180deg,${t.accent},${t.accent}44);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;">${name}</div>
      </div>
      <div style="display:flex;justify-content:space-between;padding-top:24px;border-top:1px solid ${t.borderColor};">
        <p style="font-size:13px;color:${t.pageText}55;">© ${new Date().getFullYear()} Design ${name}. All rights reserved.</p>
        <p style="font-size:13px;color:${t.pageText}55;">Powered by ${name}</p>
      </div>
    </div>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(true, t.pageText, t.pageBg)}
  @media (max-width: 768px) {
    [style*="grid-template-columns:1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
    [style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
    [style*="grid-template-columns:repeat(3"] { grid-template-columns: repeat(2, 1fr) !important; }
    [style*="grid-template-columns:2fr 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
    nav { padding: 0 16px !important; }
    nav > div:nth-child(2) { display: none !important; }
  }
</style></head><body>
${navHTML}
${heroHTML}${aboutHTML}${featCatHTML}${whyHTML}${menuHTML}${eventHTML}${testimonialsHTML}${reservationHTML}${galleryHTML}${footerHTML}
</body></html>`;
}
