/**
 * Website HTML generator based on builder selections.
 * Produces a complete single-page HTML string with embedded CSS.
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
    bg: "#FAFAFA",
    text: "#1A1A1A",
    accent: "#F97316",
    accentText: "#FFFFFF",
    secondary: "#F3F4F6",
    heroGradient: "linear-gradient(135deg, #1A1A1A 0%, #374151 100%)",
    cardBg: "#FFFFFF",
    borderColor: "#E5E7EB",
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
  },
  bold: {
    bg: "#FFFBEB",
    text: "#1C1917",
    accent: "#EF4444",
    accentText: "#FFFFFF",
    secondary: "#FEF3C7",
    heroGradient: "linear-gradient(135deg, #EF4444 0%, #F97316 50%, #EAB308 100%)",
    cardBg: "#FFFFFF",
    borderColor: "#FCD34D",
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
  },
  dark: {
    bg: "#0F0F0F",
    text: "#F5F5F5",
    accent: "#D4A853",
    accentText: "#0F0F0F",
    secondary: "#1A1A1A",
    heroGradient: "linear-gradient(135deg, #0F0F0F 0%, #1F1F1F 50%, #2D2D2D 100%)",
    cardBg: "#1A1A1A",
    borderColor: "#333333",
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
  },
};

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

export function generateWebsiteHTML(config: GeneratorConfig): string {
  const theme = STYLE_THEMES[config.style] || STYLE_THEMES.modern;
  const pages = getPageContent(config.category, config.businessName, config.location, config.userIdea);
  const domain = CATEGORY_CONFIGS[config.category]?.domain || ".site";

  const navLinks = pages.map((p) => `<a href="#${p.name.toLowerCase().replace(/[\s/]/g, "-")}" class="nav-link">${p.name}</a>`).join("\n            ");

  const sectionsHTML = pages
    .map((page, i) => {
      const id = page.name.toLowerCase().replace(/[\s/]/g, "-");
      const isHero = i === 0;

      const itemsHtml = page.items
        ? `<div class="items-grid">${page.items
            .map(
              (item) =>
                `<div class="item-card"><span>${item}</span></div>`
            )
            .join("")}</div>`
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
  <title>${config.businessName || "My Website"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    html { scroll-behavior: smooth; }
    
    body {
      font-family: ${theme.fontBody};
      background: ${theme.bg};
      color: ${theme.text};
      line-height: 1.6;
    }
    
    /* NAV */
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
    
    /* HERO */
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
    
    /* SECTIONS */
    .content-section { padding: 80px 24px; }
    .content-section.alt-bg { background: ${theme.secondary}; }
    .section-inner { max-width: 900px; margin: 0 auto; text-align: center; }
    .section-title { font-family: ${theme.fontHeading}; font-size: 2rem; font-weight: 700; margin-bottom: 12px; }
    .section-subtitle { font-size: 1rem; color: ${theme.text}bb; margin-bottom: 40px; line-height: 1.7; }
    
    /* ITEMS GRID */
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
    
    /* FOOTER */
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
