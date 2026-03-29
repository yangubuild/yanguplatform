import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OUTSTAND_BASE = "https://api.outstand.so/v1";

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getApiKey(): string {
  const key = Deno.env.get("OUTSTAND_API_KEY");
  if (!key) throw new Error("OUTSTAND_API_KEY not configured");
  return key;
}

async function outstandFetch(
  path: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<Response> {
  const apiKey = getApiKey();
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };
  if (body && method !== "GET") {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${OUTSTAND_BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Outstand API ${method} ${path} failed [${res.status}]: ${text}`);
  }
  return res;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      // ── Health check ────────────────────────────────────
      case "health": {
        try {
          getApiKey();
          // Try a lightweight call to verify connectivity
          const res = await fetch(`${OUTSTAND_BASE}/accounts`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${getApiKey()}`,
              "Content-Type": "application/json",
            },
          });
          return jsonResponse({
            ok: res.ok,
            status: res.status,
            message: res.ok ? "Outstand reachable" : `Outstand returned ${res.status}`,
          });
        } catch (e) {
          return jsonResponse({ ok: false, message: e.message });
        }
      }

      // ── Get OAuth connect URL ───────────────────────────
      case "get_connect_url": {
        const { provider, redirectUrl, workspaceId } = params;
        if (!provider) return errorResponse("provider is required", 400);

        const res = await outstandFetch("/auth/connect", "POST", {
          provider,
          redirect_url: redirectUrl,
          metadata: { workspace_id: workspaceId },
        });
        const data = await res.json();
        return jsonResponse({
          url: data.url || data.auth_url || data.connect_url,
          state: data.state,
        });
      }

      // ── OAuth callback exchange ─────────────────────────
      case "oauth_callback": {
        const { code, state, workspaceId } = params;
        if (!code) return errorResponse("code is required", 400);

        const res = await outstandFetch("/auth/callback", "POST", {
          code,
          state,
        });
        const data = await res.json();

        // Persist to DB
        if (data.account) {
          const supabase = getSupabaseAdmin();
          const accountData = {
            workspace_id: workspaceId,
            provider: data.account.provider || "unknown",
            provider_user_id: data.account.id || data.account.provider_user_id,
            display_name: data.account.name || data.account.display_name || "",
            avatar_url: data.account.avatar_url || null,
            account_type: data.account.account_type || "personal",
            account_handle: data.account.handle || data.account.username || null,
            status: "active",
            scopes: data.account.scopes || [],
            metadata: data.account.metadata || data.account,
            last_synced_at: new Date().toISOString(),
          };

          // Check if we already have this account linked
          const { data: existing } = await supabase
            .from("social_connected_accounts")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("provider_user_id", accountData.provider_user_id)
            .eq("provider", accountData.provider)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("social_connected_accounts")
              .update({ ...accountData, updated_at: new Date().toISOString() })
              .eq("id", existing.id);
            accountData["id"] = existing.id;
          } else {
            const { data: inserted } = await supabase
              .from("social_connected_accounts")
              .insert(accountData)
              .select("id")
              .single();
            if (inserted) accountData["id"] = inserted.id;
          }

          return jsonResponse({ account: accountData });
        }

        return jsonResponse({ account: data });
      }

      // ── List accounts ───────────────────────────────────
      case "list_accounts": {
        const { workspaceId } = params;
        const res = await outstandFetch("/accounts", "GET");
        const data = await res.json();
        return jsonResponse({ accounts: data.accounts || data.data || [] });
      }

      // ── Refresh account ─────────────────────────────────
      case "refresh_account": {
        const { accountId } = params;
        if (!accountId) return errorResponse("accountId is required", 400);
        const res = await outstandFetch(`/accounts/${accountId}`, "GET");
        const data = await res.json();

        // Update DB
        const supabase = getSupabaseAdmin();
        await supabase
          .from("social_connected_accounts")
          .update({
            display_name: data.name || data.display_name,
            avatar_url: data.avatar_url,
            status: data.status || "active",
            last_synced_at: new Date().toISOString(),
            metadata: data,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_user_id", accountId);

        return jsonResponse({ account: data });
      }

      // ── Disconnect account ──────────────────────────────
      case "disconnect_account": {
        const { accountId } = params;
        if (!accountId) return errorResponse("accountId is required", 400);
        try {
          await outstandFetch(`/accounts/${accountId}/disconnect`, "POST");
        } catch {
          // Outstand may not have a disconnect endpoint; just update local status
        }

        const supabase = getSupabaseAdmin();
        await supabase
          .from("social_connected_accounts")
          .update({ status: "disconnected", updated_at: new Date().toISOString() })
          .eq("id", accountId);

        return jsonResponse({ disconnected: true });
      }

      // ── Create post ─────────────────────────────────────
      case "create_post":
      case "publish_post": {
        const { accountId, caption, media_urls, platform_payload } = params;
        if (!accountId) return errorResponse("accountId is required", 400);

        const res = await outstandFetch("/posts", "POST", {
          account_id: accountId,
          content: caption,
          media_urls: media_urls || [],
          ...(platform_payload || {}),
        });
        const data = await res.json();
        return jsonResponse({
          provider_post_id: data.id || data.post_id,
          url: data.url,
          metadata: data,
        });
      }

      // ── Schedule post ───────────────────────────────────
      case "schedule_post": {
        const { accountId, caption, media_urls, scheduled_for, platform_payload } = params;
        if (!accountId) return errorResponse("accountId is required", 400);
        if (!scheduled_for) return errorResponse("scheduled_for is required", 400);

        const res = await outstandFetch("/posts/schedule", "POST", {
          account_id: accountId,
          content: caption,
          media_urls: media_urls || [],
          scheduled_for,
          ...(platform_payload || {}),
        });
        const data = await res.json();
        return jsonResponse({
          provider_post_id: data.id || data.post_id,
          url: data.url,
          metadata: data,
        });
      }

      // ── Fetch analytics ─────────────────────────────────
      case "fetch_analytics": {
        const { accountId, start_date, end_date, metrics } = params;
        if (!accountId) return errorResponse("accountId is required", 400);

        const qs = new URLSearchParams({
          account_id: accountId,
          start_date: start_date || "",
          end_date: end_date || "",
        });
        if (metrics?.length) qs.set("metrics", metrics.join(","));

        const res = await outstandFetch(`/analytics?${qs.toString()}`, "GET");
        const data = await res.json();
        return jsonResponse({ metrics: data.metrics || data.data || data });
      }

      // ── Webhook intake ──────────────────────────────────
      case "webhook": {
        const supabase = getSupabaseAdmin();

        // Log the raw webhook event
        await supabase.from("social_publish_events").insert({
          event_type: params.event_type || "webhook_received",
          source: "outstand_webhook",
          payload: params,
          status: "received",
          workspace_id: params.workspace_id || null,
          post_id: params.post_id || null,
        });

        // Handle status updates
        if (params.event_type === "post.published" && params.post_id) {
          await supabase
            .from("social_post_targets")
            .update({
              publish_status: "published",
              published_at: new Date().toISOString(),
              provider_post_id: params.provider_post_id,
            })
            .eq("provider_post_id", params.provider_post_id);
        }

        if (params.event_type === "post.failed" && params.provider_post_id) {
          await supabase
            .from("social_post_targets")
            .update({
              publish_status: "failed",
              last_error: params.error || "Unknown error from provider",
            })
            .eq("provider_post_id", params.provider_post_id);
        }

        return jsonResponse({ received: true });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    console.error("outstand-proxy error:", err);
    return new Response(
      JSON.stringify({ error: err.message, code: "OUTSTAND_PROXY_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
