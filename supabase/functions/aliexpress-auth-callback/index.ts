import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const DEFAULT_FRONTEND_URL = "https://yangu-launchpad.lovable.app/dashboard/seller/eshop-connect";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function redirectWithError(frontendUrl: string, msg: string) {
  const url = new URL(frontendUrl);
  url.searchParams.set("ae_error", msg);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

function redirectWithSuccess(frontendUrl: string) {
  const url = new URL(frontendUrl);
  url.searchParams.set("connected", "1");
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

function safeJson(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type ParsedAliToken = {
  accessToken?: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  ret?: string;
  code?: string;
  msg?: string;
  path?: string;
};

function normalizeRet(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value == null) return "";
  return String(value).toLowerCase();
}

function toPositiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseXmlTokenBody(xmlText: string): ParsedAliToken {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) throw new Error("XML parse error");

  const read = (selectors: string[]) => {
    for (const selector of selectors) {
      const text = doc.querySelector(selector)?.textContent?.trim();
      if (text) return text;
    }
    return "";
  };

  const accessToken = read(["aliexpress_system_oauth_token_response > result > data > access_token", "result > data > access_token", "data > access_token", "access_token"]);
  const refreshToken = read(["aliexpress_system_oauth_token_response > result > data > refresh_token", "result > data > refresh_token", "data > refresh_token", "refresh_token"]);
  const expiresInRaw = read(["aliexpress_system_oauth_token_response > result > data > expires_in", "result > data > expires_in", "data > expires_in", "expires_in"]);
  const ret = read(["aliexpress_system_oauth_token_response > result > ret", "result > ret", "ret"]);
  const code = read(["aliexpress_system_oauth_token_response > result > code", "result > code", "code"]);
  const msg = read(["aliexpress_system_oauth_token_response > result > msg", "result > msg", "msg", "message"]);

  const path = accessToken
    ? "xml.aliexpress_system_oauth_token_response.result.data.access_token|xml.result.data.access_token"
    : "xml.(token path not found)";

  return {
    accessToken: accessToken || undefined,
    refreshToken: refreshToken || null,
    expiresIn: toPositiveNumber(expiresInRaw),
    ret,
    code,
    msg,
    path,
  };
}

function parseJsonTokenBody(tokenJson: any): ParsedAliToken {
  const nestedResult = tokenJson?.aliexpress_system_oauth_token_response?.result;
  const topResult = tokenJson?.result;

  const candidates = [
    {
      path: "aliexpress_system_oauth_token_response.result.data.access_token",
      data: nestedResult?.data,
      result: nestedResult,
    },
    {
      path: "result.data.access_token",
      data: topResult?.data,
      result: topResult,
    },
    {
      path: "data.access_token",
      data: tokenJson?.data,
      result: tokenJson,
    },
    {
      path: "access_token",
      data: tokenJson,
      result: tokenJson,
    },
  ];

  const ret = nestedResult?.ret ?? topResult?.ret ?? tokenJson?.ret;
  const code = nestedResult?.code ?? topResult?.code ?? tokenJson?.code;
  const msg = nestedResult?.msg ?? topResult?.msg ?? tokenJson?.msg ?? tokenJson?.message;

  for (const candidate of candidates) {
    const accessToken = candidate?.data?.access_token;
    if (!accessToken) continue;

    return {
      accessToken,
      refreshToken: candidate?.data?.refresh_token ?? null,
      expiresIn: toPositiveNumber(candidate?.data?.expires_in),
      ret,
      code,
      msg,
      path: candidate.path,
    };
  }

  return {
    ret,
    code,
    msg,
    path: "(token path not found)",
  };
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

  // Extract user_id and return origin from state (format: userId:randomUUID:returnOrigin)
  const stateParts = state.split(":");
  const userId = stateParts[0];
  // Reconstruct origin (may contain colons, e.g. https://...)
  const returnOrigin = stateParts.length >= 3 ? stateParts.slice(2).join(":") : "";
  const frontendUrl = returnOrigin
    ? `${returnOrigin}/dashboard/seller/eshop-connect`
    : DEFAULT_FRONTEND_URL;

  console.log("[aliexpress-auth-callback] Redirect target:", frontendUrl);

  if (!code) {
    console.error("[aliexpress-auth-callback] Missing authorization code");
    return redirectWithError(frontendUrl, "Missing authorization code");
  }

  if (!state || !state.includes(":")) {
    console.error("[aliexpress-auth-callback] Invalid state token");
    return redirectWithError(frontendUrl, "Invalid state token");
  }

  if (!userId || userId.length < 10) {
    console.error("[aliexpress-auth-callback] Invalid user_id in state");
    return redirectWithError(frontendUrl, "Invalid state token (bad user_id)");
  }

  const appKey = (Deno.env.get("ALIEXPRESS_APP_KEY") || "").trim();
  const appSecret = (Deno.env.get("ALIEXPRESS_APP_SECRET") || "").trim();

  if (!appKey || !appSecret) {
    console.error("[aliexpress-auth-callback] Missing AliExpress credentials");
    return redirectWithError(frontendUrl, "AliExpress not configured");
  }

  // Exchange code for tokens using TOP protocol signing
  // Endpoint: https://api-sg.aliexpress.com/rest (GET with signed params)
  const apiPath = "/auth/token/create";

  const params: Record<string, string> = {
    app_key: appKey,
    code,
    sign_method: "sha256",
    timestamp: Date.now().toString(),
    v: "2.0",
  };

  // Generate HMAC-SHA256 signature per TOP protocol:
  // For /rest endpoints: signString = apiPath + sorted(key+value pairs)
  // HMAC key = appSecret
  const sortedKeys = Object.keys(params).sort();
  let signString = apiPath;
  for (const key of sortedKeys) {
    signString += key + params[key];
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(appSecret);
  const msgData = encoder.encode(signString);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const sign = encodeHex(new Uint8Array(signatureBuffer)).toUpperCase();

  params.sign = sign;

  const searchParams = new URLSearchParams(params);
  const finalTokenUrl = `https://api-sg.aliexpress.com/rest${apiPath}?${searchParams.toString()}`;
  console.log("[aliexpress-auth-callback] Final token URL used:", finalTokenUrl.replace(sign, sign.slice(0, 8) + "..."));

  let tokenRes: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    tokenRes = await fetch(finalTokenUrl, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (fetchErr: any) {
    console.error("[aliexpress-auth-callback] Token fetch failed:", fetchErr?.message);
    return redirectWithError(frontendUrl, "Failed to reach AliExpress token endpoint");
  }

  const tokenText = await tokenRes.text();
  const tokenStatus = tokenRes.status;
  const tokenContentType = tokenRes.headers.get("content-type") || "(none)";

  console.log("[aliexpress-auth-callback] Token response status:", tokenStatus);
  console.log("[aliexpress-auth-callback] Token response content-type:", tokenContentType);
  console.log("[aliexpress-auth-callback] Raw token response body START");
  console.log(tokenText);
  console.log("[aliexpress-auth-callback] Raw token response body END");

  let parsedToken: ParsedAliToken;
  const trimmedBody = tokenText.trim();
  const lowerTrimmedBody = trimmedBody.toLowerCase();
  const isXmlResponse =
    tokenContentType.toLowerCase().includes("xml") ||
    /^<\?xml/i.test(trimmedBody) ||
    (/^<[^!][\s\S]*?>/.test(trimmedBody) && !lowerTrimmedBody.startsWith("<!doctype html"));

  if (isXmlResponse) {
    try {
      parsedToken = parseXmlTokenBody(tokenText);
      console.log("[aliexpress-auth-callback] Parsed XML token path:", parsedToken.path);
    } catch (xmlErr: any) {
      console.error("[aliexpress-auth-callback] Failed to parse XML response:", xmlErr?.message);
      console.log("[aliexpress-auth-callback] Final parsed path used:", "(unparsed: invalid-xml-response)");
      return redirectWithError(frontendUrl, "Invalid XML response from AliExpress");
    }
  } else {
    let tokenJson: any;
    try {
      tokenJson = JSON.parse(tokenText);
    } catch {
      console.error("[aliexpress-auth-callback] Invalid JSON from AliExpress:", tokenText);
      console.log("[aliexpress-auth-callback] Final parsed path used:", "(unparsed: non-json-response)");
      return redirectWithError(frontendUrl, "Invalid response from AliExpress");
    }

    parsedToken = parseJsonTokenBody(tokenJson);
    console.log("[aliexpress-auth-callback] Parsed JSON token path:", parsedToken.path);
  }

  const parsedPath = parsedToken.path || "(unknown path)";
  const accessToken = parsedToken.accessToken;
  const refreshToken = parsedToken.refreshToken;
  const expiresIn = parsedToken.expiresIn;
  const ret = normalizeRet(parsedToken.ret);

  console.log("[aliexpress-auth-callback] Final parsed path used:", parsedPath);

  if (!accessToken || (ret && ret !== "true")) {
    const errCode = parsedToken.code || "UNKNOWN";
    const errMsg = parsedToken.msg || "Unknown error";
    console.error("[aliexpress-auth-callback] Token exchange failed", {
      ret,
      code: errCode,
      msg: errMsg,
      parsed_path: parsedPath,
    });
    return redirectWithError(frontendUrl, `AliExpress error ${errCode}: ${errMsg}`);
  }

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
    return redirectWithError(frontendUrl, "Failed to store token");
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

  return redirectWithSuccess(frontendUrl);
});
