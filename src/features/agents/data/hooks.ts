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
  integrationsRepo, usageRepo, auditRepo, dashboardKpisRepo, type AgentKpis,
} from "./repo";
import { getActiveOrgId } from "./repo/orgContext";
import type {
  Agent, AgentConfig, Conversation, Lead, Appointment, Call,
  Workflow, Integration, KCollection, KSource, KFAQ, KProduct, KService, KWebsiteImport,
  Message, ConversationNote,
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
      // Authenticated org — always return the real (org-scoped) result, even
      // if empty. Empty is a genuine state; the UI must render an empty state
      // rather than leak seeded data across tenants.
      return await remoteFn();
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
      if (!remote) return;
      const { data, error } = await supabase.functions.invoke("channel-send", { body: { conversationId, text } });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).message || (data as any).error);
      await usageRepo.record("human_message", 1, { conversationId });
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["agents", "conversation", v.conversationId] });
      qc.invalidateQueries({ queryKey: ["agents", "conversations"] });
    },
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

export function useUpdateKnowledgeCollection() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<KCollection> }) => {
      if (!remote) { db.knowledge.collections.update(id, patch); return; }
      await knowledgeRepo.updateCollection(id, patch);
      await auditRepo.log("kcollection.update", "kcollection", id, null, patch);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "kcollections"] }); toast.success("Collection updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteKnowledgeCollection() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!remote) { db.knowledge.collections.remove(id); return; }
      await knowledgeRepo.deleteCollection(id);
      await auditRepo.log("kcollection.delete", "kcollection", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents", "kcollections"] });
      qc.invalidateQueries({ queryKey: ["agents", "ksources"] });
      toast.success("Collection deleted");
    },
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

export function useUpdateKnowledgeSource() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<KSource> }) => {
      if (!remote) { db.knowledge.sources.update(id, patch); return; }
      await knowledgeRepo.updateSource(id, patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "ksources"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetKnowledgeSourceStatus() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: KSource["status"] }) => {
      if (!remote) { db.knowledge.sources.setStatus(id, status); return; }
      await knowledgeRepo.setSourceStatus(id, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "ksources"] }),
  });
}

export function useArchiveKnowledgeSource() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!remote) { db.knowledge.sources.archive(id); return; }
      await knowledgeRepo.archiveSource(id);
      await auditRepo.log("ksource.archive", "ksource", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "ksources"] }); toast.success("Archived"); },
  });
}

export function useRestoreKnowledgeSource() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!remote) { db.knowledge.sources.restore(id); return; }
      await knowledgeRepo.restoreSource(id);
      await auditRepo.log("ksource.restore", "ksource", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "ksources"] }); toast.success("Restored"); },
  });
}

export function useDeleteKnowledgeSource() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!remote) { db.knowledge.sources.remove(id); return; }
      await knowledgeRepo.deleteSource(id);
      await auditRepo.log("ksource.delete", "ksource", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "ksources"] }); toast.success("Deleted"); },
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

export function useUnassignKnowledgeFromAgent() {
  const qc = useQueryClient();
  const remote = useRemote();
  return useMutation({
    mutationFn: async ({ agentId, sourceId }: { agentId: string; sourceId: string }) => {
      if (!remote) return;
      await knowledgeRepo.unassign(agentId, sourceId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "ksources"] }),
  });
}

// FAQs / Products / Services / Website imports
export function useFaqs() {
  return useRemoteOrMock<KFAQ[]>(
    ["agents", "faqs"] as const,
    () => knowledgeRepo.listFaqs(),
    () => db.knowledge.faqs.list(),
  );
}
export function useCreateFaq() {
  const qc = useQueryClient(); const remote = useRemote();
  return useMutation({
    mutationFn: async (input: { question: string; answer: string; category?: string; language?: string; collectionId: string }) => {
      if (!remote) return db.knowledge.faqs.add(input);
      return knowledgeRepo.createFaq(input);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "faqs"] }); toast.success("FAQ added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateFaq() {
  const qc = useQueryClient(); const remote = useRemote();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<KFAQ> }) => {
      if (!remote) { db.knowledge.faqs.update(id, patch); return; }
      await knowledgeRepo.updateFaq(id, patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "faqs"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteFaq() {
  const qc = useQueryClient(); const remote = useRemote();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!remote) { db.knowledge.faqs.remove(id); return; }
      await knowledgeRepo.deleteFaq(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "faqs"] }),
  });
}

export function useProducts() {
  return useRemoteOrMock<KProduct[]>(["agents", "products"] as const, () => knowledgeRepo.listProducts(), () => db.knowledge.products.list());
}
export function useCreateProduct() {
  const qc = useQueryClient(); const remote = useRemote();
  return useMutation({
    mutationFn: async (input: Partial<KProduct> & { name: string; collectionId: string }) => {
      if (!remote) return db.knowledge.products.add(input);
      return knowledgeRepo.createProduct(input);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "products"] }); toast.success("Product added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteProduct() {
  const qc = useQueryClient(); const remote = useRemote();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!remote) { db.knowledge.products.remove(id); return; }
      await knowledgeRepo.deleteProduct(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "products"] }),
  });
}

export function useServices() {
  return useRemoteOrMock<KService[]>(["agents", "services"] as const, () => knowledgeRepo.listServices(), () => db.knowledge.services.list());
}
export function useCreateService() {
  const qc = useQueryClient(); const remote = useRemote();
  return useMutation({
    mutationFn: async (input: Partial<KService> & { name: string; collectionId: string }) => {
      if (!remote) return db.knowledge.services.add(input);
      return knowledgeRepo.createService(input);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents", "services"] }); toast.success("Service added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteService() {
  const qc = useQueryClient(); const remote = useRemote();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!remote) { db.knowledge.services.remove(id); return; }
      await knowledgeRepo.deleteService(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "services"] }),
  });
}

export function useWebsiteImports() {
  return useRemoteOrMock<KWebsiteImport[]>(["agents", "wimports"] as const, () => knowledgeRepo.listWebsiteImports(), () => db.knowledge.websiteImports.list());
}
export function useCreateWebsiteImport() {
  const qc = useQueryClient(); const remote = useRemote();
  return useMutation({
    mutationFn: async (input: { rootUrl: string; mode: KWebsiteImport["mode"]; pages?: string[]; collectionId: string }) => {
      if (!remote) return db.knowledge.websiteImports.add(input);
      return knowledgeRepo.createWebsiteImport(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents", "wimports"] });
      qc.invalidateQueries({ queryKey: ["agents", "ksources"] });
      toast.success("Website import queued");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteWebsiteImport() {
  const qc = useQueryClient(); const remote = useRemote();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!remote) { db.knowledge.websiteImports.remove(id); return; }
      await knowledgeRepo.deleteWebsiteImport(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents", "wimports"] });
      qc.invalidateQueries({ queryKey: ["agents", "ksources"] });
    },
  });
}

// ─── DASHBOARD KPIs (Supabase-derived) ────────────────────────────────

export function useAgentKpis() {
  const { data: orgId, isLoading: orgLoading } = useOrgId();
  return useQuery<AgentKpis | null>({
    queryKey: ["agents", "kpis", orgId ?? "none"],
    queryFn: async () => (orgId ? await dashboardKpisRepo.load() : null),
    enabled: !orgLoading,
    staleTime: 30_000,
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