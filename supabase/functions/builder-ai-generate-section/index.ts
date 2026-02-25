import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_SURFACE_TYPES = ["live_bio", "emenu", "quick_site", "eshop", "store_listing", "community_listing", "community_group", "live_selling", "studio_showcase"];
const VALID_SECTION_TYPES = ["hero", "bio", "links", "social", "cta", "video", "gallery", "text", "about", "offer", "plans", "rules", "join", "products", "categories", "listings", "filters", "services", "testimonials", "faq", "contact", "schedule", "menu", "hours", "location"];

const SCHEMA_SPECS: Record<string, string> = {
  hero: '{"headline": "string", "subheadline": "string"}',
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

Return ONLY valid JSON matching this schema: ${SCHEMA_SPECS[section_type]}

No markdown, no explanation, just the JSON object.`;

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
          { role: "user", content: prompt || `Generate compelling content for a ${section_type} section.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_section_schema",
            description: "Return the generated section schema",
            parameters: {
              type: "object",
              properties: {
                schema: { type: "object", description: "The section schema matching the required format" },
              },
              required: ["schema"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_section_schema" } },
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

    return new Response(JSON.stringify({ ok: true, schema: args.schema }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("builder-ai-generate-section error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
