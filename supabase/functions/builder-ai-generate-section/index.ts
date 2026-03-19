import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_SURFACE_TYPES = ["live_bio", "emenu", "quick_site", "eshop", "store_listing", "community_listing", "community_group", "live_selling", "studio_showcase"];
const VALID_SECTION_TYPES = ["hero", "featured", "bio", "links", "social", "cta", "video", "gallery", "text", "about", "offer", "plans", "rules", "join", "products", "categories", "listings", "filters", "services", "testimonials", "faq", "contact", "schedule", "menu", "hours", "location"];

// ─── Per-editor-type schema specs with REAL content guidance ───

const SCHEMA_SPECS: Record<string, string> = {
  hero: '{"headline": "string", "subheadline": "string", "cta_text": "string (button text)", "cta_href": "string (url)", "media": {"type": "image", "source": "url", "url": "" (leave empty — AI images will be generated separately), "alt": "string", "fit": "cover"}}',
  featured: '{"title": "string", "items": [{"title": "string", "description": "string", "image_url": "" (leave empty), "href": "string"}]} (3-6 items)',
  bio: '{"text": "string (1-3 paragraphs)"}',
  links: '{"items": [{"label": "string", "url": "string"}]} (2-5 items)',
  social: '{"handles": {"instagram": "string", "twitter": "string", "tiktok": "string", ...}} (include relevant ones)',
  cta: '{"label": "string (button text)", "href": "string (url)"}',
  video: '{"url": "string (youtube or similar url)"}',
  gallery: '{"items": [{"src": "" (leave empty), "alt": "string", "name": "string (descriptive caption)"}]} (3-6 items)',
  text: '{"heading": "string", "body": "string (1-3 paragraphs)"}',
  about: '{"heading": "string", "body": "string (1-3 paragraphs)"}',
  offer: '{"heading": "string", "items": [{"title": "string", "price": "string", "description": "string"}]} (2-5 items)',
  plans: '{"heading": "string", "items": [{"name": "string", "price": "string", "description": "string"}]} (2-4 items)',
  rules: '{"heading": "string", "items": [{"title": "string", "description": "string"}]}',
  join: '{"label": "string", "url": "string", "description": "string"}',
  products: '{"heading": "string", "items": [{"name": "string", "price": "string", "description": "string", "image_url": "" (leave empty)}]} (3-6 items)',
  categories: '{"heading": "string", "items": [{"name": "string", "description": "string", "icon": "string (emoji)"}]}',
  listings: '{"heading": "string", "items": [{"name": "string", "price": "string", "description": "string", "image_url": "" (leave empty)}]}',
  filters: '{"heading": "string", "keys": ["string"]}',
  services: '{"heading": "string", "items": [{"name": "string", "price": "string", "description": "string", "icon": "string (emoji)"}]} (3-5 items)',
  testimonials: '{"heading": "string", "items": [{"name": "string", "quote": "string"}]} (2-4 items)',
  faq: '{"heading": "string", "items": [{"question": "string", "answer": "string"}]} (3-5 items)',
  contact: '{"heading": "string", "email": "string", "phone": "string", "address": "string"}',
  schedule: '{"heading": "string", "items": [{"day": "string", "time": "string"}]}',
  menu: '{"heading": "string", "categories": [{"name": "string", "items": [{"name": "string", "price": "string", "description": "string"}]}]}',
  hours: '{"heading": "string", "items": [{"day": "string", "hours": "string"}]}',
  location: '{"heading": "string", "address": "string", "mapUrl": "string"}',
};

// ─── Surface-type-specific content generation instructions ───

const SURFACE_CONTENT_GUIDES: Record<string, string> = {
  eshop: `You are generating content for an ONLINE SHOP (Eshop).
Content rules:
- Products MUST have realistic names (e.g. "Ankara Print Midi Dress", "Wireless Bluetooth Earbuds"), specific descriptions, and plausible prices (e.g. "UGX 45,000", "$29.99").
- Hero headlines should be commerce-oriented: "Shop the Latest Collection", "New Arrivals This Season".
- CTAs should be shopping-focused: "Shop Now", "Browse Collection", "Add to Cart".
- Offer sections should have real discount language: "20% Off First Order", "Buy 2 Get 1 Free".
- Testimonials should reference product quality and delivery experience.
- FAQs should cover shipping, returns, sizing, payment methods.
- Gallery items should represent product lifestyle imagery.
- Generate product specs where relevant: material, size, weight, color options.`,

  store_listing: `You are generating content for a WHOLESALE/TRADING STORE (Estore).
Content rules:
- Listings MUST have bulk/wholesale product names (e.g. "Premium Cement 50kg Bag", "Refined Sunflower Oil 20L Jerrycan"), with MOQ-style pricing (e.g. "UGX 32,000/bag", "$150/carton").
- Hero headlines should be B2B: "Your Trusted Wholesale Supplier", "Quality Products at Scale".
- Products must include bulk descriptions: pack sizes, minimum order quantities, weight/volume.
- CTAs: "Request Quote", "Contact for Bulk Pricing", "View Catalog".
- Testimonials from business buyers referencing reliability, consistency, and delivery.
- FAQs about bulk ordering, delivery lead times, payment terms, credit facilities.
- Categories should be industry-specific: "Building Materials", "Food Commodities", "Industrial Supplies".`,

  emenu: `You are generating content for a DIGITAL RESTAURANT MENU (Emenu).
Content rules:
- Menu items MUST have appetizing dish names (e.g. "Grilled Tilapia with Coconut Rice", "Espresso Macchiato"), vivid descriptions, and realistic prices (e.g. "UGX 25,000", "$12.50").
- Menu categories should be proper: "Starters", "Main Course", "Beverages", "Desserts", "Sides".
- Each menu item description should mention key ingredients, cooking method, or serving style.
- Hero headlines: "Welcome to [Restaurant Name]", "Taste the Difference".
- CTAs: "View Full Menu", "Order Now", "Reserve a Table".
- Hours section should have realistic restaurant hours (e.g. Mon-Fri: 8:00 AM - 10:00 PM).
- Testimonials should reference food quality, ambiance, service.
- FAQs about allergens, dietary options (vegan/halal), delivery radius, reservation policy.
- Offer items should be meal deals: "Lunch Combo: Main + Drink for UGX 18,000".`,

  quick_site: `You are generating content for a PROFESSIONAL BUSINESS WEBSITE (Esite).
Content rules:
- Services MUST have specific names (e.g. "Brand Strategy Consulting", "Residential Electrical Installation"), detailed descriptions, and pricing where applicable.
- Hero headlines should be professional and benefit-driven: "Transform Your Business", "Expert Solutions You Can Trust".
- About sections should tell the business story: founding year, mission, unique value proposition.
- CTAs: "Get a Free Consultation", "Contact Us Today", "Learn More".
- Testimonials should reference specific results: "Increased our revenue by 40%", "Professional and reliable team".
- FAQs about service process, timelines, pricing structure, guarantees.
- Contact must include realistic placeholder data: email, phone number format, address format.
- Plans/pricing should have tiered structures: Basic, Professional, Enterprise with feature lists.`,

  live_bio: `You are generating content for an INFLUENCER BIO-LINK PAGE.
Content rules:
- Bio text must be personal, energetic, and niche-specific: "🔥 Fitness Coach | Helping 10K+ people transform their bodies".
- Links should be platform-specific: "Watch My Latest YouTube Video", "Shop My Favorites", "Book a 1-on-1 Session".
- Hero headlines should be personality-driven: "Hey, I'm [Name]!", "Creator | Mentor | Dreamer".
- CTAs: "Follow Me", "Join My Community", "Shop My Picks", "Book Me".
- Social handles should use realistic @handle format.
- Gallery should represent content highlights, behind-the-scenes, brand collaborations.
- Products (if applicable) should be creator merch or affiliate products with catchy names.
- Featured items should be "Latest Video", "New Podcast Episode", "Brand Collaboration".
- Testimonials from brands or followers: "Amazing content creator to work with".`,

  community_group: `You are generating content for a COMMUNITY LANDING PAGE.
Content rules:
- Headline should inspire belonging: "Join a Community That Empowers You", "Connect, Learn, Grow Together".
- About/text sections should describe the community mission, values, and what members gain.
- Rules should be community guidelines: "Be Respectful", "No Spam", "Share Knowledge Freely".
- Plans should be membership tiers: "Free Member", "Premium Member ($5/mo)", "Founding Member ($20/mo)".
- Join section should have compelling signup copy: "Become Part of Something Bigger".
- Events/schedule should list community activities: "Weekly Masterclass", "Monthly Networking Mixer".
- CTAs: "Join Now", "Apply for Membership", "Learn More".
- FAQs about membership benefits, cancellation, community rules, events schedule.
- Testimonials from members: "This community changed my career trajectory".`,

  community_listing: `You are generating content for a COMMUNITY LISTING PAGE.
Content rules:
- Same as community_group but focused on discovery and public-facing content.
- Listings should showcase community highlights, featured members, recent events.
- CTAs should drive signups: "Join This Community", "Request to Join".`,
};

// Fallback for surface types not explicitly mapped
const DEFAULT_SURFACE_GUIDE = `You are generating content for a website.
Content rules:
- Generate realistic, compelling content — never use lorem ipsum or generic placeholder text.
- All names, descriptions, prices, and copy should feel like they belong to a real business.
- CTAs should be action-oriented and specific to the context.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Quota check ──
    const { data: quotaResult, error: quotaErr } = await supabase.rpc("check_and_increment_quota", {
      p_quota_key: "builder_ai_section",
    });
    if (quotaErr) throw new Error(quotaErr.message);
    const quota = quotaResult as { ok: boolean; code: string };
    if (!quota.ok) {
      return new Response(JSON.stringify({ ok: false, error: "quota_exceeded", details: quota }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Validate input ──
    const { surface_type, section_type, prompt } = await req.json();

    if (!VALID_SURFACE_TYPES.includes(surface_type)) {
      return new Response(JSON.stringify({ ok: false, error: "unsupported_surface_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!VALID_SECTION_TYPES.includes(section_type)) {
      return new Response(JSON.stringify({ ok: false, error: "unsupported_section_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── AI call with editor-type-aware prompting ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const surfaceGuide = SURFACE_CONTENT_GUIDES[surface_type] || DEFAULT_SURFACE_GUIDE;

    const systemPrompt = `${surfaceGuide}

You are generating a "${section_type}" section.

Return ONLY valid JSON matching this exact schema: ${SCHEMA_SPECS[section_type]}

CRITICAL RULES:
- Output ONLY the raw JSON object, no markdown fences, no explanation, no extra text.
- ALL text content MUST be realistic, specific, and compelling — NEVER use "Lorem ipsum", "Sample", "Example", "Item 1", "Product 1", or any generic placeholder.
- Product/item names must be specific and believable (e.g. "Organic Shea Butter Moisturizer" not "Product 1").
- Descriptions must be detailed and relevant (2-3 sentences minimum for items, 1-3 paragraphs for text/about sections).
- Prices must be realistic with proper currency formatting where applicable.
- CTA text must be action-oriented and context-appropriate.
- For any image_url, src, or media.url fields, leave them as empty strings "". AI images will be generated separately after text content is created.
- Do NOT use picsum.photos, placeholder.com, or any placeholder image URLs.
- If the user's prompt mentions a specific business or context, tailor ALL content to that business.`;

    const userPrompt = prompt?.trim()
      ? prompt.trim()
      : `Generate compelling, realistic ${section_type} content for a ${surface_type} page. Make it feel like real business content, not a template.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ ok: false, error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ ok: false, error: "payment_required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    console.log("[builder-ai-generate-section] Raw content:", content.slice(0, 1500));

    let schema: Record<string, unknown> = {};
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      schema = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[builder-ai-generate-section] JSON parse failed:", parseErr, "content:", content.slice(0, 500));
      return new Response(JSON.stringify({ ok: false, error: "AI returned invalid JSON. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (Object.keys(schema).length === 0) {
      console.error("[builder-ai-generate-section] Empty schema");
      return new Response(JSON.stringify({ ok: false, error: "AI returned empty content. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Safe field normalization ──
    // Ensure items arrays are always arrays
    for (const key of ["items", "categories"]) {
      if (schema[key] !== undefined && !Array.isArray(schema[key])) {
        schema[key] = [];
      }
    }
    // Normalize menu categories items
    if (Array.isArray(schema.categories)) {
      for (const cat of schema.categories as any[]) {
        if (cat && typeof cat === "object" && cat.items !== undefined && !Array.isArray(cat.items)) {
          cat.items = [];
        }
      }
    }
    // Ensure string fields are strings
    for (const key of ["heading", "headline", "subheadline", "body", "text", "label", "description"]) {
      if (schema[key] !== undefined && typeof schema[key] !== "string") {
        schema[key] = String(schema[key] ?? "");
      }
    }

    console.log("[builder-ai-generate-section] Final schema keys:", Object.keys(schema));
    return new Response(JSON.stringify({ ok: true, schema }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("builder-ai-generate-section error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});