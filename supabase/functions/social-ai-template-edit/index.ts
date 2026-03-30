import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { template_id, instruction, brand_colors, fonts, logo_url, topic, variation_count } = body;

    if (!template_id || !instruction) {
      return new Response(JSON.stringify({ error: "template_id and instruction are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch template + layers
    const { data: template, error: tErr } = await supabase
      .from("social_design_templates")
      .select("*")
      .eq("id", template_id)
      .single();
    if (tErr) throw tErr;

    const { data: layers, error: lErr } = await supabase
      .from("social_template_layers")
      .select("*")
      .eq("template_id", template_id)
      .order("sort_order");
    if (lErr) throw lErr;

    // Build AI prompt
    const layerSummary = (layers || []).map((l: any) => ({
      id: l.id,
      type: l.layer_type,
      role: l.role,
      content: l.content,
      locked: l.locked,
    }));

    const systemPrompt = `You are a template design editor AI for YANGU social media platform.

RULES:
- You can ONLY modify text content, colors, and image sources within the provided layers.
- You must NEVER change layout positions, sizes, spacing, or proportions.
- You must NEVER destroy the template's visual identity.
- Preserve the design structure at all costs.
- Return valid JSON only.

TEMPLATE: "${template.name}" (${template.category})
COLOR SLOTS: ${JSON.stringify(template.color_slots || {})}
BRAND COLORS: ${JSON.stringify(brand_colors || {})}
FONTS: ${JSON.stringify(fonts || {})}
LOGO: ${logo_url || "none"}
${topic ? `TOPIC: ${topic}` : ""}

LAYERS (editable only):
${JSON.stringify(layerSummary.filter((l: any) => !l.locked), null, 2)}`;

    const variationPrompt =
      variation_count && variation_count > 1
        ? `\n\nGenerate ${variation_count} variations. Return a JSON array of ${variation_count} objects, each with "layer_overrides" and "color_overrides".`
        : `\nReturn a single JSON object with "layer_overrides" (array of {layer_id, content?, src?, style?}) and "color_overrides" (object with primary?, secondary?, accent? etc).`;

    const userPrompt = `${instruction}${variationPrompt}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: [
          {
            type: "function",
            function: {
              name: "apply_template_edits",
              description: "Apply edits to template layers and colors",
              parameters: {
                type: "object",
                properties: {
                  variations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        layer_overrides: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              layer_id: { type: "string" },
                              content: { type: "string" },
                              src: { type: "string" },
                              style: { type: "object" },
                            },
                            required: ["layer_id"],
                          },
                        },
                        color_overrides: {
                          type: "object",
                          properties: {
                            primary: { type: "string" },
                            secondary: { type: "string" },
                            accent: { type: "string" },
                            background: { type: "string" },
                            textPrimary: { type: "string" },
                            textSecondary: { type: "string" },
                          },
                        },
                        caption: { type: "string" },
                      },
                      required: ["layer_overrides"],
                    },
                  },
                },
                required: ["variations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "apply_template_edits" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result = { variations: [] as any[] };

    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        result = { variations: [] };
      }
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("template-edit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
