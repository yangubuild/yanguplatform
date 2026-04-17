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

// ═══════════════════════════════════════════════════════════════════
// UNCOVER — Tech / Electronics storefront
// Reference: https://uncovertemplatesite.framer.website
// Structure: discount marquee → minimal nav (Categories / Products / Blogs / Newsletter)
//            → centered hero with two-tone headline ("Uncover The Most Innovative Products.")
//            → 4-up category tiles (Outdoor / Video Gear / Sound Essentials / Best Sellers)
//            → "Popular Products" eyebrow + tab filter (All / New / Classic)
//            → 4-col product grid with stock chip + price + "New" badge
//            → testimonials grid (avatar + quote + name + role)
//            → About Us split (image left + 2 feature blocks right)
//            → 4-up animated stats (Partners / Community / Orders / Reviews)
//            → blogs preview row → newsletter footer
// ═══════════════════════════════════════════════════════════════════

interface UncoverTheme {
  pageBg: string;
  surfaceBg: string;
  pageText: string;
  mutedText: string;
  accent: string;        // signature orange in classic
  accentText: string;
  cardBg: string;
  border: string;
  fontHeading: string;
  fontBody: string;
  mood: "light" | "dark" | "graphite";
}

const UNCOVER_VARIANTS: UncoverTheme[] = [
  // Variant 0 — Classic Uncover (light gray bg, black type, signature orange accent)
  {
    pageBg: "#EFEFEF",
    surfaceBg: "#FFFFFF",
    pageText: "#0E0E0E",
    mutedText: "#6B6B6B",
    accent: "#F25822",
    accentText: "#FFFFFF",
    cardBg: "#FFFFFF",
    border: "#E2E2E2",
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    mood: "light",
  },
  // Variant 1 — Graphite (warm off-white + deep navy accent)
  {
    pageBg: "#F4F2EE",
    surfaceBg: "#FFFFFF",
    pageText: "#161A22",
    mutedText: "#5C6270",
    accent: "#2A4BD9",
    accentText: "#FFFFFF",
    cardBg: "#FFFFFF",
    border: "#E1DDD5",
    fontHeading: "'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
    mood: "graphite",
  },
  // Variant 2 — Dark studio (inverted, lime accent)
  {
    pageBg: "#0C0C0C",
    surfaceBg: "#141414",
    pageText: "#F2F2F2",
    mutedText: "#9A9A9A",
    accent: "#C9F24A",
    accentText: "#0C0C0C",
    cardBg: "#141414",
    border: "#262626",
    fontHeading: "'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
    mood: "dark",
  },
];

export function renderUncover(ctx: EshopRenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as Record<string, any>;
  const headerS = (s.header?.schema || {}) as Record<string, any>;
  const mainS = (s.main_content?.schema || {}) as Record<string, any>;
  const offerS = (s.offer?.schema || {}) as Record<string, any>;
  const footerS = (s.footer?.schema || {}) as Record<string, any>;

  const t = { ...UNCOVER_VARIANTS[variantIndex] || UNCOVER_VARIANTS[0] };

  // User brand color overrides accent (except graphite variant where navy is its identity)
  if (config.userBrandColors?.[0] && variantIndex !== 1) {
    t.accent = config.userBrandColors[0];
  }

  const name = config.businessName || "Uncover";
  const navItems = (headerS.nav_items as string[]) || ["Categories", "Products", "Blogs", "Newsletter"];
  const tagline = (headerS.top_tagline as string) || "Get a 20% discount  USE CODE 20PD";

  const headlineLead = (heroS.headline as string) || "Uncover The Most";
  const headlineTail = (heroS.headline_tail as string) || "Innovative Products.";
  const heroSub = (heroS.subheadline as string) || "Exploring the tech and design shaping the world of tomorrow.";

  // Categories tile row
  const categories = (mainS.categories as any[]) || [
    { title: "Outdoor", count: "4 pcs" },
    { title: "Video Gear", count: "4 pcs" },
    { title: "Sound Essentials", count: "4 pcs" },
    { title: "Best Sellers", count: "8 pcs" },
  ];

  // Products
  const fallbackProducts = [
    { title: "R21 Controller", price: "$129", stock: "In Stock", badge: "" },
    { title: "Studio Remote", price: "$84", stock: "In Stock", badge: "" },
    { title: "Retro Charger", price: "$49", stock: "In Stock", badge: "" },
    { title: "OP-1 Field", price: "$1,990", stock: "In Stock", badge: "New" },
    { title: "Wireless Headphones", price: "$249", stock: "In Stock", badge: "" },
    { title: "Mixer TX-6", price: "$1,199", stock: "In Stock", badge: "New" },
    { title: "TP-7 Recorder", price: "$1,290", stock: "In Stock", badge: "" },
    { title: "Motion Controller", price: "$199", stock: "In Stock", badge: "New" },
  ];
  const items = ((mainS.items as any[])?.length ? (mainS.items as any[]) : fallbackProducts);
  const productTabs = (mainS.tabs as string[]) || ["All Items", "New Products", "Classic"];

  // Testimonials
  const testimonials = (offerS.testimonials?.items as any[]) || [
    { quote: "The build quality is excellent and the overall experience feels premium. Setup was straightforward.", name: "Ethan Brooks", role: "Director" },
    { quote: "Everything works as expected and feels well put together. Setup was easy and smooth so far.", name: "Ava Mitchell", role: "Creative Director" },
    { quote: "The overall experience feels balanced and well executed. Worked without issues out of the box.", name: "Ethan Walker", role: "Brand Designer" },
    { quote: "Integrates well into an existing setup and doesn't require much adjustment.", name: "Emily Collins", role: "Sound Designer" },
    { quote: "The quality is immediately noticeable and it feels great to use every single day.", name: "James Walker", role: "Music Producer" },
    { quote: "You can tell right away that this is a well-made product. Reliable and thoughtfully designed.", name: "Isabella Reed", role: "Audio Engineer" },
  ];

  // Stats
  const stats = (offerS.stats as any[]) || [
    { value: "120+", label: "Official Partners" },
    { value: "8K+", label: "Community Members" },
    { value: "2.4K+", label: "Orders This Month" },
    { value: "1.9K+", label: "Reviews" },
  ];

  // About
  const aboutHeading = (offerS.about_heading as string) || "Learn More About Us";
  const aboutSub = (offerS.about_sub as string) || "Discover our story, values, and what we stand for.";
  const aboutFeatures = (offerS.about_features as any[]) || [
    { title: "Well-Designed Products", body: "We focus on products where form, function, and thoughtful design come together." },
    { title: "Modern Tech Selection", body: "A curated range of tech products built for everyday use and creative workflows." },
  ];

  // Blogs
  const blogs = (footerS.blogs as any[]) || [
    { title: "Your Tech Setup", excerpt: "Building a setup that works for you starts with clarity, not complexity." },
    { title: "Modern Product Design", excerpt: "Where technology meets intention, simplicity, and long-term value." },
    { title: "About Our Products", excerpt: "Transparent look at the standards, thinking, and philosophy behind products." },
  ];

  // Logo
  const logoHTML = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:24px;width:auto;"/>`
    : `<span style="font-family:${t.fontHeading};font-weight:700;font-size:18px;letter-spacing:-0.01em;color:${t.pageText};">${name}</span>`;

  // ─── Top discount marquee ───
  const taglineHTML = `
  <div style="background:${t.pageText};color:${t.pageBg};font-size:12px;font-weight:500;padding:9px 0;overflow:hidden;border-bottom:1px solid ${t.border};">
    <div class="aema-marquee">
      ${Array(10).fill(`<span style="white-space:nowrap;">${tagline.replace(/USE CODE/i, `<span style="color:${t.accent};font-weight:700;margin-left:8px;">USE CODE</span>`)}</span>`).join("")}
    </div>
  </div>`;

  // ─── Centered nav with pill CTA ───
  const navHTML = `
  <nav style="position:sticky;top:0;z-index:80;background:${t.pageBg};display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:18px 32px;border-bottom:1px solid ${t.border};">
    <div style="justify-self:start;">${logoHTML}</div>
    <div class="aema-nav-links" style="display:flex;gap:8px;align-items:center;background:${t.surfaceBg};border:1px solid ${t.border};padding:6px;border-radius:4px;">
      ${navItems
        .map(
          (n) =>
            `<a href="${navHref(n)}" style="font-size:13px;font-weight:500;color:${t.pageText};padding:6px 14px;border-radius:3px;">${n}</a>`,
        )
        .join("")}
    </div>
    <div style="justify-self:end;">
      <a href="#newsletter" style="display:inline-flex;align-items:center;gap:8px;background:${t.surfaceBg};color:${t.pageText};border:1px solid ${t.border};padding:10px 18px;font-size:13px;font-weight:600;border-radius:4px;">Join Newsletter</a>
    </div>
  </nav>`;

  // ─── Hero: centered headline with two-tone (orange highlight on "The Most") ───
  const heroHTML = `
  <section id="hero" style="padding:90px 32px 56px;background:${t.pageBg};text-align:center;">
    <h1 style="font-family:${t.fontHeading};font-size:clamp(2.4rem,6vw,4.6rem);font-weight:700;line-height:1.02;letter-spacing:-0.025em;color:${t.pageText};max-width:1100px;margin:0 auto 24px;">
      ${headlineLead.split(" ").slice(0, -2).join(" ")} <span style="color:${t.accent};">${headlineLead.split(" ").slice(-2).join(" ")}</span><br/>${headlineTail}
    </h1>
    <p style="font-size:1rem;color:${t.mutedText};max-width:560px;margin:0 auto;line-height:1.55;">${heroSub}</p>
  </section>`;

  // ─── Category tiles: 4-up large image cards ───
  const categoryTilesHTML = `
  <section style="padding:24px 32px 48px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div data-grid="4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
        ${categories
          .slice(0, 4)
          .map(
            (c: any, i: number) => `
          <a href="#products" style="display:block;position:relative;aspect-ratio:3/4;overflow:hidden;background:${t.surfaceBg};border-radius:6px;">
            <img src="${getEshopImage(config, "collection", i)}" alt="${c.title}" style="width:100%;height:100%;object-fit:cover;"/>
            <div style="position:absolute;left:0;right:0;bottom:0;padding:18px 18px;background:linear-gradient(to top, #00000099, transparent);color:#FFFFFF;">
              <h3 style="font-family:${t.fontHeading};font-size:1.15rem;font-weight:600;margin-bottom:2px;">${c.title}</h3>
              <span style="font-size:11px;opacity:0.85;">${c.count || ""}</span>
            </div>
          </a>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── Popular Products eyebrow + tabs ───
  const productsHeaderHTML = `
  <section id="products" style="padding:64px 32px 24px;background:${t.pageBg};text-align:center;">
    <div class="yangu-content-container">
      <p style="display:inline-block;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${t.mutedText};background:${t.surfaceBg};border:1px solid ${t.border};padding:6px 14px;border-radius:3px;margin-bottom:18px;">Popular Products</p>
      <h2 style="font-family:${t.fontHeading};font-size:clamp(1.9rem,4.4vw,3.2rem);font-weight:700;letter-spacing:-0.02em;color:${t.pageText};max-width:900px;margin:0 auto 14px;line-height:1.05;">
        Check Out The <span style="color:${t.accent};">Most Popular</span> Pieces.
      </h2>
      <p style="color:${t.mutedText};max-width:520px;margin:0 auto 28px;">Exploring the tech and design shaping the world of tomorrow.</p>
      <div style="display:inline-flex;gap:6px;background:${t.surfaceBg};border:1px solid ${t.border};padding:5px;border-radius:4px;">
        ${productTabs
          .map(
            (tab, i) => `
          <button style="background:${i === 0 ? t.pageText : "transparent"};color:${i === 0 ? t.pageBg : t.pageText};border:none;cursor:pointer;font-size:13px;font-weight:500;padding:8px 16px;border-radius:3px;">${tab}</button>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── Product grid: 4-col, stock chip + price + optional "New" badge ───
  const productCard = (item: any, idx: number): string => {
    const img = getEshopImage(config, "product", idx);
    return `
    <a href="#" style="display:block;background:${t.cardBg};border:1px solid ${t.border};border-radius:6px;overflow:hidden;color:${t.pageText};">
      <div style="position:relative;aspect-ratio:1/1;background:${t.surfaceBg};">
        <img src="${img}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;"/>
        ${item.badge ? `<span style="position:absolute;top:10px;right:10px;background:${t.accent};color:${t.accentText};font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:4px 9px;border-radius:3px;">${item.badge}</span>` : ""}
      </div>
      <div style="padding:14px 14px 16px;">
        <div style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#0F9D58;background:${t.mood === "dark" ? "#0F9D5820" : "#E8F5E9"};padding:3px 8px;border-radius:3px;margin-bottom:8px;">● ${item.stock || "In Stock"}</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;">
          <span style="font-size:14px;font-weight:600;letter-spacing:-0.01em;">${item.title}</span>
          <span style="font-size:14px;font-weight:700;color:${t.pageText};">${item.price}</span>
        </div>
      </div>
    </a>`;
  };

  const productGridHTML = `
  <section style="padding:8px 32px 80px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div data-grid="4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
        ${items.slice(0, 8).map((p: any, i: number) => productCard(p, i)).join("")}
      </div>
    </div>
  </section>`;

  // ─── Testimonials: 3-col grid of quote cards with avatar + name + role ───
  const testimonialsHTML = `
  <section style="padding:80px 32px;background:${t.surfaceBg};border-top:1px solid ${t.border};border-bottom:1px solid ${t.border};">
    <div class="yangu-content-container" style="text-align:center;">
      <p style="display:inline-block;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${t.mutedText};background:${t.pageBg};border:1px solid ${t.border};padding:6px 14px;border-radius:3px;margin-bottom:18px;">Testimonials</p>
      <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,4vw,2.8rem);font-weight:700;letter-spacing:-0.02em;color:${t.pageText};max-width:780px;margin:0 auto 12px;line-height:1.1;">See what our customers think about us and our products</h2>
      <p style="color:${t.mutedText};margin-bottom:40px;">Read real reviews from people who use our products every day.</p>
      <div data-grid="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;text-align:left;">
        ${testimonials
          .slice(0, 6)
          .map(
            (tm: any, i: number) => `
          <div style="background:${t.cardBg};border:1px solid ${t.border};border-radius:6px;padding:24px;">
            <p style="font-size:14px;line-height:1.6;color:${t.pageText};margin-bottom:24px;min-height:90px;">"${tm.quote}"</p>
            <div style="display:flex;align-items:center;gap:12px;border-top:1px solid ${t.border};padding-top:16px;">
              <div style="width:42px;height:42px;border-radius:50%;overflow:hidden;background:${t.surfaceBg};flex-shrink:0;">
                <img src="${getEshopImage(config, "product", i + 4)}" alt="${tm.name}" style="width:100%;height:100%;object-fit:cover;"/>
              </div>
              <div>
                <div style="font-size:13px;font-weight:600;color:${t.pageText};">${tm.name}</div>
                <div style="font-size:12px;color:${t.mutedText};">${tm.role}</div>
              </div>
            </div>
          </div>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── About + Stats ───
  const aboutStatsHTML = `
  <section id="about" style="padding:80px 32px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div data-grid="2" style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:64px;">
        <div style="aspect-ratio:4/5;overflow:hidden;border-radius:8px;background:${t.surfaceBg};">
          <img src="${getEshopImage(config, "hero", 1)}" alt="${aboutHeading}" style="width:100%;height:100%;object-fit:cover;"/>
        </div>
        <div>
          <p style="display:inline-block;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${t.mutedText};background:${t.surfaceBg};border:1px solid ${t.border};padding:6px 14px;border-radius:3px;margin-bottom:18px;">About Us</p>
          <h2 style="font-family:${t.fontHeading};font-size:clamp(1.9rem,4vw,3rem);font-weight:700;letter-spacing:-0.02em;color:${t.pageText};margin-bottom:14px;line-height:1.05;">${aboutHeading}</h2>
          <p style="color:${t.mutedText};margin-bottom:28px;">${aboutSub}</p>
          <div style="display:flex;flex-direction:column;gap:18px;">
            ${aboutFeatures
              .map(
                (f: any) => `
              <div style="background:${t.surfaceBg};border:1px solid ${t.border};border-radius:6px;padding:18px;">
                <h4 style="font-size:14px;font-weight:600;color:${t.pageText};margin-bottom:6px;">${f.title}</h4>
                <p style="font-size:13px;color:${t.mutedText};line-height:1.5;">${f.body}</p>
              </div>`,
              )
              .join("")}
          </div>
          <a href="#" style="display:inline-block;margin-top:24px;background:${t.pageText};color:${t.pageBg};padding:11px 22px;font-size:13px;font-weight:600;border-radius:4px;">More About Us</a>
        </div>
      </div>
      <div data-grid="4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
        ${stats
          .slice(0, 4)
          .map(
            (st: any) => `
          <div style="background:${t.surfaceBg};border:1px solid ${t.border};border-radius:6px;padding:28px 20px;text-align:center;">
            <div style="font-family:${t.fontHeading};font-size:clamp(2rem,3.4vw,2.8rem);font-weight:700;color:${t.pageText};letter-spacing:-0.02em;line-height:1;">${st.value}</div>
            <div style="font-size:12px;color:${t.mutedText};margin-top:8px;letter-spacing:0.04em;">${st.label}</div>
          </div>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── Blogs ───
  const blogsHTML = `
  <section style="padding:80px 32px;background:${t.surfaceBg};border-top:1px solid ${t.border};">
    <div class="yangu-content-container" style="text-align:center;">
      <p style="display:inline-block;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${t.mutedText};background:${t.pageBg};border:1px solid ${t.border};padding:6px 14px;border-radius:3px;margin-bottom:18px;">Blogs</p>
      <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem,4vw,2.6rem);font-weight:700;letter-spacing:-0.02em;color:${t.pageText};margin-bottom:10px;">Check out our blogs</h2>
      <p style="color:${t.mutedText};margin-bottom:36px;">Explore stories, tips, and insights that matter.</p>
      <div data-grid="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;text-align:left;">
        ${blogs
          .slice(0, 3)
          .map(
            (b: any, i: number) => `
          <a href="#" style="display:block;background:${t.cardBg};border:1px solid ${t.border};border-radius:6px;overflow:hidden;color:${t.pageText};">
            <div style="aspect-ratio:16/10;background:${t.pageBg};overflow:hidden;">
              <img src="${getEshopImage(config, "collection", i + 1)}" alt="${b.title}" style="width:100%;height:100%;object-fit:cover;"/>
            </div>
            <div style="padding:18px;">
              <h4 style="font-size:15px;font-weight:600;color:${t.pageText};margin-bottom:6px;">${b.title}</h4>
              <p style="font-size:13px;color:${t.mutedText};line-height:1.5;">${b.excerpt}</p>
            </div>
          </a>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── Newsletter footer ───
  const footerHTML = `
  <footer id="newsletter" style="padding:90px 32px 36px;background:${t.pageText};color:${t.pageBg};text-align:center;">
    <div class="yangu-content-container">
      <p style="display:inline-block;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7;border:1px solid ${t.pageBg}33;padding:6px 14px;border-radius:3px;margin-bottom:18px;">Get Notified</p>
      <h2 style="font-family:${t.fontHeading};font-size:clamp(2rem,4.6vw,3.2rem);font-weight:700;letter-spacing:-0.02em;margin-bottom:10px;line-height:1.05;">Join our Newsletter</h2>
      <p style="opacity:0.75;margin-bottom:28px;">Get notified about new updates and exclusive offers.</p>
      <form style="display:flex;gap:10px;max-width:460px;margin:0 auto 56px;flex-wrap:wrap;justify-content:center;" onsubmit="event.preventDefault();">
        <input type="email" placeholder="Email" style="flex:1;min-width:220px;background:transparent;border:1px solid ${t.pageBg}33;color:${t.pageBg};padding:12px 16px;font-size:14px;border-radius:4px;outline:none;"/>
        <button type="submit" style="background:${t.accent};color:${t.accentText};border:none;cursor:pointer;padding:12px 24px;font-size:14px;font-weight:600;border-radius:4px;">Submit</button>
      </form>
      <p style="font-size:12px;opacity:0.5;letter-spacing:0.06em;">${footerS.copyright || `© ${new Date().getFullYear()} ${name} — All rights reserved.`}</p>
    </div>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${eshopBaseStyles(t.pageBg, t.pageText, t.accent)}</style></head><body>
${taglineHTML}
${navHTML}
${heroHTML}
${categoryTilesHTML}
${productsHeaderHTML}
${productGridHTML}
${testimonialsHTML}
${aboutStatsHTML}
${blogsHTML}
${footerHTML}
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// KANVA — Natural skincare / single-brand beauty store
// Reference: https://kanva-template.framer.website
// Structure: minimal nav (Shop / Collections / About / Blog / Contact) with center wordmark
//            → fullscreen serif-italic hero (Natural Skincare) over portrait image
//            → 4-up feature highlights (Natural Formula / Cruelty-Free / Expert Approved / Free Shipping)
//            → playful headline row "Refresh your skin, love yourself, renew your glow." with inline ingredient images
//            → cleansers tab strip + 3-up product cards with % OFF chip + price
//            → "Eco-Friendly, Skin-Friendly" 2-up split (text + bottle image)
//            → "Why Your Skin Deserves the Best" rating + 2x2 feature cards (Proven Effectiveness / Eco-Friendly Packaging / 100% Natural / testimonial)
//            → 2-up product (Daily Flow / Glow Milk) with discount chip
//            → newsletter band + Instagram 4-up grid
// ═══════════════════════════════════════════════════════════════════

interface KanvaTheme {
  pageBg: string;
  pageText: string;
  mutedText: string;
  accent: string;
  accentText: string;
  cardBg: string;
  surfaceBg: string;
  border: string;
  fontHeading: string;
  fontBody: string;
  /** "cream" = default beige skincare, "sage" = green natural, "blush" = pink soft luxury */
  mood: "cream" | "sage" | "blush";
}

const KANVA_VARIANTS: KanvaTheme[] = [
  // Variant 0 — Cream (signature Kanva: warm beige + cream + soft brown)
  {
    pageBg: "#E8E1D5",
    surfaceBg: "#F2EDE3",
    pageText: "#2A241C",
    mutedText: "#6B6155",
    accent: "#3F3528",
    accentText: "#F2EDE3",
    cardBg: "#F7F2E9",
    border: "#D8CFBE",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    mood: "cream",
  },
  // Variant 1 — Sage (eco-natural green palette)
  {
    pageBg: "#E5E8DD",
    surfaceBg: "#EFF1E7",
    pageText: "#1F2A1B",
    mutedText: "#5D6A55",
    accent: "#3C5234",
    accentText: "#EFF1E7",
    cardBg: "#F4F6EE",
    border: "#CFD6BF",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    mood: "sage",
  },
  // Variant 2 — Blush (soft pink luxury)
  {
    pageBg: "#F1E4DE",
    surfaceBg: "#F8EDE7",
    pageText: "#2C1F1B",
    mutedText: "#7A5A52",
    accent: "#8A4A3A",
    accentText: "#F8EDE7",
    cardBg: "#FBF3EF",
    border: "#E5CFC5",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    mood: "blush",
  },
];

export function renderKanva(ctx: EshopRenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as Record<string, any>;
  const headerS = (s.header?.schema || {}) as Record<string, any>;
  const mainS = (s.main_content?.schema || {}) as Record<string, any>;
  const offerS = (s.offer?.schema || {}) as Record<string, any>;
  const footerS = (s.footer?.schema || {}) as Record<string, any>;

  const t = { ...KANVA_VARIANTS[variantIndex] || KANVA_VARIANTS[0] };
  if (config.userBrandColors?.[0]) {
    t.accent = config.userBrandColors[0];
  }

  const name = config.businessName || "kanva";
  const navItems = (headerS.nav_items as string[]) || ["Shop", "Collections", "About", "Blog", "Contact"];
  const headlineLead = (heroS.headline as string) || "Natural";
  const headlineTail = (heroS.headline_tail as string) || "Skincare";
  const heroSub = (heroS.subheadline as string) || "Start your day with gentle care and nourishing ingredients designed to awaken your skin naturally.";
  const ctaText = (heroS.cta_text as string) || "Shop Now";
  const heroImg = getEshopImage(config, "hero", variantIndex);

  // Features
  const features = (mainS.features as any[]) || [
    { title: "Natural Formula", body: "Crafted with pure, skin-loving ingredients for ultimate care." },
    { title: "Cruelty-Free", body: "Our products are never tested on animals, guaranteed ethical." },
    { title: "Expert Approved", body: "Carefully tested to ensure safety and visible results." },
    { title: "Free Shipping", body: "Delivered to your doorstep with no extra costs worldwide." },
  ];

  // Headline marquee row words
  const ritualLead = (offerS.ritual_lead as string) || "Refresh your skin,";
  const ritualMid = (offerS.ritual_mid as string) || "love yourself,";
  const ritualTail = (offerS.ritual_tail as string) || "renew your glow.";

  // Product tabs + cleansers
  const productTabs = (mainS.tabs as string[]) || ["Cleansers", "Lotions", "Moisturizers"];
  const fallbackProducts = [
    { title: "Gentle Wash", category: "Cleansers", price: "7,90 €", original_price: "18,90 €", badge: "58% OFF" },
    { title: "Clay Clean", category: "Cleansers", price: "8,90 €", badge: "" },
    { title: "Citrus Foam", category: "Cleansers", price: "8,90 €", badge: "" },
  ];
  const items = ((mainS.items as any[])?.length ? (mainS.items as any[]) : fallbackProducts);

  // Eco-Friendly section bullet points
  const ecoBullets = (offerS.eco_bullets as string[]) || ["No Harsh Chemicals", "Plant-Based Goodness", "Ethically Sourced"];

  // "Why Your Skin Deserves the Best" — 2x2 cards
  const whyHeading = (offerS.why_heading as string) || "Why Your Skin";
  const whyHeadingTail = (offerS.why_heading_tail as string) || "Deserves the Best";
  const whyRating = (offerS.why_rating as string) || "4.7";
  const whyReviewCount = (offerS.why_review_count as string) || "1,109 reviews";
  const whyCards = (offerS.why_cards as any[]) || [
    { eyebrow: "Proven Effectiveness", body: "Every product is carefully crafted to meet the highest quality standards." },
    { eyebrow: "Eco-Friendly Packaging", body: "Eco-friendly materials designed to care for the planet as much as your skin." },
    { eyebrow: "100% Natural · 100% You", body: "No Harsh Chemicals · Plant-Based Goodness · Ethically Sourced", isBullets: true },
    { eyebrow: "From Jennifer K.", body: "It feels healthier, smoother & more radiant than ever. I love knowing I'm using something natural and effective!", isQuote: true },
  ];

  // Featured 2-up products at bottom
  const featuredPair = (offerS.featured_pair as any[]) || [
    { title: "Daily Flow", category: "Lotions", price: "7,90 €", badge: "66% OFF" },
    { title: "Glow Milk", category: "Lotions", price: "9,90 €", badge: "57% OFF" },
  ];

  // Instagram
  const igHandle = (footerS.ig_handle as string) || `@${name.toLowerCase().replace(/\s+/g, "")}`;

  // ─── Logo: parenthesized wordmark like "(kanva)" ───
  const logoHTML = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:24px;width:auto;"/>`
    : `<span style="font-family:${t.fontHeading};font-style:italic;font-weight:500;font-size:22px;color:${t.pageText};letter-spacing:-0.01em;">(${name.toLowerCase()})</span>`;

  // ─── Sticky pill nav ───
  const navHTML = `
  <nav style="position:sticky;top:16px;z-index:80;margin:16px 24px 0;padding:14px 24px;background:${t.surfaceBg}f5;backdrop-filter:blur(10px);border:1px solid ${t.border};border-radius:6px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;">
    <div class="aema-nav-links" style="justify-self:start;display:flex;gap:24px;align-items:center;">
      ${navItems
        .slice(0, 3)
        .map((n) => `<a href="${navHref(n)}" style="font-size:13px;font-weight:500;color:${t.pageText};">${n}</a>`)
        .join("")}
    </div>
    <div style="justify-self:center;">${logoHTML}</div>
    <div class="aema-nav-links" style="justify-self:end;display:flex;gap:18px;align-items:center;font-size:13px;color:${t.pageText};">
      ${navItems
        .slice(3)
        .map((n) => `<a href="${navHref(n)}" style="font-weight:500;color:${t.pageText};">${n}</a>`)
        .join("")}
      <a href="#products" aria-label="Search" style="opacity:0.85;">⌕</a>
      <a href="#cart" aria-label="Cart" style="opacity:0.85;">⛬ 0</a>
    </div>
  </nav>`;

  // ─── Hero: portrait image with serif-italic two-line headline overlay ───
  const heroHTML = `
  <section id="hero" style="position:relative;margin:16px 24px 0;border-radius:6px;overflow:hidden;min-height:78vh;display:flex;align-items:flex-end;background:${t.surfaceBg};">
    <img src="${heroImg}" alt="${headlineLead} ${headlineTail}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"/>
    <div style="position:relative;z-index:2;width:100%;padding:60px 56px;color:${t.surfaceBg};background:linear-gradient(to top, ${t.pageText}80, transparent 60%);">
      <h1 style="font-family:${t.fontHeading};font-weight:400;line-height:0.95;letter-spacing:-0.02em;margin-bottom:24px;">
        <span style="display:block;font-size:clamp(3rem,9vw,7rem);font-style:normal;">${headlineLead}</span>
        <span style="display:block;font-size:clamp(3rem,9vw,7rem);font-style:italic;opacity:0.92;margin-left:clamp(20px,6vw,80px);">${headlineTail}</span>
      </h1>
      <p style="font-size:0.95rem;line-height:1.55;max-width:420px;margin-bottom:24px;opacity:0.92;">${heroSub}</p>
      <a href="#products" style="display:inline-block;font-size:13px;font-weight:500;letter-spacing:0.04em;color:${t.surfaceBg};border-bottom:1px solid ${t.surfaceBg};padding-bottom:4px;">${ctaText}</a>
    </div>
  </section>`;

  // ─── 4-up feature highlights ───
  const featuresHTML = `
  <section style="padding:72px 32px 32px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div data-grid="4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px;">
        ${features
          .slice(0, 4)
          .map(
            (f: any, i: number) => `
          <div style="text-align:left;padding-right:12px;${i < 3 ? `border-right:1px solid ${t.border};` : ""}">
            <div style="width:32px;height:32px;border-radius:50%;background:${t.accent};color:${t.accentText};display:flex;align-items:center;justify-content:center;font-size:14px;margin-bottom:14px;">✦</div>
            <h4 style="font-family:${t.fontHeading};font-size:1.1rem;font-weight:500;color:${t.pageText};margin-bottom:6px;">${f.title}</h4>
            <p style="font-size:13px;color:${t.mutedText};line-height:1.55;">${f.body}</p>
          </div>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── Playful headline row with inline ingredient images ───
  const ritualHTML = `
  <section style="padding:64px 32px;background:${t.pageBg};text-align:center;">
    <div class="yangu-content-container">
      <h2 style="font-family:${t.fontHeading};font-style:italic;font-weight:400;font-size:clamp(2rem,5.5vw,4rem);line-height:1.05;letter-spacing:-0.02em;color:${t.pageText};">
        ${ritualLead}
        <span style="display:inline-block;width:clamp(48px,7vw,90px);height:clamp(48px,7vw,90px);border-radius:50%;overflow:hidden;vertical-align:middle;margin:0 8px;">
          <img src="${getEshopImage(config, "product", 1)}" alt="" style="width:100%;height:100%;object-fit:cover;"/>
        </span>
        ${ritualMid}
        <span style="display:inline-block;width:clamp(48px,7vw,90px);height:clamp(48px,7vw,90px);border-radius:50%;overflow:hidden;vertical-align:middle;margin:0 8px;">
          <img src="${getEshopImage(config, "product", 2)}" alt="" style="width:100%;height:100%;object-fit:cover;"/>
        </span>
        ${ritualTail}
      </h2>
    </div>
  </section>`;

  // ─── Cleansers tab strip + 3-up product cards ───
  const productCard = (item: any, idx: number): string => {
    const imgA = getEshopImage(config, "product", idx + 3);
    const imgB = getEshopImage(config, "product", idx + 6);
    return `
    <a href="#" class="aema-card" style="display:block;background:${t.cardBg};border:1px solid ${t.border};border-radius:6px;overflow:hidden;color:${t.pageText};">
      <div style="position:relative;aspect-ratio:1/1;background:${t.surfaceBg};">
        <img src="${imgA}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;"/>
        <img class="aema-card-img-alt" src="${imgB}" alt="" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;opacity:0;"/>
        ${item.badge ? `<span style="position:absolute;top:12px;left:12px;background:${t.pageText};color:${t.surfaceBg};font-size:10px;font-weight:600;letter-spacing:0.08em;padding:5px 10px;border-radius:3px;">${item.badge}</span>` : ""}
      </div>
      <div style="padding:18px;">
        ${item.category ? `<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${t.mutedText};margin-bottom:6px;">${item.category}</div>` : ""}
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;">
          <span style="font-family:${t.fontHeading};font-size:18px;font-weight:500;color:${t.pageText};">${item.title}</span>
          <span style="font-size:14px;font-weight:600;color:${t.pageText};">
            ${item.price}
            ${item.original_price ? `<span style="display:block;font-size:11px;color:${t.mutedText};text-decoration:line-through;font-weight:400;text-align:right;">${item.original_price}</span>` : ""}
          </span>
        </div>
      </div>
    </a>`;
  };

  const productsHTML = `
  <section id="products" style="padding:24px 32px 80px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:32px;background:${t.surfaceBg};border:1px solid ${t.border};padding:6px;border-radius:6px;width:fit-content;margin-left:auto;margin-right:auto;">
        ${productTabs
          .map(
            (tab, i) => `
          <button style="background:${i === 0 ? t.pageText : "transparent"};color:${i === 0 ? t.surfaceBg : t.pageText};border:none;cursor:pointer;font-size:13px;font-weight:500;padding:8px 18px;border-radius:4px;font-family:${t.fontBody};">${tab}</button>`,
          )
          .join("")}
      </div>
      <div data-grid="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:32px;">
        ${items.slice(0, 3).map((p: any, i: number) => productCard(p, i)).join("")}
      </div>
      <div style="text-align:center;">
        <a href="#" style="display:inline-block;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;color:${t.pageText};border-bottom:1px solid ${t.pageText};padding-bottom:4px;">Shop ${productTabs[0] || "Cleansers"}</a>
      </div>
    </div>
  </section>`;

  // ─── Eco-Friendly, Skin-Friendly split ───
  const ecoHTML = `
  <section style="padding:32px;background:${t.pageBg};">
    <div class="yangu-content-container" data-grid="2" style="display:grid;grid-template-columns:1.05fr 1fr;gap:24px;align-items:stretch;">
      <div style="background:${t.accent};color:${t.accentText};border-radius:8px;padding:56px 48px;display:flex;flex-direction:column;justify-content:space-between;">
        <h2 style="font-family:${t.fontHeading};font-weight:400;font-size:clamp(2rem,4.4vw,3.4rem);line-height:1.0;letter-spacing:-0.02em;">
          <span style="display:block;">Eco-Friendly,</span>
          <span style="display:block;font-style:italic;opacity:0.9;">Skin-Friendly</span>
        </h2>
        <div style="margin-top:32px;">
          <p style="font-size:14px;line-height:1.6;opacity:0.85;margin-bottom:24px;max-width:420px;">100% natural means every ingredient is carefully selected from nature to provide safe, effective, and gentle care for your skin.</p>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;">
            ${ecoBullets
              .map(
                (b) =>
                  `<li style="display:flex;align-items:center;gap:10px;font-size:13px;letter-spacing:0.04em;"><span style="width:18px;height:1px;background:${t.accentText};opacity:0.6;"></span>${b}</li>`,
              )
              .join("")}
          </ul>
        </div>
      </div>
      <div style="border-radius:8px;overflow:hidden;background:${t.surfaceBg};">
        <img src="${getEshopImage(config, "collection", 0)}" alt="Eco friendly" style="width:100%;height:100%;object-fit:cover;min-height:380px;"/>
      </div>
    </div>
  </section>`;

  // ─── Why Your Skin Deserves the Best ───
  const whyHTML = `
  <section style="padding:80px 32px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:24px;margin-bottom:36px;">
        <h2 style="font-family:${t.fontHeading};font-weight:400;font-size:clamp(2rem,4.4vw,3.4rem);line-height:1.0;letter-spacing:-0.02em;color:${t.pageText};max-width:680px;">
          <span style="display:block;">${whyHeading}</span>
          <span style="display:block;font-style:italic;">${whyHeadingTail}</span>
        </h2>
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="display:flex;">
            ${[0, 1, 2]
              .map(
                (i) =>
                  `<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid ${t.pageBg};margin-left:${i === 0 ? "0" : "-10px"};background:${t.surfaceBg};"><img src="${getEshopImage(config, "product", i + 5)}" alt="" style="width:100%;height:100%;object-fit:cover;"/></div>`,
              )
              .join("")}
          </div>
          <div style="font-size:13px;color:${t.pageText};line-height:1.3;">
            <div style="font-weight:600;">${whyRating} <span style="color:${t.accent};">★★★★★</span></div>
            <div style="color:${t.mutedText};font-size:12px;">(${whyReviewCount})</div>
          </div>
        </div>
      </div>
      <div data-grid="2" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
        ${whyCards
          .slice(0, 4)
          .map((c: any, i: number) => {
            const isImage = i === 0 || i === 2;
            const bgImg = i === 0 ? getEshopImage(config, "hero", 2) : i === 2 ? getEshopImage(config, "collection", 1) : null;
            if (bgImg) {
              return `
              <div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:5/4;background:${t.surfaceBg};">
                <img src="${bgImg}" alt="${c.eyebrow}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"/>
                <div style="position:absolute;inset:0;background:linear-gradient(to top, ${t.pageText}b3, transparent 55%);"></div>
                <div style="position:absolute;left:0;right:0;bottom:0;padding:28px;color:${t.surfaceBg};">
                  <h4 style="font-family:${t.fontHeading};font-size:1.4rem;font-weight:500;margin-bottom:6px;line-height:1.1;"><span style="display:block;">${c.eyebrow.split("·")[0]?.trim()}</span>${c.eyebrow.includes("·") ? `<span style="display:block;font-style:italic;opacity:0.92;">${c.eyebrow.split("·")[1].trim()}</span>` : ""}</h4>
                  <p style="font-size:13px;line-height:1.55;opacity:0.9;max-width:340px;">${c.body}</p>
                </div>
              </div>`;
            }
            if (c.isQuote) {
              return `
              <div style="background:${t.cardBg};border:1px solid ${t.border};border-radius:8px;padding:32px;display:flex;flex-direction:column;justify-content:space-between;aspect-ratio:5/4;">
                <p style="font-family:${t.fontHeading};font-size:1.25rem;font-weight:400;line-height:1.35;color:${t.pageText};font-style:italic;">"${c.body}"</p>
                <div style="display:flex;align-items:center;gap:12px;margin-top:20px;">
                  <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;background:${t.surfaceBg};"><img src="${getEshopImage(config, "product", 7)}" alt="" style="width:100%;height:100%;object-fit:cover;"/></div>
                  <div>
                    <div style="font-size:13px;font-weight:600;color:${t.pageText};">${c.eyebrow.replace(/^From\s+/i, "")}</div>
                    <div style="font-size:12px;color:${t.mutedText};">Verified Buyer</div>
                  </div>
                </div>
              </div>`;
            }
            // bullet card
            return `
            <div style="background:${t.cardBg};border:1px solid ${t.border};border-radius:8px;padding:32px;display:flex;flex-direction:column;justify-content:center;aspect-ratio:5/4;">
              <h4 style="font-family:${t.fontHeading};font-size:1.4rem;font-weight:500;color:${t.pageText};margin-bottom:18px;line-height:1.1;"><span style="display:block;">${c.eyebrow.split("·")[0]?.trim()}</span>${c.eyebrow.includes("·") ? `<span style="display:block;font-style:italic;">${c.eyebrow.split("·")[1].trim()}</span>` : ""}</h4>
              <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;">
                ${c.body.split("·").map((b: string) => `<li style="display:flex;align-items:center;gap:10px;font-size:13px;color:${t.pageText};"><span style="width:18px;height:1px;background:${t.pageText};opacity:0.4;"></span>${b.trim()}</li>`).join("")}
              </ul>
            </div>`;
          })
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── Featured 2-up product pair ───
  const featuredPairHTML = `
  <section style="padding:24px 32px 64px;background:${t.pageBg};">
    <div class="yangu-content-container" data-grid="2" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
      ${featuredPair
        .slice(0, 2)
        .map(
          (p: any, i: number) => `
        <a href="#" style="display:block;background:${t.cardBg};border:1px solid ${t.border};border-radius:8px;overflow:hidden;color:${t.pageText};">
          <div style="position:relative;aspect-ratio:4/3;background:${t.surfaceBg};">
            <img src="${getEshopImage(config, "product", i)}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;"/>
            ${p.badge ? `<span style="position:absolute;top:14px;left:14px;background:${t.pageText};color:${t.surfaceBg};font-size:10px;font-weight:600;letter-spacing:0.08em;padding:5px 10px;border-radius:3px;">${p.badge}</span>` : ""}
          </div>
          <div style="padding:20px 22px;display:flex;justify-content:space-between;align-items:baseline;">
            <div>
              ${p.category ? `<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${t.mutedText};margin-bottom:6px;">${p.category}</div>` : ""}
              <span style="font-family:${t.fontHeading};font-size:20px;font-weight:500;color:${t.pageText};">${p.title}</span>
            </div>
            <span style="font-size:15px;font-weight:600;color:${t.pageText};">${p.price}</span>
          </div>
        </a>`,
        )
        .join("")}
    </div>
  </section>`;

  // ─── Newsletter band ───
  const newsletterHTML = `
  <section id="newsletter" style="padding:64px 32px;background:${t.pageBg};text-align:center;border-top:1px solid ${t.border};">
    <div class="yangu-content-container">
      <h2 style="font-family:${t.fontHeading};font-weight:400;font-size:clamp(2rem,4.4vw,3rem);line-height:1.05;letter-spacing:-0.02em;color:${t.pageText};margin-bottom:8px;">
        <span style="display:block;">Stay Updated,</span>
        <span style="display:block;font-style:italic;">Stay Radiant</span>
      </h2>
      <p style="font-size:14px;color:${t.mutedText};margin-bottom:28px;">Be the first to know about new products, offers, and skincare tips.</p>
      <form style="display:flex;gap:8px;max-width:440px;margin:0 auto;flex-wrap:wrap;justify-content:center;" onsubmit="event.preventDefault();">
        <input type="email" placeholder="Email" style="flex:1;min-width:220px;background:${t.surfaceBg};border:1px solid ${t.border};color:${t.pageText};padding:12px 16px;font-size:14px;border-radius:4px;outline:none;font-family:${t.fontBody};"/>
        <button type="submit" style="background:${t.accent};color:${t.accentText};border:none;cursor:pointer;padding:12px 24px;font-size:14px;font-weight:600;border-radius:4px;font-family:${t.fontBody};">Subscribe</button>
      </form>
    </div>
  </section>`;

  // ─── Instagram 4-up ───
  const igHTML = `
  <section style="padding:64px 32px;background:${t.pageBg};">
    <div class="yangu-content-container" style="text-align:center;">
      <h3 style="font-family:${t.fontHeading};font-weight:400;font-size:clamp(1.6rem,3.2vw,2.4rem);color:${t.pageText};margin-bottom:8px;"><span style="font-style:italic;">Follow On</span> Instagram</h3>
      <p style="font-size:13px;color:${t.mutedText};margin-bottom:28px;">${igHandle}</p>
      <div data-grid="4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
        ${[0, 1, 2, 3]
          .map(
            (i) => `
          <a href="#" style="display:block;position:relative;aspect-ratio:1/1;overflow:hidden;border-radius:6px;background:${t.surfaceBg};">
            <img src="${getEshopImage(config, "product", i + 2)}" alt="" style="width:100%;height:100%;object-fit:cover;"/>
          </a>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  // ─── Footer ───
  const footerCols = (footerS.columns as any[]) || [
    { title: "Shop", links: ["All Products", "Cleansers", "Lotions", "Moisturizers"] },
    { title: "Company", links: ["About", "Blog", "Contact"] },
    { title: "Help", links: ["Shipping", "Returns", "FAQ"] },
  ];
  const footerHTML = `
  <footer id="footer" style="padding:64px 32px 28px;background:${t.surfaceBg};color:${t.pageText};border-top:1px solid ${t.border};">
    <div class="yangu-content-container" data-grid="2" style="display:grid;grid-template-columns:1.2fr 2fr;gap:48px;align-items:start;margin-bottom:48px;">
      <div>
        <div style="font-family:${t.fontHeading};font-style:italic;font-weight:500;font-size:28px;color:${t.pageText};margin-bottom:12px;">(${name.toLowerCase()})</div>
        <p style="font-size:13px;color:${t.mutedText};line-height:1.6;max-width:320px;">${footerS.tagline || heroSub}</p>
      </div>
      <div data-grid="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
        ${footerCols
          .map(
            (col: any) => `
          <div>
            <h4 style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:600;color:${t.pageText};margin-bottom:14px;">${col.title}</h4>
            ${(col.links as string[]).map((l: string) => `<p style="font-size:13px;color:${t.mutedText};margin-bottom:8px;">${l}</p>`).join("")}
          </div>`,
          )
          .join("")}
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:${t.mutedText};letter-spacing:0.06em;border-top:1px solid ${t.border};padding-top:24px;">${footerS.copyright || `© ${new Date().getFullYear()} ${name} — All rights reserved.`}</p>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${eshopBaseStyles(t.pageBg, t.pageText, t.accent)}</style></head><body>
${navHTML}
${heroHTML}
${featuresHTML}
${ritualHTML}
${productsHTML}
${ecoHTML}
${whyHTML}
${featuredPairHTML}
${newsletterHTML}
${igHTML}
${footerHTML}
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// MINNA — Editorial fashion store (centered serif wordmark)
// Reference: https://minna.framer.website
// Structure:  fixed nav (hamburger + Women/Men · centered MINNA wordmark · search + cart)
//             → full-bleed edge-to-edge hero image
//             → bright marquee strip (NEW SEASON * %20 DISCOUNT *)
//             → "Products" heading + "See all" link
//             → 4-column minimal product grid (image · title · price)
//             → 2-up collection blocks
//             → minimal centered footer
// ═══════════════════════════════════════════════════════════════════

interface MinnaTheme {
  pageBg: string;
  pageText: string;
  mutedText: string;
  marqueeBg: string;
  marqueeText: string;
  border: string;
  cardBg: string;
  fontHeading: string;
  fontBody: string;
  /** "bright" = signature yellow marquee, "mono" = black/white, "warm" = beige */
  mood: "bright" | "mono" | "warm";
}

const MINNA_VARIANTS: MinnaTheme[] = [
  // Variant 0 — Signature MINNA (white + bright yellow marquee + serif wordmark)
  {
    pageBg: "#FFFFFF",
    pageText: "#0A0A0A",
    mutedText: "#6B6B6B",
    marqueeBg: "#F5E94A",
    marqueeText: "#0A0A0A",
    border: "#EDEDED",
    cardBg: "#F7F7F5",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    mood: "bright",
  },
  // Variant 1 — Mono editorial (white + black marquee + white text)
  {
    pageBg: "#FFFFFF",
    pageText: "#0A0A0A",
    mutedText: "#6B6B6B",
    marqueeBg: "#0A0A0A",
    marqueeText: "#FFFFFF",
    border: "#E5E5E5",
    cardBg: "#F4F4F2",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    mood: "mono",
  },
  // Variant 2 — Warm beige editorial
  {
    pageBg: "#F4EFE7",
    pageText: "#1A140E",
    mutedText: "#6B5E50",
    marqueeBg: "#D9C57A",
    marqueeText: "#1A140E",
    border: "#E2D9C8",
    cardBg: "#FBF7EE",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    mood: "warm",
  },
];

export function renderMinna(ctx: EshopRenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const heroS = (s.hero?.schema || {}) as Record<string, any>;
  const headerS = (s.header?.schema || {}) as Record<string, any>;
  const mainS = (s.main_content?.schema || {}) as Record<string, any>;
  const offerS = (s.offer?.schema || {}) as Record<string, any>;
  const footerS = (s.footer?.schema || {}) as Record<string, any>;

  const t = { ...MINNA_VARIANTS[variantIndex] || MINNA_VARIANTS[0] };
  if (config.userBrandColors?.[0]) {
    t.marqueeBg = config.userBrandColors[0];
  }

  const name = config.businessName || "MINNA";
  const wordmark = name.toUpperCase();
  const logoHTML = config.userLogoUrl
    ? `<img src="${config.userLogoUrl}" alt="${name}" style="height:32px;width:auto;object-fit:contain;display:block;"/>`
    : `<span style="font-family:${t.fontHeading};font-size:24px;letter-spacing:0.32em;font-weight:500;color:${t.pageText};white-space:nowrap;">${wordmark}</span>`;
  const navLeft = (headerS.nav_left as string[]) || ["Women", "Men"];
  const heroImg = getEshopImage(config, "hero", variantIndex);
  const marqueeWords = (heroS.marquee_words as string[]) || ["%20 DISCOUNT", "NEW SEASON", "%20 DISCOUNT", "NEW SEASON", "%20 DISCOUNT", "NEW SEASON"];

  // Products
  const productsHeading = (mainS.heading as string) || "Products";
  const productsCta = (mainS.cta_text as string) || "See all";
  const fallbackProducts = [
    { title: "Pink Bucket Hat & Jacket", price: "$78" },
    { title: "Yellow Sunglasses Look", price: "$92" },
    { title: "Pink Sunglasses Editorial", price: "$108" },
    { title: "Soft Curls Beauty", price: "$64" },
  ];
  const products = ((mainS.items as any[])?.length ? (mainS.items as any[]) : fallbackProducts).slice(0, 8);

  // Collections (2-up blocks)
  const collections = (offerS.collections as any[]) || [
    { title: "Women", subtitle: "New Season", image: "" },
    { title: "Men", subtitle: "Essentials", image: "" },
  ];

  // ─── Header (hamburger + nav left · centered wordmark · search + cart right) ───
  const navHTML = `
  <header style="position:sticky;top:0;z-index:50;background:${t.pageBg};border-bottom:1px solid ${t.border};">
    <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:18px 32px;gap:24px;">
      <div style="display:flex;align-items:center;gap:24px;">
        <button aria-label="Menu" style="background:none;border:none;cursor:pointer;padding:6px;color:${t.pageText};">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        ${navLeft.map((l) => `<a href="${navHref(l)}" style="font-size:13px;letter-spacing:0.04em;color:${t.pageText};font-weight:500;">${l}</a>`).join("")}
      </div>
      <a href="#hero" style="font-family:${t.fontHeading};font-size:24px;letter-spacing:0.32em;font-weight:500;color:${t.pageText};white-space:nowrap;">${wordmark}</a>
      <div style="display:flex;align-items:center;gap:18px;justify-content:flex-end;">
        <button aria-label="Search" style="background:none;border:none;cursor:pointer;padding:6px;color:${t.pageText};">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button aria-label="Cart" data-yangu-cart style="background:none;border:none;cursor:pointer;padding:6px;color:${t.pageText};">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </button>
      </div>
    </div>
  </header>`;

  // ─── Full-bleed hero image ───
  const heroHTML = `
  <section id="hero" style="background:${t.pageBg};">
    <div style="width:100%;aspect-ratio:16/9;overflow:hidden;background:${t.cardBg};">
      <img src="${heroImg}" alt="${name} hero" style="width:100%;height:100%;object-fit:cover;display:block;"/>
    </div>
  </section>`;

  // ─── Marquee strip ───
  const marqueeItems = [...marqueeWords, ...marqueeWords].map(
    (w) => `<span style="display:inline-flex;align-items:center;gap:32px;font-size:13px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${t.marqueeText};">${w}<span style="font-size:18px;">*</span></span>`
  ).join("");
  const marqueeHTML = `
  <div style="background:${t.marqueeBg};color:${t.marqueeText};overflow:hidden;padding:14px 0;border-bottom:1px solid ${t.border};">
    <div class="aema-marquee" style="white-space:nowrap;gap:32px;">
      ${marqueeItems}
    </div>
  </div>`;

  // ─── Products section ───
  const productCards = products.map((p: any, i: number) => {
    const img = getEshopImage(config, "product", i);
    return `
    <a href="#" class="aema-card" style="display:block;color:${t.pageText};">
      <div style="aspect-ratio:3/4;overflow:hidden;background:${t.cardBg};margin-bottom:12px;">
        <img src="${img}" alt="${p.title || ""}" style="width:100%;height:100%;object-fit:cover;transition:transform .5s ease;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'"/>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;padding:0 2px;">
        <p style="font-size:13px;font-weight:500;color:${t.pageText};line-height:1.4;">${p.title || ""}</p>
        <p style="font-size:13px;font-weight:600;color:${t.pageText};">${p.price || ""}</p>
      </div>
    </a>`;
  }).join("");

  const productsHTML = `
  <section id="products" style="padding:72px 32px 48px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;">
        <h2 style="font-family:${t.fontHeading};font-size:clamp(2rem, 4vw, 2.6rem);font-weight:600;color:${t.pageText};letter-spacing:-0.01em;">${productsHeading}</h2>
        <a href="#products" style="font-size:13px;color:${t.mutedText};text-decoration:underline;text-underline-offset:4px;">${productsCta}</a>
      </div>
      <div data-grid="4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;">
        ${productCards}
      </div>
    </div>
  </section>`;

  // ─── 2-up collections ───
  const collectionsHTML = `
  <section id="collections" style="padding:32px 32px 72px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div data-grid="2" style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
        ${collections.map((c: any, i: number) => {
          const img = getEshopImage(config, "collection", i);
          return `
          <a href="#products" style="position:relative;display:block;aspect-ratio:4/5;overflow:hidden;background:${t.cardBg};color:#fff;">
            <img src="${img}" alt="${c.title}" style="width:100%;height:100%;object-fit:cover;"/>
            <div style="position:absolute;inset:auto 0 0 0;padding:24px;background:linear-gradient(180deg, transparent, rgba(0,0,0,0.5));">
              <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.85;margin-bottom:6px;">${c.subtitle || ""}</p>
              <h3 style="font-family:${t.fontHeading};font-size:28px;font-weight:500;letter-spacing:0.04em;">${c.title || ""}</h3>
            </div>
          </a>`;
        }).join("")}
      </div>
    </div>
  </section>`;

  // ─── Footer ───
  const footerCols = (footerS.columns as any[]) || [
    { title: "Shop", links: ["Women", "Men", "New Arrivals", "Sale"] },
    { title: "Help", links: ["Shipping", "Returns", "Size Guide", "Contact"] },
    { title: "About", links: ["Our Story", "Sustainability", "Press"] },
  ];
  const footerHTML = `
  <footer id="footer" style="padding:64px 32px 32px;background:${t.pageBg};color:${t.pageText};border-top:1px solid ${t.border};">
    <div class="yangu-content-container">
      <div style="text-align:center;margin-bottom:48px;">
        <div style="font-family:${t.fontHeading};font-size:32px;letter-spacing:0.32em;font-weight:500;color:${t.pageText};margin-bottom:12px;">${wordmark}</div>
        <p style="font-size:13px;color:${t.mutedText};max-width:480px;margin:0 auto;">${footerS.tagline || "New season, new you. Shop the latest editorial collection."}</p>
      </div>
      <div data-grid="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-bottom:48px;">
        ${footerCols.map((col: any) => `
          <div style="text-align:center;">
            <h4 style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;color:${t.pageText};margin-bottom:14px;">${col.title}</h4>
            ${(col.links as string[]).map((l: string) => `<p style="font-size:13px;color:${t.mutedText};margin-bottom:8px;">${l}</p>`).join("")}
          </div>
        `).join("")}
      </div>
      <p style="text-align:center;font-size:11px;color:${t.mutedText};letter-spacing:0.06em;border-top:1px solid ${t.border};padding-top:24px;">${footerS.copyright || `© ${new Date().getFullYear()} ${name} — All rights reserved.`}</p>
    </div>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${eshopBaseStyles(t.pageBg, t.pageText, t.marqueeBg)}</style></head><body>
${navHTML}
${heroHTML}
${marqueeHTML}
${productsHTML}
${collectionsHTML}
${footerHTML}
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// MOCKHUB — Mixed-merch / digital marketplace (dark, vibrant accent)
// Reference: https://mockhub.framer.website
// Structure:  vibrant promo bar → dark sticky nav (logo + Device/Apparel/Product
//             pills + search + Use For Free CTA + theme toggle + Sign in)
//             → split hero (text-left + large rounded media-right)
//             → category sections (Device/Apparel/Product) with 3-up image-swap cards
//             → 2x3 features grid ("Powerful template designs.")
//             → testimonial wall (3-col masonry-ish quotes)
//             → centered CTA + minimal footer
// ═══════════════════════════════════════════════════════════════════

interface MockhubTheme {
  pageBg: string;
  panelBg: string;
  cardBg: string;
  pageText: string;
  mutedText: string;
  border: string;
  accent: string;
  accentText: string;
  promoBg: string;
  promoText: string;
  fontHeading: string;
  fontBody: string;
}

const MOCKHUB_VARIANTS: MockhubTheme[] = [
  // 0 — Signature Mockhub: pure black + violet promo
  {
    pageBg: "#0A0A0B",
    panelBg: "#101013",
    cardBg: "#16171B",
    pageText: "#FFFFFF",
    mutedText: "#A1A1AA",
    border: "#26272B",
    accent: "#A855F7",
    accentText: "#FFFFFF",
    promoBg: "#A855F7",
    promoText: "#FFFFFF",
    fontHeading: "'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
  },
  // 1 — Graphite + lime accent
  {
    pageBg: "#111315",
    panelBg: "#181B1F",
    cardBg: "#1F2227",
    pageText: "#F4F5F6",
    mutedText: "#9AA0A6",
    border: "#2A2E33",
    accent: "#C6FF3D",
    accentText: "#0A0A0B",
    promoBg: "#C6FF3D",
    promoText: "#0A0A0B",
    fontHeading: "'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
  },
  // 2 — Cream light + coral accent
  {
    pageBg: "#F7F4EE",
    panelBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    pageText: "#141414",
    mutedText: "#5C5C5C",
    border: "#E6E1D6",
    accent: "#FF5A4E",
    accentText: "#FFFFFF",
    promoBg: "#141414",
    promoText: "#FFFFFF",
    fontHeading: "'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
  },
];

export function renderMockhub(ctx: EshopRenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const headerS = (s.header?.schema || {}) as Record<string, any>;
  const heroS = (s.hero?.schema || {}) as Record<string, any>;
  const mainS = (s.main_content?.schema || {}) as Record<string, any>;
  const offerS = (s.offer?.schema || {}) as Record<string, any>;
  const footerS = (s.footer?.schema || {}) as Record<string, any>;

  const t = { ...(MOCKHUB_VARIANTS[variantIndex] || MOCKHUB_VARIANTS[0]) };
  if (config.userBrandColors?.[0]) {
    t.accent = config.userBrandColors[0];
    t.promoBg = config.userBrandColors[0];
  }

  const name = config.businessName || "Mockhub";
  const promoText = (headerS.promo_text as string) || "Get unlimited access to all products";
  const navPills = (headerS.nav_items as string[]) || ["Device", "Apparel", "Product", "All Assets"];
  const ctaLabel = (headerS.cta_label as string) || "Use for Free";

  const heroTitle = (heroS.title as string) || "Showcase Your Designs with Ease";
  const heroSub = (heroS.subtitle as string) || "Discover high-quality mockups to present your work beautifully and effortlessly.";
  const heroImg = getEshopImage(config, "hero", variantIndex);

  // Three category sections, each with 3 cards
  const categories = (mainS.categories as any[]) || [
    {
      title: "Device Mockup",
      cta: "Explore Devices",
      items: [
        { title: "Colourful monitor", tag: "Device", price: "$32" },
        { title: "Girl showing iPhone 13", tag: "Device", price: "$54" },
        { title: "AI generated monitor", tag: "Device", price: "Free" },
      ],
    },
    {
      title: "Apparel Mockup",
      cta: "Explore Apparel",
      items: [
        { title: "Girl wearing a t-shirt", tag: "Apparel", price: "Free" },
        { title: "Girl wearing t-shirt and glasses", tag: "Apparel", price: "Free" },
        { title: "Tote bag with t-shirt", tag: "Apparel", price: "$43" },
      ],
    },
    {
      title: "Product Mockup",
      cta: "Explore Products",
      items: [
        { title: "Open box with bottle", tag: "Product", price: "Free" },
        { title: "Jar and tube mockup", tag: "Product", price: "Free" },
        { title: "Closed box", tag: "Product", price: "$54" },
      ],
    },
  ];

  const features = (offerS.features as any[]) || [
    { title: "Simple To Modify", body: "Easily change layouts, fonts, and colors to match your brand." },
    { title: "Affordable", body: "Launch a polished website for a small fraction of the cost." },
    { title: "Quality Support", body: "Reach us instantly via live chat whenever you need help." },
    { title: "High-Quality Mockups", body: "Meticulously crafted for stunning, high-quality visuals." },
    { title: "Wide Variety", body: "Explore a vast collection across many categories." },
    { title: "Instant Download", body: "Access your mockups immediately after purchase." },
  ];

  const testimonials = (offerS.testimonials as any[]) || [
    { name: "Myron", brand: "Shoply", quote: "I adore the speed and style. Highly scalable — a complete, adjustable design system." },
    { name: "Ezekiel", brand: "Shoply", quote: "Lovely design. Outstanding performance." },
    { name: "Jeff", brand: "Sero", quote: "Exquisitely crafted from the inside out. Incredibly capable." },
    { name: "Jude", brand: "Sero", quote: "Very neat and user-friendly! Helped me launch my portfolio." },
    { name: "Kane", brand: "Shoply", quote: "It's simple to use." },
    { name: "Jane", brand: "Shoply", quote: "Amazing template — opened my store in half the time!" },
  ];

  // ─── Promo bar ───
  const promoHTML = `
  <div style="background:${t.promoBg};color:${t.promoText};text-align:center;padding:10px 16px;font-size:13px;font-weight:500;letter-spacing:0.01em;">
    ${promoText} <span style="opacity:.85;margin-left:6px;">→</span>
  </div>`;

  // ─── Header ───
  const navHTML = `
  <header style="position:sticky;top:0;z-index:50;background:${t.panelBg};border-bottom:1px solid ${t.border};">
    <div style="display:flex;align-items:center;gap:18px;padding:14px 28px;max-width:1320px;margin:0 auto;">
      <a href="#hero" style="display:flex;align-items:center;gap:10px;color:${t.pageText};">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:${t.accent};color:${t.accentText};border-radius:8px;font-family:${t.fontHeading};font-weight:800;font-size:14px;">M</span>
        <span style="font-family:${t.fontHeading};font-weight:700;font-size:17px;color:${t.pageText};">${name}</span>
      </a>
      <nav class="aema-nav-links" style="display:flex;align-items:center;gap:6px;margin-left:18px;">
        ${navPills.map((p) => `<a href="${navHref(p)}" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;background:transparent;color:${t.pageText};font-size:13px;font-weight:500;border:1px solid transparent;" onmouseover="this.style.background='${t.cardBg}';this.style.borderColor='${t.border}'" onmouseout="this.style.background='transparent';this.style.borderColor='transparent'">${p}</a>`).join("")}
      </nav>
      <div class="aema-nav-links" style="flex:1;display:flex;justify-content:center;">
        <div style="display:flex;align-items:center;gap:8px;background:${t.cardBg};border:1px solid ${t.border};border-radius:10px;padding:8px 12px;min-width:280px;max-width:360px;width:100%;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${t.mutedText}" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style="font-size:13px;color:${t.mutedText};">Search all assets</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <a href="#products" style="display:inline-flex;align-items:center;padding:9px 16px;background:${t.pageText};color:${t.pageBg};border-radius:10px;font-size:13px;font-weight:600;">${ctaLabel}</a>
        <a href="#footer" style="display:inline-flex;align-items:center;padding:9px 16px;background:${t.cardBg};border:1px solid ${t.border};color:${t.pageText};border-radius:10px;font-size:13px;font-weight:500;">Sign in</a>
      </div>
    </div>
  </header>`;

  // ─── Hero (split) ───
  const heroHTML = `
  <section id="hero" style="background:${t.pageBg};padding:80px 28px 64px;">
    <div class="yangu-content-container aema-hero-grid" style="display:grid;grid-template-columns:1fr 1.1fr;gap:48px;align-items:center;">
      <div class="aema-hero-text">
        <h1 style="font-family:${t.fontHeading};font-size:clamp(2.4rem, 5vw, 4.4rem);font-weight:700;line-height:1.05;letter-spacing:-0.02em;color:${t.pageText};margin-bottom:22px;">${heroTitle}</h1>
        <p style="font-size:16px;color:${t.mutedText};max-width:480px;margin-bottom:32px;line-height:1.6;">${heroSub}</p>
        <div style="display:flex;gap:10px;align-items:center;background:${t.cardBg};border:1px solid ${t.border};border-radius:12px;padding:10px 14px;max-width:440px;">
          <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;background:${t.panelBg};border:1px solid ${t.border};font-size:12px;color:${t.pageText};font-weight:500;">All Assets ▾</span>
          <span style="flex:1;font-size:13px;color:${t.mutedText};padding-left:4px;">Search all assets</span>
          <button aria-label="Search" style="background:${t.accent};color:${t.accentText};border:none;border-radius:8px;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </div>
      <div class="aema-hero-media" style="aspect-ratio:5/4;border-radius:18px;overflow:hidden;background:${t.cardBg};border:1px solid ${t.border};">
        <img src="${heroImg}" alt="${name} hero" style="width:100%;height:100%;object-fit:cover;display:block;"/>
      </div>
    </div>
  </section>`;

  // ─── Category sections ───
  const categoriesHTML = categories.map((cat: any, ci: number) => {
    const cardsHTML = (cat.items as any[]).map((it: any, i: number) => {
      const img = getEshopImage(config, "product", ci * 3 + i);
      const isFree = String(it.price).toLowerCase() === "free";
      return `
      <a href="#" class="aema-card" style="display:block;background:${t.cardBg};border:1px solid ${t.border};border-radius:14px;overflow:hidden;color:${t.pageText};">
        <div style="aspect-ratio:4/3;overflow:hidden;background:${t.panelBg};">
          <img src="${img}" alt="${it.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform .5s ease;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'"/>
        </div>
        <div style="padding:16px 18px;display:flex;flex-direction:column;gap:8px;">
          <p style="font-size:14px;font-weight:600;color:${t.pageText};">${it.title}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${t.mutedText};border:1px solid ${t.border};padding:4px 8px;border-radius:6px;">${it.tag}</span>
            <span style="font-size:13px;font-weight:700;color:${isFree ? t.accent : t.pageText};">${it.price}</span>
          </div>
        </div>
      </a>`;
    }).join("");
    return `
    <section id="${ci === 0 ? "products" : `cat-${ci}`}" style="padding:48px 28px;background:${t.pageBg};">
      <div class="yangu-content-container">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;gap:16px;">
          <h2 style="font-family:${t.fontHeading};font-size:clamp(1.6rem, 3vw, 2.2rem);font-weight:600;color:${t.pageText};letter-spacing:-0.01em;">${cat.title}</h2>
          <a href="#products" style="font-size:13px;color:${t.mutedText};display:inline-flex;align-items:center;gap:4px;">${cat.cta} <span aria-hidden="true">→</span></a>
        </div>
        <div data-grid="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">${cardsHTML}</div>
      </div>
    </section>`;
  }).join("");

  // ─── Features grid ───
  const featuresHTML = `
  <section id="features" style="padding:88px 28px;background:${t.panelBg};border-top:1px solid ${t.border};border-bottom:1px solid ${t.border};">
    <div class="yangu-content-container">
      <div style="text-align:center;max-width:760px;margin:0 auto 56px;">
        <h2 style="font-family:${t.fontHeading};font-size:clamp(2rem, 4vw, 3rem);font-weight:700;color:${t.pageText};letter-spacing:-0.02em;margin-bottom:14px;">Powerful template designs.</h2>
        <p style="font-size:15px;color:${t.mutedText};">We ensure that each of our templates includes everything you need to launch your brand-new, dazzling website.</p>
      </div>
      <div data-grid="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
        ${features.map((f: any) => `
          <div style="background:${t.cardBg};border:1px solid ${t.border};border-radius:14px;padding:26px 24px;">
            <div style="width:34px;height:34px;border-radius:8px;background:${t.accent};color:${t.accentText};display:inline-flex;align-items:center;justify-content:center;font-weight:800;margin-bottom:14px;">✦</div>
            <h3 style="font-family:${t.fontHeading};font-size:17px;font-weight:600;color:${t.pageText};margin-bottom:8px;">${f.title}</h3>
            <p style="font-size:13.5px;color:${t.mutedText};line-height:1.55;">${f.body}</p>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;

  // ─── Testimonials wall ───
  const testimonialsHTML = `
  <section id="testimonials" style="padding:88px 28px;background:${t.pageBg};">
    <div class="yangu-content-container">
      <div style="text-align:center;max-width:680px;margin:0 auto 48px;">
        <h2 style="font-family:${t.fontHeading};font-size:clamp(1.8rem, 3.5vw, 2.6rem);font-weight:700;color:${t.pageText};letter-spacing:-0.02em;margin-bottom:12px;">Don't only take what we say.</h2>
        <p style="font-size:14px;color:${t.mutedText};">Our templates have helped over 1,000 people start a new website.</p>
      </div>
      <div data-grid="3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;">
        ${testimonials.map((q: any, i: number) => `
          <div style="background:${t.cardBg};border:1px solid ${t.border};border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:14px;">
            <p style="font-size:14px;color:${t.pageText};line-height:1.55;">"${q.quote}"</p>
            <div style="display:flex;align-items:center;gap:10px;margin-top:auto;">
              <div style="width:36px;height:36px;border-radius:50%;background:${t.accent};color:${t.accentText};display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">${(q.name || "?").charAt(0)}</div>
              <div>
                <p style="font-size:13px;font-weight:600;color:${t.pageText};">${q.name}</p>
                <p style="font-size:11px;color:${t.mutedText};letter-spacing:0.04em;text-transform:uppercase;">${q.brand}</p>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;

  // ─── Footer CTA ───
  const footerHTML = `
  <footer id="footer" style="padding:64px 28px 36px;background:${t.panelBg};border-top:1px solid ${t.border};color:${t.pageText};">
    <div class="yangu-content-container">
      <div style="text-align:center;margin-bottom:48px;">
        <h3 style="font-family:${t.fontHeading};font-size:clamp(1.8rem, 3.5vw, 2.4rem);font-weight:700;letter-spacing:-0.02em;margin-bottom:18px;">Ready to ship your next project?</h3>
        <a href="#hero" style="display:inline-flex;align-items:center;padding:13px 24px;background:${t.accent};color:${t.accentText};border-radius:12px;font-size:14px;font-weight:600;">${ctaLabel}</a>
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:18px;border-top:1px solid ${t.border};padding-top:24px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:${t.accent};color:${t.accentText};border-radius:7px;font-family:${t.fontHeading};font-weight:800;font-size:12px;">M</span>
          <span style="font-family:${t.fontHeading};font-weight:600;font-size:14px;">${name}</span>
        </div>
        <p style="font-size:12px;color:${t.mutedText};letter-spacing:0.04em;">${footerS.copyright || `© ${new Date().getFullYear()} ${name} — All rights reserved.`}</p>
      </div>
    </div>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${eshopBaseStyles(t.pageBg, t.pageText, t.accent)}</style></head><body>
${promoHTML}
${navHTML}
${heroHTML}
${categoriesHTML}
${featuresHTML}
${testimonialsHTML}
${footerHTML}
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// LUMEL — Bottled / wellness products (editorial, organic premium)
// Reference: bottled juice / wellness tonic / spice / cold-pressed brand
// Structure:  thin top promo → centered serif wordmark nav (left links / right cart)
//             → editorial split hero (oversized serif headline + bottle image)
//             → ingredient strip (3 icon+label pairs)
//             → "Our Bottles" 3-up product grid (image, title, volume, price)
//             → editorial story block (image-left + copy-right)
//             → testimonial / press band
//             → newsletter + minimal footer
// ═══════════════════════════════════════════════════════════════════

interface LumelTheme {
  pageBg: string;
  panelBg: string;
  pageText: string;
  mutedText: string;
  border: string;
  accent: string;
  accentText: string;
  promoBg: string;
  promoText: string;
  fontHeading: string;
  fontBody: string;
}

const LUMEL_VARIANTS: LumelTheme[] = [
  // 0 — Signature cream + amber (juice / wellness)
  {
    pageBg: "#F4EFE6",
    panelBg: "#FFFFFF",
    pageText: "#1A1814",
    mutedText: "#6B6356",
    border: "#E2DAC9",
    accent: "#B8612A",
    accentText: "#FFFFFF",
    promoBg: "#1A1814",
    promoText: "#F4EFE6",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
  },
  // 1 — Olive botanical
  {
    pageBg: "#EDEFE6",
    panelBg: "#FFFFFF",
    pageText: "#1F2A1A",
    mutedText: "#5E6A52",
    border: "#D4D9C6",
    accent: "#4F6B3A",
    accentText: "#FFFFFF",
    promoBg: "#1F2A1A",
    promoText: "#EDEFE6",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
  },
  // 2 — Dark apothecary
  {
    pageBg: "#161311",
    panelBg: "#1F1B18",
    pageText: "#F4EFE6",
    mutedText: "#B0A698",
    border: "#2E2925",
    accent: "#D4A86A",
    accentText: "#161311",
    promoBg: "#D4A86A",
    promoText: "#161311",
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
  },
];

export function renderLumel(ctx: EshopRenderContext): string {
  const { config, preset, variantIndex } = ctx;
  const s = preset.patches;
  const headerS = (s.header?.schema || {}) as Record<string, any>;
  const heroS = (s.hero?.schema || {}) as Record<string, any>;
  const mainS = (s.main_content?.schema || {}) as Record<string, any>;
  const offerS = (s.offer?.schema || {}) as Record<string, any>;
  const footerS = (s.footer?.schema || {}) as Record<string, any>;

  const t = { ...(LUMEL_VARIANTS[variantIndex] || LUMEL_VARIANTS[0]) };
  if (config.userBrandColors?.[0]) t.accent = config.userBrandColors[0];

  const name = config.businessName || "Lumel";
  const promoText = (headerS.promo_text as string) || "Free delivery on orders over $40 — naturally sourced, small batch.";
  const navItems = (headerS.nav_items as string[]) || ["Shop", "Ingredients", "Our Story", "Journal"];

  const heroTitle = (heroS.title as string) || "Pure ingredients,\nbottled with intention.";
  const heroSub = (heroS.subtitle as string) || "Cold-pressed wellness blends, crafted in small batches from organically grown botanicals.";
  const heroCta = (heroS.cta_label as string) || "Shop the collection";
  const heroImg = getEshopImage(config, "hero", variantIndex);

  const ingredients = (offerS.ingredients as any[]) || [
    { label: "100% Organic", note: "Certified sourcing" },
    { label: "Cold-Pressed", note: "Nutrients preserved" },
    { label: "Glass Bottled", note: "Plastic-free packaging" },
  ];

  const products = (mainS.items as any[]) || [
    { title: "Golden Tonic", volume: "500ml", price: "$18", note: "Turmeric · Ginger · Honey" },
    { title: "Verde Reset", volume: "500ml", price: "$18", note: "Spinach · Apple · Mint" },
    { title: "Citrus Sun", volume: "500ml", price: "$16", note: "Orange · Carrot · Cayenne" },
    { title: "Berry Glow", volume: "500ml", price: "$19", note: "Blueberry · Beet · Lemon" },
    { title: "Roots Elixir", volume: "350ml", price: "$22", note: "Ginger · Lemon · Cayenne" },
    { title: "Dawn Brew", volume: "350ml", price: "$20", note: "Matcha · Vanilla · Oat" },
  ];

  const story = (offerS.story as Record<string, any>) || {
    title: "Bottled with intention.",
    body: "Every batch begins on the farms we partner with. We work with small growers who share our standards for soil, season, and care — then press, blend, and bottle within hours of harvest. Nothing added, nothing taken away.",
    cta: "Read our story",
  };

  const testimonial = (offerS.testimonial as Record<string, any>) || {
    quote: "Genuinely the cleanest tasting cold-press I have come across. Beautifully packaged too.",
    author: "Vogue Wellness",
  };

  // ─── HTML chunks ───
  const promoHTML = `<div style="background:${t.promoBg};color:${t.promoText};font-family:${t.fontBody};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;text-align:center;padding:10px 16px;">${promoText}</div>`;

  const navHTML = `<header style="background:${t.pageBg};border-bottom:1px solid ${t.border};position:sticky;top:0;z-index:50;">
    <div class="yangu-content-container" style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:18px 24px;gap:16px;">
      <nav style="display:flex;gap:24px;font-family:${t.fontBody};font-size:13px;letter-spacing:0.04em;color:${t.pageText};">
        ${navItems.slice(0, 2).map(n => `<a href="${navHref(n)}" style="opacity:.85;">${n}</a>`).join("")}
      </nav>
      <a href="#hero" style="font-family:${t.fontHeading};font-size:28px;letter-spacing:0.18em;text-transform:uppercase;color:${t.pageText};text-align:center;">${name}</a>
      <nav style="display:flex;gap:24px;justify-content:flex-end;font-family:${t.fontBody};font-size:13px;letter-spacing:0.04em;color:${t.pageText};">
        ${navItems.slice(2).map(n => `<a href="${navHref(n)}" style="opacity:.85;">${n}</a>`).join("")}
        <a href="#cart" style="opacity:.85;">Cart (0)</a>
      </nav>
    </div>
  </header>`;

  const heroHTML = `<section id="hero" style="background:${t.pageBg};padding:64px 24px 48px;">
    <div class="yangu-content-container" data-grid="2" style="display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center;">
      <div>
        <p style="font-family:${t.fontBody};font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${t.accent};margin-bottom:20px;">— New Season Collection</p>
        <h1 style="font-family:${t.fontHeading};font-weight:500;font-size:clamp(40px, 6vw, 72px);line-height:1.04;color:${t.pageText};margin-bottom:24px;white-space:pre-line;">${heroTitle}</h1>
        <p style="font-family:${t.fontBody};font-size:17px;line-height:1.65;color:${t.mutedText};max-width:480px;margin-bottom:32px;">${heroSub}</p>
        <a href="#products" style="display:inline-block;background:${t.accent};color:${t.accentText};padding:16px 32px;font-family:${t.fontBody};font-size:13px;letter-spacing:0.12em;text-transform:uppercase;border-radius:8px;">${heroCta}</a>
      </div>
      <div style="position:relative;aspect-ratio:4/5;border-radius:12px;overflow:hidden;background:${t.panelBg};">
        <img src="${heroImg}" alt="${name} bottles" style="width:100%;height:100%;object-fit:cover;" loading="eager"/>
      </div>
    </div>
  </section>`;

  const ingredientsHTML = `<section style="background:${t.panelBg};border-top:1px solid ${t.border};border-bottom:1px solid ${t.border};padding:36px 24px;">
    <div class="yangu-content-container" data-grid="3" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:32px;text-align:center;">
      ${ingredients.map(ing => `
        <div>
          <p style="font-family:${t.fontHeading};font-size:22px;color:${t.pageText};margin-bottom:6px;">${ing.label}</p>
          <p style="font-family:${t.fontBody};font-size:13px;letter-spacing:0.05em;text-transform:uppercase;color:${t.mutedText};">${ing.note}</p>
        </div>
      `).join("")}
    </div>
  </section>`;

  const productsHTML = `<section id="products" style="background:${t.pageBg};padding:80px 24px;">
    <div class="yangu-content-container">
      <div style="display:flex;align-items:end;justify-content:space-between;margin-bottom:40px;gap:16px;flex-wrap:wrap;">
        <div>
          <p style="font-family:${t.fontBody};font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${t.accent};margin-bottom:8px;">— The Collection</p>
          <h2 style="font-family:${t.fontHeading};font-weight:500;font-size:clamp(32px, 4vw, 48px);color:${t.pageText};">Our bottles</h2>
        </div>
        <a href="#products" style="font-family:${t.fontBody};font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${t.pageText};border-bottom:1px solid ${t.pageText};padding-bottom:2px;">Shop all →</a>
      </div>
      <div class="yangu-product-grid" data-grid="3" style="grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:32px;">
        ${products.map((p, i) => `
          <article class="yangu-product-card" data-yangu-product="true" data-yangu-product-id="lumel-${i}" data-yangu-product-name="${p.title}" data-yangu-product-price="${p.price}" style="background:${t.panelBg};border:1px solid ${t.border};border-radius:12px;overflow:hidden;display:flex;flex-direction:column;">
            <div style="aspect-ratio:4/5;background:${t.pageBg};overflow:hidden;">
              <img src="${getEshopImage(config, "product", i)}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>
            </div>
            <div style="padding:24px;display:flex;flex-direction:column;gap:6px;">
              <p style="font-family:${t.fontBody};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${t.mutedText};">${p.volume}</p>
              <h3 class="yangu-product-name" style="font-family:${t.fontHeading};font-weight:500;font-size:22px;color:${t.pageText};">${p.title}</h3>
              <p style="font-family:${t.fontBody};font-size:13px;color:${t.mutedText};margin-bottom:12px;">${p.note}</p>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
                <span class="yangu-product-price" style="font-family:${t.fontHeading};font-size:20px;color:${t.pageText};">${p.price}</span>
                <button class="yangu-product-add" style="background:${t.accent};color:${t.accentText};border:none;padding:10px 18px;font-family:${t.fontBody};font-size:12px;letter-spacing:0.1em;text-transform:uppercase;border-radius:8px;cursor:pointer;">+ Add</button>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  </section>`;

  const storyHTML = `<section id="about" style="background:${t.panelBg};padding:96px 24px;border-top:1px solid ${t.border};border-bottom:1px solid ${t.border};">
    <div class="yangu-content-container" data-grid="2" style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;">
      <div style="aspect-ratio:1/1;border-radius:12px;overflow:hidden;background:${t.pageBg};">
        <img src="${getEshopImage(config, "collection", 0)}" alt="${story.title}" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>
      </div>
      <div>
        <p style="font-family:${t.fontBody};font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${t.accent};margin-bottom:16px;">— Our story</p>
        <h2 style="font-family:${t.fontHeading};font-weight:500;font-size:clamp(32px, 4vw, 52px);line-height:1.1;color:${t.pageText};margin-bottom:24px;">${story.title}</h2>
        <p style="font-family:${t.fontBody};font-size:16px;line-height:1.7;color:${t.mutedText};margin-bottom:28px;">${story.body}</p>
        <a href="#about" style="display:inline-block;font-family:${t.fontBody};font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${t.pageText};border-bottom:1px solid ${t.pageText};padding-bottom:3px;">${story.cta} →</a>
      </div>
    </div>
  </section>`;

  const testimonialHTML = `<section style="background:${t.pageBg};padding:80px 24px;text-align:center;">
    <div class="yangu-content-container" style="max-width:780px;">
      <p style="font-family:${t.fontHeading};font-style:italic;font-weight:400;font-size:clamp(24px, 3vw, 34px);line-height:1.4;color:${t.pageText};margin-bottom:24px;">"${testimonial.quote}"</p>
      <p style="font-family:${t.fontBody};font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${t.mutedText};">— ${testimonial.author}</p>
    </div>
  </section>`;

  const footerHTML = `<footer id="footer" style="background:${t.panelBg};border-top:1px solid ${t.border};padding:64px 24px 32px;">
    <div class="yangu-content-container">
      <div data-grid="2" style="display:grid;grid-template-columns:1.2fr 1fr;gap:48px;margin-bottom:48px;align-items:start;">
        <div>
          <p style="font-family:${t.fontHeading};font-size:32px;letter-spacing:0.16em;text-transform:uppercase;color:${t.pageText};margin-bottom:16px;">${name}</p>
          <p style="font-family:${t.fontBody};font-size:14px;line-height:1.6;color:${t.mutedText};max-width:380px;">Cold-pressed wellness, bottled in small batches and delivered fresh.</p>
        </div>
        <form style="display:flex;flex-direction:column;gap:12px;" onsubmit="event.preventDefault();">
          <label style="font-family:${t.fontBody};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${t.pageText};">Join the journal</label>
          <div style="display:flex;gap:8px;">
            <input type="email" placeholder="your@email.com" style="flex:1;background:${t.pageBg};border:1px solid ${t.border};color:${t.pageText};padding:14px 16px;font-family:${t.fontBody};font-size:14px;border-radius:8px;outline:none;"/>
            <button type="submit" style="background:${t.accent};color:${t.accentText};border:none;padding:14px 22px;font-family:${t.fontBody};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;border-radius:8px;cursor:pointer;">Subscribe</button>
          </div>
        </form>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-top:1px solid ${t.border};padding-top:24px;font-family:${t.fontBody};font-size:12px;letter-spacing:0.06em;color:${t.mutedText};">
        <span>© ${new Date().getFullYear()} ${name}. ${footerS.copyright || "All rights reserved."}</span>
        <div style="display:flex;gap:20px;"><a href="#">Instagram</a><a href="#">TikTok</a><a href="#">Pinterest</a></div>
      </div>
    </div>
  </footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${name}</title>
<style>${eshopBaseStyles(t.pageBg, t.pageText, t.accent)}</style></head><body>
${promoHTML}
${navHTML}
${heroHTML}
${ingredientsHTML}
${productsHTML}
${storyHTML}
${testimonialHTML}
${footerHTML}
</body></html>`;
}
