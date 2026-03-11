import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Unified app-connect edge function.
 * Routes to the correct OAuth flow based on app_slug.
 * POST body: { app_slug: string, redirect_back?: string }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const slug: string = body.app_slug;
    const redirectBack: string = body.redirect_back || "/dashboard/my-apps";

    if (!slug) {
      return json({ ok: false, error: "app_slug is required" }, 400);
    }

    // --------------- Google OAuth (shared) ---------------
    if (["google-drive", "gmail", "google-meet"].includes(slug)) {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID") || Deno.env.get("GOOGLE_DRIVE_CLIENT_ID");
      if (!clientId) {
        return json({ ok: false, error: "Google OAuth not configured" });
      }

      // Scopes per app
      const scopeMap: Record<string, string[]> = {
        "google-drive": ["https://www.googleapis.com/auth/drive.file"],
        gmail: [
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
        ],
        "google-meet": [
          "https://www.googleapis.com/auth/calendar.events",
        ],
      };

      const scopes = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        ...(scopeMap[slug] || []),
      ];

      const statePayload = JSON.stringify({
        uid: user.id,
        slug,
        rb: redirectBack,
      });
      const state = btoa(statePayload);
      const callbackUrl = `${supabaseUrl}/functions/v1/app-connect-callback`;

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: scopes.join(" "),
        access_type: "offline",
        prompt: "consent",
        state,
      });

      return json({
        ok: true,
        authorize_url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        method: "redirect",
      });
    }

    // --------------- PayPal OAuth ---------------
    if (slug === "paypal") {
      const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
      if (!clientId) {
        return json({ ok: false, error: "PayPal not configured. PAYPAL_CLIENT_ID required." });
      }

      const statePayload = JSON.stringify({ uid: user.id, slug, rb: redirectBack });
      const state = btoa(statePayload);
      const callbackUrl = `${supabaseUrl}/functions/v1/app-connect-callback`;

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        scope: "openid email",
        redirect_uri: callbackUrl,
        state,
      });

      return json({
        ok: true,
        authorize_url: `https://www.paypal.com/signin/authorize?${params.toString()}`,
        method: "redirect",
      });
    }

    // --------------- Stripe ---------------
    if (slug === "stripe") {
      // Stripe uses API key, not OAuth — mark as connected directly
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        return json({ ok: false, error: "Stripe not configured. STRIPE_SECRET_KEY required." });
      }

      // Upsert connected_accounts
      const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await adminClient
        .from("connected_accounts")
        .upsert(
          {
            user_id: user.id,
            provider: "stripe",
            provider_user_id: "platform",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" }
        );

      // Update install status to connected
      await adminClient
        .from("app_user_installs")
        .update({ status: "connected", updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .in(
          "app_id",
          adminClient
            .from("app_registry")
            .select("id")
            .eq("slug", "stripe")
        );

      return json({
        ok: true,
        method: "direct",
        message: "Stripe connected successfully",
        redirect: "/dashboard/payment-settings",
      });
    }

    // --------------- Notion OAuth ---------------
    if (slug === "notion") {
      const clientId = Deno.env.get("NOTION_CLIENT_ID");
      if (!clientId) {
        return json({ ok: false, error: "Notion not configured. NOTION_CLIENT_ID required." });
      }

      const statePayload = JSON.stringify({ uid: user.id, slug, rb: redirectBack });
      const state = btoa(statePayload);
      const callbackUrl = `${supabaseUrl}/functions/v1/app-connect-callback`;

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        owner: "user",
        redirect_uri: callbackUrl,
        state,
      });

      return json({
        ok: true,
        authorize_url: `https://api.notion.com/v1/oauth/authorize?${params.toString()}`,
        method: "redirect",
      });
    }

    // --------------- Discord OAuth ---------------
    if (slug === "discord") {
      const clientId = Deno.env.get("DISCORD_CLIENT_ID");
      if (!clientId) {
        return json({ ok: false, error: "Discord not configured. DISCORD_CLIENT_ID required." });
      }

      const statePayload = JSON.stringify({ uid: user.id, slug, rb: redirectBack });
      const state = btoa(statePayload);
      const callbackUrl = `${supabaseUrl}/functions/v1/app-connect-callback`;

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: "identify guilds",
        state,
      });

      return json({
        ok: true,
        authorize_url: `https://discord.com/api/oauth2/authorize?${params.toString()}`,
        method: "redirect",
      });
    }

    return json({ ok: false, error: `No connection flow defined for ${slug}` }, 400);
  } catch (err) {
    console.error("[app-connect]", err);
    return json({
      ok: false,
      error: err instanceof Error ? err.message : "Internal error",
    }, 500);
  }
});
