import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENGINE_CONTEXTS: Record<string, string> = {
  emenu: "a digital restaurant/food menu with menu categories and food items. Generate REAL appetizing dish names (e.g. 'Grilled Tilapia with Coconut Rice', 'Espresso Macchiato'), vivid descriptions mentioning ingredients and cooking methods, realistic prices (e.g. 'UGX 25,000'), and proper menu categories (Starters, Main Course, Beverages, Desserts). Never use generic names like 'Item 1' or 'Dish A'.",
  esite: "a professional business website with services and contact info. Generate REAL service names (e.g. 'Brand Strategy Consulting', 'Residential Electrical Installation'), detailed benefit-driven descriptions, professional about copy with mission and values, and tiered pricing where applicable. Testimonials should reference specific results.",
  eshop: "an online shop with product listings and collections. Generate REAL product names (e.g. 'Ankara Print Midi Dress', 'Wireless Bluetooth Earbuds'), specific descriptions with materials/features, plausible prices (e.g. 'UGX 45,000', '$29.99'), and commerce-oriented CTAs. Never use 'Product 1' or generic names.",
  estore: "a wholesale/trading store with catalog and bulk pricing. Generate REAL wholesale product names (e.g. 'Premium Cement 50kg Bag', 'Refined Sunflower Oil 20L Jerrycan'), B2B descriptions with pack sizes and MOQs, bulk pricing (e.g. 'UGX 32,000/bag'), and trade-focused CTAs like 'Request Quote'.",
  influencer: "a creator bio-link page with social links and media showcase. Generate personal, energetic bio copy, platform-specific links ('Watch My Latest YouTube Video', 'Shop My Favorites'), personality-driven headlines, creator merch or affiliate products with catchy names, and brand collaboration highlights.",
  community: "a community landing page with member signup and events. Generate mission-driven headlines ('Join a Community That Empowers You'), membership tier descriptions, community guidelines, event listings ('Weekly Masterclass', 'Monthly Networking Mixer'), and member testimonials about community impact.",
};

/* ─── Image Completion Helpers ─── */

/** Build search queries based on business context */
function buildSearchQueries(businessName: string, category: string, location: string, description: string): string[] {
  const queries: string[] = [];
  const cat = category?.toLowerCase() || "";
  const loc = location || "";

  // Category-specific queries
  if (cat.includes("restaurant") || cat.includes("cafe") || cat.includes("food") || cat.includes("coffee")) {
    queries.push(
      `${cat} interior design`,
      "food plating restaurant",
      "coffee shop atmosphere",
      "dining experience people",
      "chef cooking kitchen",
      "restaurant table setting",
      "cafe latte art",
      "fresh food ingredients",
      "bakery pastries display",
      "cozy restaurant ambiance",
    );
  } else if (cat.includes("salon") || cat.includes("beauty") || cat.includes("spa")) {
    queries.push("beauty salon interior", "spa treatment", "hair styling", "manicure nails", "beauty products display", "relaxation spa", "salon chairs mirrors", "skincare routine");
  } else if (cat.includes("gym") || cat.includes("fitness")) {
    queries.push("modern gym interior", "fitness training", "workout equipment", "personal training", "yoga class", "sports motivation", "gym weights", "fitness lifestyle");
  } else if (cat.includes("hotel") || cat.includes("lodge") || cat.includes("accommodation")) {
    queries.push("luxury hotel room", "hotel lobby", "hotel pool", "resort amenities", "comfortable bedroom", "hotel restaurant", "spa wellness hotel", "travel accommodation");
  } else if (cat.includes("shop") || cat.includes("store") || cat.includes("retail")) {
    queries.push("retail store interior", "shopping products display", "modern store design", "boutique shop", "product showcase", "retail customer experience", "store shelves organized", "shopping bags");
  } else {
    // Generic business
    queries.push(
      `${category || "business"} professional`,
      "modern office workspace",
      "team collaboration",
      "professional services",
      "business meeting",
      "customer service",
      "quality craftsmanship",
      "brand identity design",
    );
  }

  // Add location-specific if available
  if (loc) {
    queries.push(`${loc} business`, `${loc} city`);
  }

  return queries;
}

/** Fetch stock photos from Pexels API */
async function fetchPexelsPhotos(query: string, count: number, apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&size=large`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map((p: any) => p.src?.large2x || p.src?.large || p.src?.original).filter(Boolean);
  } catch {
    return [];
  }
}

/** Gather enough stock photos for all sections */
async function gatherStockPhotos(
  needed: number,
  businessName: string,
  category: string,
  location: string,
  description: string,
): Promise<string[]> {
  const apiKey = Deno.env.get("PEXELS_API_KEY");
  if (!apiKey || needed <= 0) return [];

  const queries = buildSearchQueries(businessName, category, location, description);
  const collected: string[] = [];
  const seen = new Set<string>();

  // Fetch from multiple queries to get diverse images
  for (const query of queries) {
    if (collected.length >= needed) break;
    const perQuery = Math.min(5, needed - collected.length + 2); // fetch a few extra for diversity
    const photos = await fetchPexelsPhotos(query, perQuery, apiKey);
    for (const url of photos) {
      if (!seen.has(url) && collected.length < needed) {
        seen.add(url);
        collected.push(url);
      }
    }
  }

  return collected;
}

/* ─── Section image counting ─── */

interface ImageSlot {
  sectionIdx: number;
  field: string; // e.g. "media.url", "items.0.src", "items.0.image_url"
  current: string | null;
  isPlaceholder: boolean;
}

function isPlaceholderUrl(url: unknown): boolean {
  if (!url || typeof url !== "string") return true;
  if (!url.startsWith("http")) return true;
  const lower = url.toLowerCase();
  return lower.includes("picsum") || lower.includes("placeholder") || lower.includes("example.com") || lower.includes("via.placeholder");
}

function countImageSlots(sections: any[]): { filled: ImageSlot[]; empty: ImageSlot[] } {
  const filled: ImageSlot[] = [];
  const empty: ImageSlot[] = [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const schema = s.schema || {};

    if (s.type === "hero") {
      const url = schema.media?.url || schema.media_url;
      const slot: ImageSlot = { sectionIdx: i, field: "media.url", current: url || null, isPlaceholder: isPlaceholderUrl(url) };
      (slot.isPlaceholder ? empty : filled).push(slot);
    }

    if (s.type === "gallery" && Array.isArray(schema.items)) {
      for (let j = 0; j < schema.items.length; j++) {
        const item = schema.items[j];
        const url = item?.src || item?.url || item?.image_url;
        const slot: ImageSlot = { sectionIdx: i, field: `items.${j}.src`, current: url || null, isPlaceholder: isPlaceholderUrl(url) };
        (slot.isPlaceholder ? empty : filled).push(slot);
      }
    }

    if ((s.type === "products" || s.type === "categories" || s.type === "collections") && Array.isArray(schema.items)) {
      for (let j = 0; j < schema.items.length; j++) {
        const item = schema.items[j];
        const url = item?.image_url || item?.src;
        const slot: ImageSlot = { sectionIdx: i, field: `items.${j}.image_url`, current: url || null, isPlaceholder: isPlaceholderUrl(url) };
        (slot.isPlaceholder ? empty : filled).push(slot);
      }
    }
  }

  return { filled, empty };
}

/** Minimum image requirements */
const MIN_IMAGES: Record<string, number> = {
  hero: 1,
  gallery: 6,
  products: 4,
  categories: 4,
  collections: 4,
};

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
      p_quota_key: "builder_ai_business_profile",
    });
    if (quotaErr) throw new Error(quotaErr.message);
    const quota = quotaResult as { ok: boolean; code: string };
    if (!quota.ok) {
      return new Response(JSON.stringify({ ok: false, error: "quota_exceeded", details: quota }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Input ──
    const { engineKey, answers, allowedSectionTypes, source, source_url } = await req.json();
    const context = ENGINE_CONTEXTS[engineKey] || "a business";

    const businessPhotos: string[] = answers?.photos || [];
    const businessDescription: string = answers?.business_description || "";
    const businessName: string = answers?.business_name || "";
    const industry: string = answers?.industry || "";
    const location: string = answers?.location || "";

    const answerLines = Object.entries(answers || {})
      .filter(([k, v]) => k !== "photos" && v && String(v).trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const sourceContext = source && source !== "manual"
      ? `\nImport source: ${source}${source_url ? ` (${source_url})` : ""}`
      : "";

    const hasPhotos = businessPhotos.length > 0;
    const photoInstruction = hasPhotos
      ? `\n\nIMPORTANT: The business has ${businessPhotos.length} real photos. You MUST use these exact URLs in the sections:
${businessPhotos.map((url: string, i: number) => `Photo ${i + 1}: ${url}`).join("\n")}

Use Photo 1 as the hero image in the media object: { "type": "image", "url": "<Photo 1 URL>", "fit": "cover", "source": "google" }.
Use remaining photos in gallery (as "src" fields), products (as "image_url" fields), or collections/categories sections.
Do NOT use placeholder images — only use the provided photo URLs.`
      : "";

    // ── AI call ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const allowedTypes = allowedSectionTypes || ["hero", "text", "contact", "cta"];

    const systemPrompt = `You are a website builder AI. Generate content for ${context}.

Based on the user's business information, create a REAL branded page that looks like it belongs to this specific business.

CRITICAL RULES:
1. The business name must be "${businessName || "the provided name"}"
2. Write compelling, SPECIFIC copy — NEVER use "Lorem ipsum", "Sample", "Example", "Item 1", "Product 1", or any generic placeholder text.
3. Product/item names MUST be realistic and specific (e.g. "Organic Shea Butter Moisturizer" not "Product 1", "Grilled Tilapia with Coconut Rice" not "Dish A").
4. Descriptions MUST be detailed (2-3 sentences for items, 1-3 paragraphs for text sections) and mention specifics about the business.
5. Prices MUST be realistic with proper currency formatting.
6. The primary_color must be a bold, appropriate color for a ${industry || "business"} brand.
7. Every section schema must have fully populated, specific content.
${businessDescription ? `8. Use this description as inspiration: "${businessDescription}"` : ""}
${location ? `9. Reference the location: "${location}"` : ""}

SECTION SCHEMA REQUIREMENTS (use EXACTLY these field names):
- hero section: "headline" (string — brand-specific, compelling), "subheadline" (string — value proposition), "cta_text" (string — action-oriented), "media" object with { "type": "image", "url": "<image URL>", "fit": "cover" }
- text/about section: "heading" (string), "body" (string — tell the business story, founding, mission, unique value)
- gallery section: "heading" (string), "items" array of {"name": string (descriptive caption), "src": "<image URL>"}. MUST have at least 6 items.
- products section: "heading" (string), "items" array of {"name": string (REAL product name), "price": string (realistic price), "image_url": "<image URL>", "description": string (2-3 sentences with features/materials)}. MUST have at least 4 items.
- menu section: "heading" (string), "categories" array of {"name": string, "items": [{"name": string (REAL dish name), "price": string, "description": string (ingredients, cooking method)}]}. MUST have at least 3 categories with 3-5 items each.
- services section: "heading" (string), "items" array of {"name": string (REAL service name), "price": string, "description": string, "icon": string (emoji)}
- listings section: "heading" (string), "items" array of {"name": string, "price": string, "description": string, "image_url": string}
- collections/categories section: "heading" (string), "items" array of {"name": string (specific category name), "image_url": "<image URL>"}
- contact section: "heading" (string), "phone" (string), "address" (string), "email" (string)
- offer section: "heading" (string), "description" (string), "items" array of {"title": string, "description": string, "price": string}
- cta section: "label" (string — specific action), "url" (string)
- footer section: "heading" (string), "email" (string), "phone" (string), "address" (string)
- testimonials section: "heading" (string), "items" array of {"name": string (realistic name), "quote": string (specific testimonial mentioning results)}
- faq section: "heading" (string), "items" array of {"question": string, "answer": string (detailed answer)}
- plans section: "heading" (string), "items" array of {"name": string (tier name), "price": string, "description": string (feature list)}
- rules section: "heading" (string), "items" array of {"title": string, "description": string}
- join section: "label" (string), "url" (string), "description" (string — compelling reason to join)
${photoInstruction}

ALLOWED section types: ${allowedTypes.join(", ")}
You MUST only use section types from the allowed list above.
Generate 5-7 sections minimum. Always include content-rich items in every section.`;

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
          { role: "user", content: `${answerLines}${sourceContext}\n\nGenerate a complete, branded page for this business. Every item must have a REAL specific name, detailed description, and realistic price. Make it feel like a real, established business — not a template.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_draft_surface",
            description: "Return the generated draft surface with sections",
            parameters: {
              type: "object",
              properties: {
                business_name: { type: "string", description: "Page/business name" },
                description: { type: "string", description: "1-2 sentence brand description" },
                primary_color: { type: "string", description: "Hex color code matching the brand" },
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Section type from allowed list" },
                      schema: { type: "object", description: "Section content schema with all required fields populated" },
                    },
                    required: ["type", "schema"],
                  },
                  description: "Page sections (5-7 sections)",
                },
              },
              required: ["business_name", "description", "primary_color", "sections"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_draft_surface" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ ok: false, error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ ok: false, error: "payment_required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const args = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    // Filter sections to only allowed types
    let filteredSections = (args.sections || []).filter(
      (s: { type: string }) => allowedTypes.includes(s.type)
    );

    // ────────────────────────────────────────────────
    // PHASE 1: Merge standalone contact into footer
    // ────────────────────────────────────────────────
    const contactIdx = filteredSections.findIndex((s: { type: string }) => s.type === "contact");
    const footerIdx = filteredSections.findIndex((s: { type: string }) => s.type === "footer");
    if (contactIdx >= 0 && footerIdx >= 0) {
      const contactSchema = filteredSections[contactIdx].schema || {};
      const footerSchema = filteredSections[footerIdx].schema || {};
      if (!footerSchema.email && contactSchema.email) footerSchema.email = contactSchema.email;
      if (!footerSchema.phone && contactSchema.phone) footerSchema.phone = contactSchema.phone;
      if (!footerSchema.address && contactSchema.address) footerSchema.address = contactSchema.address;
      filteredSections = filteredSections.filter((_: unknown, i: number) => i !== contactIdx);
    }

    // ────────────────────────────────────────────────
    // PHASE 2: Inject Google photos into sections
    // ────────────────────────────────────────────────
    let googlePhotoIdx = 0;
    const usedGoogleUrls = new Set<string>();

    for (const section of filteredSections) {
      const schema = section.schema || {};
      section.schema = schema;

      // Hero — ensure media.url has a real photo
      if (section.type === "hero") {
        const media = (schema.media as Record<string, unknown>) || {};
        const mediaUrl = media.url || (schema as any).media_url;
        if (isPlaceholderUrl(mediaUrl) && googlePhotoIdx < businessPhotos.length) {
          schema.media = { type: "image", url: businessPhotos[googlePhotoIdx], fit: "cover", source: "google" };
          usedGoogleUrls.add(businessPhotos[googlePhotoIdx]);
          googlePhotoIdx++;
        } else if (mediaUrl && !isPlaceholderUrl(mediaUrl)) {
          schema.media = { type: "image", url: mediaUrl, fit: "cover", source: "google" };
          if (!schema.media.url.includes("pexels")) usedGoogleUrls.add(mediaUrl);
          googlePhotoIdx = Math.max(googlePhotoIdx, 1);
        } else if (!schema.media || typeof schema.media !== "object") {
          if (googlePhotoIdx < businessPhotos.length) {
            schema.media = { type: "image", url: businessPhotos[googlePhotoIdx], fit: "cover", source: "google" };
            usedGoogleUrls.add(businessPhotos[googlePhotoIdx]);
            googlePhotoIdx++;
          } else {
            schema.media = { type: "image", url: "", fit: "cover", source: "pending" };
          }
        }
        if (!schema.headline) schema.headline = businessName || "Welcome";
        if (!schema.subheadline) schema.subheadline = args.description || `Welcome to ${businessName}`;
        if (!schema.cta_text) schema.cta_text = schema.cta_label || "Explore";
        delete schema.cta_label;
      }

      // Text/about
      if (section.type === "text") {
        if (!schema.heading) schema.heading = `About ${businessName}`;
        if (!schema.body) schema.body = businessDescription || args.description || `${businessName} is located at ${location}. We're proud to serve our community with quality ${industry || "products and services"}.`;
      }

      // Gallery — inject Google photos
      if (section.type === "gallery") {
        if (!schema.heading) schema.heading = "Gallery";
        if (!schema.items || !Array.isArray(schema.items) || schema.items.length === 0) {
          const galleryPhotos = businessPhotos.slice(googlePhotoIdx);
          schema.items = galleryPhotos.map((url: string, i: number) => ({
            name: `Photo ${i + 1}`, src: url, source: "google",
          }));
          galleryPhotos.forEach((u: string) => usedGoogleUrls.add(u));
          googlePhotoIdx = businessPhotos.length;
        } else {
          for (const item of schema.items) {
            if (item.image_url && !item.src) item.src = item.image_url;
            if (googlePhotoIdx < businessPhotos.length && isPlaceholderUrl(item.src)) {
              item.src = businessPhotos[googlePhotoIdx];
              item.source = "google";
              usedGoogleUrls.add(businessPhotos[googlePhotoIdx]);
              googlePhotoIdx++;
            }
          }
          // Add remaining Google photos
          while (googlePhotoIdx < businessPhotos.length && schema.items.length < 12) {
            const url = businessPhotos[googlePhotoIdx];
            schema.items.push({ name: `Photo ${schema.items.length + 1}`, src: url, source: "google" });
            usedGoogleUrls.add(url);
            googlePhotoIdx++;
          }
        }
      }

      // Products/categories/collections
      if ((section.type === "products" || section.type === "categories" || section.type === "collections") && googlePhotoIdx < businessPhotos.length) {
        if (!schema.heading) schema.heading = section.type === "products" ? "Our Products" : "Collections";
        if (!schema.items || !Array.isArray(schema.items) || schema.items.length === 0) {
          const count = Math.min(4, businessPhotos.length - googlePhotoIdx);
          schema.items = [];
          for (let i = 0; i < count; i++) {
            const url = businessPhotos[googlePhotoIdx];
            schema.items.push({
              name: `Item ${i + 1}`,
              description: `Quality ${industry || "product"} from ${businessName}`,
              image_url: url,
              source: "google",
              ...(section.type === "products" ? { price: "" } : {}),
            });
            usedGoogleUrls.add(url);
            googlePhotoIdx++;
          }
        } else {
          for (const item of schema.items) {
            if (googlePhotoIdx < businessPhotos.length && isPlaceholderUrl(item.image_url)) {
              item.image_url = businessPhotos[googlePhotoIdx];
              item.source = "google";
              usedGoogleUrls.add(businessPhotos[googlePhotoIdx]);
              googlePhotoIdx++;
            }
          }
        }
      }

      // Contact
      if (section.type === "contact") {
        if (!schema.heading) schema.heading = "Contact Us";
        if (!schema.phone && answers?.contact_phone) schema.phone = answers.contact_phone;
        if (!schema.address && location) schema.address = location;
        if (!schema.email) schema.email = "";
      }
    }

    // If unused Google photos remain and no gallery, add one
    if (googlePhotoIdx < businessPhotos.length && !filteredSections.some((s: { type: string }) => s.type === "gallery") && allowedTypes.includes("gallery")) {
      const remainingPhotos = businessPhotos.slice(googlePhotoIdx);
      const galleryItems = remainingPhotos.map((url: string, i: number) => ({
        name: `Photo ${i + 1}`, src: url, source: "google",
      }));
      const insertIdx = filteredSections.findIndex((s: { type: string }) => s.type === "footer" || s.type === "contact");
      const gallerySection = { type: "gallery", schema: { heading: "Gallery", items: galleryItems } };
      if (insertIdx >= 0) {
        filteredSections.splice(insertIdx, 0, gallerySection);
      } else {
        filteredSections.push(gallerySection);
      }
    }

    // ────────────────────────────────────────────────
    // PHASE 3: AI IMAGE GENERATION — fill gaps with real AI images
    // ────────────────────────────────────────────────
    const { empty: emptySlots } = countImageSlots(filteredSections);

    // Build image prompts per editor type
    const IMAGE_PROMPT_CONTEXT: Record<string, string> = {
      eshop: "Professional ecommerce product photography, clean white background, studio lighting, high resolution product shot",
      estore: "Commercial catalog product photography, wholesale industrial style, clean professional background",
      emenu: "Professional food photography, appetizing plating, restaurant-quality presentation, warm lighting",
      esite: "Professional business photography, modern corporate style, clean composition",
      influencer: "Creator lifestyle photography, vibrant social media aesthetic, engaging visual",
      community: "Community event photography, diverse people, warm welcoming atmosphere",
    };
    const imageContext = IMAGE_PROMPT_CONTEXT[engineKey] || "Professional photography, clean composition";

    // Cap: generate at most 6 AI images per draft to stay performant
    const AI_IMAGE_CAP = 6;
    const slotsToFill = emptySlots.slice(0, AI_IMAGE_CAP);
    
    if (slotsToFill.length > 0) {
      console.log(`[builder-ai] AI Image generation: ${slotsToFill.length} slots to fill (capped from ${emptySlots.length})`);
      
      // Build prompts for each slot
      const imageJobs: { slot: ImageSlot; prompt: string }[] = [];
      for (const slot of slotsToFill) {
        const section = filteredSections[slot.sectionIdx];
        const schema = section.schema || {};
        let itemPrompt = "";

        if (slot.field === "media.url") {
          // Hero image
          const headline = schema.headline || businessName || "";
          itemPrompt = `${imageContext}. Hero banner for "${businessName}": ${headline}. ${industry || ""} business${location ? ` in ${location}` : ""}.`;
        } else if (slot.field.startsWith("items.")) {
          const parts = slot.field.split(".");
          const idx = parseInt(parts[1], 10);
          if (Array.isArray(schema.items) && idx < schema.items.length) {
            const item = schema.items[idx];
            const itemName = item?.name || item?.title || `Item ${idx + 1}`;
            const itemDesc = item?.description || "";
            if (section.type === "gallery") {
              itemPrompt = `${imageContext}. ${itemName} for ${businessName}. ${itemDesc}`.trim();
            } else if (section.type === "products" || section.type === "listings") {
              itemPrompt = `${imageContext}. Product photo of "${itemName}". ${itemDesc}`.trim();
            } else if (section.type === "menu") {
              itemPrompt = `Professional food photography, appetizing plating, restaurant-quality. Dish: "${itemName}". ${itemDesc}`.trim();
            } else {
              itemPrompt = `${imageContext}. ${itemName}. ${itemDesc}`.trim();
            }
          }
        }

        if (itemPrompt) {
          imageJobs.push({ slot, prompt: itemPrompt });
        }
      }

      // Generate images in parallel batches of 3
      const BATCH_SIZE = 3;
      for (let batchStart = 0; batchStart < imageJobs.length; batchStart += BATCH_SIZE) {
        const batch = imageJobs.slice(batchStart, batchStart + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (job) => {
            try {
              const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-image",
                  prompt: job.prompt,
                  n: 1,
                  size: "1024x1024",
                  response_format: "b64_json",
                }),
              });

              if (!imgRes.ok) {
                console.warn(`[builder-ai] AI image gen failed (${imgRes.status}) for slot ${job.slot.field}`);
                return null;
              }

              const imgData = await imgRes.json();
              const b64 = imgData.data?.[0]?.b64_json;
              if (!b64) return null;

              // Decode and upload to builder-media
              const binaryStr = atob(b64);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

              const userId = claimsData.claims.sub as string;
              const storagePath = `${userId}/ai-draft/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
              
              const { error: uploadErr } = await adminClient.storage
                .from("builder-media")
                .upload(storagePath, bytes, { contentType: "image/png", upsert: false });

              if (uploadErr) {
                console.warn(`[builder-ai] Image upload failed for ${job.slot.field}:`, uploadErr.message);
                return null;
              }

              const { data: publicData } = adminClient.storage.from("builder-media").getPublicUrl(storagePath);
              return { slot: job.slot, url: publicData.publicUrl };
            } catch (err) {
              console.warn(`[builder-ai] AI image error for ${job.slot.field}:`, err);
              return null;
            }
          })
        );

        // Apply successful results
        for (const r of results) {
          if (r.status !== "fulfilled" || !r.value) continue;
          const { slot, url } = r.value;
          const section = filteredSections[slot.sectionIdx];
          const schema = section.schema || {};

          if (slot.field === "media.url") {
            if (!schema.media || typeof schema.media !== "object") schema.media = {};
            (schema.media as any).url = url;
            (schema.media as any).type = "image";
            (schema.media as any).fit = "cover";
            (schema.media as any).source = "ai";
          } else if (slot.field.startsWith("items.")) {
            const parts = slot.field.split(".");
            const idx = parseInt(parts[1], 10);
            const key = parts[2]; // "src" or "image_url"
            if (Array.isArray(schema.items) && idx < schema.items.length) {
              schema.items[idx][key] = url;
              schema.items[idx].source = "ai";
            }
          }
        }
      }

      console.log(`[builder-ai] AI image generation complete`);
    }

    // ── Remaining empty slots without Google photos: fallback to stock if available ──
    const { empty: stillEmpty } = countImageSlots(filteredSections);
    if (stillEmpty.length > 0) {
      const stockPhotos = await gatherStockPhotos(
        stillEmpty.length + 4,
        businessName,
        industry,
        location,
        businessDescription,
      );

      let stockIdx = 0;
      for (const slot of stillEmpty) {
        if (stockIdx >= stockPhotos.length) break;
        const section = filteredSections[slot.sectionIdx];
        const schema = section.schema || {};

        if (slot.field === "media.url") {
          if (!schema.media || typeof schema.media !== "object") schema.media = {};
          (schema.media as any).url = stockPhotos[stockIdx];
          (schema.media as any).type = "image";
          (schema.media as any).fit = "cover";
          (schema.media as any).source = "stock";
          stockIdx++;
        } else if (slot.field.startsWith("items.")) {
          const parts = slot.field.split(".");
          const idx = parseInt(parts[1], 10);
          const key = parts[2];
          if (Array.isArray(schema.items) && idx < schema.items.length) {
            schema.items[idx][key] = stockPhotos[stockIdx];
            schema.items[idx].source = "stock";
            stockIdx++;
          }
        }
      }
    }

    // ────────────────────────────────────────────────
    // PHASE 4: Final cleanup — keep items even without images
    // ────────────────────────────────────────────────
    // Don't strip items that lack images — they still have real text content

    return new Response(JSON.stringify({
      ok: true,
      business_name: args.business_name,
      description: args.description,
      primary_color: args.primary_color,
      sections: filteredSections,
      photos: businessPhotos,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("builder-ai-generate-draft error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
