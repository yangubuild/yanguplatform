import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function safeJson(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
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
      return safeJson({ ok: false, error: "Unauthorized" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData?.user) {
      return safeJson({ ok: false, error: "Invalid session" });
    }

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const code = typeof body.code === "string" ? body.code.trim() : "";
    const state = typeof body.state === "string" ? body.state.trim() : "";

    if (!code) {
      return safeJson({ ok: false, error: "Missing authorization code" });
    }

    // Validate state contains user ID
    if (!state.startsWith(userData.user.id + ":")) {
      return safeJson({ ok: false, error: "Invalid state token (CSRF check failed)" });
    }

    const appKey = (Deno.env.get("ALIEXPRESS_APP_KEY") || "").trim();
    const appSecret = (Deno.env.get("ALIEXPRESS_APP_SECRET") || "").trim();

    if (!appKey || !appSecret) {
      return safeJson({ ok: false, error: "AliExpress not configured" });
    }

    // Exchange code for tokens
    // AliExpress token endpoint: https://api-sg.aliexpress.com/auth/token/create
    const redirectUri = "https://yangu-launchpad.lovable.app/dashboard/seller/eshop-connect?aliexpress_callback=1";

    const tokenParams = new URLSearchParams({
      app_key: appKey,
      app_secret: appSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    let tokenRes: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      tokenRes = await fetch("https://api-sg.aliexpress.com/auth/token/create", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: tokenParams.toString(),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (fetchErr: any) {
      return safeJson({ ok: false, error: "Failed to reach AliExpress token endpoint: " + (fetchErr?.message || "unknown") });
    }

    const tokenText = await tokenRes.text();
    let tokenJson: any;
    try { tokenJson = JSON.parse(tokenText); } catch {
      return safeJson({ ok: false, error: "Invalid response from AliExpress token endpoint", raw: tokenText.slice(0, 500) });
    }

    // AliExpress returns: access_token, refresh_token, expire_time (seconds from epoch), refresh_token_valid_time
    const accessToken = tokenJson.access_token;
    const refreshToken = tokenJson.refresh_token;
    const expireTime = tokenJson.expire_time; // milliseconds timestamp

    if (!accessToken) {
      return safeJson({
        ok: false,
        error: "AliExpress did not return an access token",
        ali_error_code: tokenJson.code || tokenJson.error_code,
        ali_error_msg: tokenJson.msg || tokenJson.message || tokenJson.sub_msg,
        raw: tokenText.slice(0, 500),
      });
    }

    // Calculate expires_at
    const expiresAt = expireTime
      ? new Date(Number(expireTime)).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // fallback 24h

    // Store tokens using service role (bypasses RLS)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: upsertErr } = await adminClient
      .from("provider_oauth_tokens")
      .upsert({
        user_id: userData.user.id,
        provider_key: "aliexpress",
        access_token: accessToken,
        refresh_token: refreshToken || null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,provider_key" });

    if (upsertErr) {
      console.error("Failed to store token", upsertErr);
      return safeJson({ ok: false, error: "Failed to store token: " + upsertErr.message });
    }

    return safeJson({
      ok: true,
      message: "AliExpress connected successfully",
      expires_at: expiresAt,
    });
  } catch (e: any) {
    console.error("aliexpress-auth-callback error", e?.message, e?.stack);
    return safeJson({ ok: false, error: e?.message || "Unknown error" });
  }
});
