import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Universal OAuth callback for app connections.
 * Receives ?code=...&state=... from OAuth provider.
 * Exchanges code for tokens, stores in connected_accounts,
 * updates app_user_installs status to 'connected',
 * then redirects user back.
 */
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateB64 = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    if (!stateB64) {
      return new Response("Missing state", { status: 400 });
    }

    let state: { uid: string; slug: string; rb: string };
    try {
      state = JSON.parse(atob(stateB64));
    } catch {
      return new Response("Invalid state", { status: 400 });
    }

    if (errorParam) {
      return redirectToApp(state.rb, state.slug, "error", "OAuth access was denied");
    }

    if (!code) {
      return redirectToApp(state.rb, state.slug, "error", "Missing authorization code");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const callbackUrl = `${supabaseUrl}/functions/v1/app-connect-callback`;

    let providerUserId = "";
    let accessToken = "";
    let refreshToken = "";
    let expiresAt: string | null = null;

    // --------------- Google ---------------
    if (["google-drive", "gmail", "google-meet", "youtube"].includes(state.slug)) {
      const clientId = normalizeOAuthCredential(Deno.env.get("GOOGLE_DRIVE_CLIENT_ID"));
      const clientSecret = normalizeOAuthCredential(Deno.env.get("GOOGLE_DRIVE_CLIENT_SECRET"));
      if (!clientId || !clientSecret) {
        return redirectToApp(state.rb, state.slug, "error", "Google OAuth is not configured");
      }

      const credentialFingerprint = {
        source: "GOOGLE_DRIVE_CLIENT_ID/GOOGLE_DRIVE_CLIENT_SECRET",
        clientId: maskCredential(clientId, 8),
        clientIdLength: clientId.length,
        clientSecret: maskCredential(clientSecret, 4),
        clientSecretLength: clientSecret.length,
      };

      const tokenResult = await exchangeGoogleToken({
        code,
        clientId,
        clientSecret,
        redirectUri: callbackUrl,
      });

      if (!tokenResult.tokens?.access_token) {
        console.error("Google token error:", {
          tokens: tokenResult.tokens,
          credentialFingerprint,
          authMethod: tokenResult.authMethod,
          slug: state.slug,
        });

        const providerMessage =
          tokenResult.tokens?.error_description ||
          tokenResult.tokens?.error ||
          "Token exchange failed";

        return redirectToApp(state.rb, state.slug, "error", providerMessage);
      }

      accessToken = tokenResult.tokens.access_token;
      refreshToken = tokenResult.tokens.refresh_token || "";
      expiresAt = new Date(
        Date.now() + (tokenResult.tokens.expires_in || 3600) * 1000,
      ).toISOString();

      // Get user info
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoRes.json();
      providerUserId = userInfo.id || userInfo.email || "";
    }

    // --------------- PayPal ---------------
    else if (state.slug === "paypal") {
      const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
      const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
      if (!clientId || !clientSecret) {
        return new Response("PayPal not configured", { status: 500 });
      }

      const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("PayPal token error:", tokens);
        return new Response(`PayPal token exchange failed`, { status: 500 });
      }

      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || "";
      expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
      providerUserId = tokens.payer_id || "";
    }

    // --------------- Notion ---------------
    else if (state.slug === "notion") {
      const clientId = Deno.env.get("NOTION_CLIENT_ID");
      const clientSecret = Deno.env.get("NOTION_CLIENT_SECRET");
      if (!clientId || !clientSecret) {
        return new Response("Notion not configured", { status: 500 });
      }

      const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("Notion token error:", tokens);
        return new Response("Notion token exchange failed", { status: 500 });
      }

      accessToken = tokens.access_token;
      providerUserId = tokens.workspace_id || "";
    }

    // --------------- Discord ---------------
    else if (state.slug === "discord") {
      const clientId = Deno.env.get("DISCORD_CLIENT_ID");
      const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");
      if (!clientId || !clientSecret) {
        return new Response("Discord not configured", { status: 500 });
      }

      const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("Discord token error:", tokens);
        return new Response("Discord token exchange failed", { status: 500 });
      }

      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || "";
      expiresAt = new Date(Date.now() + (tokens.expires_in || 604800) * 1000).toISOString();

      // Get Discord user
      const meRes = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const me = await meRes.json();
      providerUserId = me.id || "";
    }

    // Store in connected_accounts
    await admin.from("connected_accounts").upsert(
      {
        user_id: state.uid,
        provider: state.slug,
        provider_user_id: providerUserId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    // Also sync to drive_tokens for google-drive so existing Drive features work
    if (state.slug === "google-drive" && accessToken) {
      await admin.from("drive_tokens").upsert(
        {
          user_id: state.uid,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    // Update app_user_installs status to connected
    const { data: appRow } = await admin
      .from("app_registry")
      .select("id")
      .eq("slug", state.slug)
      .single();

    if (appRow) {
      await admin
        .from("app_user_installs")
        .update({ status: "connected", updated_at: new Date().toISOString() })
        .eq("user_id", state.uid)
        .eq("app_id", appRow.id);
    }

    // Redirect back — use meta-refresh HTML so it works from any origin
    const rb = state.rb || "/dashboard/my-apps";
    const sep = rb.includes("?") ? "&" : "?";
    const finalPath = `${rb}${sep}connect_status=success&connect_app=${state.slug}`;

    const html = `<!DOCTYPE html>
<html><head><meta http-equiv="refresh" content="0;url=${finalPath}"></head>
<body><p>Connected! Redirecting…</p></body></html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[app-connect-callback]", err);
    return new Response(
      `Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      { status: 500 }
    );
  }
});

function maskCredential(value: string, visibleChars: number): string {
  if (value.length <= visibleChars * 2) {
    return `${value.slice(0, 1)}***${value.slice(-1)}`;
  }

  return `${value.slice(0, visibleChars)}***${value.slice(-visibleChars)}`;
}
