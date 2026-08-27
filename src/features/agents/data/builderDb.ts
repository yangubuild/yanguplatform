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
  };
}

export async function listThreads(): Promise<BuilderThread[]> {
  const orgId = await requireOrgId();
  const { data, error } = await sb
    .from("agent_threads").select("*").eq("org_id", orgId)
    .order("updated_at", { ascending: false }).limit(50);
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

/** One conversational turn of the Composer. The skill is chosen server-side. */
export async function sendBuilderTurn(input: { threadId?: string; text: string; skill?: string }): Promise<BuilderTurn> {
  const { data, error } = await supabase.functions.invoke("agent-builder-chat", {
    body: { threadId: input.threadId, text: input.text, skill: input.skill },
  });
  if (error) {
    const msg = (data as any)?.message || error.message || "Yangu AI could not respond.";
    throw new Error(msg);
  }
  return data as BuilderTurn;
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
async function vapiAction(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("vapi-agent", { body: { action, ...payload } });
  if (error) throw new Error((data as any)?.message || error.message || "The voice service is unavailable.");
  if (data && (data as any).ok === false) throw new Error((data as any).message || "The voice service rejected that request.");
  return data as any;
}

export const voiceOps = {
  status: () => vapiAction("status"),
  deploy: (agentId: string) => vapiAction("deploy", { agentId }),
  update: (agentId: string) => vapiAction("update", { agentId }),
  pause: (agentId: string) => vapiAction("pause", { agentId }),
  resume: (agentId: string) => vapiAction("resume", { agentId }),
  syncCalls: (agentId: string) => vapiAction("sync_calls", { agentId }),
  listNumbers: (orgId: string) => vapiAction("list_numbers", { orgId }),
  assignNumber: (agentId: string, phoneNumberId: string) => vapiAction("assign_number", { agentId, phoneNumberId }),
  placeCall: (input: { agentId: string; to: string; name?: string; purpose?: string }) => vapiAction("place_call", input),
};

