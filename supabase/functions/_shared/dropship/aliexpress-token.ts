import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Retrieves a valid AliExpress access token for the given user.
 * Auto-refreshes if expired.
 * Returns null if no token exists.
 */
export async function getAliExpressAccessToken(userId: string): Promise<string | null> {
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await adminClient
    .from("provider_oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider_key", "aliexpress")
    .maybeSingle();

  if (error || !data) return null;

  const now = Date.now();
  const expiresAt = new Date(data.expires_at).getTime();

  // If token is still valid (with 5 min buffer), return it
  if (expiresAt > now + 5 * 60 * 1000) {
    return data.access_token;
  }

  // Try refresh
  if (!data.refresh_token) {
    // No refresh token — mark as expired
    await adminClient
      .from("provider_oauth_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("provider_key", "aliexpress");
    return null;
  }

  const appKey = (Deno.env.get("ALIEXPRESS_APP_KEY") || "").trim();
  const appSecret = (Deno.env.get("ALIEXPRESS_APP_SECRET") || "").trim();

  if (!appKey || !appSecret) return null;

  try {
    const refreshParams = new URLSearchParams({
      app_key: appKey,
      app_secret: appSecret,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch("https://api-sg.aliexpress.com/auth/token/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: refreshParams.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { return null; }

    if (!json.access_token) {
      // Refresh failed — delete token row so UI shows reconnect
      console.error("AliExpress token refresh failed", json);
      await adminClient
        .from("provider_oauth_tokens")
        .delete()
        .eq("user_id", userId)
        .eq("provider_key", "aliexpress");
      return null;
    }

    const newExpiresAt = json.expire_time
      ? new Date(Number(json.expire_time)).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await adminClient
      .from("provider_oauth_tokens")
      .update({
        access_token: json.access_token,
        refresh_token: json.refresh_token || data.refresh_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider_key", "aliexpress");

    return json.access_token;
  } catch (e) {
    console.error("AliExpress token refresh error", e);
    return null;
  }
}

/**
 * Check if user has an AliExpress token (without exposing the token itself)
 */
export async function hasAliExpressToken(userId: string): Promise<boolean> {
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data } = await adminClient
    .from("provider_oauth_tokens")
    .select("id")
    .eq("user_id", userId)
    .eq("provider_key", "aliexpress")
    .maybeSingle();

  return !!data;
}
