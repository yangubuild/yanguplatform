import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

Deno.serve(async (req) => {
  // This is a redirect endpoint — Google sends a GET with ?code=...&state=...
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    if (errorParam) {
      console.error("[drive-callback] OAuth error:", errorParam);
      return redirectWithStatus("error", "OAuth denied", "");
    }

    if (!code || !stateParam) {
      return redirectWithStatus("error", "Missing code or state", "");
    }

    // Decode state
    let stateData: { uid: string; rb: string };
    try {
      stateData = JSON.parse(atob(stateParam));
    } catch {
      return redirectWithStatus("error", "Invalid state", "");
    }

    const userId = stateData.uid;
    const redirectBack = stateData.rb || "";

    if (!userId) {
      return redirectWithStatus("error", "No user in state", redirectBack);
    }

    // --- Exchange code for tokens ---
    const clientId = (Deno.env.get("GOOGLE_DRIVE_CLIENT_ID") || "").trim();
    const clientSecret = (Deno.env.get("GOOGLE_DRIVE_CLIENT_SECRET") || "").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callbackUrl = `${supabaseUrl}/functions/v1/drive-callback`;

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[drive-callback] Token exchange failed:", tokenData);
      return redirectWithStatus(
        "error",
        "Token exchange failed",
        redirectBack
      );
    }

    // --- Store tokens via service_role ---
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const expiresAt = new Date(
      Date.now() + (tokenData.expires_in || 3600) * 1000
    ).toISOString();

    const { error: upsertErr } = await supabase.from("drive_tokens").upsert(
      {
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      console.error("[drive-callback] DB upsert error:", upsertErr);
      return redirectWithStatus("error", "Failed to save tokens", redirectBack);
    }

    return redirectWithStatus("success", "", redirectBack);
  } catch (err) {
    console.error("[drive-callback] Error:", err);
    return redirectWithStatus("error", "Internal error", "");
  }
});

function redirectWithStatus(
  status: string,
  message: string,
  redirectBack: string
): Response {
  // Default redirect to the My Apps page
  let target = redirectBack || "/dashboard/my-apps";

  // Ensure it's a relative path (security)
  if (target.startsWith("http")) {
    try {
      const u = new URL(target);
      target = u.pathname + u.search + u.hash;
    } catch {
      target = "/dashboard/my-apps";
    }
  }

  const sep = target.includes("?") ? "&" : "?";
  const finalUrl = `${target}${sep}drive_status=${status}${message ? `&drive_msg=${encodeURIComponent(message)}` : ""}`;

  // Use true HTTP 302 redirect to cleanly return to the app
  // Since this is a relative path, the browser resolves it against the current origin.
  // For cross-origin redirect, prepend the app origin.
  const appOrigin = "https://yangu.io";
  const absoluteUrl = finalUrl.startsWith("http") ? finalUrl : `${appOrigin}${finalUrl}`;

  return new Response(null, {
    status: 302,
    headers: { Location: absoluteUrl },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
