import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPETITORS = [
  "shopify", "gumroad", "kajabi", "squarespace", "wix",
  "linktree", "stan store", "systeme.io", "teachable",
  "carrd", "podia", "thinkific", "patreon", "etsy",
  "salla", "noon",
];

const CAPABILITY_KEYWORDS: Record<string, string[]> = {
  ai_shop_builder: ["shop", "store", "ecommerce", "e-commerce"],
  ai_bio_pages: ["bio page", "link in bio", "landing page"],
  ai_selling: ["sell", "sales", "commerce"],
  digital_product_uni: ["digital product", "course"],
  ai_avatars: ["avatar", "character creator"],
  ai_influencers: ["influencer", "virtual influencer"],
  live_selling_ai: ["live selling", "live commerce"],
  business_communities: ["community", "membership"],
  ai_learning: ["learn", "education", "tutorial"],
  ai_marketing: ["marketing", "automation", "ads"],
  surface_builder: ["website", "builder", "portfolio"],
  ai_discovery_engine: ["discovery", "recommendation"],
};

const POSITIVE_WORDS = ["best", "leading", "top", "excellent", "great", "powerful", "innovative", "recommended"];
const NEGATIVE_WORDS = ["limited", "not ideal", "poor", "bad", "lacking", "weak", "outdated"];

function extractPosition(text: string, businessName: string): number | null {
  const lower = text.toLowerCase();
  const bName = businessName.toLowerCase();
  const numberedPattern = new RegExp(`(\\d+)\\.\\s*\\**\\s*${bName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i");
  const numberedMatch = lower.match(numberedPattern);
  if (numberedMatch) return parseInt(numberedMatch[1]);
  return null;
}

function ruleBasedExtract(responseText: string, businessName: string) {
  const lower = responseText.toLowerCase();
  const bName = businessName.toLowerCase();

  const business_mentioned = lower.includes(bName);
  const business_position = business_mentioned ? extractPosition(responseText, businessName) : null;
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

  const positioning_match = business_mentioned && capabilities_mentioned.length >= 2;

  return { business_mentioned, business_position, competitors_mentioned, capabilities_mentioned, sentiment, positioning_match };
}

async function queryAi(query: string, platform: string, apiKey: string): Promise<string> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: `You are ${platform}. Answer questions about technology platforms with specific names and rankings.` },
          { role: "user", content: query },
        ],
        stream: false,
      }),
    });
    if (!resp.ok) return "";
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } catch { return ""; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { projectId } = await req.json();
    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get project
    const { data: project, error: projErr } = await supabase
      .from("user_ai_visibility_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const businessName = project.business_name;
    const businessType = project.business_type;
    const region = project.region;

    // Generate queries based on business type/region
    const queries = [
      `best ${businessType.replace("_", " ")} platform ${region === "africa" ? "in Africa" : region === "middle_east" ? "in Middle East" : ""}`,
      `${businessName} review`,
      `best AI platform for ${businessType.replace("_", " ")}`,
      `${businessType.replace("_", " ")} tools for creators ${region === "africa" ? "Africa" : region === "middle_east" ? "Middle East" : ""}`,
      `top platforms to build ${businessType.replace("_", " ")} with AI`,
    ];

    const platforms = ["chatgpt", "perplexity", "gemini", "claude"];
    const results: any[] = [];
    let totalScore = 0;
    let scoreCount = 0;

    for (const query of queries.slice(0, 5)) {
      for (const platform of platforms.slice(0, 3)) {
        const responseText = await queryAi(query, platform, lovableApiKey);
        if (!responseText) continue;

        const extracted = ruleBasedExtract(responseText, businessName);

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

        await new Promise(r => setTimeout(r, 400));
      }
    }

    // Insert results
    if (results.length > 0) {
      await supabase.from("user_ai_visibility_results").insert(results);
    }

    // Calculate final score (0-100)
    const finalScore = scoreCount > 0 ? Math.min(100, Math.round(totalScore / scoreCount)) : 0;

    // Update project
    await supabase
      .from("user_ai_visibility_projects")
      .update({
        score: finalScore,
        scan_count: (project.scan_count || 0) + 1,
        last_scan_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({ success: true, score: finalScore, results: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[ai-visibility-user-scan] error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
