import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_data_url, campaign_name, product_name, location, media_type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a world-class digital advertising copywriter and SEO strategist. You write high-converting ad captions for social media, display ads, and video ads.

Your captions must:
- Be highly specific to the product/business shown in the image
- Use proven direct-response copywriting frameworks (PAS, AIDA, hook-story-offer)
- Include relevant SEO keywords naturally
- Use emojis strategically for engagement (👉, ✅, 🔥, 💡, etc.)
- Include a clear call-to-action
- Be location-aware if location is provided (reference local market, culture, or trends)
- Be competitive — study what top brands do and match that energy
- Vary tone across the 3 variations: one punchy/urgent, one story-driven, one benefit-focused

IMPORTANT: Analyze the actual image carefully. Identify the brand, product, colors, text, and context visible. Your captions must directly reference what's shown.

Return EXACTLY 3 caption variations as a JSON array of strings. No markdown, no explanation — just the JSON array.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Generate 3 high-converting ad captions for this ${media_type || "image"}.

Campaign: ${campaign_name || "Product campaign"}
Product/Business: ${product_name || "See image"}
Location/Market: ${location || "Global"}

Analyze the image thoroughly — identify the brand, product type, visual elements, text overlays, and target audience. Write captions that are specific to THIS exact creative, not generic templates.

Each caption should be 3-6 sentences with emoji hooks, bullet points or checkmarks for benefits, and a strong CTA. Make them SEO-optimized with natural keywords.`,
      },
    ];

    // If we have an image data URL, include it for vision analysis
    if (image_data_url) {
      userContent.push({
        type: "image_url",
        image_url: { url: image_data_url },
      });
    }

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
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON array from the response
    let captions: string[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        captions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, split by double newlines as fallback
      captions = rawContent
        .split(/\n\n+/)
        .filter((s: string) => s.trim().length > 20)
        .slice(0, 3);
    }

    // Ensure we have at least 3 captions
    while (captions.length < 3) {
      captions.push("Discover something amazing. Click to learn more! 🔥");
    }

    return new Response(JSON.stringify({ captions: captions.slice(0, 3) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ad-caption-generate error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
