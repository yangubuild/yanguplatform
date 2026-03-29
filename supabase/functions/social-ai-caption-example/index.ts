import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profile, count } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const numCaptions = count || 2;

    const systemPrompt = `You are a social media copywriter. Generate ${numCaptions} example social media captions based on the brand profile provided.

Rules from the profile:
- Voice: ${profile.tone_of_voice || "professional"}
- Brand voice: ${profile.brand_voice || "informative"}
- Caption rules: ${(profile.caption_rules || []).join(", ") || "none specified"}
- CTAs to use: ${(profile.preferred_ctas || []).join(", ") || "none specified"}
- Emoji policy: ${profile.emoji_policy || "light"}
- Hashtag rules: ${profile.hashtag_rules || "moderate use"}
- Business: ${profile.business_name || "the business"} - ${profile.business_description || ""}
- Audience: ${profile.target_audience || "general audience"}
- Keywords: ${(profile.brand_keywords || []).join(", ") || "none"}

Return a JSON array of objects with:
[{"caption": "...", "topic": "topic name"}]
Return ONLY valid JSON array, no markdown.`;

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
          { role: "user", content: `Generate ${numCaptions} example captions that follow the brand profile rules exactly.` },
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
    const raw = data.choices?.[0]?.message?.content?.trim() || "[]";

    let examples;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      examples = JSON.parse(jsonMatch ? jsonMatch[1].trim() : raw);
    } catch {
      const first = raw.indexOf("[");
      const last = raw.lastIndexOf("]");
      if (first !== -1 && last > first) {
        examples = JSON.parse(raw.slice(first, last + 1));
      } else {
        examples = [{ caption: raw, topic: "General" }];
      }
    }

    return new Response(JSON.stringify({ examples }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-ai-caption-example error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
