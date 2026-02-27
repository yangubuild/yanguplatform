import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENGINE_CONTEXTS: Record<string, string> = {
  emenu: "a digital restaurant/food menu with menu categories and food items",
  esite: "a professional business website with services and contact info",
  eshop: "an online shop with product listings and collections",
  estore: "a wholesale/trading store with catalog and bulk pricing",
  influencer: "a creator bio-link page with social links and media showcase",
  community: "a community landing page with member signup and events",
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

    // Extract photos array if provided (from Google Places)
    const businessPhotos: string[] = answers?.photos || [];
    const businessDescription: string = answers?.business_description || "";
    const businessName: string = answers?.business_name || "";
    const industry: string = answers?.industry || "";
    const location: string = answers?.location || "";

    // Build prompt from answers (exclude photos array from text prompt)
    const answerLines = Object.entries(answers || {})
      .filter(([k, v]) => k !== "photos" && v && String(v).trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const sourceContext = source && source !== "manual"
      ? `\nImport source: ${source}${source_url ? ` (${source_url})` : ""}`
      : "";

    // Build image instruction
    const hasPhotos = businessPhotos.length > 0;
    const photoInstruction = hasPhotos
      ? `\n\nIMPORTANT: The business has ${businessPhotos.length} real photos. You MUST use these exact URLs in the sections:
${businessPhotos.map((url: string, i: number) => `Photo ${i + 1}: ${url}`).join("\n")}

Use Photo 1 as the hero image in the media object: { "type": "image", "url": "<Photo 1 URL>", "fit": "cover" }.
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
2. Write compelling, specific copy that mentions what THIS business does — not generic placeholder text
3. The primary_color must be a bold, appropriate color for a ${industry || "business"} brand
4. Every section schema must have populated, specific content
${businessDescription ? `5. Use this description as inspiration: "${businessDescription}"` : ""}
${location ? `6. Reference the location: "${location}"` : ""}

SECTION SCHEMA REQUIREMENTS (use EXACTLY these field names):
- hero section: "headline" (string), "subheadline" (string), "cta_text" (string), "media" object with { "type": "image", "url": "<image URL>", "fit": "cover" }
- text/about section: "heading" (string), "body" (string)  
- gallery section: "heading" (string), "items" array of {"name": string, "src": "<image URL>"}
- products section: "heading" (string), "items" array of {"name": string, "price": string, "image_url": "<image URL>", "description": string}
- collections/categories section: "heading" (string), "items" array of {"name": string, "image_url": "<image URL>"}
- contact section: "heading" (string), "phone" (string), "address" (string), "email" (string)
- offer section: "heading" (string), "description" (string), "items" array of {"title": string, "description": string, "price": string}
- cta section: "label" (string), "url" (string)
- footer section: "heading" (string), "email" (string), "phone" (string), "address" (string)
${photoInstruction}

ALLOWED section types: ${allowedTypes.join(", ")}
You MUST only use section types from the allowed list above.
Generate 5-7 sections minimum.`;

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
          { role: "user", content: `${answerLines}${sourceContext}\n\nGenerate a complete, branded page for this business. Make it feel real and specific to this brand.` },
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
    const filteredSections = (args.sections || []).filter(
      (s: { type: string }) => allowedTypes.includes(s.type)
    );

    // Post-process: inject real photos into sections if AI didn't use them
    if (hasPhotos) {
      let photoIdx = 0;
      for (const section of filteredSections) {
        const schema = section.schema || {};
        
        // Hero — ensure media.url has a real photo
        if (section.type === "hero") {
          const media = (schema.media as Record<string, unknown>) || {};
          const mediaUrl = media.url || (schema as any).media_url;
          if (!mediaUrl || !String(mediaUrl).startsWith("http")) {
            schema.media = { type: "image", url: businessPhotos[0], fit: "cover" };
            photoIdx = 1;
          } else if (!schema.media || typeof schema.media !== "object") {
            // AI returned media_url instead of media object — convert
            schema.media = { type: "image", url: mediaUrl, fit: "cover" };
            delete (schema as any).media_url;
            photoIdx = 1;
          }
        }

        // Fix hero field names: cta_label → cta_text
        if (section.type === "hero" && schema.cta_label && !schema.cta_text) {
          schema.cta_text = schema.cta_label;
          delete schema.cta_label;
        }

        // Gallery — ensure items have "src" field
        if (section.type === "gallery" && schema.items && Array.isArray(schema.items)) {
          for (const item of schema.items) {
            if (item.image_url && !item.src) {
              item.src = item.image_url;
            }
            if (photoIdx < businessPhotos.length && (!item.src || !String(item.src).startsWith("http"))) {
              item.src = businessPhotos[photoIdx];
              photoIdx++;
            }
          }
        }

        // Products/categories — inject photos into items
        if ((section.type === "products" || section.type === "categories" || section.type === "collections") && schema.items && Array.isArray(schema.items)) {
          for (const item of schema.items) {
            if (photoIdx < businessPhotos.length) {
              if (!item.image_url || !String(item.image_url).startsWith("http") || String(item.image_url).includes("placeholder")) {
                item.image_url = businessPhotos[photoIdx];
                photoIdx++;
              }
            }
          }
        }
      }
    }

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
