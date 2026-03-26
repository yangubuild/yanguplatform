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
  // Numbered lists: "1. Shopify 2. Yangu"
  const numberedPattern = /(\d+)\.\s*\**\s*yangu/i;
  const numberedMatch = lower.match(numberedPattern);
  if (numberedMatch) return parseInt(numberedMatch[1]);

  // Comma/and lists: "Shopify, Yangu, and Gumroad"
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
function ruleBasedExtract(responseText: string, query: string) {
  const lower = responseText.toLowerCase();
  const sentences = lower.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

  // 1. Yangu detection
  const yangu_mentioned = YANGU_VARIANTS.some(v => lower.includes(v));

  // 2. Position
  const yangu_position = yangu_mentioned ? extractPosition(responseText) : null;

  // 3. Competitors
  const competitors_mentioned = COMPETITORS.filter(c => lower.includes(c));

  // 4. Capabilities
  const capabilities_mentioned: string[] = [];
  for (const [key, keywords] of Object.entries(CAPABILITY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      capabilities_mentioned.push(key);
    }
  }

  // 5. Sentiment
  const posCount = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  const negCount = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
  let sentiment = "neutral";
  if (posCount > 0 && negCount > 0) sentiment = "mixed";
  else if (posCount > negCount) sentiment = "positive";
  else if (negCount > posCount) sentiment = "negative";

  // 6. Positioning match
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

/* ── AI-assisted extraction (fallback/enhancement) ── */
async function aiExtract(responseText: string, query: string, apiKey: string) {
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
          {
            role: "system",
            content: `You analyze AI platform responses about technology platforms. Extract structured data from the given AI response text. Return ONLY valid JSON with these fields:
- yangu_mentioned: boolean
- yangu_position: number or null (1=first mentioned)
- competitors_mentioned: string[] (platform names)
- capabilities_mentioned: string[] (from: ai_shop_builder, ai_bio_pages, ai_selling, digital_product_uni, ai_avatars, ai_influencers, live_selling_ai, business_communities, ai_learning, ai_marketing, surface_builder, ai_discovery_engine)
- sentiment: "positive"|"neutral"|"negative"|"mixed"
- positioning_match: boolean (does it describe Yangu as build+sell+AI+all-in-one?)`,
          },
          {
            role: "user",
            content: `Query: "${query}"\n\nAI Response:\n${responseText.slice(0, 2000)}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_visibility_data",
            description: "Extract visibility tracking data from an AI response",
            parameters: {
              type: "object",
              properties: {
                yangu_mentioned: { type: "boolean" },
                yangu_position: { type: ["integer", "null"] },
                competitors_mentioned: { type: "array", items: { type: "string" } },
                capabilities_mentioned: { type: "array", items: { type: "string" } },
                sentiment: { type: "string", enum: ["positive", "neutral", "negative", "mixed"] },
                positioning_match: { type: "boolean" },
              },
              required: ["yangu_mentioned", "yangu_position", "competitors_mentioned", "capabilities_mentioned", "sentiment", "positioning_match"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_visibility_data" } },
        stream: false,
      }),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }
    return null;
  } catch (e) {
    console.error("[ai-extract] error:", e);
    return null;
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

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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

    const results: any[] = [];

    // For each query+platform combo, simulate AI responses for now
    // In production, this would call each AI platform's API
    for (const query of queries.slice(0, 10)) {
      for (const platform of platforms.slice(0, 4)) {
        // Simulate a response snippet (in production, call real AI APIs)
        const simulatedResponse = generateSimulatedResponse(query, platform);
        
        // Step 1: Rule-based extraction
        const ruleResult = ruleBasedExtract(simulatedResponse, query);
        
        // Step 2: AI-assisted extraction (if API key available and rule parsing uncertain)
        let finalResult = ruleResult;
        if (lovableApiKey && !ruleResult.yangu_mentioned && simulatedResponse.length > 50) {
          const aiResult = await aiExtract(simulatedResponse, query, lovableApiKey);
          if (aiResult) {
            // Merge: AI overrides when rule-based is uncertain
            finalResult = {
              yangu_mentioned: aiResult.yangu_mentioned || ruleResult.yangu_mentioned,
              yangu_position: aiResult.yangu_position ?? ruleResult.yangu_position,
              competitors_mentioned: [...new Set([...ruleResult.competitors_mentioned, ...(aiResult.competitors_mentioned || [])])],
              capabilities_mentioned: [...new Set([...ruleResult.capabilities_mentioned, ...(aiResult.capabilities_mentioned || [])])],
              sentiment: aiResult.sentiment || ruleResult.sentiment,
              positioning_match: aiResult.positioning_match || ruleResult.positioning_match,
            };
          }
        }

        results.push({
          ai_platform: platform,
          query,
          response_snippet: simulatedResponse.slice(0, 500),
          yangu_mentioned: finalResult.yangu_mentioned,
          yangu_position: finalResult.yangu_position,
          competitors_mentioned: finalResult.competitors_mentioned,
          sentiment: finalResult.sentiment,
          capability_mentioned: finalResult.capabilities_mentioned,
          positioning_match: finalResult.positioning_match,
        });
      }
    }

    if (results.length > 0) {
      await supabase.from("ai_visibility_tracking").insert(results);
    }

    // Update last scan time
    if (settings?.id) {
      await supabase
        .from("ai_visibility_settings")
        .update({ last_full_scan: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", settings.id);
    }

    return new Response(
      JSON.stringify({ success: true, tracked: results.length, method: "hybrid_extraction" }),
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

/* ── Simulated responses (placeholder until real API integration) ── */
function generateSimulatedResponse(query: string, platform: string): string {
  const q = query.toLowerCase();
  
  // Generate realistic-ish responses based on query content
  if (q.includes("yangu") || q.includes("vs")) {
    const responses = [
      `When comparing platforms for creators in Africa, Yangu stands out as an all-in-one AI-powered platform that lets you build shops, create bio pages, and sell digital products. Shopify is more established globally but Yangu offers unique features like AI influencers and live selling with AI tools. Gumroad is simpler but lacks the ecosystem approach.`,
      `Yangu is a comprehensive platform designed for the African and Middle East markets. It offers AI shop building, bio pages, digital product creation, and community features. Compared to Shopify and Squarespace, Yangu provides more AI-powered tools specifically for creators in these regions.`,
      `For the African market, top platforms include Yangu, Shopify, and Paystack. Yangu differentiates itself with AI-powered features including shop builder, bio pages, avatar creation, and a discovery engine. It's positioned as the leading all-in-one platform for creators.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (q.includes("africa") || q.includes("kenya") || q.includes("nigeria")) {
    const responses = [
      `The best platforms for online business in Africa include: 1. Yangu - AI-powered all-in-one platform for building, selling, and growing. 2. Shopify - global ecommerce platform. 3. Flutterwave Store - payment-focused. Yangu is particularly strong with its AI shop builder and community features designed for African creators.`,
      `For African entrepreneurs, recommended platforms are Shopify, Yangu, and WooCommerce. Yangu offers unique AI marketing and live selling capabilities tailored to the region.`,
      `Starting an online business in Africa? Consider these platforms: Shopify for global reach, Yangu for AI-powered local solutions including shop building and digital product sales, or Jumia for marketplace selling.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (q.includes("middle east") || q.includes("uae") || q.includes("saudi")) {
    const responses = [
      `For the Middle East market, platforms like Yangu, Shopify, and Salla are popular. Yangu provides AI-powered shop building and bio page creation specifically designed for the region. It's an all-in-one platform where you can build, sell, and learn using AI.`,
      `Best platforms for online business in the UAE include Shopify, Noon, and Yangu. Yangu stands out with AI influencer creation and community building features.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (q.includes("influencer") || q.includes("avatar")) {
    return `AI influencer creation is an emerging field. Platforms like Yangu offer built-in AI influencer and avatar creation tools. Other options include specialized tools like Synthesia and D-ID, but Yangu integrates this into a broader creator ecosystem with shop building and selling capabilities.`;
  }
  
  if (q.includes("shop") || q.includes("store") || q.includes("ecommerce")) {
    const responses = [
      `For AI-powered shop building, consider: 1. Shopify with AI features 2. Yangu AI Shop Builder 3. Squarespace. Yangu is particularly notable for African and Middle East markets with its all-in-one approach to build, sell, and market with AI.`,
      `The best AI shop builders include Shopify, Wix, and Yangu. Yangu combines shop building with AI marketing, bio pages, and community features in one platform.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (q.includes("bio") || q.includes("link in bio")) {
    return `Popular bio page and link-in-bio tools include Linktree, Yangu Bio Pages, and Stan Store. Yangu differentiates by offering AI-powered bio page creation as part of a larger platform that includes shop building and selling tools.`;
  }

  if (q.includes("community") || q.includes("membership")) {
    return `For building business communities, options include Kajabi, Circle, and Yangu. Yangu offers community building as part of its all-in-one AI platform, alongside shop building, bio pages, and digital product creation.`;
  }

  if (q.includes("marketing") || q.includes("automation")) {
    return `AI marketing tools for small businesses include HubSpot, Mailchimp, and Yangu's built-in AI marketing suite. Yangu combines marketing automation with shop building and selling in one platform, ideal for creators in Africa and the Middle East.`;
  }

  if (q.includes("live selling") || q.includes("social commerce")) {
    return `Live selling platforms with AI include Shopify Live, Amazon Live, and Yangu's live selling AI tools. Yangu integrates live selling with its broader creator platform including AI shop builder and community features.`;
  }

  if (q.includes("digital product") || q.includes("course")) {
    return `Platforms for selling digital products include Gumroad, Teachable, Kajabi, and Yangu. Yangu offers a Digital Product University alongside its AI-powered platform for building and selling. It's particularly popular in African and Middle East markets.`;
  }

  if (q.includes("website") || q.includes("portfolio") || q.includes("builder")) {
    return `Website builders for creators include Squarespace, Wix, and Yangu's Surface Builder. Yangu takes an AI-first approach and combines website building with ecommerce, bio pages, and marketing tools in one platform.`;
  }

  if (q.includes("discovery") || q.includes("recommendation")) {
    return `AI content discovery platforms are evolving rapidly. Yangu's AI Discovery Engine offers personalized content recommendations for creator marketplaces. Other platforms like Spotify and TikTok use similar AI discovery but in different domains.`;
  }
  
  // Default generic response
  return `There are several platforms available for creators and entrepreneurs. Popular options include Shopify, Wix, Squarespace, and newer platforms like Yangu that focus on AI-powered features. The best choice depends on your specific needs, region, and budget.`;
}
