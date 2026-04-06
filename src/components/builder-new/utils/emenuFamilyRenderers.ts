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
    <section style="min-height:85vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:56px;background:linear-gradient(135deg, ${t.pageBg} 0%, #1A1510 100%);">
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
    <section style="min-height:85vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;background:radial-gradient(ellipse at center, #1A1510 0%, ${t.pageBg} 70%);">
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
  <section style="padding:80px 32px;background:#0E0E0E;">
    <div style="max-width:640px;margin:0 auto;text-align:center;">
      ${story.eyebrow ? `<p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};margin-bottom:10px;">${story.eyebrow}</p>` : ""}
      <h2 style="font-family:${t.fontHeading};font-size:1.8rem;font-weight:700;margin-bottom:16px;color:${t.pageText};">${story.heading || ""}</h2>
      <p style="font-size:0.95rem;color:${t.pageText}88;line-height:1.8;">${story.description || ""}</p>
    </div>
  </section>` : "";

  // Testimonials
  const testimonialsHTML = testimonials.enabled && testimonials.items?.length ? `
  <section style="padding:72px 32px;background:${t.pageBg};">
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
  <footer style="padding:48px 32px;background:#050505;border-top:1px solid ${t.borderColor};">
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
    ${navItems.map(n => `<a href="#" style="text-decoration:none;font-size:13px;color:${t.pageText}99;font-weight:400;letter-spacing:0.03em;">${n}</a>`).join("")}
  </div>
</nav>
${heroHTML}${menuHTML}${storyHTML}${testimonialsHTML}${footerHTML}
</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// YUMIX — Bold dark food brand
// ═══════════════════════════════════════════════════════════════════

const YUMIX_VARIANTS: VariantTheme[] = [
  {
    accent: "#F97316", accentText: "#FFFFFF", pageBg: "#0F0D0A", pageText: "#F5F0E8",
    cardBg: "#1A1714", borderColor: "#2D2A25", fontHeading: "'DM Sans', sans-serif",
    heroLayout: "split", cardStyle: "rounded", buttonRadius: "28px", menuCols: 3, cardImageHeight: "190px",
  },
  {
    accent: "#EF4444", accentText: "#FFFFFF", pageBg: "#0A0A0F", pageText: "#E8E8F0",
    cardBg: "#14141A", borderColor: "#25253A", fontHeading: "'Poppins', sans-serif",
    heroLayout: "fullwidth", cardStyle: "sharp", buttonRadius: "4px", menuCols: 2, cardImageHeight: "220px",
  },
  {
    accent: "#FBBF24", accentText: "#0A0A0A", pageBg: "#0D0F0A", pageText: "#F0F5E8",
    cardBg: "#171A14", borderColor: "#2A2D25", fontHeading: "'Outfit', sans-serif",
    heroLayout: "centered", cardStyle: "pill", buttonRadius: "24px", menuCols: 3, cardImageHeight: "180px",
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
  const stats = (offerS.stats as any[]) || [];
  const testimonials = offerS.testimonials || {};
  const newsletter = offerS.newsletter || {};
  const footerCols = (footerS.columns as any[]) || [];
  const navItems = (headerS.nav_items as string[]) || ["Home", "Menu", "Deals", "About", "Contact"];
  const headline = heroS.headline || "Delicious Food For Every Mood";
  const subheadline = heroS.subheadline || "";
  const ctaText = heroS.cta_text || "Order Now";
  const badge = heroS.badge;
  const cardRadius = t.cardStyle === "sharp" ? "4px" : t.cardStyle === "pill" ? "20px" : "16px";

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:28px;"/>`
    : `<span style="font-family:${t.fontHeading};font-weight:800;font-size:20px;color:${t.pageText};">${name}</span>`;

  const btnStyle = `padding:14px 32px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};text-decoration:none;font-weight:700;font-size:14px;display:inline-block;`;
  const btnOutline = `padding:14px 24px;border-radius:${t.buttonRadius};background:transparent;color:${t.pageText};text-decoration:none;font-weight:600;font-size:14px;border:1px solid ${t.borderColor};display:inline-block;`;

  // HERO
  let heroHTML = "";
  if (t.heroLayout === "split") {
    heroHTML = `
    <section style="min-height:85vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:48px;background:linear-gradient(135deg, ${t.pageBg} 0%, #1A1408 100%);">
      <div>
        ${badge ? `<span style="display:inline-block;padding:6px 16px;border-radius:20px;background:${t.accent};color:${t.accentText};font-size:12px;font-weight:700;margin-bottom:16px;">${badge.text || "30% OFF"}</span>` : ""}
        ${subheadline ? `<p style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:${t.pageText}77;margin-bottom:10px;">${subheadline}</p>` : ""}
        <h1 style="font-family:${t.fontHeading};font-size:clamp(2.4rem,5vw,3.6rem);font-weight:800;margin-bottom:20px;line-height:1.06;color:${t.pageText};">${headline}</h1>
        <div style="display:flex;gap:12px;">
          <a href="#menu" style="${btnStyle}">${ctaText}</a>
        </div>
      </div>
      <div style="border-radius:20px;overflow:hidden;aspect-ratio:1/1;">
        <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
      </div>
    </section>`;
  } else if (t.heroLayout === "fullwidth") {
    heroHTML = `
    <section style="min-height:90vh;position:relative;display:flex;align-items:center;justify-content:center;text-align:center;">
      <div style="position:absolute;inset:0;"><img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;" alt=""/></div>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, ${t.pageBg}cc 0%, ${t.pageBg}ee 100%);"></div>
      <div style="position:relative;z-index:1;max-width:600px;padding:24px;">
        ${badge ? `<span style="display:inline-block;padding:8px 20px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};font-size:13px;font-weight:700;margin-bottom:20px;">${badge.text || "30% OFF"}</span>` : ""}
        <h1 style="font-family:${t.fontHeading};font-size:clamp(2.6rem,6vw,4rem);font-weight:800;margin-bottom:20px;line-height:1.06;color:#FFFFFF;">${headline}</h1>
        <div style="display:flex;gap:12px;justify-content:center;">
          <a href="#menu" style="${btnStyle}">${ctaText}</a>
          <a href="#" style="${btnOutline}">Explore</a>
        </div>
      </div>
    </section>`;
  } else {
    heroHTML = `
    <section style="min-height:85vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;background:${t.pageBg};">
      ${badge ? `<span style="display:inline-block;padding:8px 20px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};font-size:13px;font-weight:700;margin-bottom:20px;">${badge.text || "30% OFF"}</span>` : ""}
      ${subheadline ? `<p style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:${t.accent};margin-bottom:10px;">${subheadline}</p>` : ""}
      <h1 style="font-family:${t.fontHeading};font-size:clamp(2.4rem,5vw,3.6rem);font-weight:800;margin-bottom:24px;line-height:1.06;color:${t.pageText};max-width:600px;">${headline}</h1>
      <div style="display:flex;gap:12px;margin-bottom:40px;">
        <a href="#menu" style="${btnStyle}">${ctaText}</a>
      </div>
      <div style="display:flex;gap:16px;justify-content:center;">
        ${[0,1,2].map(i => `<div style="width:160px;height:160px;border-radius:${cardRadius};overflow:hidden;border:2px solid ${t.borderColor};">
          <img src="${getImageUrl(config, "menu", i)}" style="width:100%;height:100%;object-fit:cover;" alt=""/>
        </div>`).join("")}
      </div>
    </section>`;
  }

  // Category cards
  const catHTML = catShowcase?.enabled && catShowcase.items?.length ? `
  <section style="padding:64px 28px;background:#141210;">
    <div style="max-width:1000px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${t.fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:28px;color:${t.pageText};">${catShowcase.heading || "Categories"}</h2>
      <div style="display:grid;grid-template-columns:repeat(${catShowcase.columns || 4},1fr);gap:16px;">
        ${catShowcase.items.map((cat: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:28px 16px;text-align:center;">
            ${cat.emoji ? `<span style="font-size:2rem;display:block;margin-bottom:8px;">${cat.emoji}</span>` : ""}
            <span style="font-weight:600;font-size:14px;color:${t.pageText};">${cat.title}</span>
            ${cat.count ? `<br/><span style="font-size:11px;color:${t.pageText}66;">${cat.count}</span>` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  </section>` : "";

  // Menu grid
  const menuHTML = `
  <section id="menu" style="padding:72px 28px;background:${t.pageBg};">
    <div style="max-width:1000px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${t.fontHeading};font-size:1.6rem;font-weight:800;margin-bottom:36px;color:${t.pageText};">${mainS.heading || "Featured"}</h2>
      <div style="display:grid;grid-template-columns:repeat(${t.menuCols},1fr);gap:22px;">
        ${items.map((item: any, idx: number) => {
          const imgSrc = getImageUrl(config, "menu", idx);
          const itemBadge = item.badges?.[0] ? `<span style="position:absolute;top:10px;right:10px;padding:4px 12px;border-radius:${t.cardStyle === "sharp" ? "2px" : "16px"};background:${t.accent};color:${t.accentText};font-size:10px;font-weight:700;">${item.badges[0]}</span>` : "";
          return `<div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};overflow:hidden;position:relative;">
            ${itemBadge}
            <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:${t.cardImageHeight};object-fit:cover;"/>
            <div style="padding:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;font-size:14px;color:${t.pageText};">${item.title}</span>
                <span style="font-weight:800;font-size:14px;color:${t.accent};">${item.price || ""}</span>
              </div>
              ${item.description ? `<p style="font-size:12px;color:${t.pageText}77;margin-top:5px;">${item.description}</p>` : ""}
              <button style="margin-top:10px;width:100%;padding:10px;border-radius:${t.buttonRadius};background:${t.accent}22;color:${t.accent};border:1px solid ${t.accent}44;font-weight:600;font-size:12px;cursor:pointer;">Add to Cart</button>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
  </section>`;

  // Promos
  const promoHTML = promos.length ? `
  <section style="padding:48px 28px;background:#141210;">
    <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(${Math.min(promos.length, 2)},1fr);gap:20px;">
      ${promos.map((p: any) => `
        <div style="background:${t.accent}15;border:1px solid ${t.accent}33;border-radius:${cardRadius};padding:32px 24px;">
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;color:${t.pageText};">${p.heading}</h3>
          <p style="font-size:0.85rem;color:${t.pageText}88;margin-bottom:16px;">${p.description}</p>
          ${p.cta_text ? `<a href="#" style="padding:10px 24px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};text-decoration:none;font-size:13px;font-weight:600;">${p.cta_text}</a>` : ""}
        </div>
      `).join("")}
    </div>
  </section>` : "";

  // Stats
  const statsHTML = stats.length ? `
  <section style="padding:48px 28px;background:${t.pageBg};">
    <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap;gap:24px;">
      ${stats.map((st: any) => `
        <div>
          <div style="font-size:2.2rem;font-weight:800;color:${t.accent};">${st.value}</div>
          <div style="font-size:12px;color:${t.pageText}77;margin-top:4px;">${st.label}</div>
        </div>
      `).join("")}
    </div>
  </section>` : "";

  // Testimonials
  const testimonialsHTML = testimonials.enabled && testimonials.items?.length ? `
  <section style="padding:64px 28px;background:#0D0B08;">
    <div style="max-width:1000px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${t.fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:28px;color:${t.pageText};">${testimonials.heading || "Reviews"}</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
        ${testimonials.items.slice(0, 3).map((r: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:24px 20px;text-align:left;">
            <p style="font-size:14px;color:${t.pageText}bb;line-height:1.6;font-style:italic;">"${r.quote}"</p>
            <div style="margin-top:12px;"><span style="font-weight:600;font-size:13px;color:${t.pageText};">${r.name}</span></div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>` : "";

  // Newsletter
  const newsletterHTML = newsletter.enabled ? `
  <section style="padding:52px 28px;background:#141210;">
    <div style="max-width:460px;margin:0 auto;text-align:center;">
      <h3 style="font-family:${t.fontHeading};font-size:1.2rem;font-weight:700;margin-bottom:14px;color:${t.pageText};">${newsletter.heading || "Subscribe"}</h3>
      <div style="display:flex;gap:8px;">
        <input type="email" placeholder="Your email" style="flex:1;padding:12px 16px;border-radius:${t.buttonRadius};border:1px solid ${t.borderColor};background:${t.cardBg};color:${t.pageText};font-size:14px;"/>
        <button style="padding:12px 24px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};border:none;font-weight:700;font-size:14px;cursor:pointer;">${newsletter.cta_text || "Subscribe"}</button>
      </div>
    </div>
  </section>` : "";

  // Footer
  const footerHTML = `
  <footer style="padding:48px 28px;background:#080705;border-top:1px solid ${t.borderColor};">
    <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:28px;">
      ${footerCols.map((col: any) => `<div><h4 style="font-weight:600;font-size:13px;margin-bottom:10px;color:${t.accent};">${col.title}</h4>${(col.links as string[]).map((l: string) => `<p style="font-size:12px;color:${t.pageText}55;margin-bottom:4px;">${l}</p>`).join("")}</div>`).join("")}
    </div>
    <p style="text-align:center;font-size:11px;color:${t.pageText}33;margin-top:32px;">${footerS.copyright || `${name} — All rights reserved.`}</p>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(true, t.pageText, t.pageBg)}</style></head><body>
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${t.pageBg}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${t.borderColor};padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:54px;">
  ${logo}
  <div style="display:flex;gap:20px;align-items:center;">
    ${navItems.map(n => `<a href="#" style="text-decoration:none;font-size:13px;color:${t.pageText}88;font-weight:500;">${n}</a>`).join("")}
    <a href="#" style="padding:8px 20px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};text-decoration:none;font-size:12px;font-weight:600;">Order</a>
  </div>
</nav>
${heroHTML}${catHTML}${menuHTML}${promoHTML}${statsHTML}${testimonialsHTML}${newsletterHTML}${footerHTML}
</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// ZOOOM — Clean bright modern
// ═══════════════════════════════════════════════════════════════════

const ZOOOM_VARIANTS: VariantTheme[] = [
  {
    accent: "#10B981", accentText: "#FFFFFF", pageBg: "#FFFFFF", pageText: "#1A1A1A",
    cardBg: "#FFFFFF", borderColor: "#E5E7EB", fontHeading: "'DM Sans', sans-serif",
    heroLayout: "split", cardStyle: "rounded", buttonRadius: "28px", menuCols: 4, cardImageHeight: "170px",
  },
  {
    accent: "#6366F1", accentText: "#FFFFFF", pageBg: "#FAFBFF", pageText: "#1E1B4B",
    cardBg: "#FFFFFF", borderColor: "#E0E0F0", fontHeading: "'Poppins', sans-serif",
    heroLayout: "centered", cardStyle: "pill", buttonRadius: "24px", menuCols: 3, cardImageHeight: "200px",
  },
  {
    accent: "#0EA5E9", accentText: "#FFFFFF", pageBg: "#F8FFFE", pageText: "#0F172A",
    cardBg: "#FFFFFF", borderColor: "#D1E9E4", fontHeading: "'Outfit', sans-serif",
    heroLayout: "split", cardStyle: "sharp", buttonRadius: "6px", menuCols: 4, cardImageHeight: "160px",
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
  const navItems = (headerS.nav_items as string[]) || ["Home", "Menu", "Delivery", "Contact"];
  const headline = heroS.headline || "Your Favorite Food, Delivered Fast";
  const subheadline = heroS.subheadline || "";
  const ctaText = heroS.cta_text || "Order Now";
  const softBg = variantIndex === 1 ? "#F0F0FF" : variantIndex === 2 ? "#F0FFFE" : "#F9FAFB";
  const cardRadius = t.cardStyle === "sharp" ? "6px" : t.cardStyle === "pill" ? "20px" : "14px";

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:28px;"/>`
    : `<span style="font-family:${t.fontHeading};font-weight:700;font-size:20px;color:${t.pageText};">${name}</span>`;

  const btnStyle = `padding:14px 32px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};text-decoration:none;font-weight:700;font-size:14px;display:inline-block;`;
  const btnOutline = `padding:14px 24px;border-radius:${t.buttonRadius};background:transparent;color:${t.pageText};text-decoration:none;font-weight:600;font-size:14px;border:1px solid ${t.borderColor};display:inline-block;`;

  // HERO
  let heroHTML = "";
  if (t.heroLayout === "split") {
    const imgShape = variantIndex === 2 ? "border-radius:12px;" : "border-radius:24px;";
    heroHTML = `
    <section style="min-height:80vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:48px;background:${t.pageBg};">
      <div>
        ${subheadline ? `<p style="font-size:13px;color:${t.accent};font-weight:600;margin-bottom:10px;">${subheadline}</p>` : ""}
        <h1 style="font-family:${t.fontHeading};font-size:clamp(2.4rem,5vw,3.4rem);font-weight:800;margin-bottom:20px;line-height:1.08;color:${t.pageText};">${headline}</h1>
        <div style="display:flex;gap:12px;">
          <a href="#menu" style="${btnStyle}">${ctaText}</a>
          <a href="#" style="${btnOutline}">Learn More</a>
        </div>
      </div>
      <div style="${imgShape}overflow:hidden;aspect-ratio:1/1;box-shadow:0 20px 60px rgba(0,0,0,0.08);">
        <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
      </div>
    </section>`;
  } else {
    heroHTML = `
    <section style="min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 24px 60px;background:${t.pageBg};">
      ${subheadline ? `<p style="font-size:13px;color:${t.accent};font-weight:600;margin-bottom:10px;">${subheadline}</p>` : ""}
      <h1 style="font-family:${t.fontHeading};font-size:clamp(2.4rem,5vw,3.4rem);font-weight:800;margin-bottom:20px;line-height:1.08;color:${t.pageText};max-width:640px;">${headline}</h1>
      <div style="display:flex;gap:12px;margin-bottom:40px;">
        <a href="#menu" style="${btnStyle}">${ctaText}</a>
        <a href="#" style="${btnOutline}">Explore</a>
      </div>
      <div style="border-radius:${cardRadius};overflow:hidden;width:80%;max-width:700px;aspect-ratio:16/9;box-shadow:0 20px 60px rgba(0,0,0,0.1);">
        <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
      </div>
    </section>`;
  }

  // Categories
  const catHTML = catShowcase?.enabled && catShowcase.items?.length ? `
  <section style="padding:48px 28px;background:${softBg};">
    <div style="max-width:1000px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${t.fontHeading};font-size:1.3rem;font-weight:700;margin-bottom:24px;color:${t.pageText};">${catShowcase.heading || "Categories"}</h2>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
        ${catShowcase.items.map((cat: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:20px 24px;text-align:center;min-width:120px;">
            ${cat.emoji ? `<span style="font-size:1.8rem;display:block;margin-bottom:6px;">${cat.emoji}</span>` : ""}
            <span style="font-weight:600;font-size:13px;color:${t.pageText};">${cat.title}</span>
          </div>
        `).join("")}
      </div>
    </div>
  </section>` : "";

  // Menu grid
  const menuHTML = `
  <section id="menu" style="padding:72px 28px;background:${t.pageBg};">
    <div style="max-width:1100px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${t.fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:36px;color:${t.pageText};">${mainS.heading || "Browse Our Menu"}</h2>
      <div style="display:grid;grid-template-columns:repeat(${t.menuCols},1fr);gap:20px;">
        ${items.map((item: any, idx: number) => {
          const imgSrc = getImageUrl(config, "menu", idx);
          const itemBadge = item.badges?.[0] ? `<span style="position:absolute;top:8px;left:8px;padding:3px 10px;border-radius:10px;background:${t.accent};color:${t.accentText};font-size:10px;font-weight:600;">${item.badges[0]}</span>` : "";
          return `<div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};overflow:hidden;position:relative;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            ${itemBadge}
            <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:${t.cardImageHeight};object-fit:cover;"/>
            <div style="padding:14px 16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;font-size:13px;color:${t.pageText};">${item.title}</span>
                <span style="font-weight:700;font-size:13px;color:${t.accent};">${item.price || ""}</span>
              </div>
              ${item.description ? `<p style="font-size:11px;color:${t.pageText}77;margin-top:4px;">${item.description}</p>` : ""}
              <button style="margin-top:8px;width:100%;padding:8px;border-radius:${t.buttonRadius};background:${t.accent}11;color:${t.accent};border:1px solid ${t.accent}33;font-weight:600;font-size:11px;cursor:pointer;">Add +</button>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
  </section>`;

  // Story
  const storyHTML = story.enabled ? `
  <section style="padding:72px 28px;background:${softBg};">
    <div style="max-width:620px;margin:0 auto;text-align:center;">
      ${story.eyebrow ? `<p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${t.accent};margin-bottom:8px;font-weight:600;">${story.eyebrow}</p>` : ""}
      <h2 style="font-family:${t.fontHeading};font-size:1.6rem;font-weight:700;margin-bottom:14px;color:${t.pageText};">${story.heading || ""}</h2>
      <p style="font-size:0.95rem;color:${t.pageText}88;line-height:1.8;">${story.description || ""}</p>
    </div>
  </section>` : "";

  // Testimonials
  const testimonialsHTML = testimonials.enabled && testimonials.items?.length ? `
  <section style="padding:64px 28px;background:${t.pageBg};">
    <div style="max-width:1000px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${t.fontHeading};font-size:1.4rem;font-weight:700;margin-bottom:28px;color:${t.pageText};">${testimonials.heading || "Reviews"}</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
        ${testimonials.items.slice(0, 3).map((r: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:24px 20px;text-align:left;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
            <p style="font-size:14px;color:${t.pageText}bb;line-height:1.6;font-style:italic;">"${r.quote}"</p>
            <div style="margin-top:12px;"><span style="font-weight:600;font-size:13px;color:${t.pageText};">${r.name}</span></div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>` : "";

  // Footer
  const footerHTML = `
  <footer style="padding:48px 28px;background:${softBg};border-top:1px solid ${t.borderColor};">
    <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:28px;">
      ${footerCols.map((col: any) => `<div><h4 style="font-weight:600;font-size:13px;margin-bottom:10px;color:${t.pageText};">${col.title}</h4>${(col.links as string[]).map((l: string) => `<p style="font-size:12px;color:${t.pageText}77;margin-bottom:4px;">${l}</p>`).join("")}</div>`).join("")}
    </div>
    <p style="text-align:center;font-size:11px;color:${t.pageText}55;margin-top:32px;">${footerS.copyright || `${name} — All rights reserved.`}</p>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(false, t.pageText, t.pageBg)}</style></head><body>
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${t.pageBg}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${t.borderColor};padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:54px;">
  ${logo}
  <div style="display:flex;gap:20px;align-items:center;">
    ${navItems.map(n => `<a href="#" style="text-decoration:none;font-size:13px;color:${t.pageText}88;font-weight:500;">${n}</a>`).join("")}
    <a href="#" style="padding:8px 20px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};text-decoration:none;font-size:12px;font-weight:600;">Order</a>
  </div>
</nav>
${heroHTML}${catHTML}${menuHTML}${storyHTML}${testimonialsHTML}${footerHTML}
</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// VISUAL A — Classic restaurant
// ═══════════════════════════════════════════════════════════════════

const VISUALA_VARIANTS: VariantTheme[] = [
  {
    accent: "#C87941", accentText: "#FFFFFF", pageBg: "#0F0D0A", pageText: "#F0E8DC",
    cardBg: "#1A1714", borderColor: "#2D2A25", fontHeading: "'Playfair Display', serif",
    heroLayout: "fullwidth", cardStyle: "rounded", buttonRadius: "6px", menuCols: 2, cardImageHeight: "auto",
  },
  {
    accent: "#8B5E3C", accentText: "#FFFFFF", pageBg: "#F5F0EB", pageText: "#2C1810",
    cardBg: "#FFFFFF", borderColor: "#DDD0C4", fontHeading: "'Playfair Display', serif",
    heroLayout: "split", cardStyle: "rounded", buttonRadius: "8px", menuCols: 2, cardImageHeight: "auto",
  },
  {
    accent: "#B8860B", accentText: "#0A0A0A", pageBg: "#0A0808", pageText: "#EDE0D0",
    cardBg: "#151210", borderColor: "#2A2218", fontHeading: "'Outfit', sans-serif",
    heroLayout: "fullwidth", cardStyle: "sharp", buttonRadius: "0px", menuCols: 1, cardImageHeight: "auto",
  },
];

export function renderVisualA(ctx: RenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as any;
  const headerS = (s.header?.schema || {}) as any;
  const mainS = (s.main_content?.schema || {}) as any;
  const offerS = (s.offer?.schema || {}) as any;
  const footerS = (s.footer?.schema || {}) as any;

  const t = VISUALA_VARIANTS[variantIndex] || VISUALA_VARIANTS[0];
  const isDark = variantIndex !== 1;
  const name = config.businessName || "Restaurant";
  const heroImg = getImageUrl(config, "hero", variantIndex);
  const items = (mainS.items as any[]) || [];
  const offerItems = (offerS.items as any[]) || [];
  const story = offerS.story_block || {};
  const footerCols = (footerS.columns as any[]) || [];
  const navItems = (headerS.nav_items as string[]) || ["Menu", "About", "Contact"];
  const headline = heroS.headline || "Welcome to Our Restaurant";
  const subheadline = heroS.subheadline || "";
  const ctaText = heroS.cta_text || "View Menu";
  const cardRadius = t.cardStyle === "sharp" ? "2px" : "10px";

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:30px;"/>`
    : `<span style="font-family:${t.fontHeading};font-weight:700;font-size:20px;color:${isDark ? t.pageText : t.accent};">${name}</span>`;

  const btnStyle = `padding:14px 36px;border-radius:${t.buttonRadius};background:${t.accent};color:${t.accentText};text-decoration:none;font-weight:600;font-size:14px;display:inline-block;`;

  // HERO
  let heroHTML = "";
  if (t.heroLayout === "fullwidth") {
    heroHTML = `
    <section style="min-height:85vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;position:relative;overflow:hidden;">
      <div style="position:absolute;inset:0;"><img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;" alt=""/></div>
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
      <div style="position:relative;z-index:1;max-width:640px;">
        ${subheadline ? `<p style="font-size:0.95rem;color:#ffffffcc;margin-bottom:12px;">${subheadline}</p>` : ""}
        <h1 style="font-family:${t.fontHeading};font-size:clamp(2.6rem,5vw,4rem);font-weight:700;margin-bottom:20px;line-height:1.1;color:#fff;">${headline}</h1>
        <a href="#menu" style="${btnStyle}">${ctaText}</a>
      </div>
    </section>`;
  } else {
    heroHTML = `
    <section style="min-height:85vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:48px;background:${t.pageBg};">
      <div>
        ${subheadline ? `<p style="font-size:13px;color:${t.accent};font-weight:500;margin-bottom:12px;">${subheadline}</p>` : ""}
        <h1 style="font-family:${t.fontHeading};font-size:clamp(2.4rem,5vw,3.6rem);font-weight:700;margin-bottom:20px;line-height:1.08;color:${t.pageText};">${headline}</h1>
        <a href="#menu" style="${btnStyle}">${ctaText}</a>
      </div>
      <div style="border-radius:12px;overflow:hidden;aspect-ratio:4/5;">
        <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
      </div>
    </section>`;
  }

  // Menu — varies by menuCols
  const menuHTML = `
  <section id="menu" style="padding:80px 32px;background:${t.pageBg};">
    <div style="max-width:${t.menuCols === 1 ? "640px" : "800px"};margin:0 auto;text-align:center;">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};margin-bottom:8px;">OUR MENU</p>
      <h2 style="font-family:${t.fontHeading};font-size:1.8rem;font-weight:700;margin-bottom:40px;color:${t.pageText};">${mainS.heading || "Our Menu"}</h2>
      <div style="display:grid;grid-template-columns:repeat(${t.menuCols},1fr);gap:20px;">
        ${items.map((item: any, idx: number) => {
          const imgSrc = getImageUrl(config, "menu", idx);
          if (t.menuCols === 1) {
            return `<div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};overflow:hidden;display:flex;align-items:stretch;">
              <img src="${imgSrc}" alt="${item.title}" style="width:180px;height:auto;object-fit:cover;flex-shrink:0;"/>
              <div style="padding:20px;text-align:left;flex:1;display:flex;flex-direction:column;justify-content:center;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <span style="font-family:${t.fontHeading};font-weight:700;font-size:16px;color:${t.pageText};">${item.title}</span>
                  <span style="font-weight:800;font-size:16px;color:${t.accent};">${item.price || ""}</span>
                </div>
                ${item.description ? `<p style="font-size:13px;color:${t.pageText}77;line-height:1.5;">${item.description}</p>` : ""}
              </div>
            </div>`;
          }
          return `<div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};overflow:hidden;display:flex;align-items:stretch;">
            <img src="${imgSrc}" alt="${item.title}" style="width:120px;height:auto;object-fit:cover;flex-shrink:0;"/>
            <div style="padding:16px;text-align:left;flex:1;">
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

  // Trust badges
  const trustHTML = offerItems.length ? `
  <section style="padding:60px 32px;background:${isDark ? "#141210" : "#F5F0EB"};">
    <div style="max-width:900px;margin:0 auto;text-align:center;">
      <h2 style="font-family:${t.fontHeading};font-size:1.4rem;font-weight:700;margin-bottom:28px;color:${t.pageText};">${offerS.heading || "Why Dine With Us"}</h2>
      <div style="display:grid;grid-template-columns:repeat(${Math.min(offerItems.length, 4)},1fr);gap:20px;">
        ${offerItems.map((item: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.borderColor};border-radius:${cardRadius};padding:28px 16px;text-align:center;">
            <span style="font-size:1.5rem;">${item.icon === "truck" ? "🚚" : item.icon === "headphones" ? "👨‍🍳" : item.icon === "map-pin" ? "🏡" : "⚡"}</span>
            <h4 style="font-weight:600;font-size:14px;margin-top:10px;color:${t.pageText};">${item.title}</h4>
            <p style="font-size:12px;color:${t.pageText}77;margin-top:4px;">${item.description}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>` : "";

  // Story
  const storyHTML = story.enabled ? `
  <section style="padding:80px 32px;background:${t.pageBg};">
    <div style="max-width:620px;margin:0 auto;text-align:center;">
      ${story.eyebrow ? `<p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:${t.accent};margin-bottom:10px;">${story.eyebrow}</p>` : ""}
      <h2 style="font-family:${t.fontHeading};font-size:1.7rem;font-weight:700;margin-bottom:14px;color:${t.pageText};">${story.heading || ""}</h2>
      <p style="font-size:0.95rem;color:${t.pageText}88;line-height:1.8;">${story.description || ""}</p>
    </div>
  </section>` : "";

  // Footer
  const footerBg = isDark ? "#080705" : "#2C1810";
  const footerText = isDark ? t.pageText : "#F0E8DC";
  const footerHTML = `
  <footer style="padding:52px 32px;background:${footerBg};border-top:1px solid ${t.borderColor};">
    <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:32px;">
      ${footerCols.map((col: any) => `<div><h4 style="font-weight:600;font-size:13px;margin-bottom:10px;color:${t.accent};">${col.title}</h4>${(col.links as string[]).map((l: string) => `<p style="font-size:12px;color:${footerText}55;margin-bottom:4px;">${l}</p>`).join("")}</div>`).join("")}
    </div>
    <p style="text-align:center;font-size:11px;color:${footerText}33;margin-top:32px;">${footerS.copyright || `${name} — All rights reserved.`}</p>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(isDark, t.pageText, t.pageBg)}</style></head><body>
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${t.pageBg}${isDark ? "dd" : "ee"};backdrop-filter:blur(12px);border-bottom:1px solid ${t.borderColor};padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:56px;">
  ${logo}
  <div style="display:flex;gap:24px;align-items:center;">
    ${navItems.map(n => `<a href="#" style="text-decoration:none;font-size:13px;color:${t.pageText}88;font-weight:400;">${n}</a>`).join("")}
  </div>
</nav>
${heroHTML}${menuHTML}${trustHTML}${storyHTML}${footerHTML}
</body></html>`;
}
