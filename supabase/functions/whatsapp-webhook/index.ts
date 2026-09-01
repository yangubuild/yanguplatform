// WhatsApp Cloud API webhook receiver.
//
// Public endpoint (no JWT): authenticity is enforced two ways —
//   GET  … hub.verify_token must equal WHATSAPP_VERIFY_TOKEN
//   POST … X-Hub-Signature-256 HMAC over the raw body using WHATSAPP_APP_SECRET
// Processing is idempotent on the provider message id, so Meta retries never
// duplicate a message or trigger a second AI reply.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runAgentBrain } from "../_shared/agentBrain.ts";
import {
  findWhatsappChannel, isHumanControlled, jsonResponse, loadHistory, rateLimitOk,
  readChannelSecrets, recordCustomerEvent, resolveConversation, safeEqual, storeMessage,
  verifyMetaSignature,
} from "../_shared/agentChannels.ts";

const GRAPH_VERSION = "v21.0";

interface SendResult { ok: boolean; messageId?: string; error?: string }

async function sendWhatsappText(args: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  text: string;
}): Promise<SendResult> {
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${args.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${args.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: args.to,
        type: "text",
        text: { preview_url: false, body: args.text.slice(0, 4000) },
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: String(j?.error?.message ?? `graph_${res.status}`).slice(0, 200) };
    }
    return { ok: true, messageId: j?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 200) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });

  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
  const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  // ── Meta webhook verification handshake ──
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token") ?? "";
    const challenge = url.searchParams.get("hub.challenge") ?? "";
    if (!VERIFY_TOKEN) return new Response("not_configured", { status: 503 });
    if (mode === "subscribe" && safeEqual(token, VERIFY_TOKEN)) {
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("forbidden", { status: 403 });
  }

  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  if (!APP_SECRET) {
    console.error("whatsapp webhook rejected: WHATSAPP_APP_SECRET is not configured");
    return jsonResponse({ error: "not_configured" }, 503);
  }

  const raw = await req.text();
  const valid = await verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), APP_SECRET);
  if (!valid) {
    console.warn("whatsapp webhook rejected: invalid signature", {
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return jsonResponse({ error: "invalid_json" }, 400); }

  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value ?? {};
      const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      const channel = await findWhatsappChannel(svc, phoneNumberId);
      if (!channel) {
        console.warn("whatsapp webhook: no channel mapped for this business number");
        continue;
      }

      // ── Delivery / read receipts ──
      for (const st of value?.statuses ?? []) {
        if (!st?.id) continue;
        await svc.from("agent_messages")
          .update({ delivery_status: st.status ?? null, delivery_status_at: new Date().toISOString() })
          .eq("provider", "whatsapp")
          .eq("provider_message_id", st.id);
      }

      // ── Inbound messages ──
      const contacts: any[] = value?.contacts ?? [];
      for (const msg of value?.messages ?? []) {
        try {
          const from = String(msg.from ?? "");
          if (!from) continue;

          const profileName = contacts.find((c) => c?.wa_id === from)?.profile?.name ?? null;
          const text = msg.type === "text"
            ? String(msg.text?.body ?? "")
            : msg.type === "button" ? String(msg.button?.text ?? "")
            : msg.type === "interactive"
              ? String(msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? "")
              : "";
          const unsupported = !text;

          // Identity: phone number is a strong signal, reuse the customer record.
          const { data: contactId } = await svc.rpc("agent_resolve_customer", {
            p_org_id: channel.org_id,
            p_phone: from.startsWith("+") ? from : `+${from}`,
            p_email: null,
            p_name: profileName,
            p_channel: "whatsapp",
            p_create: true,
          });

          const conversationId = await resolveConversation(svc, {
            orgId: channel.org_id,
            agentId: channel.agent_id,
            channelId: channel.id,
            channel: "whatsapp",
            contactId: (contactId as string) ?? null,
          });

          const stored = await storeMessage(svc, {
            orgId: channel.org_id,
            conversationId,
            role: "customer",
            text: unsupported ? `[${msg.type} message]` : text,
            channel: "whatsapp",
            direction: "inbound",
            provider: "whatsapp",
            providerMessageId: String(msg.id),
            meta: { type: msg.type, wa_id: from, profile_name: profileName },
            at: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : undefined,
          });
          if (stored.duplicate) continue; // Meta retry — already handled

          await recordCustomerEvent(svc, {
            orgId: channel.org_id,
            contactId: (contactId as string) ?? null,
            eventType: "message_received",
            title: "WhatsApp message received",
            refType: "conversation",
            refId: conversationId,
            agentId: channel.agent_id,
            meta: { channel: "whatsapp" },
          });

          // A human operator owns the thread → log only, never auto-reply.
          if (await isHumanControlled(svc, conversationId)) continue;
          if (!channel.enabled || channel.status !== "connected") continue;
          if (unsupported) continue;

          // Abuse guard per sender.
          const allowed = await rateLimitOk(svc, `wa:${channel.id}:${from}`, "whatsapp_inbound", 30, 60);
          if (!allowed) {
            console.warn("whatsapp inbound rate limited");
            continue;
          }

          if (!LOVABLE_API_KEY) {
            console.error("whatsapp reply skipped: AI gateway not configured");
            continue;
          }

          const history = await loadHistory(svc, conversationId, 10);
          const brain = await runAgentBrain({
            svc,
            apiKey: LOVABLE_API_KEY,
            orgId: channel.org_id,
            agentId: channel.agent_id,
            text,
            history: history.slice(0, -1),
            channel: "whatsapp",
            customerId: (contactId as string) ?? null,
          });

          await svc.from("agent_conversations").update({
            sentiment: brain.sentiment,
            language: brain.language,
            status: brain.decision === "handover" ? "escalated" : undefined,
            priority: brain.decision === "handover" ? "high" : undefined,
          }).eq("id", conversationId);

          if (brain.decision === "handover") {
            await svc.from("agent_handover_events").insert({
              org_id: channel.org_id,
              conversation_id: conversationId,
              kind: "escalation",
              summary: brain.handover?.reason ?? "Escalated by AI",
              meta: { channel: "whatsapp", confidence: brain.confidence },
            });
          }

          if (!brain.reply) continue;

          const secrets = await readChannelSecrets(svc, channel.id);
          const accessToken = secrets.access_token;
          if (!accessToken) {
            await svc.from("agent_channels").update({
              status: "error", last_error: "WhatsApp access token missing. Reconnect the channel.",
            }).eq("id", channel.id);
            continue;
          }

          const sent = await sendWhatsappText({
            accessToken, phoneNumberId, to: from, text: brain.reply,
          });

          await storeMessage(svc, {
            orgId: channel.org_id,
            conversationId,
            role: "agent",
            text: brain.reply,
            channel: "whatsapp",
            direction: "outbound",
            provider: "whatsapp",
            providerMessageId: sent.messageId ?? null,
            deliveryStatus: sent.ok ? "sent" : "failed",
            meta: {
              decision: brain.decision,
              confidence: brain.confidence,
              sources: brain.sources,
              send_error: sent.ok ? null : sent.error,
            },
          });

          if (!sent.ok) {
            await svc.from("agent_channels").update({
              status: "error", last_error: `Sending failed: ${sent.error}`, last_health_check_at: new Date().toISOString(),
            }).eq("id", channel.id);
          } else if (channel.status !== "connected" || channel.last_error) {
            await svc.from("agent_channels").update({
              status: "connected", last_error: null, last_health_check_at: new Date().toISOString(),
            }).eq("id", channel.id);
          }
        } catch (e) {
          // One bad message must never stop the rest of the batch.
          console.error("whatsapp inbound processing failed", (e as Error).message);
        }
      }
    }
  }

  // Meta requires a fast 200 regardless of internal outcome.
  return jsonResponse({ ok: true });
});
