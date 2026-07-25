/**
 * React Query hooks for the AI Agents module.
 *
 * All hooks call `dbRemote` when an active organization is resolvable, and
 * gracefully fall back to the in-memory mock DB when there is no active org
 * (e.g. dev accounts without a workspace, or unauthenticated preview).
 *
 * This keeps existing pages working with minimal UI changes while persisting
 * every action to Supabase for real organizations. Tenant isolation is
 * enforced by RLS on `org_id`.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { db } from "./mock";
import {
  agentsRepo, agentConfigsRepo, conversationsRepo, leadsRepo,
  appointmentsRepo, callsRepo, knowledgeRepo, workflowsRepo,
  integrationsRepo, usageRepo, auditRepo,
} from "./repo";
import { getActiveOrgId } from "./repo/orgContext";
import type {
  Agent, AgentConfig, Conversation, Lead, Appointment, Call,
  Workflow, Integration, KCollection, KSource, Message, ConversationNote,
  ConversationStatus, PublishEnv, Channel,
} from "./types";

// ─── org context ────────────────────────────────────────────────────────

export function useOrgId() {
  return useQuery({
    queryKey: ["agents", "orgId"],
    queryFn: async () => (await getActiveOrgId()) ?? null,
    staleTime: 60_000,
  });
}

/** True when the current user has a real Supabase-backed org. */
function useRemote() {
  const { data: orgId } = useOrgId();
  return !!orgId;
}

// ─── keys ──────────────────────────────────────────────────────────────

const K = {
  agents: ["agents", "list"] as const,
  agent: (id: string) => ["agents", "detail", id] as const,
  agentConfig: (id: string, env: PublishEnv) => ["agents", "config", id, env] as const,
  conversations: ["agents", "conversations"] as const,
  conversation: (id: string) => ["agents", "conversation", id] as const,
  leads: ["agents", "leads"] as const,
  appointments: ["agents", "appointments"] as const,
  calls: ["agents", "calls"] as const,
  knowledgeCollections: ["agents", "kcollections"] as const,
  knowledgeSources: ["agents", "ksources"] as const,
  workflows: ["agents", "workflows"] as const,
  integrations: ["agents", "integrations"] as const,
  usage: ["agents", "usage"] as const,
  audit: ["agents", "audit"] as const,
};

// ─── generic remote-or-mock query helper ───────────────────────────────

function useRemoteOrMock<T>(
  key: readonly unknown[],
  remoteFn: () => Promise<T>,
  mockFn: () => T,
  opts?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
) {
  const { data: orgId, isLoading: orgLoading } = useOrgId();
  return useQuery<T>({
    queryKey: [...key, orgId ?? "mock"],
    queryFn: async () => {
      if (!orgId) return mockFn();
      try {
        const remote = await remoteFn();
        // If the remote store is empty, keep showing mock in dev so screens are not blank.
        if (Array.isArray(remote) && remote.length === 0 && import.meta.env.DEV) {
          return mockFn();
        }
        return remote;
      } catch (err) {
        if (import.meta.env.DEV) console.warn("[agents] remote query failed — using mock", err);
        return mockFn();
      }
    },
    enabled: !orgLoading,
    staleTime: 15_000,
    ...opts,
  });
}

// ─── AGENTS ────────────────────────────────────────────────────────────

export function useAgents() {
  return useRemoteOrMock<Agent[]>(K.agents, () => agentsRepo.list(), () => db.agents.list());
}

export function useAgent(id: string | undefined) {
  return useRemoteOrMock<Agent | null>(
    id ? K.agent(id) : ["agents", "detail", "none"],
    () => (id ? agentsRepo.get(id) : Promise.resolve(null)),
    () => (id ? (db.agents.get(id) ?? null) : null),
    { enabled: !!id },
  );
}

export function useCreateAgent() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (input: Partial<Agent>) => {
      if (!remote) throw new Error("Sign in with a workspace to save agents.");
      const created = await agentsRepo.create(input);
      await auditRepo.log("agent.create", "agent", created.id, null, created);
      return created;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "list"] }); toast.success("Agent created"); },
    onError: (e: Error) => toast.error(e.message ?? "Could not create agent"),
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Agent> }) => {
      if (!remote) throw new Error("Sign in with a workspace to save changes.");
      const updated = await agentsRepo.update(id, patch);
      await auditRepo.log("agent.update", "agent", id, null, patch);
      return updated;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["agents", "list"] });
      qc.invalidateQueries({ queryKey: ["agents", "detail", v.id] });
      toast.success("Agent updated");
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!remote) throw new Error("Sign in with a workspace to delete.");
      await agentsRepo.remove(id);
      await auditRepo.log("agent.delete", "agent", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "list"] }); toast.success("Agent deleted"); },
    onError: (e: Error) => toast.error(e.message ?? "Delete failed"),
  });
}

// ─── AGENT CONFIG (versioned) ──────────────────────────────────────────

export function useAgentConfig(agentId: string | undefined, env: PublishEnv = "draft") {
  const { data: orgId } = useOrgId();
  return useQuery<AgentConfig | null>({
    queryKey: agentId ? K.agentConfig(agentId, env) : ["agents", "config", "none"],
    queryFn: async () => {
      if (!agentId) return null;
      if (!orgId) return db.agentConfigs.get(agentId);
      try {
        const remote = await agentConfigsRepo.get(agentId, env);
        return remote ?? db.agentConfigs.get(agentId);
      } catch {
        return db.agentConfigs.get(agentId);
      }
    },
    enabled: !!agentId,
    staleTime: 15_000,
  });
}

export function useSaveAgentConfig() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ agentId, config }: { agentId: string; config: AgentConfig }) => {
      if (!remote) {
        // dev fallback — persist to in-memory mock
        return db.agentConfigs.save(agentId, config);
      }
      const saved = await agentConfigsRepo.save(agentId, config);
      await auditRepo.log("agent_config.save", "agent_config", agentId, null, { version: saved.version });
      return saved;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["agents", "config", v.agentId] });
      toast.success("Changes saved");
    },
    onError: (e: Error) => toast.error(e.message ?? "Save failed"),
  });
}

export function usePublishAgentConfig() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ agentId, env }: { agentId: string; env: PublishEnv }) => {
      if (!remote) return db.agentConfigs.publish(agentId, env);
      const published = await agentConfigsRepo.publish(agentId, env);
      await auditRepo.log("agent_config.publish", "agent_config", agentId, null, { env, version: published.version });
      await usageRepo.record("config_publish", 1, { env }, agentId);
      return published;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["agents", "config", v.agentId] });
      qc.invalidateQueries({ queryKey: ["agents", "list"] });
      toast.success(`Moved to ${v.env}`);
    },
    onError: (e: Error) => toast.error(e.message ?? "Publish failed"),
  });
}

// ─── CONVERSATIONS ─────────────────────────────────────────────────────

export function useConversations() {
  return useRemoteOrMock<Conversation[]>(K.conversations, () => conversationsRepo.list(), () => db.conversations.list() as Conversation[]);
}

export function useConversation(id: string | undefined) {
  return useRemoteOrMock<Conversation | null>(
    id ? K.conversation(id) : ["agents", "conversation", "none"],
    () => (id ? conversationsRepo.get(id) : Promise.resolve(null)),
    () => (id ? ((db.conversations.get(id) as Conversation | undefined) ?? null) : null),
    { enabled: !!id },
  );
}

export function useSendHumanMessage() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ conversationId, text }: { conversationId: string; text: string }) => {
      if (remote) {
        const at = new Date().toISOString();
        await conversationsRepo.appendMessage(conversationId, { role: "human", text, at });
        await usageRepo.record("human_message", 1, { conversationId });
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["agents", "conversation", v.conversationId] }),
    onError: (e: Error) => toast.error(e.message ?? "Send failed"),
  });
}

export function useAddConversationNote() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ conversationId, text }: { conversationId: string; text: string }) => {
      if (remote) await conversationsRepo.addNote(conversationId, text);
    },
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["agents", "conversation", v.conversationId] }); toast.success("Note added"); },
    onError: (e: Error) => toast.error(e.message ?? "Could not add note"),
  });
}

export function useTakeoverConversation() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ conversationId, summary }: { conversationId: string; summary?: string }) => {
      if (remote) await conversationsRepo.takeover(conversationId, summary);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["agents", "conversations"] });
      qc.invalidateQueries({ queryKey: ["agents", "conversation", v.conversationId] });
      toast.success("You took over the conversation");
    },
  });
}

export function useReturnToAI() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ conversationId, summary }: { conversationId: string; summary: string }) => {
      if (remote) await conversationsRepo.returnToAI(conversationId, summary);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["agents", "conversations"] });
      qc.invalidateQueries({ queryKey: ["agents", "conversation", v.conversationId] });
      toast.success("Returned to AI");
    },
  });
}

export function useSetConversationStatus() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: ConversationStatus }) => {
      if (remote) await conversationsRepo.update(conversationId, { status });
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["agents", "conversations"] });
      qc.invalidateQueries({ queryKey: ["agents", "conversation", v.conversationId] });
    },
  });
}

// ─── LEADS ─────────────────────────────────────────────────────────────

export function useLeads() {
  return useRemoteOrMock<Lead[]>(K.leads, () => leadsRepo.list(), () => db.leads.list());
}

export function useCreateLead() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (input: Omit<Lead, "id" | "createdAt">) => {
      if (!remote) throw new Error("Sign in with a workspace to save leads.");
      const lead = await leadsRepo.create(input);
      await auditRepo.log("lead.create", "lead", lead.id, null, lead);
      return lead;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "leads"] }); toast.success("Lead created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Lead> }) => {
      if (!remote) throw new Error("Sign in with a workspace to save changes.");
      await leadsRepo.update(id, patch);
      await auditRepo.log("lead.update", "lead", id, null, patch);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "leads"] }); toast.success("Lead updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── APPOINTMENTS ──────────────────────────────────────────────────────

export function useAppointments() {
  return useRemoteOrMock<Appointment[]>(K.appointments, () => appointmentsRepo.list(), () => db.appointments.list());
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (input: Omit<Appointment, "id">) => {
      if (!remote) throw new Error("Sign in with a workspace to book appointments.");
      const a = await appointmentsRepo.create(input);
      await auditRepo.log("appointment.create", "appointment", a.id, null, a);
      return a;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "appointments"] }); toast.success("Appointment booked"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── CALLS ─────────────────────────────────────────────────────────────

export function useCalls() {
  return useRemoteOrMock<Call[]>(K.calls, () => callsRepo.list(), () => db.calls.list());
}

// ─── KNOWLEDGE ─────────────────────────────────────────────────────────

export function useKnowledgeCollections() {
  return useRemoteOrMock<KCollection[]>(
    K.knowledgeCollections,
    () => knowledgeRepo.listCollections(),
    () => db.knowledge.collections.list(),
  );
}

export function useCreateKnowledgeCollection() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (input: Partial<KCollection>) => {
      if (!remote) return db.knowledge.collections.add(input);
      const c = await knowledgeRepo.createCollection(input);
      await auditRepo.log("kcollection.create", "kcollection", c.id, null, c);
      return c;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "kcollections"] }); toast.success("Collection created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useKnowledgeSources() {
  return useRemoteOrMock<KSource[]>(
    K.knowledgeSources,
    () => knowledgeRepo.listSources(),
    () => db.knowledge.sources.list(),
  );
}

export function useCreateKnowledgeSource() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (input: Partial<KSource> & { name: string; kind: KSource["kind"]; collectionId: string }) => {
      if (!remote) return db.knowledge.sources.add(input);
      const s = await knowledgeRepo.createSource(input);
      await auditRepo.log("ksource.create", "ksource", s.id, null, s);
      return s;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "ksources"] }); toast.success("Source added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAssignKnowledgeToAgent() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ agentId, sourceId, assign }: { agentId: string; sourceId: string; assign: boolean }) => {
      if (!remote) return; // mock has its own inline paths
      if (assign) await knowledgeRepo.assign(agentId, sourceId);
      else await knowledgeRepo.unassign(agentId, sourceId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "ksources"] }),
  });
}

// ─── WORKFLOWS ─────────────────────────────────────────────────────────

export function useWorkflows() {
  return useRemoteOrMock<Workflow[]>(K.workflows, () => workflowsRepo.list(), () => db.workflows.list());
}

// ─── INTEGRATIONS ──────────────────────────────────────────────────────

export function useIntegrations() {
  return useRemoteOrMock<Integration[]>(K.integrations, () => integrationsRepo.list(), () => db.integrations.list());
}

export function useSetIntegrationConnected() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ id, connected }: { id: string; connected: boolean }) => {
      if (!remote) return; // dev only — mock is not mutated for integrations
      await integrationsRepo.setConnected(id, connected);
      await auditRepo.log(connected ? "integration.connect" : "integration.disconnect", "integration", id);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["agents", "integrations"] });
      toast.success(v.connected ? "Connected" : "Disconnected");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── USAGE + AUDIT ─────────────────────────────────────────────────────

export function useRecordUsage() {
  const remote = useRemote();
  return useMutation({
    mutationFn: async (input: { eventType: string; units?: number; meta?: Record<string, unknown>; agentId?: string; conversationId?: string }) => {
      if (!remote) return;
      await usageRepo.record(input.eventType, input.units ?? 1, input.meta ?? {}, input.agentId, input.conversationId);
    },
  });
}

export function useUsage(days = 30) {
  const { data: orgId } = useOrgId();
  return useQuery({
    queryKey: ["agents", "usage", "list", orgId, days],
    queryFn: async () => {
      if (!orgId) return [] as { event_type: string; units: number; created_at: string }[];
      const sb = supabase as any;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data, error } = await sb
        .from("agent_usage_events")
        .select("event_type, units, created_at")
        .eq("org_id", orgId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });
}

export function useAuditLogs(limit = 100) {
  const { data: orgId } = useOrgId();
  return useQuery({
    queryKey: ["agents", "audit", "list", orgId, limit],
    queryFn: async () => {
      if (!orgId) return [] as { action: string; entity_type: string; entity_id: string | null; created_at: string; actor_user_id: string | null }[];
      const sb = supabase as any;
      const { data, error } = await sb
        .from("agent_audit_logs")
        .select("action, entity_type, entity_id, created_at, actor_user_id")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });
}

// ─── UI helpers ────────────────────────────────────────────────────────

export function isEmpty<T>(list: T[] | undefined): boolean {
  return !list || list.length === 0;
}