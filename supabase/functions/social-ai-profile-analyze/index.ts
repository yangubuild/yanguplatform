import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch page content
    let pageContent = "";
    try {
      const pageResp = await fetch(url, {
        headers: { "User-Agent": "YanguBot/1.0 (profile-analyzer)" },
      });
      if (pageResp.ok) {
        const html = await pageResp.text();
        // Strip tags, keep text
        pageContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 8000);
      }
    } catch (e) {
      console.warn("Failed to fetch URL:", e);
      pageContent = `Could not fetch URL: ${url}. Generate reasonable defaults based on the URL itself.`;
    }

    const systemPrompt = `You are a brand analyst. Given website content, extract a structured brand profile.
Return a JSON object with these exact keys:
{
  "business_name": "string",
  "industry": "string",
  "business_description": "string (2-3 sentences)",
  "target_audience": "string (1-2 sentences)",
  "tone_of_voice": "string - comma-separated voice traits like 'Confident and future-focused, Entrepreneurial and inspiring, Clear and practical'",
  "brand_voice": "string - overall voice description",
  "caption_rules": ["array of 3-5 caption writing rules"],
  "preferred_ctas": ["array of 3-5 call-to-action phrases"],
  "brand_keywords": ["array of 5-8 brand keywords"],
  "hashtag_rules": "string - hashtag usage preference",
  "emoji_policy": "light or moderate or none",
  "language": "English",
  "positioning": "string - market positioning statement",
  "website": "the analyzed URL",
  "visual_style": "string - visual direction"
}
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
          { role: "user", content: `Analyze this website and extract a brand profile:\n\nURL: ${url}\n\nPage content:\n${pageContent}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";

    // Parse JSON from response (handle markdown wrapping)
    let profile;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      profile = JSON.parse(jsonMatch ? jsonMatch[1].trim() : raw);
    } catch {
      // Try extracting JSON object
      const first = raw.indexOf("{");
      const last = raw.lastIndexOf("}");
      if (first !== -1 && last > first) {
        profile = JSON.parse(raw.slice(first, last + 1));
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-ai-profile-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
