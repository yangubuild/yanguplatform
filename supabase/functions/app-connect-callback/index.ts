import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Universal OAuth callback for app connections.
 * Receives ?code=...&state=... from OAuth provider.
 * Exchanges code for tokens, stores in connected_accounts,
 * updates app_user_installs status to 'connected',
 * then redirects user back.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateB64 = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    if (!stateB64) {
      return new Response(JSON.stringify({ error: "Missing state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let state: { uid: string; slug: string; rb: string; origin?: string };
    try {
      state = JSON.parse(atob(stateB64));
    } catch {
      return new Response(JSON.stringify({ error: "Invalid state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (errorParam) {
      return redirectToApp(state.rb, state.slug, "error", "OAuth access was denied", state.origin);
    }

    if (!code) {
      return redirectToApp(state.rb, state.slug, "error", "Missing authorization code", state.origin);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const callbackUrl = `${supabaseUrl}/functions/v1/app-connect-callback`;
    const requestId = crypto.randomUUID();

    let providerUserId = "";
    let accessToken = "";
    let refreshToken = "";
    let expiresAt: string | null = null;

    // --------------- Google ---------------
    if (["google-drive", "gmail", "google-meet", "youtube"].includes(state.slug)) {
      const clientIdEnvName = "GOOGLE_DRIVE_CLIENT_ID";
      const clientSecretEnvName = "GOOGLE_DRIVE_CLIENT_SECRET";
      const rawClientId = Deno.env.get(clientIdEnvName);
      const rawClientSecret = Deno.env.get(clientSecretEnvName);
      const clientId = normalizeOAuthCredential(rawClientId);
      const clientSecret = normalizeOAuthCredential(rawClientSecret);

      console.log("[app-connect-callback] Google OAuth env binding", {
        requestId,
        slug: state.slug,
        envNames: [clientIdEnvName, clientSecretEnvName],
        clientIdPresent: Boolean(rawClientId),
        clientSecretPresent: Boolean(rawClientSecret),
        clientIdLength: clientId.length,
        clientSecretLength: clientSecret.length,
        clientIdDigest: await credentialDigest(clientId),
        clientSecretDigest: await credentialDigest(clientSecret),
        redirectUri: callbackUrl,
      });

      if (!clientId || !clientSecret) {
        return redirectToApp(state.rb, state.slug, "error", "Google OAuth is not configured");
      }

      const credentialFingerprint = {
        source: "GOOGLE_DRIVE_CLIENT_ID/GOOGLE_DRIVE_CLIENT_SECRET",
        envNames: [clientIdEnvName, clientSecretEnvName],
        clientId: maskCredential(clientId, 8),
        clientIdLength: clientId.length,
        clientSecret: maskCredential(clientSecret, 4),
        clientSecretLength: clientSecret.length,
        clientIdDigest: await credentialDigest(clientId),
        clientSecretDigest: await credentialDigest(clientSecret),
      };

      const tokenResult = await exchangeGoogleToken({
        code,
        clientId,
        clientSecret,
        redirectUri: callbackUrl,
      });

      console.log("[app-connect-callback] Google token exchange result", {
        requestId,
        authMethod: tokenResult.authMethod,
        slug: state.slug,
        attempts: tokenResult.attempts,
      });

      if (!tokenResult.tokens?.access_token) {
        console.error("Google token error:", {
          requestId,
          tokens: tokenResult.tokens,
          credentialFingerprint,
          authMethod: tokenResult.authMethod,
          slug: state.slug,
        });

        const providerMessage =
          tokenResult.tokens?.error_description ||
          tokenResult.tokens?.error ||
          "Token exchange failed";

        return redirectToApp(state.rb, state.slug, "error", providerMessage, state.origin);
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
        return new Response(JSON.stringify({ error: "PayPal not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
    const { error: connectedAccountUpsertError } = await admin.from("connected_accounts").upsert(
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

    if (connectedAccountUpsertError) {
      console.error("[app-connect-callback] Failed to persist connected_accounts", {
        requestId,
        slug: state.slug,
        userId: state.uid,
        error: connectedAccountUpsertError.message,
      });
      return redirectToApp(state.rb, state.slug, "error", "Failed to persist connection token", state.origin);
    }

    // Also sync to drive_tokens for google-drive so existing Drive features work
    if (state.slug === "google-drive" && accessToken) {
      const { error: driveTokenUpsertError } = await admin.from("drive_tokens").upsert(
        {
          user_id: state.uid,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (driveTokenUpsertError) {
        console.error("[app-connect-callback] Failed to sync drive_tokens", {
          requestId,
          userId: state.uid,
          error: driveTokenUpsertError.message,
        });
      }
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

    return redirectToApp(state.rb, state.slug, "success", undefined, state.origin);
  } catch (err) {
    console.error("[app-connect-callback]", err);
    return new Response(
      `Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      { status: 500 }
    );
  }
});

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleTokenAttempt = {
  method: "client_secret_post" | "client_secret_basic" | "minimal_form_post";
  tokenUrl: string;
  grantType: "authorization_code";
  clientIdSource: "GOOGLE_DRIVE_CLIENT_ID";
  clientSecretSource: "GOOGLE_DRIVE_CLIENT_SECRET";
  redirectUri: string;
  contentType: "application/x-www-form-urlencoded";
  formEncoded: true;
  includesClientSecretInBody: boolean;
  includesClientSecretInAuthorizationHeader: boolean;
  requestBodyShape: string;
  status: number;
  responseError?: string;
  responseErrorDescription?: string;
};

async function exchangeGoogleToken(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{
  tokens: GoogleTokenResponse;
  authMethod: "client_secret_post" | "client_secret_basic" | "minimal_form_post";
  attempts: GoogleTokenAttempt[];
}> {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const attempts: GoogleTokenAttempt[] = [];

  const postBody = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  }).toString();

  console.log("[app-connect-callback] Google token request", {
    method: "client_secret_post",
    tokenUrl,
    grant_type: "authorization_code",
    client_id_source: "GOOGLE_DRIVE_CLIENT_ID",
    client_secret_source: "GOOGLE_DRIVE_CLIENT_SECRET",
    redirect_uri: params.redirectUri,
    includes_client_secret_in_body: true,
    includes_client_secret_in_authorization_header: false,
    content_type: "application/x-www-form-urlencoded",
    form_encoded: true,
    request_body_shape: redactGoogleTokenBody(postBody),
  });

  const postResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: postBody,
  });

  const postTokens = (await postResponse.json()) as GoogleTokenResponse;

  attempts.push({
    method: "client_secret_post",
    tokenUrl,
    grantType: "authorization_code",
    clientIdSource: "GOOGLE_DRIVE_CLIENT_ID",
    clientSecretSource: "GOOGLE_DRIVE_CLIENT_SECRET",
    redirectUri: params.redirectUri,
    contentType: "application/x-www-form-urlencoded",
    formEncoded: true,
    includesClientSecretInBody: true,
    includesClientSecretInAuthorizationHeader: false,
    requestBodyShape: redactGoogleTokenBody(postBody),
    status: postResponse.status,
    responseError: postTokens.error,
    responseErrorDescription: postTokens.error_description,
  });

  if (postResponse.ok || postTokens.error !== "invalid_client") {
    return { tokens: postTokens, authMethod: "client_secret_post", attempts };
  }

  const basicBody = new URLSearchParams({
    code: params.code,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  }).toString();

  console.log("[app-connect-callback] Google token request", {
    method: "client_secret_basic",
    tokenUrl,
    grant_type: "authorization_code",
    client_id_source: "GOOGLE_DRIVE_CLIENT_ID",
    client_secret_source: "GOOGLE_DRIVE_CLIENT_SECRET",
    redirect_uri: params.redirectUri,
    includes_client_secret_in_body: false,
    includes_client_secret_in_authorization_header: true,
    content_type: "application/x-www-form-urlencoded",
    form_encoded: true,
    request_body_shape: redactGoogleTokenBody(basicBody),
  });

  const basicResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${params.clientId}:${params.clientSecret}`)}`,
    },
    body: basicBody,
  });

  const basicTokens = (await basicResponse.json()) as GoogleTokenResponse;

  attempts.push({
    method: "client_secret_basic",
    tokenUrl,
    grantType: "authorization_code",
    clientIdSource: "GOOGLE_DRIVE_CLIENT_ID",
    clientSecretSource: "GOOGLE_DRIVE_CLIENT_SECRET",
    redirectUri: params.redirectUri,
    contentType: "application/x-www-form-urlencoded",
    formEncoded: true,
    includesClientSecretInBody: false,
    includesClientSecretInAuthorizationHeader: true,
    requestBodyShape: redactGoogleTokenBody(basicBody),
    status: basicResponse.status,
    responseError: basicTokens.error,
    responseErrorDescription: basicTokens.error_description,
  });

  if (basicResponse.ok || basicTokens.error !== "invalid_client") {
    return { tokens: basicTokens, authMethod: "client_secret_basic", attempts };
  }

  // Minimal direct form-encoded comparison test using the same runtime values.
  const minimalBody = [
    `code=${encodeURIComponent(params.code)}`,
    `client_id=${encodeURIComponent(params.clientId)}`,
    `client_secret=${encodeURIComponent(params.clientSecret)}`,
    `redirect_uri=${encodeURIComponent(params.redirectUri)}`,
    "grant_type=authorization_code",
  ].join("&");

  console.log("[app-connect-callback] Google token request", {
    method: "minimal_form_post",
    tokenUrl,
    grant_type: "authorization_code",
    client_id_source: "GOOGLE_DRIVE_CLIENT_ID",
    client_secret_source: "GOOGLE_DRIVE_CLIENT_SECRET",
    redirect_uri: params.redirectUri,
    includes_client_secret_in_body: true,
    includes_client_secret_in_authorization_header: false,
    content_type: "application/x-www-form-urlencoded",
    form_encoded: true,
    request_body_shape: redactGoogleTokenBody(minimalBody),
  });

  const minimalResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: minimalBody,
  });

  const minimalTokens = (await minimalResponse.json()) as GoogleTokenResponse;

  attempts.push({
    method: "minimal_form_post",
    tokenUrl,
    grantType: "authorization_code",
    clientIdSource: "GOOGLE_DRIVE_CLIENT_ID",
    clientSecretSource: "GOOGLE_DRIVE_CLIENT_SECRET",
    redirectUri: params.redirectUri,
    contentType: "application/x-www-form-urlencoded",
    formEncoded: true,
    includesClientSecretInBody: true,
    includesClientSecretInAuthorizationHeader: false,
    requestBodyShape: redactGoogleTokenBody(minimalBody),
    status: minimalResponse.status,
    responseError: minimalTokens.error,
    responseErrorDescription: minimalTokens.error_description,
  });

  return { tokens: minimalTokens, authMethod: "minimal_form_post", attempts };
}

function redactGoogleTokenBody(body: string): string {
  return body
    .replace(/(code=)[^&]*/g, "$1[REDACTED]")
    .replace(/(client_secret=)[^&]*/g, "$1[REDACTED]");
}

async function credentialDigest(value: string): Promise<string> {
  if (!value) return "missing";

  const bytes = new TextEncoder().encode(value);
  const digestBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const digestHex = Array.from(new Uint8Array(digestBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return digestHex.slice(0, 12);
}

function normalizeOAuthCredential(raw: string | undefined): string {
  return (raw || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "")
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
}

function redirectToApp(
  redirectBack: string | undefined,
  slug: string,
  status: "success" | "error",
  message?: string,
  appOrigin?: string,
): Response {
  const path = sanitizeRedirectPath(redirectBack || "/dashboard/my-apps");
  const params = new URLSearchParams({
    connect_status: status,
    connect_app: slug,
  });

  if (status === "error" && message) {
    params.set("connect_error", message.slice(0, 180));
  }

  const sep = path.includes("?") ? "&" : "?";
  const pathWithParams = `${path}${sep}${params.toString()}`;

  // Build absolute URL and use a true HTTP 302 redirect
  const origin = appOrigin || "https://yangu.io";
  const finalUrl = `${origin}${pathWithParams}`;

  return new Response(null, {
    status: 302,
    headers: { Location: finalUrl },
  });
}

function sanitizeRedirectPath(target: string): string {
  if (target.startsWith("http")) {
    try {
      const parsed = new URL(target);
      return parsed.pathname + parsed.search + parsed.hash;
    } catch {
      return "/dashboard/my-apps";
    }
  }

  return target.startsWith("/") ? target : "/dashboard/my-apps";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function maskCredential(value: string, visibleChars: number): string {
  if (value.length <= visibleChars * 2) {
    return `${value.slice(0, 1)}***${value.slice(-1)}`;
  }

  return `${value.slice(0, visibleChars)}***${value.slice(-visibleChars)}`;
}
