// Connects (or disconnects) an organization's WhatsApp Business number to an
// agent. Authenticated + role checked. The access token is verified against the
// WhatsApp Cloud API and then stored in the server-only
// agent_channel_secrets table — it is never returned to the browser.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CHANNEL_CORS, hasOrgRole, jsonResponse } from "../_shared/agentChannels.ts";

const GRAPH_VERSION = "v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CHANNEL_CORS });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return jsonResponse({ error: "unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: authErr } = await userClient.auth.getUser();
  if (authErr || !userData?.user) return jsonResponse({ error: "unauthorized" }, 401);
  const userId = userData.user.id;

  let body: any;
  try { body = await req.json(); } catch { return jsonResponse({ error: "invalid_json" }, 400); }

  const action = String(body?.action ?? "connect");
  const agentId = String(body?.agentId ?? "");
  if (!agentId) return jsonResponse({ error: "agent_required" }, 400);

  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: agent } = await svc.from("agent_agents").select("id, org_id, name").eq("id", agentId).maybeSingle();
  if (!agent) return jsonResponse({ error: "agent_not_found" }, 404);

  // Only operators and above of the owning organization may change channels.
  const orgId = (agent as any).org_id as string;
  if (!(await hasOrgRole(svc, orgId, userId))) return jsonResponse({ error: "forbidden" }, 403);

  if (action === "disconnect") {
    const { data: ch } = await svc.from("agent_channels")
      .select("id").eq("agent_id", agentId).eq("channel", "whatsapp").maybeSingle();
    if ((ch as any)?.id) {
      await svc.from("agent_channel_secrets").delete().eq("channel_id", (ch as any).id);
      await svc.from("agent_channels").update({
        enabled: false, status: "disabled", last_error: null,
        config: {}, last_health_check_at: new Date().toISOString(),
      }).eq("id", (ch as any).id);
    }
    await svc.from("agent_audit_logs").insert({
      org_id: orgId, actor_user_id: userId, action: "channel_disconnected",
      entity_type: "channel", entity_id: (ch as any)?.id ?? null, meta: { channel: "whatsapp", agent_id: agentId },
    });
    return jsonResponse({ ok: true, status: "disabled" });
  }

  const phoneNumberId = String(body?.phoneNumberId ?? "").trim();
  const accessToken = String(body?.accessToken ?? "").trim();
  const wabaId = String(body?.wabaId ?? "").trim();
  if (!/^\d{5,25}$/.test(phoneNumberId)) return jsonResponse({ error: "invalid_phone_number_id" }, 400);
  if (accessToken.length < 20) return jsonResponse({ error: "invalid_access_token" }, 400);

  // The same business number may not be mapped to two agents.
  const { data: clash } = await svc.from("agent_channels")
    .select("id, agent_id").eq("channel", "whatsapp")
    .eq("config->>phone_number_id", phoneNumberId).maybeSingle();
  if ((clash as any)?.id && (clash as any).agent_id !== agentId) {
    return jsonResponse({ error: "number_in_use", message: "This WhatsApp number is already connected to another agent." }, 409);
  }

  // Verify the credentials with the provider before storing anything.
  let displayNumber: string | null = null;
  let verifiedName: string | null = null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return jsonResponse({
        error: "provider_rejected",
        message: String(j?.error?.message ?? "WhatsApp rejected these details.").slice(0, 300),
      }, 400);
    }
    displayNumber = j?.display_phone_number ?? null;
    verifiedName = j?.verified_name ?? null;
  } catch (e) {
    return jsonResponse({ error: "provider_unreachable", message: (e as Error).message.slice(0, 200) }, 502);
  }

  const config = {
    phone_number_id: phoneNumberId,
    waba_id: wabaId || null,
    display_phone_number: displayNumber,
    verified_name: verifiedName,
  };

  const { data: channel, error: upErr } = await svc.from("agent_channels").upsert({
    org_id: orgId,
    agent_id: agentId,
    channel: "whatsapp",
    enabled: true,
    status: "connected",
    config,
    last_error: null,
    last_health_check_at: new Date().toISOString(),
  }, { onConflict: "agent_id,channel" }).select("id").single();
  if (upErr) return jsonResponse({ error: "save_failed", message: upErr.message }, 500);

  const { error: secErr } = await svc.from("agent_channel_secrets").upsert({
    channel_id: (channel as any).id,
    org_id: orgId,
    secrets: { access_token: accessToken },
    updated_by: userId,
  }, { onConflict: "channel_id" });
  if (secErr) return jsonResponse({ error: "save_failed", message: secErr.message }, 500);

  await svc.from("agent_audit_logs").insert({
    org_id: orgId, actor_user_id: userId, action: "channel_connected",
    entity_type: "channel", entity_id: (channel as any).id,
    meta: { channel: "whatsapp", agent_id: agentId, display_phone_number: displayNumber },
  });

  return jsonResponse({
    ok: true,
    status: "connected",
    channelId: (channel as any).id,
    displayPhoneNumber: displayNumber,
    verifiedName,
  });
});
