/**
 * Template-family-aware renderers for eshop templates.
 * Mirrors the eMenu renderer architecture (renderPlateria, renderYumix, ...).
 *
 * Each family produces 3 visually distinct variants (Classic / Alternate / Bold).
 * Renderers are pure HTML producers — they read GeneratorConfig + TemplatePreset
 * and return a complete <!DOCTYPE html> document for the iframe preview.
 *
 * Reference provenance:
 *   AEMA  → https://aema-template.framer.website (clothing / fashion)
 */

import type { GeneratorConfig } from "./websiteGenerator";
import type { TemplatePreset } from "@/config/templateRegistry";

export interface EshopRenderContext {
  config: GeneratorConfig;
  preset: TemplatePreset;
  variantIndex: number;
}

// ─── Shared utilities ───

function navHref(label: string): string {
  const map: Record<string, string> = {
    home: "#hero",
    shop: "#products",
    sale: "#products",
    "new arrivals": "#products",
    new: "#products",
    products: "#products",
    collections: "#collections",
    blog: "#footer",
    about: "#about",
    contact: "#footer",
    cart: "#cart",
  };
  return map[label.toLowerCase().trim()] || `#${label.toLowerCase().replace(/\s+/g, "-")}`;
}

function getEshopImage(config: GeneratorConfig, slot: "hero" | "product" | "collection", index: number): string {
  if (config.userImages?.length) {
    const purposeMap: Record<string, string[]> = {
      hero: ["page", "interior"],
      product: ["product", "menu"],
      collection: ["product", "page"],
    };
    const purposes = purposeMap[slot];
    const matched = config.userImages.filter((i) => purposes.includes(i.purpose));
    if (matched.length > 0) return matched[index % matched.length].url;
    return config.userImages[index % config.userImages.length].url;
  }
  // Neutral fashion-friendly fallbacks (Unsplash, no provider lock-in)
  const fallbacks: Record<string, string[]> = {
    hero: [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
    ],
    product: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80",
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=800&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80",
    ],
    collection: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1200&q=80",
    ],
  };
  const arr = fallbacks[slot];
  return arr[index % arr.length];
}

function eshopBaseStyles(pageBg: string, pageText: string, accent: string): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; background: ${pageBg}; }
    body { font-family: 'Inter', sans-serif; background: ${pageBg}; color: ${pageText}; line-height: 1.6; min-height: 100vh; -webkit-font-smoothing: antialiased; }
    img { max-width: 100%; display: block; }
    a { color: inherit; text-decoration: none; }
    .yangu-product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .yangu-product-grid > * { max-width: 360px; justify-self: center; width: 100%; }
    .yangu-content-container { max-width: 1240px; margin: 0 auto; }
    .aema-card:hover .aema-card-img-alt { opacity: 1; }
    .aema-card-img-alt { transition: opacity .35s ease; }
    .aema-marquee { display: flex; gap: 48px; animation: aema-scroll 26s linear infinite; }
    @keyframes aema-scroll {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    @media (max-width: 768px) {
      [data-grid="2"] { grid-template-columns: 1fr !important; }
      [data-grid="3"] { grid-template-columns: 1fr !important; }
      [data-grid="4"] { grid-template-columns: repeat(2, 1fr) !important; }
      .yangu-product-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
      .yangu-product-grid > * { max-width: 100% !important; }
      .aema-nav-links { display: none !important; }
      .aema-hero-grid { grid-template-columns: 1fr !important; padding: 100px 20px 40px !important; min-height: auto !important; }
      .aema-hero-text { order: 2 !important; }
      .aema-hero-media { order: 1 !important; aspect-ratio: 4/5 !important; }
      h1 { font-size: clamp(2rem, 8vw, 3rem) !important; }
    }
    @media (min-width: 769px) and (max-width: 1024px) {
      .yangu-product-grid { grid-template-columns: repeat(3, 1fr) !important; }
    }
  `;
}

// ═══════════════════════════════════════════════════════════════════
// AEMA — Minimal editorial fashion store
// Reference: https://aema-template.framer.website
// Structure: top tagline bar → fixed nav (logo + center nav + cart)
//            → split hero (collection text + large model image + thumb strip)
//            → category tabs (Our Favorites / Best Sellers / Sale)
//            → product grid with size chips + NEW/% OFF badges
//            → 2-up collection blocks (full-bleed image + label)
//            → Instagram-style 4-up gallery
//            → minimal footer
// ═══════════════════════════════════════════════════════════════════

interface AemaTheme {
  pageBg: string;
  pageText: string;
  accent: string;
  accentText: string;
  cardBg: string;
  border: string;
  fontHeading: string;
  fontBody: string;
  /** "light" = white storefront (default Aema), "dark" = inverted, "warm" = beige editorial */
  mood: "light" | "dark" | "warm";
}

const AEMA_VARIANTS: AemaTheme[] = [
  // Variant 0 — Classic Aema (clean white, black type, ultra-minimal)
  {
    pageBg: "#F5F4F2",
    pageText: "#0A0A0A",
    accent: "#0A0A0A",
    accentText: "#FFFFFF",
    cardBg: "#FFFFFF",
    border: "#E8E6E2",
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    mood: "light",
  },
  // Variant 1 — Warm editorial (beige + brown, Playfair display headings)
  {
    pageBg: "#EFE9DF",
    pageText: "#1F1A14",
    accent: "#6B4A2B",
    accentText: "#FFFFFF",
    cardBg: "#FFFFFF",
    border: "#DDD2BE",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    mood: "warm",
  },
  // Variant 2 — Dark monochrome (inverted gallery look)
  {
    pageBg: "#0E0E0E",
    pageText: "#F2F2F2",
    accent: "#F2F2F2",
    accentText: "#0E0E0E",
    cardBg: "#141414",
    border: "#262626",
    fontHeading: "'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
    mood: "dark",
  },
];

export function renderAema(ctx: EshopRenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as Record<string, any>;
  const headerS = (s.header?.schema || {}) as Record<string, any>;
  const mainS = (s.main_content?.schema || {}) as Record<string, any>;
  const offerS = (s.offer?.schema || {}) as Record<string, any>;
  const footerS = (s.footer?.schema || {}) as Record<string, any>;

  // Pick variant theme (Classic / Warm / Dark)
  const t = AEMA_VARIANTS[variantIndex] || AEMA_VARIANTS[0];

  // Allow user brand color to override the accent on variants 0/2
  if (config.userBrandColors?.[0] && variantIndex !== 1) {
    t.accent = config.userBrandColors[0];
  }

  const name = config.businessName || "ÆMA";
  const navItems = (headerS.nav_items as string[]) || ["Shop", "Sale", "New Arrivals", "Collections", "Blog"];
  const tagline = (headerS.top_tagline as string) || (heroS.subheadline as string) || "FREE DELIVERY OVER 50€";

  const headline = (heroS.headline as string) || "Basic Collection";
  const subheadline = (heroS.subheadline as string) || "Timeless everyday essentials designed for comfort, simplicity, and effortless wear.";
  const ctaText = (heroS.cta_text as string) || "SHOP NOW";

  const heroImg = getEshopImage(config, "hero", variantIndex);

  // Products
  const fallbackProducts = [
    { title: "T-Shirt Black", price: "19.90 EUR", badges: ["NEW"], sizes: ["S", "M", "L", "XL"] },
    { title: "Jeans Blue", price: "49.90 EUR", badges: [], sizes: ["30", "32", "34", "36"] },
    { title: "Sweater Gray", price: "39.90 EUR", badges: [], sizes: ["S", "M", "L", "XL"] },
    { title: "Hoodie Gray", price: "39.90 EUR", original_price: "49.90 EUR", badges: ["20% OFF"], sizes: ["S", "M", "L", "XL"] },
    { title: "Polo Beige", price: "24.90 EUR", badges: ["NEW"], sizes: ["S", "M", "L", "XL"] },
    { title: "Trousers Brown", price: "59.90 EUR", badges: [], sizes: ["30", "32", "34", "36"] },
    { title: "T-Shirt White", price: "14.90 EUR", original_price: "19.90 EUR", badges: ["25% OFF"], sizes: ["S", "M", "L", "XL"] },
    { title: "Jeans Light", price: "49.90 EUR", badges: ["NEW"], sizes: ["30", "32", "34", "36"] },
  ];
  const items = ((mainS.items as any[])?.length ? (mainS.items as any[]) : fallbackProducts);

  const collectionTabs = (mainS.tabs as string[]) || ["Our Favorites", "Best Sellers", "Sale"];

  const collections = (offerS.collections as any[]) || [
    { title: "Shirts", cta: "Shop Now" },
    { title: "Pants", cta: "Shop Now" },
  ];

  const socialItems = (offerS.social_gallery?.items as any[]) || [
    { handle: "@aema" },
    { handle: "@aema" },
    { handle: "@aema" },
    { handle: "@aema" },
  ];

  // Logo
  const logoHTML = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:22px;width:auto;"/>`
    : `<span style="font-family:${t.fontHeading};font-weight:600;font-size:18px;letter-spacing:0.18em;color:${t.pageText};">${name.toUpperCase()}</span>`;

  // ─── Top tagline marquee ───
  const taglineHTML = `
  <div style="background:${t.pageText};color:${t.pageBg};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:8px 0;overflow:hidden;">
    <div class="aema-marquee">
      ${Array(8).fill(`<span style="white-space:nowrap;">${tagline}</span>`).join("")}
      ${Array(8).fill(`<span style="white-space:nowrap;">${tagline}</span>`).join("")}
    </div>
  </div>`;

  // ─── Fixed nav: logo left | center nav | actions right ───
  const navHTML = `
  <nav style="position:sticky;top:0;z-index:80;background:${t.pageBg};border-bottom:1px solid ${t.border};display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:18px 28px;">
    <div style="justify-self:start;">${logoHTML}</div>
    <div class="aema-nav-links" style="display:flex;gap:36px;align-items:center;">
      ${navItems
        .map(
          (n) =>
            `<a href="${navHref(n)}" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:500;color:${t.pageText};">${n}</a>`,
        )
        .join("")}
    </div>
    <div style="justify-self:end;display:flex;gap:18px;align-items:center;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${t.pageText};">
      <a href="#products">SEARCH</a>
      <a href="#cart">CART (0)</a>
    </div>
  </nav>`;

  // ─── Hero: split layout with collection text + portrait image + thumb strip ───
  const heroHTML = `
  <section id="hero" class="aema-hero-grid" style="display:grid;grid-template-columns:1fr 1.6fr auto;gap:48px;align-items:end;padding:80px 48px 80px;min-height:78vh;background:${t.pageBg};">
    <div class="aema-hero-text" style="padding-bottom:20px;">
      <h1 style="font-family:${t.fontHeading};font-size:clamp(2.6rem,5.6vw,4.4rem);font-weight:700;line-height:0.95;letter-spacing:-0.02em;color:${t.pageText};margin-bottom:20px;">${headline.toUpperCase()}</h1>
      <p style="font-size:0.95rem;color:${t.pageText}aa;line-height:1.6;max-width:340px;margin-bottom:28px;">${subheadline}</p>
      <a href="#products" style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;color:${t.pageText};border-bottom:1px solid ${t.pageText};padding-bottom:4px;">${ctaText}</a>
    </div>
    <div class="aema-hero-media" style="aspect-ratio:4/5;overflow:hidden;background:${t.cardBg};">
      <img src="${heroImg}" alt="${headline}" style="width:100%;height:100%;object-fit:cover;"/>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;padding-bottom:20px;">
      ${[0, 1, 2]
        .map(
          (i) => `
        <div style="width:84px;height:84px;overflow:hidden;border:1px solid ${t.border};background:${t.cardBg};">
          <img src="${getEshopImage(config, "product", i)}" alt="" style="width:100%;height:100%;object-fit:cover;"/>
        </div>`,
        )
        .join("")}
    </div>
  </section>`;

  // ─── Category tabs (Our Favorites / Best Sellers / Sale) ───
  const tabsHTML = `
  <section style="padding:24px 28px 8px;background:${t.pageBg};border-top:1px solid ${t.border};">
    <div class="yangu-content-container" style="display:flex;gap:48px;justify-content:center;flex-wrap:wrap;">
      ${collectionTabs
        .map(
          (tab, i) => `
        <button style="background:none;border:none;cursor:pointer;font-family:${t.fontHeading};font-size:1.6rem;font-weight:${i === 0 ? "700" : "400"};color:${i === 0 ? t.pageText : t.pageText + "66"};letter-spacing:-0.01em;padding:8px 4px;border-bottom:${i === 0 ? `2px solid ${t.pageText}` : "2px solid transparent"};">${tab}</button>`,
        )
        .join("")}
    </div>
  </section>`;

  // ─── Product grid with size chips + badges (Aema signature) ───
  const productCard = (item: any, idx: number): string => {
    const imgA = getEshopImage(config, "product", idx);
    const imgB = getEshopImage(config, "product", idx + 4);
    const sizes = (item.sizes as string[]) || ["S", "M", "L", "XL"];
    const badges = (item.badges as string[]) || [];
    const badgeHTML = badges
      .map(
        (b, bi) => `
        <span style="position:absolute;top:12px;${bi === 0 ? "left:12px" : "right:12px"};padding:4px 10px;background:${b.includes("OFF") ? "#D43A3A" : t.pageText};color:#FFFFFF;font-size:10px;letter-spacing:0.12em;font-weight:600;text-transform:uppercase;border-radius:2px;">${b}</span>`,
      )
      .join("");
    return `
    <a href="#" class="aema-card" style="display:block;background:${t.cardBg};color:${t.pageText};">
      <div style="position:relative;aspect-ratio:3/4;overflow:hidden;background:${t.pageBg};">
        <img src="${imgA}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;"/>
        <img class="aema-card-img-alt" src="${imgB}" alt="" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;opacity:0;"/>
        ${badgeHTML}
        <div style="position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;gap:6px;padding:10px;background:linear-gradient(to top, ${t.cardBg}ee, transparent);">
          ${sizes
            .map(
              (sz) =>
                `<span style="min-width:28px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:1px solid ${t.border};background:${t.cardBg};color:${t.pageText};font-size:11px;font-weight:500;border-radius:2px;">${sz}</span>`,
            )
            .join("")}
        </div>
      </div>
      <div style="padding:14px 4px 24px;display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-size:13px;font-weight:600;letter-spacing:0.02em;">${item.title}</span>
        <span style="font-size:13px;font-weight:600;color:${t.pageText};">
          ${item.price}
          ${item.original_price ? `<span style="margin-left:6px;color:${t.pageText}66;text-decoration:line-through;font-weight:400;">${item.original_price}</span>` : ""}
        </span>
      </div>
    </a>`;
  };

  const productsHTML = `
  <section id="products" style="padding:32px 28px 80px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div data-grid="4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;">
        ${items.slice(0, 8).map((p: any, i: number) => productCard(p, i)).join("")}
      </div>
    </div>
  </section>`;

  // ─── 2-up Collections (full-bleed image + heading + Shop Now) ───
  const collectionsHTML = `
  <section id="collections" style="padding:80px 28px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <h2 style="font-family:${t.fontHeading};font-size:2.2rem;font-weight:700;letter-spacing:-0.02em;margin-bottom:32px;color:${t.pageText};">Collections</h2>
      <div data-grid="2" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
        ${collections
          .slice(0, 2)
          .map(
            (c: any, i: number) => `
          <a href="#" style="display:block;position:relative;aspect-ratio:4/5;overflow:hidden;background:${t.cardBg};">
            <img src="${getEshopImage(config, "collection", i)}" alt="${c.title}" style="width:100%;height:100%;object-fit:cover;"/>
            <div style="position:absolute;left:0;right:0;bottom:0;padding:28px 24px;background:linear-gradient(to top, #00000080, transparent);color:#FFFFFF;display:flex;justify-content:space-between;align-items:flex-end;">
              <h3 style="font-family:${t.fontHeading};font-size:1.6rem;font-weight:700;letter-spacing:-0.01em;">${c.title}</h3>
              <span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;border-bottom:1px solid #FFFFFF;padding-bottom:3px;">${c.cta || "Shop Now"}</span>
            </div>
          </a>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── Instagram-style 4-up gallery ───
  const igHandle = (offerS.social_gallery?.handle as string) || `@${name.toLowerCase().replace(/\s+/g, "")}`;
  const galleryHTML = `
  <section style="padding:80px 28px;background:${t.pageBg};border-top:1px solid ${t.border};">
    <div class="yangu-content-container" style="text-align:center;">
      <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${t.pageText}88;margin-bottom:8px;">Follow Us on Instagram</p>
      <h3 style="font-family:${t.fontHeading};font-size:1.6rem;font-weight:600;color:${t.pageText};margin-bottom:32px;">${igHandle}</h3>
      <div data-grid="4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
        ${socialItems
          .slice(0, 4)
          .map(
            (_: any, i: number) => `
          <a href="#" style="display:block;position:relative;aspect-ratio:1/1;overflow:hidden;background:${t.cardBg};">
            <img src="${getEshopImage(config, "product", i + 1)}" alt="" style="width:100%;height:100%;object-fit:cover;"/>
          </a>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── Footer ───
  const footerCols = (footerS.columns as any[]) || [
    { title: "Shop", links: ["All", "New", "Sale"] },
    { title: "Help", links: ["Contact", "Shipping", "Returns"] },
    { title: "About", links: ["Story", "Journal", "Careers"] },
  ];
  const footerHTML = `
  <footer id="footer" style="padding:64px 28px 28px;background:${t.pageText};color:${t.pageBg};">
    <div class="yangu-content-container" style="display:grid;grid-template-columns:1.2fr 2fr;gap:48px;align-items:start;" data-grid="2">
      <div>
        <div style="font-family:${t.fontHeading};font-weight:600;font-size:22px;letter-spacing:0.18em;margin-bottom:12px;">${name.toUpperCase()}</div>
        <p style="font-size:12px;opacity:0.7;line-height:1.6;max-width:300px;">${footerS.tagline || subheadline}</p>
      </div>
      <div data-grid="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
        ${footerCols
          .map(
            (col: any) => `
          <div>
            <h4 style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;margin-bottom:14px;">${col.title}</h4>
            ${(col.links as string[]).map((l: string) => `<p style="font-size:13px;opacity:0.7;margin-bottom:6px;">${l}</p>`).join("")}
          </div>`,
          )
          .join("")}
      </div>
    </div>
    <p style="text-align:center;font-size:11px;opacity:0.5;margin-top:48px;letter-spacing:0.1em;">${footerS.copyright || `© ${new Date().getFullYear()} ${name} — All rights reserved.`}</p>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${eshopBaseStyles(t.pageBg, t.pageText, t.accent)}</style></head><body>
${taglineHTML}
${navHTML}
${heroHTML}
${tabsHTML}
${productsHTML}
${collectionsHTML}
${galleryHTML}
${footerHTML}
</body></html>`;
}
