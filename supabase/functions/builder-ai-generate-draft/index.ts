import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generates a full draft surface with sections using AI.
 * Accepts engine key + answers, returns sections + theme + metadata.
 * Uses tool calling for structured output.
 */

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

    // Build prompt from answers
    const answerLines = Object.entries(answers || {})
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const sourceContext = source && source !== "manual"
      ? `\nImport source: ${source}${source_url ? ` (${source_url})` : ""}`
      : "";

    // ── AI call ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const allowedTypes = allowedSectionTypes || ["hero", "text", "contact", "cta"];

    const systemPrompt = `You are a website builder AI. Generate content for ${context}.

Based on the user's answers, create:
1. A catchy business/page name
2. A compelling description (1-2 sentences)
3. A primary brand color (hex)
4. Section schemas for the page

ALLOWED section types: ${allowedTypes.join(", ")}
You MUST only use section types from the allowed list above.

Each section needs a "type" (from allowed list) and a "schema" object with relevant content.`;

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
          { role: "user", content: `${answerLines}${sourceContext}\n\nGenerate the complete page content.` },
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
                description: { type: "string", description: "1-2 sentence description" },
                primary_color: { type: "string", description: "Hex color code" },
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Section type from allowed list" },
                      schema: { type: "object", description: "Section content schema" },
                    },
                    required: ["type", "schema"],
                  },
                  description: "Page sections (3-8 sections)",
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

    // Filter sections to only allowed types (server-side boundary enforcement)
    const filteredSections = (args.sections || []).filter(
      (s: { type: string }) => allowedTypes.includes(s.type)
    );

    return new Response(JSON.stringify({
      ok: true,
      business_name: args.business_name,
      description: args.description,
      primary_color: args.primary_color,
      sections: filteredSections,
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
