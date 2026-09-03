// Public web chat endpoint for the embeddable Yangu chat widget.
//
// No JWT: visitors are anonymous. Safety comes from
//   • the channel must exist, be enabled and be marked connected
//   • the request Origin must be on the channel's allow-list
//   • an opaque session token (stored hashed) scopes every message
//   • per-session and per-origin rate limits
// Replies come from the same shared agent brain used by every other channel.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runAgentBrain } from "../_shared/agentBrain.ts";
import {
  isHumanControlled, loadHistory, rateLimitOk, recordCustomerEvent,
  resolveConversation, sha256Hex, storeMessage,
} from "../_shared/agentChannels.ts";

const SESSION_TTL_HOURS = 12;
const MAX_MESSAGES_PER_SESSION = 200;

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "content-type, x-yangu-session",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function reply(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try { return new URL(value).origin.toLowerCase(); } catch { return null; }
}

/** "*" allows any site; otherwise exact origin match (host or full origin). */
function originAllowed(allowed: unknown, origin: string | null): boolean {
  const list = Array.isArray(allowed) ? allowed.map((a) => String(a).trim().toLowerCase()).filter(Boolean) : [];
  if (list.includes("*")) return true;
  if (!origin) return false;
  const host = (() => { try { return new URL(origin).host.toLowerCase(); } catch { return ""; } })();
  return list.some((a) => a === origin || a === host || a === `https://${a}` && false);
}

Deno.serve(async (req) => {
  const origin = normalizeOrigin(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req.headers.get("origin")) });
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405, req.headers.get("origin"));

  const rawOrigin = req.headers.get("origin");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  let body: any;
  try { body = await req.json(); } catch { return reply({ error: "invalid_json" }, 400, rawOrigin); }
  const action = String(body?.action ?? "");

  // ── Start a session ──
  if (action === "session") {
    const channelId = String(body?.channelId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(channelId)) return reply({ error: "invalid_channel" }, 400, rawOrigin);

    const okRate = await rateLimitOk(svc, `webchat_session:${origin ?? "unknown"}`, "webchat_session", 60, 60);
    if (!okRate) return reply({ error: "rate_limited" }, 429, rawOrigin);

    const { data: channel } = await svc
      .from("agent_channels")
      .select("id, org_id, agent_id, enabled, status, config")
      .eq("id", channelId).eq("channel", "webchat").maybeSingle();
    const ch = channel as any;
    if (!ch || !ch.enabled || ch.status !== "connected") return reply({ error: "channel_unavailable" }, 404, rawOrigin);
    if (!originAllowed(ch.config?.allowed_origins, origin)) return reply({ error: "origin_not_allowed" }, 403, rawOrigin);

    const { data: agent } = await svc.from("agent_agents").select("name, status").eq("id", ch.agent_id).maybeSingle();
    if ((agent as any)?.status === "paused") return reply({ error: "agent_paused" }, 409, rawOrigin);

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const tokenHash = await sha256Hex(token);
    const visitorKey = String(body?.visitorKey ?? "").slice(0, 80) || crypto.randomUUID();

    const { error } = await svc.from("agent_webchat_sessions").insert({
      org_id: ch.org_id,
      agent_id: ch.agent_id,
      channel_id: ch.id,
      token_hash: tokenHash,
      visitor_key: visitorKey,
      origin,
      user_agent: (req.headers.get("user-agent") ?? "").slice(0, 200),
      expires_at: new Date(Date.now() + SESSION_TTL_HOURS * 3600_000).toISOString(),
    });
    if (error) return reply({ error: "session_failed" }, 500, rawOrigin);

    return reply({
      ok: true,
      token,
      visitorKey,
      agentName: (agent as any)?.name ?? "Assistant",
      greeting: ch.config?.greeting ?? null,
      accentColor: ch.config?.accent_color ?? null,
      launcherLabel: ch.config?.launcher_label ?? null,
    }, 200, rawOrigin);
  }

  // Every other action needs a valid session.
  const token = String(body?.token ?? req.headers.get("x-yangu-session") ?? "");
  if (token.length < 32) return reply({ error: "session_required" }, 401, rawOrigin);
  const tokenHash = await sha256Hex(token);

  const { data: sessionRow } = await svc
    .from("agent_webchat_sessions")
    .select("id, org_id, agent_id, channel_id, conversation_id, contact_id, visitor_key, expires_at, message_count")
    .eq("token_hash", tokenHash).maybeSingle();
  const session = sessionRow as any;
  if (!session) return reply({ error: "session_invalid" }, 401, rawOrigin);
  if (new Date(session.expires_at).getTime() < Date.now()) return reply({ error: "session_expired" }, 401, rawOrigin);

  const { data: channel } = await svc
    .from("agent_channels")
    .select("id, enabled, status, config")
    .eq("id", session.channel_id).maybeSingle();
  const ch = channel as any;
  if (!ch?.enabled || ch.status !== "connected") return reply({ error: "channel_unavailable" }, 409, rawOrigin);
  if (!originAllowed(ch.config?.allowed_origins, origin)) return reply({ error: "origin_not_allowed" }, 403, rawOrigin);

  // ── Poll for new messages (human replies land here too) ──
  if (action === "poll") {
    if (!session.conversation_id) return reply({ ok: true, messages: [] }, 200, rawOrigin);
    const since = typeof body?.since === "string" ? body.since : new Date(0).toISOString();
    const { data: msgs } = await svc
      .from("agent_messages")
      .select("id, role, text, at")
      .eq("conversation_id", session.conversation_id)
      .gt("at", since)
      .order("at", { ascending: true })
      .limit(50);
    await svc.from("agent_webchat_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", session.id);
    return reply({
      ok: true,
      messages: ((msgs as any[]) ?? []).map((m) => ({ id: m.id, role: m.role, text: m.text, at: m.at })),
    }, 200, rawOrigin);
  }

  // ── Send a visitor message and get the agent's reply ──
  if (action === "message") {
    const text = String(body?.text ?? "").trim();
    if (!text) return reply({ error: "text_required" }, 400, rawOrigin);
    if (text.length > 2000) return reply({ error: "text_too_long" }, 400, rawOrigin);
    if (session.message_count >= MAX_MESSAGES_PER_SESSION) {
      return reply({ error: "session_limit_reached" }, 429, rawOrigin);
    }
    const okRate = await rateLimitOk(svc, `webchat_msg:${session.id}`, "webchat_message", 20, 60);
    if (!okRate) return reply({ error: "rate_limited", message: "You're sending messages too quickly." }, 429, rawOrigin);

    let contactId: string | null = session.contact_id ?? null;
    if (!contactId) {
      const { data: resolved } = await svc.rpc("agent_resolve_webchat_customer", {
        p_org_id: session.org_id,
        p_visitor_key: session.visitor_key,
        p_name: typeof body?.visitorName === "string" ? body.visitorName.slice(0, 120) : null,
      });
      contactId = (resolved as string) ?? null;
    }

    const conversationId: string = session.conversation_id ?? await resolveConversation(svc, {
      orgId: session.org_id,
      agentId: session.agent_id,
      channelId: session.channel_id,
      channel: "webchat",
      contactId,
    });

    await svc.from("agent_webchat_sessions").update({
      conversation_id: conversationId,
      contact_id: contactId,
      message_count: Number(session.message_count ?? 0) + 1,
      last_seen_at: new Date().toISOString(),
    }).eq("id", session.id);

    const history = await loadHistory(svc, conversationId, 10);

    await storeMessage(svc, {
      orgId: session.org_id,
      conversationId,
      role: "customer",
      text,
      channel: "webchat",
      direction: "inbound",
      provider: "webchat",
      meta: { origin },
    });

    await recordCustomerEvent(svc, {
      orgId: session.org_id,
      contactId,
      eventType: "message_received",
      title: "Web chat message received",
      refType: "conversation",
      refId: conversationId,
      agentId: session.agent_id,
      meta: { channel: "webchat" },
    });

    // A human operator owns the thread → the visitor waits for their reply.
    if (await isHumanControlled(svc, conversationId)) {
      return reply({ ok: true, queued: true, humanHandling: true }, 200, rawOrigin);
    }

    if (!LOVABLE_API_KEY) return reply({ error: "unavailable" }, 503, rawOrigin);

    const brain = await runAgentBrain({
      svc,
      apiKey: LOVABLE_API_KEY,
      orgId: session.org_id,
      agentId: session.agent_id,
      text,
      history,
      channel: "webchat",
      customerId: contactId,
      visitorKey: session.visitor_key,
    });

    await svc.from("agent_conversations").update({
      sentiment: brain.sentiment,
      language: brain.language,
      ...(brain.decision === "handover" ? { status: "escalated", priority: "high" } : {}),
    }).eq("id", conversationId);

    if (brain.decision === "handover") {
      await svc.from("agent_handover_events").insert({
        org_id: session.org_id,
        conversation_id: conversationId,
        kind: "escalation",
        summary: brain.handover?.reason ?? "Escalated by AI",
        meta: { channel: "webchat", confidence: brain.confidence },
      });
    }

    if (brain.reply) {
      await storeMessage(svc, {
        orgId: session.org_id,
        conversationId,
        role: "agent",
        text: brain.reply,
        channel: "webchat",
        direction: "outbound",
        provider: "webchat",
        deliveryStatus: "delivered",
        meta: { decision: brain.decision, confidence: brain.confidence, sources: brain.sources },
      });
    }

    return reply({
      ok: true,
      reply: brain.reply,
      handover: brain.decision === "handover",
      at: new Date().toISOString(),
    }, 200, rawOrigin);
  }

  return reply({ error: "unknown_action" }, 400, rawOrigin);
});
