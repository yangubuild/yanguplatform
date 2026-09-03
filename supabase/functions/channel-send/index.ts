// Outbound message sender used by the unified Inbox when a human operator
// replies. One entry point for every channel so the Inbox never needs to know
// provider details. Authenticated + organization role checked.
//
// Voice conversations cannot be replied to in text; the caller is told so
// explicitly instead of silently dropping the message.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  CHANNEL_CORS, hasOrgRole, jsonResponse, readChannelSecrets, recordCustomerEvent, storeMessage,
} from "../_shared/agentChannels.ts";

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
  const conversationId = String(body?.conversationId ?? "");
  const text = String(body?.text ?? "").trim();
  if (!conversationId) return jsonResponse({ error: "conversation_required" }, 400);
  if (!text) return jsonResponse({ error: "text_required" }, 400);
  if (text.length > 4000) return jsonResponse({ error: "text_too_long" }, 400);

  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: conv } = await svc
    .from("agent_conversations")
    .select("id, org_id, agent_id, channel, channel_id, contact_id, status")
    .eq("id", conversationId).maybeSingle();
  if (!conv) return jsonResponse({ error: "conversation_not_found" }, 404);
  const c = conv as any;
  if (!(await hasOrgRole(svc, c.org_id, userId))) return jsonResponse({ error: "forbidden" }, 403);

  if (c.channel === "voice") {
    return jsonResponse({ error: "unsupported_channel", message: "Voice calls can't be answered with a text reply." }, 400);
  }

  let providerMessageId: string | null = null;
  let deliveryStatus = "sent";

  if (c.channel === "whatsapp") {
    const { data: channel } = await svc
      .from("agent_channels")
      .select("id, enabled, status, config")
      .eq("agent_id", c.agent_id).eq("channel", "whatsapp").maybeSingle();
    const ch = channel as any;
    if (!ch?.id || !ch.enabled) {
      return jsonResponse({ error: "channel_not_connected", message: "WhatsApp is not connected for this agent." }, 409);
    }
    const { data: contact } = await svc.from("agent_contacts").select("phone_e164, phone").eq("id", c.contact_id).maybeSingle();
    const to = String((contact as any)?.phone_e164 ?? (contact as any)?.phone ?? "").replace(/[^\d]/g, "");
    if (!to) return jsonResponse({ error: "no_recipient", message: "This customer has no WhatsApp number on record." }, 409);

    const secrets = await readChannelSecrets(svc, ch.id);
    if (!secrets.access_token) {
      return jsonResponse({ error: "channel_not_connected", message: "WhatsApp credentials are missing. Reconnect the channel." }, 409);
    }

    try {
      const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${ch.config?.phone_number_id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${secrets.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp", recipient_type: "individual", to,
          type: "text", text: { preview_url: false, body: text },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        return jsonResponse({
          error: "send_failed",
          message: String(j?.error?.message ?? "WhatsApp rejected this message.").slice(0, 300),
        }, 502);
      }
      providerMessageId = j?.messages?.[0]?.id ?? null;
    } catch (e) {
      return jsonResponse({ error: "send_failed", message: (e as Error).message.slice(0, 200) }, 502);
    }
  } else {
    // Web chat: the widget polls for new messages, so persisting is delivery.
    deliveryStatus = "delivered";
  }

  const stored = await storeMessage(svc, {
    orgId: c.org_id,
    conversationId,
    role: "human",
    text,
    channel: c.channel,
    direction: "outbound",
    provider: c.channel === "whatsapp" ? "whatsapp" : "webchat",
    providerMessageId,
    deliveryStatus,
    meta: { author_user_id: userId },
  });
  await svc.from("agent_messages").update({ author_user_id: userId }).eq("id", stored.id);

  await recordCustomerEvent(svc, {
    orgId: c.org_id,
    contactId: c.contact_id,
    eventType: "message_sent",
    title: c.channel === "whatsapp" ? "WhatsApp reply sent by team" : "Web chat reply sent by team",
    refType: "conversation",
    refId: conversationId,
    agentId: c.agent_id,
    meta: { channel: c.channel },
  });

  return jsonResponse({ ok: true, messageId: stored.id, deliveryStatus });
});
