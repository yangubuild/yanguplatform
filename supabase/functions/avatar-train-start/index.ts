import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { provider = "heygen", payload } = body;

    // Check if training endpoint is actually available
    const providerKeys: Record<string, string> = {
      heygen: "HEYGEN_API_KEY",
      did: "DID_API_KEY",
      creatify: "CREATIFY_API_KEY",
    };

    const apiKeyEnv = providerKeys[provider];
    const apiKey = apiKeyEnv ? Deno.env.get(apiKeyEnv) : null;

    // Create job row regardless — we track the attempt
    const { data: job, error: insertErr } = await supabase
      .from("avatar_training_jobs")
      .insert({
        user_id: user.id,
        provider,
        payload: payload || {},
        status: apiKey ? "pending" : "not_enabled",
        error: apiKey ? null : `Avatar training is not enabled for provider "${provider}". Training API endpoints are not available with current credentials. Contact your administrator to enable this feature.`,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to create training job" }), { status: 500, headers: corsHeaders });
    }

    // If training endpoint IS available, attempt to call it
    // Currently: none of the providers expose training endpoints via our credentials
    // So all jobs will land in "not_enabled" status — this is the honest blocked state.
    //
    // When a provider training endpoint becomes available, add the call here:
    // if (provider === "heygen" && apiKey) { ... call HeyGen training API ... }

    return new Response(JSON.stringify({
      job,
      training_available: !!apiKey && false, // API key exists but no training endpoint available
      message: apiKey
        ? "API key is configured but avatar training endpoints are not yet available for this provider."
        : `Avatar training is not enabled. The "${provider}" API key is not configured.`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("avatar-train-start error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
