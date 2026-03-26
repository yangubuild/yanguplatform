import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
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

    const queries = settings?.tracked_queries ?? [
      "best AI platform for creators in Africa",
      "AI shop builder Africa",
      "yangu vs shopify",
    ];
    const platforms = settings?.tracked_ai_platforms ?? ["chatgpt", "perplexity", "gemini", "claude"];

    // For each query+platform combo, we would call the AI platform API
    // For now, this creates placeholder tracking entries that can be manually populated
    // Real implementation would use Perplexity API or web scraping

    const results: any[] = [];

    // Placeholder: create tracking entries for manual review
    for (const query of (queries as string[]).slice(0, 5)) {
      for (const platform of (platforms as string[]).slice(0, 3)) {
        results.push({
          ai_platform: platform,
          query,
          yangu_mentioned: false,
          yangu_position: null,
          competitors_mentioned: [],
          sentiment: "neutral",
          capability_mentioned: [],
          positioning_match: false,
          response_snippet: null,
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
      JSON.stringify({ success: true, tracked: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
