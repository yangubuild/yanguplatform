import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, style, business_description, tone, hashtag_behavior, brand_profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build enhanced system prompt from profile if available
    const bp = brand_profile || {};
    const voiceRules = bp.tone_of_voice || tone || "professional yet approachable";
    const captionRules = Array.isArray(bp.caption_rules) ? bp.caption_rules.join("; ") : "";
    const ctas = Array.isArray(bp.preferred_ctas) ? bp.preferred_ctas : [];
    const keywords = Array.isArray(bp.brand_keywords) ? bp.brand_keywords.join(", ") : "";

    const systemPrompt = `You are a social media copywriter for a business. Write engaging, platform-ready captions.
${business_description || bp.business_description ? `Business: ${business_description || bp.business_description}` : ""}
${bp.target_audience ? `Audience: ${bp.target_audience}` : ""}
Tone/Voice: ${voiceRules}
${captionRules ? `Caption rules: ${captionRules}` : ""}
${ctas.length > 0 ? `End with one of these CTAs: ${ctas.join(", ")}` : "Include a clear call-to-action"}
${keywords ? `Include relevant keywords: ${keywords}` : ""}
Rules:
- Keep it concise and engaging
- ${(hashtag_behavior || bp.hashtag_rules) === "none" ? "Do NOT include hashtags" : "Include 3-5 relevant hashtags at the end"}
- ${bp.emoji_policy === "none" ? "Do NOT use emojis" : bp.emoji_policy === "moderate" ? "Use emojis moderately" : "Use emojis sparingly"}
- Use line breaks for readability
- Do NOT use markdown formatting
- Return ONLY the caption text, nothing else`;

    const userPrompt = `Write a ${style || "short"} social media caption about: ${topic || "our business"}`;

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
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI generation failed");
    }

    const result = await response.json();
    const caption = result.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-ai-caption error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
