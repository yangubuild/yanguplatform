import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-outstand-signature",
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

function log(action: string, detail: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), fn: "outstand-proxy", action, ...detail }));
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

// ── Webhook signature verification ──────────────────────
async function verifyWebhookSignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get("OUTSTAND_WEBHOOK_SECRET");
  if (!secret) {
    log("webhook_sig_skip", { reason: "OUTSTAND_WEBHOOK_SECRET not set" });
    return true; // Allow if no secret configured yet
  }
  const sig = req.headers.get("x-outstand-signature") || req.headers.get("x-webhook-signature");
  if (!sig) {
    log("webhook_sig_fail", { reason: "no signature header" });
    return false;
  }
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");
    const valid = expected === sig.replace("sha256=", "");
    if (!valid) log("webhook_sig_fail", { reason: "mismatch" });
    return valid;
  } catch (e) {
    log("webhook_sig_error", { error: e.message });
    return false;
  }
}

// ── Webhook status normalizer ───────────────────────────
function normalizeWebhookStatus(eventType: string): string | null {
  const map: Record<string, string> = {
    "post.published": "published",
    "post.failed": "failed",
    "post.scheduled": "scheduled",
    "post.rejected": "failed",
    "account.connected": "active",
    "account.disconnected": "disconnected",
    "account.expired": "expired",
    "account.error": "error",
  };
  return map[eventType] || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Read raw body for both parsing and signature verification
  const rawBody = await req.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  try {
    const { action, ...params } = body;

    switch (action) {
      // ── Health check ────────────────────────────────────
      case "health": {
        try {
          getApiKey();
          const res = await fetch(`${OUTSTAND_BASE}/accounts`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${getApiKey()}`,
              "Content-Type": "application/json",
            },
          });
          log("health_check", { ok: res.ok, status: res.status });
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

        log("oauth_connect_started", { provider, workspaceId });

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

        log("oauth_callback_received", { hasCode: true, hasState: !!state });

        const res = await outstandFetch("/auth/callback", "POST", {
          code,
          state,
        });
        const data = await res.json();

        // Persist to DB
        if (data.account) {
          const supabase = getSupabaseAdmin();
          const accountData: Record<string, unknown> = {
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
            accountData.id = existing.id;
          } else {
            const { data: inserted } = await supabase
              .from("social_connected_accounts")
              .insert(accountData)
              .select("id")
              .single();
            if (inserted) accountData.id = inserted.id;
          }

          log("account_persisted", { id: accountData.id, provider: accountData.provider });
          return jsonResponse({ account: accountData });
        }

        return jsonResponse({ account: data });
      }

      // ── List accounts ───────────────────────────────────
      case "list_accounts": {
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
          // Outstand may not have a disconnect endpoint
        }

        const supabase = getSupabaseAdmin();
        await supabase
          .from("social_connected_accounts")
          .update({ status: "disconnected", updated_at: new Date().toISOString() })
          .eq("id", accountId);

        log("account_disconnected", { accountId });
        return jsonResponse({ disconnected: true });
      }

      // ── Create / publish post ───────────────────────────
      case "create_post":
      case "publish_post": {
        const { accountId, caption, media_urls, platform_payload } = params;
        if (!accountId) return errorResponse("accountId is required", 400);

        log("post_publish_started", { accountId, action });

        const res = await outstandFetch("/posts", "POST", {
          account_id: accountId,
          content: caption,
          media_urls: media_urls || [],
          ...(platform_payload || {}),
        });
        const data = await res.json();

        log("post_published", { provider_post_id: data.id || data.post_id });
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

        log("post_schedule_started", { accountId, scheduled_for });

        const res = await outstandFetch("/posts/schedule", "POST", {
          account_id: accountId,
          content: caption,
          media_urls: media_urls || [],
          scheduled_for,
          ...(platform_payload || {}),
        });
        const data = await res.json();

        log("post_scheduled", { provider_post_id: data.id || data.post_id });
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
          account_id: accountId as string,
          start_date: (start_date as string) || "",
          end_date: (end_date as string) || "",
        });
        if ((metrics as string[])?.length) qs.set("metrics", (metrics as string[]).join(","));

        const res = await outstandFetch(`/analytics?${qs.toString()}`, "GET");
        const data = await res.json();
        return jsonResponse({ metrics: data.metrics || data.data || data });
      }

      // ── Webhook intake (hardened) ───────────────────────
      case "webhook": {
        // Verify signature
        const sigValid = await verifyWebhookSignature(req, rawBody);
        if (!sigValid) {
          return errorResponse("Invalid webhook signature", 401);
        }

        const supabase = getSupabaseAdmin();
        const eventType = (params.event_type as string) || "webhook_received";
        const providerPostId = params.provider_post_id as string | undefined;
        const postId = params.post_id as string | undefined;

        // Build idempotency key to prevent duplicate processing
        const idempotencyKey = params.idempotency_key as string
          || `${eventType}:${providerPostId || postId || ""}:${params.timestamp || Date.now()}`;

        // Check for duplicate
        const { data: existing } = await supabase
          .from("social_publish_events")
          .select("id")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();

        if (existing) {
          log("webhook_duplicate_skipped", { idempotencyKey });
          return jsonResponse({ received: true, duplicate: true });
        }

        // Store event
        await supabase.from("social_publish_events").insert({
          event_type: eventType,
          source: "outstand_webhook",
          data: params,
          status: "received",
          workspace_id: (params.workspace_id as string) || null,
          post_id: postId || null,
          idempotency_key: idempotencyKey,
        });

        log("webhook_received", { eventType, idempotencyKey });

        // Normalize and apply status transitions
        const normalizedStatus = normalizeWebhookStatus(eventType);

        if (normalizedStatus && providerPostId) {
          // Update post targets
          if (["published", "failed", "scheduled"].includes(normalizedStatus)) {
            const updatePayload: Record<string, unknown> = {
              status: normalizedStatus,
            };
            if (normalizedStatus === "published") {
              updatePayload.published_at = new Date().toISOString();
            }
            if (normalizedStatus === "failed") {
              updatePayload.error = (params.error as string) || "Provider reported failure";
            }
            await supabase
              .from("social_post_targets")
              .update(updatePayload)
              .eq("provider_post_id", providerPostId);

            log("webhook_target_updated", { providerPostId, status: normalizedStatus });
          }

          // Update parent post status if all targets resolved
          if (postId && ["published", "failed"].includes(normalizedStatus)) {
            const { data: targets } = await supabase
              .from("social_post_targets")
              .select("status")
              .eq("post_id", postId);

            if (targets?.length) {
              const allPublished = targets.every(t => t.status === "published");
              const anyFailed = targets.some(t => t.status === "failed");
              if (allPublished) {
                await supabase.from("social_posts").update({
                  status: "published",
                  published_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }).eq("id", postId);
                log("webhook_post_status_synced", { postId, status: "published" });
              } else if (anyFailed && targets.every(t => ["published", "failed"].includes(t.status))) {
                await supabase.from("social_posts").update({
                  status: "failed",
                  updated_at: new Date().toISOString(),
                }).eq("id", postId);
                log("webhook_post_status_synced", { postId, status: "failed" });
              }
            }
          }
        }

        // Handle account status webhooks
        if (eventType.startsWith("account.") && params.account_id) {
          const accountStatus = normalizedStatus || "error";
          await supabase
            .from("social_connected_accounts")
            .update({ status: accountStatus, updated_at: new Date().toISOString() })
            .eq("provider_user_id", params.account_id);
          log("webhook_account_updated", { accountId: params.account_id, status: accountStatus });
        }

        return jsonResponse({ received: true });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    log("error", { message: err.message });
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
