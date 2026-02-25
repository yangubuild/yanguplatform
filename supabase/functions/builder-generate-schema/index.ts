import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  surface_type: string;
  title: string;
  description?: string;
  inputs?: Record<string, unknown>;
}

const VALID_SURFACE_TYPES = [
  "live_bio", "live_selling", "quick_site", "emenu",
  "eshop", "community_group", "store_listing", "studio_showcase",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: GenerateRequest = await req.json();

    // Validate
    if (!body.surface_type || !VALID_SURFACE_TYPES.includes(body.surface_type)) {
      return new Response(
        JSON.stringify({ ok: false, error: "unsupported_surface_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!body.title || body.title.trim().length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call AI gateway (Lovable Cloud supported model)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a web page schema generator for the YANGU platform.
Given a surface_type and user inputs, generate a JSON page schema.

The schema must be a JSON object with this structure:
{
  "pages": [
    {
      "slug": "home",
      "title": "Page Title",
      "sections": [
        {
          "section_type": "hero|bio|links|social|gallery|video|cta|text|products|services|testimonials|contact|faq|menu|schedule",
          "schema": { ... section-specific data ... },
          "position": 0
        }
      ]
    }
  ],
  "theme": {
    "primary_color": "#hex",
    "background_color": "#hex",
    "font_family": "string"
  }
}

For live_bio: Include hero, bio, links, social sections.
For live_selling: Include hero, products, cta, testimonials sections.
For quick_site: Include hero, text, gallery, contact sections.
For emenu: Include hero, menu sections.
For eshop: Include hero, products, cta sections.
For community_group: Include hero, text, faq, contact sections.
For store_listing: Include hero, products, testimonials sections.
For studio_showcase: Include hero, gallery, services, contact sections.

Return ONLY valid JSON, no markdown.`;

    const userPrompt = `Generate a page schema for:
- Surface type: ${body.surface_type}
- Title: ${body.title}
- Description: ${body.description || "Not provided"}
- Additional inputs: ${JSON.stringify(body.inputs || {})}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", errText);
      return new Response(
        JSON.stringify({ ok: false, error: "AI generation failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown fences if present)
    let schema: unknown;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      schema = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI JSON:", rawContent);
      return new Response(
        JSON.stringify({ ok: false, error: "AI returned invalid JSON", raw: rawContent }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, schema }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("builder-generate-schema error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
