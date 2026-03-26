import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Category-specific competitor groups
const COMPETITOR_GROUPS: Record<string, string[]> = {
  shop: ["shopify", "woocommerce", "wix stores", "squarespace commerce", "bigcommerce", "ecwid", "salla", "noon"],
  bio_page: ["linktree", "beacons", "stan", "carrd", "milkshake"],
  digital_products: ["gumroad", "kajabi", "teachable", "thinkific", "podia", "patreon"],
  community: ["circle", "mighty networks", "discord", "kajabi"],
  influencer: ["stan", "beacons", "linktree", "kajabi"],
};

// Fallback broad list (only used if business_type unknown)
const ALL_COMPETITORS = [
  "shopify", "gumroad", "kajabi", "squarespace", "wix", "linktree",
  "stan", "systeme.io", "teachable", "carrd", "podia", "thinkific",
  "patreon", "etsy", "salla", "noon", "bigcommerce", "ecwid",
  "woocommerce", "beacons", "milkshake", "circle", "mighty networks",
];

const CAPABILITY_KEYWORDS: Record<string, string[]> = {
  ai_shop_builder: ["shop", "store", "ecommerce", "e-commerce", "storefront"],
  ai_bio_pages: ["bio page", "link in bio", "landing page"],
  ai_selling: ["sell", "sales", "commerce", "checkout", "catalog"],
  digital_product_uni: ["digital product", "course", "ebook"],
  ai_avatars: ["avatar", "character creator"],
  ai_influencers: ["influencer", "virtual influencer"],
  live_selling_ai: ["live selling", "live commerce"],
  business_communities: ["community", "membership"],
  ai_learning: ["learn", "education", "tutorial"],
  ai_marketing: ["marketing", "automation", "ads"],
  surface_builder: ["website", "builder", "portfolio"],
  ai_discovery_engine: ["discovery", "recommendation"],
};

const POSITIVE_WORDS = ["best", "leading", "top", "excellent", "great", "powerful", "innovative", "recommended", "popular"];
const NEGATIVE_WORDS = ["limited", "not ideal", "poor", "bad", "lacking", "weak", "outdated", "basic"];

function extractPosition(text: string, businessName: string): number | null {
  const lower = text.toLowerCase();
  const bName = businessName.toLowerCase();

  // Numbered list: "1. **BusinessName**"
  const numberedPattern = new RegExp(
    `(\\d+)\\.\\s*\\**\\s*${bName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "i"
  );
  const numberedMatch = lower.match(numberedPattern);
  if (numberedMatch) return parseInt(numberedMatch[1]);

  // Comma-separated list position
  const commaListPattern = /(?:include|are|:\s*)([\w\s,]+(?:,[\w\s,]+)+)/i;
  const commaMatch = text.match(commaListPattern);
  if (commaMatch) {
    const items = commaMatch[1].split(",").map((s) => s.trim().toLowerCase());
    const idx = items.findIndex((item) => item.includes(bName));
    if (idx >= 0) return idx + 1;
  }

  return null;
}

function ruleBasedExtract(
  responseText: string,
  businessName: string,
  businessType: string
) {
  const lower = responseText.toLowerCase();
  const bName = businessName.toLowerCase();

  // Business detection (check variations)
  const businessVariations = [bName, `${bName} platform`, `${bName} ai`, `${bName}.io`];
  const business_mentioned = businessVariations.some((v) => lower.includes(v));

  const business_position = business_mentioned
    ? extractPosition(responseText, businessName)
    : null;

  // Category-filtered competitors
  const relevantCompetitors = COMPETITOR_GROUPS[businessType] || ALL_COMPETITORS;
  const competitors_mentioned = relevantCompetitors.filter((c) =>
    lower.includes(c.toLowerCase())
  );

  // Capability extraction
  const capabilities_mentioned: string[] = [];
  for (const [key, keywords] of Object.entries(CAPABILITY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      capabilities_mentioned.push(key);
    }
  }

  // Sentiment
  const posCount = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const negCount = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  let sentiment = "neutral";
  if (posCount > 0 && negCount > 0) sentiment = "mixed";
  else if (posCount > negCount) sentiment = "positive";
  else if (negCount > posCount) sentiment = "negative";

  // Positioning match (Build + Sell + AI + Ecosystem)
  const buildPresent = ["build", "create", "builder", "maker"].some((w) => lower.includes(w));
  const sellPresent = ["sell", "commerce", "product", "store"].some((w) => lower.includes(w));
  const aiPresent = ["ai", "artificial intelligence", "automation"].some((w) => lower.includes(w));
  const ecosystemPresent = ["all-in-one", "platform", "ecosystem", "suite"].some((w) => lower.includes(w));
  const matchCount = [buildPresent, sellPresent, aiPresent, ecosystemPresent].filter(Boolean).length;
  const positioning_match = business_mentioned && matchCount >= 2;

  return {
    business_mentioned,
    business_position,
    competitors_mentioned,
    capabilities_mentioned,
    sentiment,
    positioning_match,
  };
}

// Query templates by business type
function generateQueries(
  businessName: string,
  businessType: string,
  region: string
): string[] {
  const regionLabel =
    region === "africa"
      ? "in Africa"
      : region === "middle_east"
      ? "in the Middle East"
      : "";

  const typeLabel = businessType.replace(/_/g, " ");

  const typeQueries: Record<string, string[]> = {
    shop: [
      `best online shop builder ${regionLabel}`.trim(),
      `best AI ecommerce platform ${regionLabel}`.trim(),
      `sell products online ${regionLabel}`.trim(),
      `AI store builder for small business`,
      `best platform to create online store with AI`,
    ],
    bio_page: [
      `best link in bio platform ${regionLabel}`.trim(),
      `AI bio page builder ${regionLabel}`.trim(),
      `best landing page builder for creators`,
      `linktree alternatives ${regionLabel}`.trim(),
      `AI powered bio page tool`,
    ],
    digital_products: [
      `best platform to sell digital products ${regionLabel}`.trim(),
      `sell courses online ${regionLabel}`.trim(),
      `digital product platform with AI`,
      `gumroad alternatives ${regionLabel}`.trim(),
      `best tools for selling ebooks and courses`,
    ],
    community: [
      `best community platform ${regionLabel}`.trim(),
      `online community builder with AI`,
      `best membership platform ${regionLabel}`.trim(),
      `circle alternatives for creators`,
      `build paid community online`,
    ],
    influencer: [
      `best platform for influencers ${regionLabel}`.trim(),
      `creator monetization tools ${regionLabel}`.trim(),
      `AI tools for content creators`,
      `best creator economy platform`,
      `monetize as influencer ${regionLabel}`.trim(),
    ],
  };

  const queries = typeQueries[businessType] || [
    `best ${typeLabel} platform ${regionLabel}`.trim(),
    `${businessName} review`,
    `best AI platform for ${typeLabel}`,
    `${typeLabel} tools for creators ${regionLabel}`.trim(),
    `top platforms to build ${typeLabel} with AI`,
  ];

  // Add business-name specific query
  queries.push(`${businessName} review`);

  return queries.slice(0, 6);
}

async function queryAi(
  query: string,
  platform: string,
  apiKey: string
): Promise<string> {
  try {
    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: `You are ${platform}. Answer questions about technology platforms, tools, and services. Include specific platform names and rankings when relevant. Be detailed and specific.`,
            },
            { role: "user", content: query },
          ],
          stream: false,
        }),
      }
    );
    if (!resp.ok) {
      console.error(`[ai-scan] AI call failed: ${resp.status}`);
      return "";
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error("[ai-scan] AI call error:", e);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { projectId } = await req.json();
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: project, error: projErr } = await supabase
      .from("user_ai_visibility_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const businessName = project.business_name;
    const businessType = project.business_type || "shop";
    const region = project.region || "global";

    console.log(`[ai-scan] Starting scan for "${businessName}" type=${businessType} region=${region}`);

    const queries = generateQueries(businessName, businessType, region);
    const platforms = ["chatgpt", "perplexity", "gemini"];
    const results: any[] = [];
    let totalScore = 0;
    let scoreCount = 0;

    for (const query of queries) {
      for (const platform of platforms) {
        const responseText = await queryAi(query, platform, lovableApiKey);
        if (!responseText) continue;

        const extracted = ruleBasedExtract(responseText, businessName, businessType);

        console.log(`[ai-scan] ${platform} | "${query.slice(0, 40)}..." | mentioned=${extracted.business_mentioned} | competitors=${extracted.competitors_mentioned.join(",")}`);

        results.push({
          project_id: projectId,
          user_id: project.user_id,
          ai_platform: platform,
          query,
          response_snippet: responseText.slice(0, 500),
          yangu_mentioned: responseText.toLowerCase().includes("yangu"),
          business_mentioned: extracted.business_mentioned,
          business_position: extracted.business_position,
          competitors_mentioned: extracted.competitors_mentioned,
          sentiment: extracted.sentiment,
          capability_mentioned: extracted.capabilities_mentioned,
          positioning_match: extracted.positioning_match,
        });

        // Score contribution
        if (extracted.business_mentioned) totalScore += 30;
        if (extracted.business_position && extracted.business_position <= 3) totalScore += 20;
        if (extracted.capabilities_mentioned.length > 0) totalScore += 10;
        if (extracted.positioning_match) totalScore += 15;
        scoreCount++;

        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (results.length > 0) {
      await supabase.from("user_ai_visibility_results").insert(results);
    }

    const finalScore =
      scoreCount > 0 ? Math.min(100, Math.round(totalScore / scoreCount)) : 0;

    await supabase
      .from("user_ai_visibility_projects")
      .update({
        score: finalScore,
        scan_count: (project.scan_count || 0) + 1,
        last_scan_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    console.log(`[ai-scan] Done. Score=${finalScore} Results=${results.length}`);

    return new Response(
      JSON.stringify({ success: true, score: finalScore, results: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[ai-visibility-user-scan] error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
