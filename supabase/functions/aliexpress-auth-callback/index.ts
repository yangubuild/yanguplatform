import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FRONTEND_URL = "https://yangu-launchpad.lovable.app/dashboard/seller/eshop-connect";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function redirectWithError(msg: string) {
  const url = new URL(FRONTEND_URL);
  url.searchParams.set("ae_error", msg);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

function redirectWithSuccess() {
  const url = new URL(FRONTEND_URL);
  url.searchParams.set("connected", "1");
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

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

  // This endpoint is called as a browser redirect (GET) from AliExpress
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim() || "";
  const state = url.searchParams.get("state")?.trim() || "";

  console.log("[aliexpress-auth-callback] Received callback", {
    has_code: !!code,
    code_prefix: code ? code.slice(0, 6) + "..." : "(none)",
    state_prefix: state ? state.slice(0, 20) + "..." : "(none)",
    method: req.method,
  });

  if (!code) {
    console.error("[aliexpress-auth-callback] Missing authorization code");
    return redirectWithError("Missing authorization code");
  }

  if (!state || !state.includes(":")) {
    console.error("[aliexpress-auth-callback] Invalid state token");
    return redirectWithError("Invalid state token");
  }

  // Extract user_id from state (format: userId:randomUUID)
  const userId = state.split(":")[0];
  if (!userId || userId.length < 10) {
    console.error("[aliexpress-auth-callback] Invalid user_id in state");
    return redirectWithError("Invalid state token (bad user_id)");
  }

  const appKey = (Deno.env.get("ALIEXPRESS_APP_KEY") || "").trim();
  const appSecret = (Deno.env.get("ALIEXPRESS_APP_SECRET") || "").trim();

  if (!appKey || !appSecret) {
    console.error("[aliexpress-auth-callback] Missing AliExpress credentials");
    return redirectWithError("AliExpress not configured");
  }

  // Exchange code for tokens using the documented endpoint

  // Use the documented token endpoint
  const tokenUrl = new URL("https://open-api.taobao.com/rest");
  tokenUrl.searchParams.set("path", "/auth/token/create");

  const tokenParams = new URLSearchParams({
    code,
    appkey: appKey,
    secretKey: appSecret,
  });

  let tokenRes: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    tokenRes = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: tokenParams.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (fetchErr: any) {
    console.error("[aliexpress-auth-callback] Token fetch failed:", fetchErr?.message);
    return redirectWithError("Failed to reach AliExpress token endpoint");
  }

  const tokenText = await tokenRes.text();
  console.log("[aliexpress-auth-callback] Raw token response body:", tokenText.slice(0, 1000));
  console.log("[aliexpress-auth-callback] Token response status:", tokenRes.status, "body length:", tokenText.length);

  let tokenJson: any;
  try { tokenJson = JSON.parse(tokenText); } catch {
    console.error("[aliexpress-auth-callback] Invalid JSON from AliExpress:", tokenText.slice(0, 500));
    return redirectWithError("Invalid response from AliExpress");
  }

  // Parse nested AliExpress response structure
  const oauthResponse = tokenJson?.aliexpress_system_oauth_token_response?.result;
  const topLevelResult = tokenJson?.result;

  // Check for success in the nested structure
  const successData = oauthResponse?.data;
  const isSuccess = oauthResponse?.ret === "true" && successData?.access_token;

  if (!isSuccess) {
    // Error: could be in nested or top-level result
    const errResult = oauthResponse || topLevelResult || tokenJson;
    const errCode = errResult?.code || "UNKNOWN";
    const errMsg = errResult?.msg || errResult?.message || "Unknown error";
    console.error("[aliexpress-auth-callback] Token exchange failed", { ret: oauthResponse?.ret || topLevelResult?.ret, code: errCode, msg: errMsg });
    return redirectWithError(`AliExpress error ${errCode}: ${errMsg}`);
  }

  const accessToken = successData.access_token;
  const refreshToken = successData.refresh_token;
  const expiresIn = successData.expires_in; // seconds

  console.log("[aliexpress-auth-callback] Token exchange successful, storing tokens for user:", userId.slice(0, 8) + "...");

  const expiresAt = expiresIn
    ? new Date(Date.now() + Number(expiresIn) * 1000).toISOString()
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Store tokens using service role (bypasses RLS)
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error: upsertErr } = await adminClient
    .from("provider_oauth_tokens")
    .upsert({
      user_id: userId,
      provider_key: "aliexpress",
      access_token: accessToken,
      refresh_token: refreshToken || null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,provider_key" });

  if (upsertErr) {
    console.error("[aliexpress-auth-callback] Failed to store token:", upsertErr.message);
    return redirectWithError("Failed to store token");
  }

  // Verify the row was inserted
  const { data: verifyRow } = await adminClient
    .from("provider_oauth_tokens")
    .select("id, expires_at")
    .eq("user_id", userId)
    .eq("provider_key", "aliexpress")
    .maybeSingle();

  console.log("[aliexpress-auth-callback] Token stored successfully:", {
    row_exists: !!verifyRow,
    expires_at: verifyRow?.expires_at,
  });

  return redirectWithSuccess();
});
