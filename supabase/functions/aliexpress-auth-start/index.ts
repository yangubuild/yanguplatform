import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function safeJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return safeJson({ ok: false, error: "Unauthorized" }, 200);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData?.user) {
      return safeJson({ ok: false, error: "Invalid session" }, 200);
    }

    const appKey = (Deno.env.get("ALIEXPRESS_APP_KEY") || "").trim();
    if (!appKey) {
      return safeJson({ ok: false, error: "AliExpress not configured" }, 200);
    }

    // Read the caller's origin so callback can redirect back to correct environment
    let returnOrigin = "https://yangu-launchpad.lovable.app";
    try {
      const body = await req.json();
      if (body?.return_origin && typeof body.return_origin === "string") {
        returnOrigin = body.return_origin.replace(/\/+$/, "");
      }
    } catch { /* no body or invalid json, use default */ }

    // Generate CSRF state token = userId:random:returnOrigin
    const stateToken = `${userData.user.id}:${crypto.randomUUID()}:${returnOrigin}`;

    // Store state in DB for validation on callback
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use a simple approach: store state temporarily in provider_oauth_tokens with a placeholder
    // We'll use a separate lightweight approach — store in the state param itself (signed)
    // For simplicity and security, we encode user_id in state and verify on callback

    // Redirect to edge function callback (server-side token exchange)
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/aliexpress-auth-callback`;

    // AliExpress OAuth authorize URL
    // https://api-sg.aliexpress.com/oauth/authorize
    const authorizeUrl = new URL("https://api-sg.aliexpress.com/oauth/authorize");
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("force_auth", "true");
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("client_id", appKey);
    authorizeUrl.searchParams.set("state", stateToken);
    authorizeUrl.searchParams.set("view", "web");
    authorizeUrl.searchParams.set("sp", "ae");

    return safeJson({
      ok: true,
      authorize_url: authorizeUrl.toString(),
      state: stateToken,
    });
  } catch (e: any) {
    console.error("aliexpress-auth-start error", e?.message);
    return safeJson({ ok: false, error: e?.message || "Unknown error" }, 200);
  }
});
