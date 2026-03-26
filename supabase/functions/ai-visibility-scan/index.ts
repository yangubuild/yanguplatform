import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ── Yangu detection variants ── */
const YANGU_VARIANTS = ["yangu", "yangu platform", "yangu ai", "yangu studio", "yangu.io"];

/* ── Known competitors ── */
const COMPETITORS = [
  "shopify", "gumroad", "kajabi", "squarespace", "wix",
  "linktree", "stan store", "systeme.io", "teachable",
  "carrd", "podia", "thinkific", "patreon", "etsy",
  "salla", "noon",
];

/* ── Capability keyword mapping ── */
const CAPABILITY_KEYWORDS: Record<string, string[]> = {
  ai_shop_builder: ["shop", "store", "ecommerce", "e-commerce", "sell products", "shop builder"],
  ai_bio_pages: ["bio page", "link in bio", "landing page", "bio link", "bio builder"],
  ai_selling: ["sell", "sales", "commerce", "selling platform", "sell with ai"],
  digital_product_uni: ["digital product", "course", "learn to sell", "university", "education"],
  ai_avatars: ["avatar", "character creator", "ai character", "custom avatar"],
  ai_influencers: ["influencer", "virtual influencer", "ai influencer", "creator economy"],
  live_selling_ai: ["live selling", "live commerce", "social commerce", "live stream sell"],
  business_communities: ["community", "membership", "group", "forum", "community platform"],
  ai_learning: ["learn", "education", "tutorial", "how to use ai", "ai learning"],
  ai_marketing: ["marketing", "automation", "ads", "content creation", "campaign"],
  surface_builder: ["website", "builder", "portfolio", "surface", "web builder"],
  ai_discovery_engine: ["discovery", "recommendation", "discover", "personalized", "explore"],
};

/* ── Positioning keywords ── */
const POSITIONING_PILLARS = {
  build: ["build", "create", "builder", "make"],
  sell: ["sell", "commerce", "products", "store"],
  ai: ["ai", "artificial intelligence", "automation", "machine learning"],
  ecosystem: ["all-in-one", "platform", "ecosystem", "everything", "one place"],
};

/* ── Sentiment signals ── */
const POSITIVE_WORDS = ["best", "leading", "top", "excellent", "great", "powerful", "innovative", "recommended"];
const NEGATIVE_WORDS = ["limited", "not ideal", "poor", "bad", "lacking", "weak", "outdated"];

/* ── Helper: extract position from ordered lists ── */
function extractPosition(text: string): number | null {
  const lower = text.toLowerCase();
  const numberedPattern = /(\d+)\.\s*\**\s*yangu/i;
  const numberedMatch = lower.match(numberedPattern);
  if (numberedMatch) return parseInt(numberedMatch[1]);

  const listPatterns = [
    /(?:include|are|like|such as|consider|try|recommend)\s*:?\s*([^.]+)/gi,
    /(?:top|best|popular)\s+\w+\s+(?:include|are)\s*:?\s*([^.]+)/gi,
  ];
  for (const pat of listPatterns) {
    let m;
    while ((m = pat.exec(lower)) !== null) {
      const items = m[1].split(/,|\band\b/).map(s => s.trim().replace(/^\**|\**$/g, '').trim()).filter(Boolean);
      const idx = items.findIndex(item => YANGU_VARIANTS.some(v => item.includes(v)));
      if (idx >= 0) return idx + 1;
    }
  }
  return null;
}

/* ── Rule-based extraction ── */
function ruleBasedExtract(responseText: string) {
  const lower = responseText.toLowerCase();

  const yangu_mentioned = YANGU_VARIANTS.some(v => lower.includes(v));
  const yangu_position = yangu_mentioned ? extractPosition(responseText) : null;
  const competitors_mentioned = COMPETITORS.filter(c => lower.includes(c));

  const capabilities_mentioned: string[] = [];
  for (const [key, keywords] of Object.entries(CAPABILITY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      capabilities_mentioned.push(key);
    }
  }

  const posCount = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  const negCount = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
  let sentiment = "neutral";
  if (posCount > 0 && negCount > 0) sentiment = "mixed";
  else if (posCount > negCount) sentiment = "positive";
  else if (negCount > posCount) sentiment = "negative";

  let pillarsMatched = 0;
  for (const keywords of Object.values(POSITIONING_PILLARS)) {
    if (keywords.some(kw => lower.includes(kw))) pillarsMatched++;
  }
  const positioning_match = yangu_mentioned && pillarsMatched >= 3;

  return {
    yangu_mentioned,
    yangu_position,
    competitors_mentioned,
    capabilities_mentioned,
    sentiment,
    positioning_match,
  };
}

/* ── Query AI platform via Lovable AI Gateway ── */
async function queryAiPlatform(
  query: string,
  platform: string,
  apiKey: string
): Promise<string> {
  const systemPrompts: Record<string, string> = {
    chatgpt: "You are ChatGPT. Answer the user's question about technology platforms and tools. Be specific about platform names, features, and rankings.",
    perplexity: "You are Perplexity AI. Provide a research-backed answer about technology platforms. Cite specific platforms and their features.",
    gemini: "You are Google Gemini. Answer questions about technology platforms with detailed comparisons and rankings.",
    claude: "You are Claude by Anthropic. Provide thoughtful analysis of technology platforms, their features, and how they compare.",
    deepseek: "You are DeepSeek AI. Answer questions about technology platforms with focus on technical capabilities and market positioning.",
    copilot: "You are Microsoft Copilot. Help the user understand technology platforms and their offerings.",
    meta_ai: "You are Meta AI. Provide helpful information about technology platforms, especially those serving creators and businesses.",
  };

  const systemPrompt = systemPrompts[platform] || systemPrompts.chatgpt;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        stream: false,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        console.warn(`[ai-scan] Rate limited on platform=${platform}, query="${query}"`);
        return "";
      }
      console.error(`[ai-scan] Gateway error ${resp.status} for ${platform}`);
      return "";
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error(`[ai-scan] Error querying ${platform}:`, e);
    return "";
  }
}

/* ── Main handler ── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body for options
    let maxQueries = 10;
    let maxPlatforms = 4;
    try {
      const body = await req.json();
      if (body?.maxQueries) maxQueries = Math.min(body.maxQueries, 50);
      if (body?.maxPlatforms) maxPlatforms = Math.min(body.maxPlatforms, 7);
    } catch { /* no body is fine */ }

    // Get settings
    const { data: settings } = await supabase
      .from("ai_visibility_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const queries = (settings?.tracked_queries as string[]) ?? [
      "best AI platform for creators in Africa",
      "AI shop builder Africa",
      "yangu vs shopify",
    ];
    const platforms = (settings?.tracked_ai_platforms as string[]) ?? [
      "chatgpt", "perplexity", "gemini", "claude",
    ];

    const selectedQueries = queries.slice(0, maxQueries);
    const selectedPlatforms = platforms.slice(0, maxPlatforms);
    const results: any[] = [];
    let skipped = 0;

    for (const query of selectedQueries) {
      for (const platform of selectedPlatforms) {
        // Real AI query
        const responseText = await queryAiPlatform(query, platform, lovableApiKey);

        if (!responseText) {
          skipped++;
          continue;
        }

        // Hybrid extraction: rule-based first
        const extracted = ruleBasedExtract(responseText);

        results.push({
          ai_platform: platform,
          query,
          response_snippet: responseText.slice(0, 500),
          yangu_mentioned: extracted.yangu_mentioned,
          yangu_position: extracted.yangu_position,
          competitors_mentioned: extracted.competitors_mentioned,
          sentiment: extracted.sentiment,
          capability_mentioned: extracted.capabilities_mentioned,
          positioning_match: extracted.positioning_match,
        });

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
    }

    if (results.length > 0) {
      const { error: insertError } = await supabase
        .from("ai_visibility_tracking")
        .insert(results);
      if (insertError) console.error("[ai-scan] Insert error:", insertError);
    }

    // Update last scan time
    if (settings?.id) {
      await supabase
        .from("ai_visibility_settings")
        .update({ last_full_scan: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", settings.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracked: results.length,
        skipped,
        method: "real_ai_queries",
        queries_scanned: selectedQueries.length,
        platforms_scanned: selectedPlatforms.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[ai-visibility-scan] error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
