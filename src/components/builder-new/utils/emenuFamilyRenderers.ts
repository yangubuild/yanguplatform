/**
 * Template-family-aware renderers for emenu templates.
 * Each family has its own distinct HTML structure and visual identity.
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
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
    }
  `;
}

// ═══════════════════════════════════════════════════════════════════
// PLATERIA — Elegant dark restaurant, serif typography, warm gold
// Section order: header → hero(split) → menu_grid → story → testimonials → footer
// ═══════════════════════════════════════════════════════════════════

export function renderPlateria(ctx: RenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as any;
  const headerS = (s.header?.schema || {}) as any;
  const mainS = (s.main_content?.schema || {}) as any;
  const offerS = (s.offer?.schema || {}) as any;
  const footerS = (s.footer?.schema || {}) as any;

  const accent = config.userBrandColors?.[0] || "#D4A853";
  const accentText = "#0A0A0A";
  const pageBg = "#0A0A0A";
  const pageText = "#F5F0E8";
  const cardBg = "#151515";
  const borderColor = "#2A2520";
  const fontHeading = "'Playfair Display', serif";
  const name = config.businessName || "Restaurant";
  const heroImg = getImageUrl(config, "hero", variantIndex);

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:30px;"/>`
    : `<span style="font-family:${fontHeading};font-weight:700;font-size:20px;color:${accent};letter-spacing:0.05em;">${name}</span>`;

  const navItems = (headerS.nav_items as string[]) || ["Home", "Menu", "About", "Contact"];

  // HERO — split layout, serif headline
  const headline = heroS.headline || "Finest Culinary Experience";
  const subheadline = heroS.subheadline || "";
  const description = heroS.description || "";
  const ctaText = heroS.cta_text || "View Menu";

  // MENU — grid of cards on dark
  const items = (mainS.items as any[]) || [];
  const menuHeading = mainS.heading || "Our Menu";
  const menuDesc = mainS.description || "";

  // STORY
  const story = offerS.story_block || {};
  // TESTIMONIALS
  const testimonials = offerS.testimonials || {};
  const footerCols = (footerS.columns as any[]) || [];

  const gradientAngle = [135, 160, 100][variantIndex] || 135;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(true, pageText, pageBg)}</style></head><body>

<!-- PLATERIA: NAV -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${pageBg}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${borderColor};padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:56px;">
  ${logo}
  <div style="display:flex;gap:24px;align-items:center;">
    ${navItems.map(n => `<a href="#" style="text-decoration:none;font-size:13px;color:${pageText}99;font-weight:400;letter-spacing:0.03em;">${n}</a>`).join("")}
  </div>
</nav>

<!-- PLATERIA: SPLIT HERO -->
<section style="min-height:85vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:56px;background:linear-gradient(${gradientAngle}deg, ${pageBg} 0%, #1A1510 100%);">
  <div>
    ${subheadline ? `<p style="font-size:13px;text-transform:uppercase;letter-spacing:3px;color:${accent};margin-bottom:16px;font-weight:500;">${subheadline}</p>` : ""}
    <h1 style="font-family:${fontHeading};font-size:clamp(2.5rem,5vw,3.8rem);font-weight:700;margin-bottom:20px;line-height:1.08;color:${pageText};">${headline}</h1>
    ${description ? `<p style="font-size:1rem;color:${pageText}88;margin-bottom:32px;line-height:1.8;max-width:440px;">${description}</p>` : ""}
    <a href="#menu" style="display:inline-block;padding:14px 36px;border-radius:6px;background:${accent};color:${accentText};text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.02em;">${ctaText}</a>
    ${heroS.social_proof ? `<div style="margin-top:20px;display:flex;align-items:center;gap:8px;color:${pageText}66;font-size:12px;"><span>⭐ ${heroS.social_proof.rating || "4.8"}</span><span>on ${heroS.social_proof.platform || "Google"}</span></div>` : ""}
  </div>
  <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;">
    <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
  </div>
</section>

<!-- PLATERIA: MENU GRID -->
<section id="menu" style="padding:80px 32px;background:${pageBg};">
  <div style="max-width:1000px;margin:0 auto;text-align:center;">
    <p style="font-size:12px;text-transform:uppercase;letter-spacing:3px;color:${accent};margin-bottom:8px;">MENU</p>
    <h2 style="font-family:${fontHeading};font-size:2rem;font-weight:700;margin-bottom:8px;color:${pageText};">${menuHeading}</h2>
    ${menuDesc ? `<p style="font-size:0.9rem;color:${pageText}88;margin-bottom:40px;">${menuDesc}</p>` : `<div style="margin-bottom:40px;"></div>`}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      ${items.map((item: any, idx: number) => {
        const imgSrc = getImageUrl(config, "menu", idx);
        const badge = item.badges?.[0] ? `<span style="position:absolute;top:10px;left:10px;padding:4px 12px;border-radius:4px;background:${accent};color:${accentText};font-size:10px;font-weight:600;text-transform:uppercase;">${item.badges[0]}</span>` : "";
        return `<div style="background:${cardBg};border:1px solid ${borderColor};border-radius:12px;overflow:hidden;position:relative;transition:transform 0.3s;">
          ${badge}
          <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:200px;object-fit:cover;"/>
          <div style="padding:16px 18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;font-size:14px;color:${pageText};">${item.title}</span>
              <span style="font-weight:700;font-size:14px;color:${accent};">${item.price || ""}</span>
            </div>
            ${item.description ? `<p style="font-size:12px;color:${pageText}66;margin-top:6px;line-height:1.5;">${item.description}</p>` : ""}
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>
</section>

<!-- PLATERIA: STORY BLOCK -->
${story.enabled ? `
<section style="padding:80px 32px;background:#0E0E0E;">
  <div style="max-width:640px;margin:0 auto;text-align:center;">
    ${story.eyebrow ? `<p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:${accent};margin-bottom:10px;">${story.eyebrow}</p>` : ""}
    <h2 style="font-family:${fontHeading};font-size:1.8rem;font-weight:700;margin-bottom:16px;color:${pageText};">${story.heading || ""}</h2>
    <p style="font-size:0.95rem;color:${pageText}88;line-height:1.8;">${story.description || ""}</p>
    ${story.cta_text ? `<a href="#" style="display:inline-block;margin-top:24px;padding:12px 32px;border-radius:6px;background:${accent};color:${accentText};text-decoration:none;font-weight:600;font-size:14px;">${story.cta_text}</a>` : ""}
  </div>
</section>` : ""}

<!-- PLATERIA: TESTIMONIALS -->
${testimonials.enabled && testimonials.items?.length ? `
<section style="padding:72px 32px;background:${pageBg};">
  <div style="max-width:1000px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${fontHeading};font-size:1.6rem;font-weight:700;margin-bottom:8px;color:${pageText};">${testimonials.heading || "Reviews"}</h2>
    ${testimonials.subheading ? `<p style="font-size:0.85rem;color:${accent};margin-bottom:32px;">${testimonials.subheading}</p>` : `<div style="margin-bottom:32px;"></div>`}
    <div style="display:grid;grid-template-columns:repeat(${Math.min(testimonials.items.length, 3)},1fr);gap:20px;">
      ${testimonials.items.slice(0, 3).map((t: any) => `
        <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:12px;padding:28px 22px;text-align:left;">
          <p style="font-size:14px;color:${pageText}cc;line-height:1.7;font-style:italic;">"${t.quote}"</p>
          <div style="margin-top:14px;"><span style="font-weight:600;font-size:13px;color:${pageText};">${t.name}</span>
          ${t.role ? `<br/><span style="font-size:11px;color:${pageText}66;">${t.role}</span>` : ""}</div>
        </div>
      `).join("")}
    </div>
  </div>
</section>` : ""}

<!-- PLATERIA: FOOTER -->
<footer style="padding:48px 32px;background:#050505;border-top:1px solid ${borderColor};">
  <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:32px;">
    ${footerCols.map((col: any) => `<div><h4 style="font-weight:600;font-size:13px;margin-bottom:10px;color:${accent};">${col.title}</h4>${(col.links as string[]).map((l: string) => `<p style="font-size:12px;color:${pageText}66;margin-bottom:4px;">${l}</p>`).join("")}</div>`).join("")}
  </div>
  <p style="text-align:center;font-size:11px;color:${pageText}44;margin-top:32px;">${footerS.copyright || `${name} — All rights reserved.`}</p>
</footer>
</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// YUMIX — Bold dark food brand, cinematic, category cards + stats
// Section order: header → hero → category_cards → featured_grid → promo → stats → testimonials → newsletter → footer
// ═══════════════════════════════════════════════════════════════════

export function renderYumix(ctx: RenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as any;
  const headerS = (s.header?.schema || {}) as any;
  const mainS = (s.main_content?.schema || {}) as any;
  const offerS = (s.offer?.schema || {}) as any;
  const footerS = (s.footer?.schema || {}) as any;

  const accent = config.userBrandColors?.[0] || "#F97316";
  const accentText = "#FFFFFF";
  const pageBg = "#0F0D0A";
  const pageText = "#F5F0E8";
  const cardBg = "#1A1714";
  const borderColor = "#2D2A25";
  const fontHeading = "'DM Sans', sans-serif";
  const name = config.businessName || "Restaurant";
  const heroImg = getImageUrl(config, "hero", variantIndex);

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:28px;"/>`
    : `<span style="font-weight:800;font-size:20px;color:${pageText};letter-spacing:-0.02em;">${name}</span>`;

  const navItems = (headerS.nav_items as string[]) || ["Home", "Menu", "Deals", "About", "Contact"];

  const headline = heroS.headline || "Delicious Food For Every Mood";
  const subheadline = heroS.subheadline || "";
  const ctaText = heroS.cta_text || "Order Now";
  const badge = heroS.badge;

  const items = (mainS.items as any[]) || [];
  const catShowcase = mainS.category_showcase;
  const offerItems = (offerS.items as any[]) || [];
  const promos = (offerS.promo_banners as any[]) || [];
  const stats = (offerS.stats as any[]) || [];
  const testimonials = offerS.testimonials || {};
  const newsletter = offerS.newsletter || {};
  const footerCols = (footerS.columns as any[]) || [];

  const gradientAngle = [135, 155, 110][variantIndex] || 135;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(true, pageText, pageBg)}</style></head><body>

<!-- YUMIX: NAV -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${pageBg}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${borderColor};padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:54px;">
  ${logo}
  <div style="display:flex;gap:20px;align-items:center;">
    ${navItems.map(n => `<a href="#" style="text-decoration:none;font-size:13px;color:${pageText}88;font-weight:500;">${n}</a>`).join("")}
    <a href="#" style="padding:8px 20px;border-radius:20px;background:${accent};color:${accentText};text-decoration:none;font-size:12px;font-weight:600;">Order</a>
  </div>
</nav>

<!-- YUMIX: HERO with badge -->
<section style="min-height:85vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:48px;background:linear-gradient(${gradientAngle}deg, ${pageBg} 0%, #1A1408 100%);">
  <div>
    ${badge ? `<span style="display:inline-block;padding:6px 16px;border-radius:20px;background:${accent};color:${accentText};font-size:12px;font-weight:700;margin-bottom:16px;">${badge.text || "30% OFF"}</span>` : ""}
    ${subheadline ? `<p style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:${pageText}77;margin-bottom:10px;">${subheadline}</p>` : ""}
    <h1 style="font-family:${fontHeading};font-size:clamp(2.4rem,5vw,3.6rem);font-weight:800;margin-bottom:20px;line-height:1.06;color:${pageText};">${headline}</h1>
    <div style="display:flex;gap:12px;">
      <a href="#menu" style="display:inline-block;padding:14px 32px;border-radius:28px;background:${accent};color:${accentText};text-decoration:none;font-weight:700;font-size:14px;">${ctaText}</a>
    </div>
  </div>
  <div style="border-radius:20px;overflow:hidden;aspect-ratio:1/1;">
    <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
  </div>
</section>

<!-- YUMIX: CATEGORY CARDS -->
${catShowcase?.enabled && catShowcase.items?.length ? `
<section style="padding:64px 28px;background:#141210;">
  <div style="max-width:1000px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:8px;color:${pageText};">${catShowcase.heading || "Categories"}</h2>
    ${catShowcase.description ? `<p style="font-size:0.85rem;color:${pageText}88;margin-bottom:28px;">${catShowcase.description}</p>` : `<div style="margin-bottom:28px;"></div>`}
    <div style="display:grid;grid-template-columns:repeat(${catShowcase.columns || 4},1fr);gap:16px;">
      ${catShowcase.items.map((cat: any) => `
        <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:16px;padding:28px 16px;text-align:center;transition:transform 0.2s;">
          ${cat.emoji ? `<span style="font-size:2rem;display:block;margin-bottom:8px;">${cat.emoji}</span>` : ""}
          <span style="font-weight:600;font-size:14px;color:${pageText};">${cat.title}</span>
          ${cat.count ? `<br/><span style="font-size:11px;color:${pageText}66;">${cat.count}</span>` : ""}
        </div>
      `).join("")}
    </div>
  </div>
</section>` : ""}

<!-- YUMIX: FEATURED GRID -->
<section id="menu" style="padding:72px 28px;background:${pageBg};">
  <div style="max-width:1000px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${fontHeading};font-size:1.6rem;font-weight:800;margin-bottom:8px;color:${pageText};">${mainS.heading || "Featured"}</h2>
    ${mainS.description ? `<p style="font-size:0.9rem;color:${pageText}88;margin-bottom:36px;">${mainS.description}</p>` : `<div style="margin-bottom:36px;"></div>`}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;">
      ${items.map((item: any, idx: number) => {
        const imgSrc = getImageUrl(config, "menu", idx);
        const itemBadge = item.badges?.[0] ? `<span style="position:absolute;top:10px;right:10px;padding:4px 12px;border-radius:16px;background:${accent};color:${accentText};font-size:10px;font-weight:700;">${item.badges[0]}</span>` : "";
        return `<div style="background:${cardBg};border:1px solid ${borderColor};border-radius:16px;overflow:hidden;position:relative;">
          ${itemBadge}
          <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:190px;object-fit:cover;"/>
          <div style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:700;font-size:14px;color:${pageText};">${item.title}</span>
              <span style="font-weight:800;font-size:14px;color:${accent};">${item.price || ""}</span>
            </div>
            ${item.description ? `<p style="font-size:12px;color:${pageText}77;margin-top:5px;">${item.description}</p>` : ""}
            <button style="margin-top:10px;width:100%;padding:10px;border-radius:12px;background:${accent}22;color:${accent};border:1px solid ${accent}44;font-weight:600;font-size:12px;cursor:pointer;">Add to Cart</button>
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>
</section>

<!-- YUMIX: PROMO BANNERS -->
${promos.length ? `
<section style="padding:48px 28px;background:#141210;">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(${Math.min(promos.length, 2)},1fr);gap:20px;">
    ${promos.map((p: any) => `
      <div style="background:${accent}15;border:1px solid ${accent}33;border-radius:16px;padding:32px 24px;">
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;color:${pageText};">${p.heading}</h3>
        <p style="font-size:0.85rem;color:${pageText}88;margin-bottom:16px;">${p.description}</p>
        ${p.cta_text ? `<a href="#" style="padding:10px 24px;border-radius:20px;background:${accent};color:${accentText};text-decoration:none;font-size:13px;font-weight:600;">${p.cta_text}</a>` : ""}
      </div>
    `).join("")}
  </div>
</section>` : ""}

<!-- YUMIX: WHY CHOOSE US -->
${offerItems.length ? `
<section style="padding:60px 28px;background:${pageBg};">
  <div style="max-width:1000px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${fontHeading};font-size:1.4rem;font-weight:700;margin-bottom:28px;color:${pageText};">${offerS.heading || "Why Choose Us"}</h2>
    <div style="display:grid;grid-template-columns:repeat(${Math.min(offerItems.length, 3)},1fr);gap:20px;">
      ${offerItems.map((item: any) => `
        <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:14px;padding:28px 18px;text-align:center;">
          <span style="font-size:1.5rem;">${item.icon === "truck" ? "🚚" : item.icon === "leaf" ? "🌿" : item.icon === "tag" ? "🏷️" : "✅"}</span>
          <h4 style="font-weight:600;font-size:14px;margin-top:10px;color:${pageText};">${item.title}</h4>
          <p style="font-size:12px;color:${pageText}77;margin-top:4px;">${item.description}</p>
        </div>
      `).join("")}
    </div>
  </div>
</section>` : ""}

<!-- YUMIX: STATS ROW -->
${stats.length ? `
<section style="padding:48px 28px;background:#141210;">
  <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap;gap:24px;">
    ${stats.map((s: any) => `
      <div>
        <div style="font-size:2.2rem;font-weight:800;color:${accent};">${s.value}</div>
        <div style="font-size:12px;color:${pageText}77;margin-top:4px;">${s.label}</div>
      </div>
    `).join("")}
  </div>
</section>` : ""}

<!-- YUMIX: TESTIMONIALS -->
${testimonials.enabled && testimonials.items?.length ? `
<section style="padding:64px 28px;background:${pageBg};">
  <div style="max-width:1000px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:8px;color:${pageText};">${testimonials.heading || "Reviews"}</h2>
    ${testimonials.subheading ? `<p style="font-size:0.85rem;color:${accent};margin-bottom:28px;">${testimonials.subheading}</p>` : `<div style="margin-bottom:28px;"></div>`}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
      ${testimonials.items.slice(0, 3).map((t: any) => `
        <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:14px;padding:24px 20px;text-align:left;">
          <p style="font-size:14px;color:${pageText}bb;line-height:1.6;font-style:italic;">"${t.quote}"</p>
          <div style="margin-top:12px;"><span style="font-weight:600;font-size:13px;color:${pageText};">${t.name}</span>
          ${t.role ? `<br/><span style="font-size:11px;color:${pageText}66;">${t.role}</span>` : ""}</div>
        </div>
      `).join("")}
    </div>
  </div>
</section>` : ""}

<!-- YUMIX: NEWSLETTER -->
${newsletter.enabled ? `
<section style="padding:52px 28px;background:#141210;">
  <div style="max-width:460px;margin:0 auto;text-align:center;">
    <h3 style="font-family:${fontHeading};font-size:1.2rem;font-weight:700;margin-bottom:14px;color:${pageText};">${newsletter.heading || "Subscribe"}</h3>
    <div style="display:flex;gap:8px;">
      <input type="email" placeholder="Your email" style="flex:1;padding:12px 16px;border-radius:12px;border:1px solid ${borderColor};background:${cardBg};color:${pageText};font-size:14px;"/>
      <button style="padding:12px 24px;border-radius:12px;background:${accent};color:${accentText};border:none;font-weight:700;font-size:14px;cursor:pointer;">${newsletter.cta_text || "Subscribe"}</button>
    </div>
  </div>
</section>` : ""}

<!-- YUMIX: FOOTER -->
<footer style="padding:48px 28px;background:#080705;border-top:1px solid ${borderColor};">
  <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:28px;">
    ${footerCols.map((col: any) => `<div><h4 style="font-weight:600;font-size:13px;margin-bottom:10px;color:${accent};">${col.title}</h4>${(col.links as string[]).map((l: string) => `<p style="font-size:12px;color:${pageText}55;margin-bottom:4px;">${l}</p>`).join("")}</div>`).join("")}
  </div>
  <p style="text-align:center;font-size:11px;color:${pageText}33;margin-top:32px;">${footerS.copyright || `${name} — All rights reserved.`}</p>
</footer>
</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// ZOOOM — Clean bright modern, minimalist, delivery-focused
// Section order: header → hero → categories → menu_grid → story → testimonials → footer
// ═══════════════════════════════════════════════════════════════════

export function renderZooom(ctx: RenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as any;
  const headerS = (s.header?.schema || {}) as any;
  const mainS = (s.main_content?.schema || {}) as any;
  const offerS = (s.offer?.schema || {}) as any;
  const footerS = (s.footer?.schema || {}) as any;

  const accent = config.userBrandColors?.[0] || "#10B981";
  const accentText = "#FFFFFF";
  const pageBg = "#FFFFFF";
  const pageText = "#1A1A1A";
  const cardBg = "#FFFFFF";
  const borderColor = "#E5E7EB";
  const softBg = "#F9FAFB";
  const fontHeading = "'DM Sans', sans-serif";
  const name = config.businessName || "Restaurant";
  const heroImg = getImageUrl(config, "hero", variantIndex);

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:28px;"/>`
    : `<span style="font-weight:700;font-size:20px;color:${pageText};letter-spacing:-0.02em;">${name}</span>`;

  const navItems = (headerS.nav_items as string[]) || ["Home", "Menu", "Delivery", "Contact"];
  const headline = heroS.headline || "Your Favorite Food, Delivered Fast";
  const subheadline = heroS.subheadline || "";
  const ctaText = heroS.cta_text || "Order Now";

  const items = (mainS.items as any[]) || [];
  const catShowcase = mainS.category_showcase;
  const story = offerS.story_block || {};
  const testimonials = offerS.testimonials || {};
  const footerCols = (footerS.columns as any[]) || [];

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(false, pageText, pageBg)}</style></head><body>

<!-- ZOOOM: NAV -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${pageBg}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${borderColor};padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:54px;">
  ${logo}
  <div style="display:flex;gap:20px;align-items:center;">
    ${navItems.map(n => `<a href="#" style="text-decoration:none;font-size:13px;color:${pageText}88;font-weight:500;">${n}</a>`).join("")}
    <a href="#" style="padding:8px 20px;border-radius:20px;background:${accent};color:${accentText};text-decoration:none;font-size:12px;font-weight:600;">Order</a>
  </div>
</nav>

<!-- ZOOOM: HERO — bright, clean split -->
<section style="min-height:80vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:100px 48px 80px;gap:48px;background:${pageBg};">
  <div>
    ${subheadline ? `<p style="font-size:13px;color:${accent};font-weight:600;margin-bottom:10px;">${subheadline}</p>` : ""}
    <h1 style="font-family:${fontHeading};font-size:clamp(2.4rem,5vw,3.4rem);font-weight:800;margin-bottom:20px;line-height:1.08;color:${pageText};">${headline}</h1>
    <div style="display:flex;gap:12px;">
      <a href="#menu" style="display:inline-block;padding:14px 32px;border-radius:28px;background:${accent};color:${accentText};text-decoration:none;font-weight:700;font-size:14px;">${ctaText}</a>
      <a href="#" style="display:inline-block;padding:14px 24px;border-radius:28px;background:transparent;color:${pageText};text-decoration:none;font-weight:600;font-size:14px;border:1px solid ${borderColor};">Learn More</a>
    </div>
  </div>
  <div style="border-radius:24px;overflow:hidden;aspect-ratio:1/1;box-shadow:0 20px 60px rgba(0,0,0,0.08);">
    <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
  </div>
</section>

<!-- ZOOOM: SCROLLABLE CATEGORIES -->
${catShowcase?.enabled && catShowcase.items?.length ? `
<section style="padding:48px 28px;background:${softBg};">
  <div style="max-width:1000px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${fontHeading};font-size:1.3rem;font-weight:700;margin-bottom:24px;color:${pageText};">${catShowcase.heading || "Categories"}</h2>
    <div style="display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;justify-content:center;flex-wrap:wrap;">
      ${catShowcase.items.map((cat: any) => `
        <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:14px;padding:20px 24px;text-align:center;min-width:120px;flex-shrink:0;">
          ${cat.emoji ? `<span style="font-size:1.8rem;display:block;margin-bottom:6px;">${cat.emoji}</span>` : ""}
          <span style="font-weight:600;font-size:13px;color:${pageText};">${cat.title}</span>
          ${cat.count ? `<br/><span style="font-size:11px;color:${pageText}77;">${cat.count}</span>` : ""}
        </div>
      `).join("")}
    </div>
  </div>
</section>` : ""}

<!-- ZOOOM: MENU GRID — 4 columns, clean cards -->
<section id="menu" style="padding:72px 28px;background:${pageBg};">
  <div style="max-width:1100px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${fontHeading};font-size:1.5rem;font-weight:700;margin-bottom:8px;color:${pageText};">${mainS.heading || "Browse Our Menu"}</h2>
    ${mainS.description ? `<p style="font-size:0.9rem;color:${pageText}88;margin-bottom:36px;">${mainS.description}</p>` : `<div style="margin-bottom:36px;"></div>`}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">
      ${items.map((item: any, idx: number) => {
        const imgSrc = getImageUrl(config, "menu", idx);
        const itemBadge = item.badges?.[0] ? `<span style="position:absolute;top:8px;left:8px;padding:3px 10px;border-radius:10px;background:${accent};color:${accentText};font-size:10px;font-weight:600;">${item.badges[0]}</span>` : "";
        return `<div style="background:${cardBg};border:1px solid ${borderColor};border-radius:14px;overflow:hidden;position:relative;box-shadow:0 2px 8px rgba(0,0,0,0.04);transition:transform 0.2s;">
          ${itemBadge}
          <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:170px;object-fit:cover;"/>
          <div style="padding:14px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;font-size:13px;color:${pageText};">${item.title}</span>
              <span style="font-weight:700;font-size:13px;color:${accent};">${item.price || ""}</span>
            </div>
            ${item.description ? `<p style="font-size:11px;color:${pageText}77;margin-top:4px;">${item.description}</p>` : ""}
            <button style="margin-top:8px;width:100%;padding:8px;border-radius:10px;background:${accent}11;color:${accent};border:1px solid ${accent}33;font-weight:600;font-size:11px;cursor:pointer;">Add +</button>
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>
</section>

<!-- ZOOOM: STORY / ABOUT -->
${story.enabled ? `
<section style="padding:72px 28px;background:${softBg};">
  <div style="max-width:620px;margin:0 auto;text-align:center;">
    ${story.eyebrow ? `<p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${accent};margin-bottom:8px;font-weight:600;">${story.eyebrow}</p>` : ""}
    <h2 style="font-family:${fontHeading};font-size:1.6rem;font-weight:700;margin-bottom:14px;color:${pageText};">${story.heading || ""}</h2>
    <p style="font-size:0.95rem;color:${pageText}88;line-height:1.8;">${story.description || ""}</p>
    ${story.cta_text ? `<a href="#" style="display:inline-block;margin-top:20px;padding:12px 28px;border-radius:24px;background:${accent};color:${accentText};text-decoration:none;font-weight:600;font-size:14px;">${story.cta_text}</a>` : ""}
  </div>
</section>` : ""}

<!-- ZOOOM: TESTIMONIALS -->
${testimonials.enabled && testimonials.items?.length ? `
<section style="padding:64px 28px;background:${pageBg};">
  <div style="max-width:1000px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${fontHeading};font-size:1.4rem;font-weight:700;margin-bottom:8px;color:${pageText};">${testimonials.heading || "Reviews"}</h2>
    ${testimonials.subheading ? `<p style="font-size:0.85rem;color:${accent};margin-bottom:28px;">${testimonials.subheading}</p>` : `<div style="margin-bottom:28px;"></div>`}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
      ${testimonials.items.slice(0, 3).map((t: any) => `
        <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:14px;padding:24px 20px;text-align:left;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
          <p style="font-size:14px;color:${pageText}bb;line-height:1.6;font-style:italic;">"${t.quote}"</p>
          <div style="margin-top:12px;"><span style="font-weight:600;font-size:13px;color:${pageText};">${t.name}</span>
          ${t.role ? `<br/><span style="font-size:11px;color:${pageText}77;">${t.role}</span>` : ""}</div>
        </div>
      `).join("")}
    </div>
  </div>
</section>` : ""}

<!-- ZOOOM: FOOTER -->
<footer style="padding:48px 28px;background:${softBg};border-top:1px solid ${borderColor};">
  <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:28px;">
    ${footerCols.map((col: any) => `<div><h4 style="font-weight:600;font-size:13px;margin-bottom:10px;color:${pageText};">${col.title}</h4>${(col.links as string[]).map((l: string) => `<p style="font-size:12px;color:${pageText}77;margin-bottom:4px;">${l}</p>`).join("")}</div>`).join("")}
  </div>
  <p style="text-align:center;font-size:11px;color:${pageText}55;margin-top:32px;">${footerS.copyright || `${name} — All rights reserved.`}</p>
</footer>
</body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// VISUAL A — Classic restaurant, fullwidth dark hero, 2-col menu, trust badges
// Section order: header → hero(fullwidth) → menu → trust_badges → story → footer
// ═══════════════════════════════════════════════════════════════════

export function renderVisualA(ctx: RenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as any;
  const headerS = (s.header?.schema || {}) as any;
  const mainS = (s.main_content?.schema || {}) as any;
  const offerS = (s.offer?.schema || {}) as any;
  const footerS = (s.footer?.schema || {}) as any;

  const accent = config.userBrandColors?.[0] || "#C87941";
  const accentText = "#FFFFFF";
  const pageBg = "#0F0D0A";
  const pageText = "#F0E8DC";
  const cardBg = "#1A1714";
  const borderColor = "#2D2A25";
  const fontHeading = "'Playfair Display', serif";
  const name = config.businessName || "Restaurant";
  const heroImg = getImageUrl(config, "hero", variantIndex);

  const logo = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:30px;"/>`
    : `<span style="font-family:${fontHeading};font-weight:700;font-size:20px;color:${pageText};">${name}</span>`;

  const navItems = (headerS.nav_items as string[]) || ["Menu", "About", "Contact"];
  const headline = heroS.headline || "Welcome to Our Restaurant";
  const subheadline = heroS.subheadline || "";
  const ctaText = heroS.cta_text || "View Menu";

  const items = (mainS.items as any[]) || [];
  const offerItems = (offerS.items as any[]) || [];
  const story = offerS.story_block || {};
  const footerCols = (footerS.columns as any[]) || [];

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${baseStyles(true, pageText, pageBg)}</style></head><body>

<!-- VISUAL_A: NAV -->
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:${pageBg}dd;backdrop-filter:blur(12px);border-bottom:1px solid ${borderColor};padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:56px;">
  ${logo}
  <div style="display:flex;gap:24px;align-items:center;">
    ${navItems.map(n => `<a href="#" style="text-decoration:none;font-size:13px;color:${pageText}88;font-weight:400;">${n}</a>`).join("")}
  </div>
</nav>

<!-- VISUAL_A: FULLWIDTH HERO with overlay -->
<section style="min-height:85vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;"><img src="${heroImg}" style="width:100%;height:100%;object-fit:cover;" alt=""/></div>
  <div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
  <div style="position:relative;z-index:1;max-width:640px;">
    ${subheadline ? `<p style="font-size:0.95rem;color:${pageText}cc;margin-bottom:12px;line-height:1.7;">${subheadline}</p>` : ""}
    <h1 style="font-family:${fontHeading};font-size:clamp(2.6rem,5vw,4rem);font-weight:700;margin-bottom:20px;line-height:1.1;color:#fff;">${headline}</h1>
    <a href="#menu" style="display:inline-block;padding:14px 36px;border-radius:6px;background:${accent};color:${accentText};text-decoration:none;font-weight:600;font-size:14px;">${ctaText}</a>
  </div>
</section>

<!-- VISUAL_A: 2-COL MENU -->
<section id="menu" style="padding:80px 32px;background:${pageBg};">
  <div style="max-width:800px;margin:0 auto;text-align:center;">
    <p style="font-size:12px;text-transform:uppercase;letter-spacing:3px;color:${accent};margin-bottom:8px;">OUR MENU</p>
    <h2 style="font-family:${fontHeading};font-size:1.8rem;font-weight:700;margin-bottom:8px;color:${pageText};">${mainS.heading || "Our Menu"}</h2>
    ${mainS.description ? `<p style="font-size:0.9rem;color:${pageText}88;margin-bottom:40px;">${mainS.description}</p>` : `<div style="margin-bottom:40px;"></div>`}
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">
      ${items.map((item: any, idx: number) => {
        const imgSrc = getImageUrl(config, "menu", idx);
        return `<div style="background:${cardBg};border:1px solid ${borderColor};border-radius:10px;overflow:hidden;display:flex;align-items:stretch;">
          <img src="${imgSrc}" alt="${item.title}" style="width:120px;height:auto;object-fit:cover;flex-shrink:0;"/>
          <div style="padding:16px;text-align:left;flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;font-size:14px;color:${pageText};">${item.title}</span>
              <span style="font-weight:700;font-size:14px;color:${accent};">${item.price || ""}</span>
            </div>
            ${item.description ? `<p style="font-size:12px;color:${pageText}66;margin-top:6px;line-height:1.5;">${item.description}</p>` : ""}
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>
</section>

<!-- VISUAL_A: TRUST BADGES -->
${offerItems.length ? `
<section style="padding:60px 32px;background:#141210;">
  <div style="max-width:900px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${fontHeading};font-size:1.4rem;font-weight:700;margin-bottom:28px;color:${pageText};">${offerS.heading || "Why Dine With Us"}</h2>
    <div style="display:grid;grid-template-columns:repeat(${Math.min(offerItems.length, 4)},1fr);gap:20px;">
      ${offerItems.map((item: any) => `
        <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:10px;padding:28px 16px;text-align:center;">
          <span style="font-size:1.5rem;">${item.icon === "truck" ? "🚚" : item.icon === "headphones" ? "👨‍🍳" : item.icon === "map-pin" ? "🏡" : item.icon === "credit-card" ? "⚡" : "✅"}</span>
          <h4 style="font-weight:600;font-size:14px;margin-top:10px;color:${pageText};">${item.title}</h4>
          <p style="font-size:12px;color:${pageText}77;margin-top:4px;">${item.description}</p>
        </div>
      `).join("")}
    </div>
  </div>
</section>` : ""}

<!-- VISUAL_A: STORY -->
${story.enabled ? `
<section style="padding:80px 32px;background:${pageBg};">
  <div style="max-width:620px;margin:0 auto;text-align:center;">
    ${story.eyebrow ? `<p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:${accent};margin-bottom:10px;">${story.eyebrow}</p>` : ""}
    <h2 style="font-family:${fontHeading};font-size:1.7rem;font-weight:700;margin-bottom:14px;color:${pageText};">${story.heading || ""}</h2>
    <p style="font-size:0.95rem;color:${pageText}88;line-height:1.8;">${story.description || ""}</p>
    ${story.cta_text ? `<a href="#" style="display:inline-block;margin-top:24px;padding:12px 32px;border-radius:6px;background:${accent};color:${accentText};text-decoration:none;font-weight:600;font-size:14px;">${story.cta_text}</a>` : ""}
  </div>
</section>` : ""}

<!-- VISUAL_A: FOOTER -->
<footer style="padding:52px 32px;background:#080705;border-top:1px solid ${borderColor};">
  <div style="max-width:900px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:32px;">
    ${footerCols.map((col: any) => `<div><h4 style="font-weight:600;font-size:13px;margin-bottom:10px;color:${accent};">${col.title}</h4>${(col.links as string[]).map((l: string) => `<p style="font-size:12px;color:${pageText}55;margin-bottom:4px;">${l}</p>`).join("")}</div>`).join("")}
  </div>
  <p style="text-align:center;font-size:11px;color:${pageText}33;margin-top:32px;">${footerS.copyright || `${name} — All rights reserved.`}</p>
</footer>
</body></html>`;
}
