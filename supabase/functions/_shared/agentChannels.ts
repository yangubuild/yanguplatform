// Shared omnichannel plumbing: conversation resolution and message persistence
// used by every inbound channel (WhatsApp, web chat). All writes go through the
// existing agent_conversations / agent_messages / agent_customer_events tables —
// there is no separate per-channel store.

export type Svc = any;

export const CHANNEL_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-yangu-session",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CHANNEL_CORS, "Content-Type": "application/json", ...extraHeaders },
  });
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/** Verify Meta's X-Hub-Signature-256 header over the raw request body. */
export async function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header) return false;
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return safeEqual(provided.toLowerCase(), expected);
}

export interface ChannelRow {
  id: string;
  org_id: string;
  agent_id: string;
  channel: string;
  enabled: boolean;
  status: string;
  config: Record<string, any>;
}

/** Look up an enabled channel by its provider identifier (WhatsApp phone number id). */
export async function findWhatsappChannel(svc: Svc, phoneNumberId: string): Promise<ChannelRow | null> {
  const { data } = await svc
    .from("agent_channels")
    .select("id, org_id, agent_id, channel, enabled, status, config")
    .eq("channel", "whatsapp")
    .eq("config->>phone_number_id", phoneNumberId)
    .maybeSingle();
  return (data as ChannelRow) ?? null;
}

export async function readChannelSecrets(svc: Svc, channelId: string): Promise<Record<string, string>> {
  const { data } = await svc.from("agent_channel_secrets").select("secrets").eq("channel_id", channelId).maybeSingle();
  return ((data as any)?.secrets ?? {}) as Record<string, string>;
}

/**
 * Finds the live conversation for a contact on a channel, or opens a new one.
 * Resolved/archived threads are never reused, so a returning customer starts a
 * fresh conversation while keeping the same customer record and memory.
 */
export async function resolveConversation(svc: Svc, args: {
  orgId: string;
  agentId: string;
  channelId: string;
  channel: string;
  contactId: string | null;
  language?: string | null;
}): Promise<string> {
  if (args.contactId) {
    const { data: open } = await svc
      .from("agent_conversations")
      .select("id, status")
      .eq("org_id", args.orgId)
      .eq("contact_id", args.contactId)
      .eq("channel", args.channel)
      .not("status", "in", '("resolved","archived")')
      .eq("archived", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if ((open as any)?.id) return (open as any).id as string;
  }

  const { data: created, error } = await svc
    .from("agent_conversations")
    .insert({
      org_id: args.orgId,
      agent_id: args.agentId,
      contact_id: args.contactId,
      channel_id: args.channelId,
      channel: args.channel,
      status: "new",
      priority: "normal",
      language: args.language ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`conversation_create_failed:${error.message}`);
  return (created as any).id as string;
}

export interface StoreMessageArgs {
  orgId: string;
  conversationId: string;
  role: "customer" | "agent" | "human" | "system";
  text: string;
  channel: string;
  direction: "inbound" | "outbound";
  provider?: string | null;
  providerMessageId?: string | null;
  deliveryStatus?: string | null;
  meta?: Record<string, unknown>;
  at?: string;
}

/** Inserts a message idempotently (provider message ids are never stored twice). */
export async function storeMessage(svc: Svc, args: StoreMessageArgs): Promise<{ id: string | null; duplicate: boolean }> {
  const at = args.at ?? new Date().toISOString();
  const { data, error } = await svc
    .from("agent_messages")
    .insert({
      org_id: args.orgId,
      conversation_id: args.conversationId,
      role: args.role,
      text: args.text,
      channel: args.channel,
      direction: args.direction,
      provider: args.provider ?? null,
      provider_message_id: args.providerMessageId ?? null,
      delivery_status: args.deliveryStatus ?? null,
      delivery_status_at: args.deliveryStatus ? at : null,
      meta: args.meta ?? {},
      at,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // 23505 = unique violation on (provider, provider_message_id): a retry.
    if ((error as any).code === "23505") return { id: null, duplicate: true };
    throw new Error(`message_insert_failed:${error.message}`);
  }

  const patch: Record<string, unknown> = {
    last_message: args.text.slice(0, 500),
    last_message_at: at,
    updated_at: at,
  };
  if (args.direction === "inbound") {
    const { data: conv } = await svc.from("agent_conversations").select("unread, status").eq("id", args.conversationId).maybeSingle();
    patch.unread = Number((conv as any)?.unread ?? 0) + 1;
    if ((conv as any)?.status === "new") patch.status = "active";
  } else {
    patch.unread = 0;
  }
  await svc.from("agent_conversations").update(patch).eq("id", args.conversationId);

  return { id: (data as any)?.id ?? null, duplicate: false };
}

/** Adds a customer timeline entry. Timeline writes must never break messaging. */
export async function recordCustomerEvent(svc: Svc, args: {
  orgId: string;
  contactId: string | null;
  eventType: string;
  title: string;
  refType?: string;
  refId?: string | null;
  agentId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (!args.contactId) return;
  try {
    await svc.from("agent_customer_events").insert({
      org_id: args.orgId,
      contact_id: args.contactId,
      event_type: args.eventType,
      title: args.title,
      ref_type: args.refType ?? null,
      ref_id: args.refId ?? null,
      agent_id: args.agentId ?? null,
      meta: args.meta ?? {},
    });
  } catch (_e) { /* additive only */ }
}

/** Recent conversation history for the brain, oldest first. */
export async function loadHistory(svc: Svc, conversationId: string, limit = 10) {
  const { data } = await svc
    .from("agent_messages")
    .select("role, text, at")
    .eq("conversation_id", conversationId)
    .order("at", { ascending: false })
    .limit(limit);
  return ((data as any[]) ?? []).reverse().map((m) => ({ role: m.role, text: m.text }));
}

/** True when a human operator currently owns the thread — the AI must stay silent. */
export async function isHumanControlled(svc: Svc, conversationId: string): Promise<boolean> {
  const { data } = await svc.from("agent_conversations").select("status").eq("id", conversationId).maybeSingle();
  return (data as any)?.status === "human";
}

/** Simple fixed-window rate limiter backed by the existing rate-limit RPC. */
export async function rateLimitOk(svc: Svc, key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await svc.rpc("check_rate_limit_anon", {
      p_key: key, p_max_requests: maxRequests, p_window_seconds: windowSeconds,
    });
    if (error) return true; // never block real traffic on limiter failure
    return data !== false;
  } catch { return true; }
}
