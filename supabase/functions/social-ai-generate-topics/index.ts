import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profile, business_type, url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const businessContext = [
      profile?.business_name && `Business: ${profile.business_name}`,
      profile?.industry && `Industry: ${profile.industry}`,
      profile?.business_description && `Description: ${profile.business_description}`,
      profile?.target_audience && `Audience: ${profile.target_audience}`,
      business_type && `Business type: ${business_type}`,
      url && `Website: ${url}`,
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are a social media content strategist. Given business context, generate topic categories and topics for social media content planning.

Rules:
- Create 3-6 categories that are specific to this business type
- Each category should have 2-4 topics
- Topics should be broad enough for repeated post generation but specific to the business
- Each topic needs a clear title (max 50 chars) and a 1-2 sentence description
- Categories and topics must be business-relevant, not generic filler
- Consider the industry, audience, and business model

Return a JSON object:
{
  "categories": [
    {
      "title": "Category Name",
      "color": "#hex color",
      "topics": [
        {
          "title": "Topic Title",
          "description": "1-2 sentence description of what posts about this topic cover."
        }
      ]
    }
  ]
}

Use these colors for variety: #10B981, #F59E0B, #F97316, #F87171, #8B5CF6, #3B82F6, #06B6D4, #84CC16, #EC4899, #9CA3AF

Return ONLY valid JSON, no markdown.`;

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
          { role: "user", content: `Generate topic categories and topics for this business:\n\n${businessContext}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";

    let result;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      result = JSON.parse(jsonMatch ? jsonMatch[1].trim() : raw);
    } catch {
      const first = raw.indexOf("{");
      const last = raw.lastIndexOf("}");
      if (first !== -1 && last > first) {
        result = JSON.parse(raw.slice(first, last + 1));
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-ai-generate-topics error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
