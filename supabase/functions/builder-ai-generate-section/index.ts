import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_SURFACE_TYPES = ["live_bio", "emenu", "quick_site", "eshop", "store_listing", "community_listing", "community_group", "live_selling", "studio_showcase"];
const VALID_SECTION_TYPES = ["hero", "featured", "bio", "links", "social", "cta", "video", "gallery", "text", "about", "offer", "plans", "rules", "join", "products", "categories", "listings", "filters", "services", "testimonials", "faq", "contact", "schedule", "menu", "hours", "location"];

const SCHEMA_SPECS: Record<string, string> = {
  hero: '{"headline": "string", "subheadline": "string", "cta_text": "string (button text)", "cta_href": "string (url)"}',
  featured: '{"title": "string", "items": [{"title": "string", "description": "string", "image_url": "string (placeholder url)", "href": "string"}]} (3-6 items)',
  bio: '{"text": "string (1-3 paragraphs)"}',
  links: '{"items": [{"label": "string", "url": "string"}]} (2-5 items)',
  social: '{"handles": {"instagram": "string", "twitter": "string", "tiktok": "string", ...}} (include relevant ones)',
  cta: '{"label": "string (button text)", "href": "string (url)"}',
  video: '{"url": "string (youtube or similar url)"}',
  gallery: '{"items": [{"src": "string (placeholder url)", "alt": "string"}]} (3-6 items)',
  text: '{"heading": "string", "body": "string (1-3 paragraphs)"}',
  about: '{"heading": "string", "body": "string (1-3 paragraphs)"}',
  offer: '{"heading": "string", "items": [{"title": "string", "price": "string", "description": "string"}]} (2-5 items)',
  plans: '{"heading": "string", "items": [{"name": "string", "price": "string", "description": "string"}]} (2-4 items)',
  rules: '{"heading": "string", "items": [{"title": "string", "description": "string"}]}',
  join: '{"label": "string", "url": "string", "description": "string"}',
  products: '{"heading": "string", "items": [{"name": "string", "price": "string", "description": "string"}]} (3-6 items)',
  categories: '{"heading": "string", "items": [{"name": "string", "description": "string"}]}',
  listings: '{"heading": "string", "items": [{"name": "string", "price": "string", "description": "string"}]}',
  filters: '{"heading": "string", "keys": ["string"]}',
  services: '{"heading": "string", "items": [{"name": "string", "price": "string", "description": "string"}]} (3-5 items)',
  testimonials: '{"heading": "string", "items": [{"name": "string", "quote": "string"}]} (2-4 items)',
  faq: '{"heading": "string", "items": [{"question": "string", "answer": "string"}]} (3-5 items)',
  contact: '{"heading": "string", "email": "string", "phone": "string", "address": "string"}',
  schedule: '{"heading": "string", "items": [{"day": "string", "time": "string"}]}',
  menu: '{"heading": "string", "categories": [{"name": "string", "items": [{"name": "string", "price": "string", "description": "string"}]}]}',
  hours: '{"heading": "string", "items": [{"day": "string", "hours": "string"}]}',
  location: '{"heading": "string", "address": "string", "mapUrl": "string"}',
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

    // ── AI call ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a content generator for a website builder. Generate content for a "${section_type}" section on a "${surface_type}" page.

Return ONLY valid JSON matching this exact schema: ${SCHEMA_SPECS[section_type]}

Rules:
- Output ONLY the raw JSON object, no markdown fences, no explanation, no extra text.
- Fill in realistic, compelling placeholder content based on the user's prompt.
- All string values must be non-empty.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt || `Generate compelling content for a ${section_type} section.` },
        ],
        temperature: 0.7,
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
