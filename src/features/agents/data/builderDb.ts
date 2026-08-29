// Conversational Agent Builder — client data layer.
// Threads/messages live in agent_threads / agent_thread_messages; all model
// calls and every privileged voice-provider call go through edge functions.

import { supabase } from "@/integrations/supabase/client";
import { requireOrgId, currentUserId } from "./repo/orgContext";

const sb = supabase as any;

export interface BuilderThread {
  id: string;
  title: string;
  status: "gathering" | "ready" | "deployed" | string;
  agentId: string | null;
  config: AgentDraftConfig;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface BuilderMessage {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AgentDraftConfig {
  agentName?: string;
  businessName?: string;
  type?: "inbound" | "outbound" | "support" | string;
  purpose?: string;
  products?: string;
  targetCustomers?: string;
  greeting?: string;
  languages?: string[];
  voice?: string;
  hours?: string;
  timezone?: string;
  escalation?: string;
  transferNumber?: string;
  appointments?: boolean;
  qualificationQuestions?: string[];
  faqs?: { q: string; a: string }[];
  objectives?: string;
  prohibited?: string;
  fallback?: string;
  outcome?: string;
  [k: string]: unknown;
}

function rowToThread(r: any): BuilderThread {
  return {
    id: r.id,
    title: r.title,
    status: r.status,
    agentId: r.agent_id ?? null,
    config: (r.config ?? {}) as AgentDraftConfig,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    archivedAt: r.archived_at ?? null,
  };
}

/** Active list hides archived conversations; archived keeps every message. */
export async function listThreads(scope: "active" | "archived" = "active"): Promise<BuilderThread[]> {
  const orgId = await requireOrgId();
  let q = sb.from("agent_threads").select("*").eq("org_id", orgId);
  q = scope === "archived" ? q.not("archived_at", "is", null) : q.is("archived_at", null);
  const { data, error } = await q.order("updated_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map(rowToThread);
}

export async function getThread(id: string): Promise<BuilderThread | null> {
  const { data, error } = await sb.from("agent_threads").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToThread(data) : null;
}

export async function listMessages(threadId: string): Promise<BuilderMessage[]> {
  const { data, error } = await sb
    .from("agent_thread_messages").select("*").eq("thread_id", threadId).order("created_at");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id, role: r.role, content: r.content,
    metadata: (r.metadata ?? {}) as Record<string, unknown>, createdAt: r.created_at,
  }));
}

export async function renameThread(id: string, title: string): Promise<void> {
  const clean = title.trim().slice(0, 120);
  if (!clean) throw new Error("Give the conversation a title.");
  const { error } = await sb.from("agent_threads").update({ title: clean }).eq("id", id);
  if (error) throw error;
}

export async function setThreadArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await sb.from("agent_threads")
    .update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw error;
}

/**
 * Deletes only the conversation row; agent_thread_messages cascade with it.
 * agent_threads.agent_id is ON DELETE SET NULL on the agent side, so agents,
 * numbers, calls, leads, knowledge and campaigns are never touched.
 */
export async function deleteThread(id: string): Promise<void> {
  const { error } = await sb.from("agent_threads").delete().eq("id", id);
  if (error) throw error;
}

/** Inline UI payload the Composer renders under an assistant reply. */
export interface ComposerUi {
  type: string;
  [k: string]: unknown;
}

export interface BuilderTurn {
  threadId: string;
  title: string;
  reply: string;
  skill: string;
  skillLabel: string;
  ui: ComposerUi | null;
  config: AgentDraftConfig;
  missing: string[];
  ready: boolean;
  status: string;
}

/**
 * Invoke an edge function with a hard deadline so the UI can never hang.
 * Every failure resolves to a readable message — nothing is swallowed.
 */
async function invokeFn<T>(fn: string, body: Record<string, unknown>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
  });
  let data: any, error: any;
  try {
    ({ data, error } = await Promise.race([supabase.functions.invoke(fn, { body }), timeout]));
  } catch (e) {
    if (e instanceof Error && e.message === "TIMEOUT") {
      throw new Error("This took too long to respond. Please try again.");
    }
    throw e;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  if (error) {
    let responseData = data;
    const response = error?.context;
    if (!responseData && response instanceof Response) {
      try { responseData = await response.clone().json(); } catch { /* use mapped fallback */ }
    }
    const code = String(responseData?.error ?? "");
    const mapped: Record<string, string> = {
      auth_failed: "Voice service connection needs attention.",
      not_configured: "Voice service connection needs attention.",
      no_number: "Connect a phone number before making calls.",
      no_outbound_number: "No outbound phone number is connected yet.",
      not_deployed: "This agent hasn't been deployed yet.",
      international_not_supported: "Your current calling number doesn't support this destination.",
      provider_unavailable: "Voice service is temporarily unavailable. Try again.",
    };
    throw new Error(responseData?.message || mapped[code] || "The service is temporarily unavailable. Try again.");
  }
  if (data && data.ok === false) throw new Error(data.message || "That request could not be completed.");
  return data as T;
}

/** One conversational turn of the Composer. The skill is chosen server-side. */
export async function sendBuilderTurn(input: { threadId?: string; text: string; skill?: string }): Promise<BuilderTurn> {
  return invokeFn<BuilderTurn>(
    "agent-builder-chat",
    { threadId: input.threadId, text: input.text, skill: input.skill },
    120_000,
  );
}


/** Patch an existing agent's configuration and push it live when deployed. */
export async function updateAgentFields(
  agentId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const orgId = await requireOrgId();
  const userId = await currentUserId();
  const { data: agent } = await sb.from("agent_agents").select("id, status, vapi_assistant_id").eq("id", agentId).maybeSingle();
  const { data: latest } = await sb
    .from("agent_configs").select("version, config").eq("agent_id", agentId).eq("environment", "draft")
    .order("version", { ascending: false }).limit(1).maybeSingle();

  const merged = { ...(latest?.config ?? {}), ...patch };
  const { error } = await sb.from("agent_configs").insert({
    org_id: orgId, agent_id: agentId, environment: "draft",
    version: (latest?.version ?? 0) + 1, config: merged, updated_by: userId,
  });
  if (error) throw error;

  const row: Record<string, unknown> = {};
  if (typeof patch.voice === "string") row.voice = patch.voice;
  if (Array.isArray(patch.languages) && patch.languages.length) row.language = patch.languages[0];
  if (Object.keys(row).length) {
    const { error: upErr } = await sb.from("agent_agents").update(row).eq("id", agentId);
    if (upErr) throw upErr;
  }

  if (agent?.vapi_assistant_id) await voiceOps.update(agentId);
}


/** Persist the gathered configuration as a draft agent (no paid resources created). */
export async function saveDraftAgent(thread: BuilderThread): Promise<string> {
  const orgId = await requireOrgId();
  const userId = await currentUserId();
  const c = thread.config ?? {};
  let agentId = thread.agentId;

  if (!agentId) {
    const { data, error } = await sb.from("agent_agents").insert({
      org_id: orgId,
      name: c.agentName || c.businessName || thread.title || "New agent",
      type: (c.type as string) || "inbound",
      status: "draft",
      description: (c.purpose as string) || "",
      channels: ["voice"],
      language: (c.languages as string[] | undefined)?.[0] ?? "English",
      voice: (c.voice as string) ?? null,
      created_by: userId,
    }).select("id").single();
    if (error) throw error;
    agentId = data.id as string;
    await sb.from("agent_threads").update({ agent_id: agentId }).eq("id", thread.id);
  } else {
    await sb.from("agent_agents").update({
      name: c.agentName || c.businessName || thread.title,
      type: (c.type as string) || "inbound",
      description: (c.purpose as string) || "",
      language: (c.languages as string[] | undefined)?.[0] ?? "English",
      voice: (c.voice as string) ?? null,
    }).eq("id", agentId);
  }

  const { data: latest } = await sb
    .from("agent_configs").select("version").eq("agent_id", agentId).eq("environment", "draft")
    .order("version", { ascending: false }).limit(1).maybeSingle();
  await sb.from("agent_configs").insert({
    org_id: orgId, agent_id: agentId, environment: "draft",
    version: (latest?.version ?? 0) + 1, config: c, updated_by: userId,
  });

  return agentId!;
}

// ─── voice infrastructure (server-side only) ──────────────────────────
// The provider's private key lives only in the edge function; nothing here
// ever sees it. Every call is bounded so the UI resolves to a real state.
async function vapiAction<T = any>(action: string, payload: Record<string, unknown> = {}, timeoutMs = 45_000) {
  return invokeFn<T>("vapi-agent", { action, ...payload }, timeoutMs);
}

export interface VoiceDiagnostics {
  ok: boolean;
  keyPresent: boolean;
  auth?: "pass" | "fail" | "fail_auth";
  assistantCount?: number;
  secretName?: string;
  authorization?: string;
  assistantsApi?: { ok: boolean; httpStatus: number | null };
  phoneNumbersApi?: { ok: boolean; httpStatus: number | null };
  callsApi?: { ok: boolean; httpStatus: number | null };
  callCount?: number | null;
  webVoiceReady?: boolean;
  assistants?: { id: string | null; name: string | null; updatedAt?: string | null }[];
  numberCount?: number | null;
  numbers?: { id: string; number: string | null; provider: string; status?: string | null; assistantId: string | null }[];
  message?: string;
}

export interface VoiceAgentStatus {
  ok: boolean;
  agentId: string;
  name: string;
  localStatus: string;
  assistantId: string | null;
  phoneNumber: string | null;
  phoneNumberId: string | null;
  deployedAt: string | null;
  state: "not_deployed" | "deployed" | "provider_missing" | "provider_unreachable";
  message?: string;
  provider?: {
    name: string | null; model: string | null; modelProvider: string | null;
    voice: string | null; voiceProvider: string | null; transcriber: string | null;
    firstMessage: string | null; systemPrompt: string | null; updatedAt: string | null;
  };
  /** Whether the provider is wired to report call results back securely. */
  webhook?: { configured: boolean; secretConfigured: boolean };
}

export interface VoiceNumber {
  id: string;
  number: string | null;
  provider: string;
  assistantId: string | null;
  name?: string | null;
  outboundCapable: boolean;
}

export interface VoiceCallState {
  ok: boolean;
  callId: string;
  status: string | null;
  endedReason: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  cost: number | null;
  transcript: string | null;
  recordingUrl: string | null;
  summary: string | null;
}

export const voiceOps = {
  status: () => vapiAction<{ connected: boolean; reason?: string }>("status", {}, 20_000),
  diagnostics: () => vapiAction<VoiceDiagnostics>("diagnostics", {}, 30_000),
  agentStatus: (agentId: string) => vapiAction<VoiceAgentStatus>("agent_status", { agentId }, 30_000),
  deploy: (agentId: string) => vapiAction("deploy", { agentId }, 60_000),
  update: (agentId: string) => vapiAction("update", { agentId }, 60_000),
  pause: (agentId: string) => vapiAction("pause", { agentId }),
  resume: (agentId: string) => vapiAction("resume", { agentId }),
  syncCalls: (agentId: string) => vapiAction<{ synced: number; reason?: string; message?: string }>("sync_calls", { agentId }, 60_000),
  listNumbers: (orgId?: string) => vapiAction<{ numbers: VoiceNumber[]; count: number }>("list_numbers", orgId ? { orgId } : {}, 30_000),
  assignNumber: (agentId: string, phoneNumberId: string) => vapiAction("assign_number", { agentId, phoneNumberId }),
  /** Chargeable — always confirmed by the user first. */
  createNumber: (input: { areaCode?: string }) => vapiAction<{ id: string; number: string | null }>("create_number", { ...input, confirm: true }, 60_000),
  importNumber: (input: { number: string; accountSid: string; authToken: string }) =>
    vapiAction<{ id: string; number: string | null }>("import_number", { ...input, confirm: true }, 60_000),
  placeCall: (input: { agentId: string; to: string; name?: string; purpose?: string }) =>
    vapiAction<{ callId: string; status: string; from: string | null; to: string }>("place_call", input, 60_000),
  getCall: (agentId: string, callId: string) => vapiAction<VoiceCallState>("get_call", { agentId, callId }, 30_000),
  webTest: (agentId: string) =>
    vapiAction<{ available: boolean; reason?: string; message?: string; publicKey?: string; assistantId?: string }>(
      "web_test", { agentId }, 20_000,
    ),
};


