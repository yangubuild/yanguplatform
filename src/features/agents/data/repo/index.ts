// Supabase persistence adapters for the AI Agents module.
// These mirror the mock `db` interface but are async and org-scoped.
// Pages currently consume the sync mock; hooks/components migrate to these
// adapters one call site at a time without any UI change.

import { supabase } from "@/integrations/supabase/client";
import type {
  Agent, AgentConfig, Conversation, Message, ConversationNote,
  Lead, Appointment, Call, Workflow, Integration,
  KCollection, KSource, KFAQ, KProduct, KService, KWebsiteImport, Channel,
} from "../types";
import { requireOrgId, currentUserId } from "./orgContext";

// ─── helpers ───────────────────────────────────────────────────────────
// The new agent_* tables aren't in the generated Database types yet
// (typegen runs after the migration is approved). At these adapter
// boundaries we widen the client and rows to `any` — the RLS policies
// and column defs are the source of truth.
const sb = supabase as any;
function unwrap(res: { data: unknown; error: any }): any {
  if (res.error) throw res.error;
  return res.data;
}

// ─── agents ────────────────────────────────────────────────────────────
function rowToAgent(r: any): Agent {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    status: r.status,
    channels: (r.channels ?? []) as Channel[],
    language: r.language ?? "en",
    voice: r.voice ?? "—",
    conversationsToday: 0,
    leadsThisWeek: 0,
    handoverRate: 0,
    updatedAt: r.updated_at,
    description: r.description ?? "",
  };
}

export const agentsRepo = {
  async list(): Promise<Agent[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(
      await sb.from("agent_agents").select("*").eq("org_id", orgId).order("created_at", { ascending: false })
    );
    return (rows ?? []).map(rowToAgent);
  },
  async get(id: string): Promise<Agent | null> {
    const row = unwrap(
      await sb.from("agent_agents").select("*").eq("id", id).maybeSingle()
    );
    return row ? rowToAgent(row) : null;
  },
  async create(input: Partial<Agent>): Promise<Agent> {
    const orgId = await requireOrgId();
    const userId = await currentUserId();
    const row = unwrap(
      await sb.from("agent_agents").insert({
        org_id: orgId,
        name: input.name ?? "New Agent",
        type: input.type ?? "support",
        status: input.status ?? "draft",
        description: input.description ?? "",
        channels: input.channels ?? [],
        language: input.language ?? "en",
        voice: input.voice ?? null,
        created_by: userId,
      }).select().single()
    );
    return rowToAgent(row);
  },
  async update(id: string, patch: Partial<Agent>): Promise<Agent> {
    const row = unwrap(
      await sb.from("agent_agents").update({
        name: patch.name,
        type: patch.type,
        status: patch.status,
        description: patch.description,
        channels: patch.channels,
        language: patch.language,
        voice: patch.voice,
      }).eq("id", id).select().single()
    );
    return rowToAgent(row);
  },
  async remove(id: string): Promise<void> {
    const r = await sb.from("agent_agents").delete().eq("id", id);
    if (r.error) throw r.error;
  },
};

// ─── agent configs (versioned) ─────────────────────────────────────────
export const agentConfigsRepo = {
  async get(agentId: string, env: "draft" | "staging" | "live" = "draft"): Promise<AgentConfig | null> {
    const row = unwrap(
      await sb.from("agent_configs")
        .select("*")
        .eq("agent_id", agentId)
        .eq("environment", env)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    if (!row) return null;
    return { ...(row.config as unknown as AgentConfig), id: row.id, agentId, environment: row.environment as any, version: row.version, updatedAt: row.updated_at, publishedAt: row.published_at ?? undefined };
  },
  async save(agentId: string, config: AgentConfig): Promise<AgentConfig> {
    const orgId = await requireOrgId();
    const userId = await currentUserId();
    const env = config.environment ?? "draft";
    // upsert latest draft of the current env
    const existing = await agentConfigsRepo.get(agentId, env);
    if (existing) {
      const row = unwrap(
        await sb.from("agent_configs")
          .update({ config, updated_by: userId })
          .eq("id", existing.id).select().single()
      );
      return { ...(row.config as unknown as AgentConfig), id: row.id, agentId, environment: row.environment as any, version: row.version, updatedAt: row.updated_at };
    }
    const row = unwrap(
      await sb.from("agent_configs").insert({
        org_id: orgId, agent_id: agentId, environment: env, version: 1,
        config, updated_by: userId,
      }).select().single()
    );
    return { ...(row.config as unknown as AgentConfig), id: row.id, agentId, environment: row.environment as any, version: row.version, updatedAt: row.updated_at };
  },
  async publish(agentId: string, env: "draft" | "staging" | "live"): Promise<AgentConfig> {
    const orgId = await requireOrgId();
    const userId = await currentUserId();
    const draft = await agentConfigsRepo.get(agentId, "draft");
    if (!draft) throw new Error("No draft to publish");
    // find latest version in target env, bump
    const { data: last } = await sb.from("agent_configs")
      .select("version").eq("agent_id", agentId).eq("environment", env)
      .order("version", { ascending: false }).limit(1).maybeSingle();
    const nextVersion = (last?.version ?? 0) + 1;
    const row = unwrap(
      await sb.from("agent_configs").insert({
        org_id: orgId, agent_id: agentId, environment: env, version: nextVersion,
        config: { ...draft, environment: env, version: nextVersion },
        updated_by: userId,
        published_at: env === "live" ? new Date().toISOString() : null,
      }).select().single()
    );
    if (env === "live") {
      await sb.from("agent_agents").update({ status: "live" }).eq("id", agentId);
    }
    return { ...(row.config as unknown as AgentConfig), id: row.id, agentId, environment: row.environment as any, version: row.version, updatedAt: row.updated_at, publishedAt: row.published_at ?? undefined };
  },
};

// ─── conversations + messages ──────────────────────────────────────────
function rowToConversation(r: any, msgs: Message[] = [], notes: ConversationNote[] = []): Conversation {
  return {
    id: r.id,
    contactName: r.contact_name ?? "Unknown",
    contactHandle: r.contact_handle ?? "",
    channel: r.channel,
    agentId: r.agent_id ?? "",
    lastMessage: r.last_message ?? "",
    unread: r.unread ?? 0,
    updatedAt: r.updated_at,
    status: r.status,
    messages: msgs,
    priority: r.priority ?? undefined,
    sentiment: r.sentiment ?? undefined,
    language: r.language ?? undefined,
    outcome: r.outcome ?? undefined,
    assignedTo: r.assigned_to ?? undefined,
    takeoverBy: r.takeover_by ?? undefined,
    takeoverAt: r.takeover_at ?? undefined,
    returnedBy: r.returned_by ?? undefined,
    returnedAt: r.returned_at ?? undefined,
    handoverSummary: r.handover_summary ?? undefined,
    tags: r.tags ?? [],
    notes,
    memoryRetention: r.memory_retention ?? undefined,
    spam: r.spam ?? false,
    archived: r.archived ?? false,
  };
}

export const conversationsRepo = {
  async list(): Promise<Conversation[]> {
    const orgId = await requireOrgId();
    // fetch conversations + join contact
    const rows = unwrap(
      await sb.from("agent_conversations")
        .select("*, contact:agent_contacts(name, handle)")
        .eq("org_id", orgId)
        .order("updated_at", { ascending: false })
        .limit(200)
    );
    return (rows ?? []).map((r: any) => rowToConversation({
      ...r,
      contact_name: r.contact?.name,
      contact_handle: r.contact?.handle,
    }));
  },
  async get(id: string): Promise<Conversation | null> {
    const [convRes, msgRes, noteRes] = await Promise.all([
      sb.from("agent_conversations").select("*, contact:agent_contacts(name, handle)").eq("id", id).maybeSingle(),
      sb.from("agent_messages").select("*").eq("conversation_id", id).order("at", { ascending: true }),
      sb.from("agent_conversation_notes").select("*").eq("conversation_id", id).order("at", { ascending: true }),
    ]);
    const r: any = unwrap(convRes);
    if (!r) return null;
    const msgs: Message[] = (msgRes.data ?? []).map((m: any) => ({
      id: m.id, role: m.role, text: m.text, at: m.at, meta: m.meta ?? undefined,
    }));
    const notes: ConversationNote[] = (noteRes.data ?? []).map((n: any) => ({
      id: n.id, author: n.author_name ?? "Team", text: n.text, at: n.at,
    }));
    return rowToConversation({
      ...r,
      contact_name: r.contact?.name,
      contact_handle: r.contact?.handle,
    }, msgs, notes);
  },
  async create(input: Partial<Conversation> & { contactName: string; contactHandle?: string; channel: Channel; agentId?: string }): Promise<Conversation> {
    const orgId = await requireOrgId();
    // upsert contact
    const contact = unwrap(
      await sb.from("agent_contacts").insert({
        org_id: orgId,
        name: input.contactName,
        handle: input.contactHandle ?? null,
        channel: input.channel,
        language: input.language ?? null,
      }).select().single()
    );
    const row = unwrap(
      await sb.from("agent_conversations").insert({
        org_id: orgId,
        agent_id: input.agentId ?? null,
        contact_id: contact.id,
        channel: input.channel,
        status: input.status ?? "new",
        priority: input.priority ?? "normal",
        language: input.language ?? null,
        tags: input.tags ?? [],
      }).select().single()
    );
    return rowToConversation({ ...row, contact_name: contact.name, contact_handle: contact.handle });
  },
  async update(id: string, patch: Partial<Conversation>): Promise<void> {
    const r = await sb.from("agent_conversations").update({
      status: patch.status,
      priority: patch.priority,
      sentiment: patch.sentiment,
      language: patch.language,
      outcome: patch.outcome,
      assigned_to: patch.assignedTo,
      tags: patch.tags,
      handover_summary: patch.handoverSummary,
      memory_retention: patch.memoryRetention,
      spam: patch.spam,
      archived: patch.archived,
      unread: patch.unread,
      last_message: patch.lastMessage,
    }).eq("id", id);
    if (r.error) throw r.error;
  },
  async appendMessage(conversationId: string, msg: Omit<Message, "id">): Promise<Message> {
    const orgId = await requireOrgId();
    const userId = await currentUserId();
    const row = unwrap(
      await sb.from("agent_messages").insert({
        org_id: orgId,
        conversation_id: conversationId,
        role: msg.role,
        text: msg.text,
        meta: msg.meta ?? {},
        author_user_id: msg.role === "human" ? userId : null,
        at: msg.at,
      }).select().single()
    );
    await sb.from("agent_conversations").update({
      last_message: msg.text,
      last_message_at: msg.at,
      updated_at: new Date().toISOString(),
    }).eq("id", conversationId);
    return { id: row.id, role: row.role, text: row.text, at: row.at, meta: row.meta ?? undefined };
  },
  async addNote(conversationId: string, text: string): Promise<ConversationNote> {
    const orgId = await requireOrgId();
    const userId = await currentUserId();
    const row = unwrap(
      await sb.from("agent_conversation_notes").insert({
        org_id: orgId,
        conversation_id: conversationId,
        author_user_id: userId,
        author_name: "Team",
        text,
      }).select().single()
    );
    return { id: row.id, author: row.author_name ?? "Team", text: row.text, at: row.at };
  },
  async takeover(conversationId: string, summary?: string): Promise<void> {
    const orgId = await requireOrgId();
    const userId = await currentUserId();
    const now = new Date().toISOString();
    await sb.from("agent_conversations").update({
      status: "human",
      takeover_by: userId,
      takeover_at: now,
      assigned_to: userId,
    }).eq("id", conversationId);
    await sb.from("agent_handover_events").insert({
      org_id: orgId, conversation_id: conversationId,
      kind: "takeover", actor_user_id: userId, summary: summary ?? null,
    });
  },
  async returnToAI(conversationId: string, summary: string): Promise<void> {
    const orgId = await requireOrgId();
    const userId = await currentUserId();
    const now = new Date().toISOString();
    await sb.from("agent_conversations").update({
      status: "active",
      returned_by: userId,
      returned_at: now,
      handover_summary: summary,
      assigned_to: null,
    }).eq("id", conversationId);
    await sb.from("agent_handover_events").insert({
      org_id: orgId, conversation_id: conversationId,
      kind: "return", actor_user_id: userId, summary,
    });
  },
};

// ─── leads ─────────────────────────────────────────────────────────────
export const leadsRepo = {
  async list(): Promise<Lead[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(
      await sb.from("agent_leads").select("*").eq("org_id", orgId).order("created_at", { ascending: false })
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id, name: r.name, email: r.email ?? undefined, phone: r.phone ?? undefined,
      source: r.source, intent: r.intent ?? "", score: r.score ?? 0, stage: r.stage,
      owner: r.owner_user_id ?? "", createdAt: r.created_at,
    }));
  },
  async create(input: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
    const orgId = await requireOrgId();
    const row = unwrap(
      await sb.from("agent_leads").insert({
        org_id: orgId,
        name: input.name, email: input.email ?? null, phone: input.phone ?? null,
        source: input.source, intent: input.intent, score: input.score, stage: input.stage,
      }).select().single()
    );
    return {
      id: row.id, name: row.name, email: row.email ?? undefined, phone: row.phone ?? undefined,
      source: row.source, intent: row.intent ?? "", score: row.score, stage: row.stage,
      owner: row.owner_user_id ?? "", createdAt: row.created_at,
    };
  },
  async update(id: string, patch: Partial<Lead>): Promise<void> {
    const r = await sb.from("agent_leads").update({
      name: patch.name, email: patch.email, phone: patch.phone,
      intent: patch.intent, score: patch.score, stage: patch.stage,
    }).eq("id", id);
    if (r.error) throw r.error;
  },
};

// ─── appointments ──────────────────────────────────────────────────────
export const appointmentsRepo = {
  async list(): Promise<Appointment[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(
      await sb.from("agent_appointments").select("*").eq("org_id", orgId).order("scheduled_at", { ascending: true })
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id, title: r.title, contact: r.contact_name ?? "",
      channel: r.channel, when: r.scheduled_at, duration: r.duration_min,
      agentId: r.agent_id ?? "", status: r.status,
    }));
  },
  async create(input: Omit<Appointment, "id">): Promise<Appointment> {
    const orgId = await requireOrgId();
    const row = unwrap(
      await sb.from("agent_appointments").insert({
        org_id: orgId, agent_id: input.agentId || null,
        title: input.title, contact_name: input.contact, channel: input.channel,
        scheduled_at: input.when, duration_min: input.duration, status: input.status,
      }).select().single()
    );
    return {
      id: row.id, title: row.title, contact: row.contact_name ?? "",
      channel: row.channel, when: row.scheduled_at, duration: row.duration_min,
      agentId: row.agent_id ?? "", status: row.status,
    };
  },
};

// ─── calls ─────────────────────────────────────────────────────────────
export const callsRepo = {
  async list(): Promise<Call[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(
      await sb.from("agent_calls").select("*").eq("org_id", orgId).order("started_at", { ascending: false })
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id, contact: r.contact_name ?? "", direction: r.direction,
      agentId: r.agent_id ?? "", duration: r.duration_sec,
      outcome: r.outcome, when: r.started_at,
      recordingUrl: r.recording_url ?? undefined, transcript: r.transcript ?? undefined,
    }));
  },
};

// ─── knowledge (collections + sources) ─────────────────────────────────
function rowToSource(r: any, agentIds: string[] = []): KSource {
  return {
    id: r.id, name: r.name, kind: r.kind, collectionId: r.collection_id ?? "",
    language: r.language ?? "en", version: r.version ?? 1, status: r.status,
    uploadedAt: r.uploaded_at, updatedAt: r.updated_at, size: r.size ?? "",
    active: r.active, permission: r.permission,
    agentIds,
    sourceUrl: r.source_url ?? undefined,
    tags: r.tags ?? [],
    chunks: r.chunks ?? 0,
    history: r.history ?? [],
  };
}

export const knowledgeRepo = {
  // ── collections ──
  async listCollections(): Promise<KCollection[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(
      await sb.from("agent_knowledge_collections").select("*").eq("org_id", orgId).order("created_at")
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id, name: r.name, description: r.description ?? "",
      color: r.color ?? "sky", agentIds: (r.meta?.agentIds ?? []),
      createdAt: r.created_at,
    }));
  },
  async createCollection(input: Partial<KCollection>): Promise<KCollection> {
    const orgId = await requireOrgId();
    const row = unwrap(
      await sb.from("agent_knowledge_collections").insert({
        org_id: orgId,
        name: input.name ?? "New Collection",
        description: input.description ?? "",
        color: input.color ?? "sky",
        meta: { agentIds: input.agentIds ?? [] },
      }).select().single()
    );
    return {
      id: row.id, name: row.name, description: row.description ?? "",
      color: row.color, agentIds: row.meta?.agentIds ?? [], createdAt: row.created_at,
    };
  },
  async updateCollection(id: string, patch: Partial<KCollection>): Promise<void> {
    const update: any = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.description !== undefined) update.description = patch.description;
    if (patch.color !== undefined) update.color = patch.color;
    if (patch.agentIds !== undefined) update.meta = { agentIds: patch.agentIds };
    const r = await sb.from("agent_knowledge_collections").update(update).eq("id", id);
    if (r.error) throw r.error;
  },
  async deleteCollection(id: string): Promise<void> {
    const r = await sb.from("agent_knowledge_collections").delete().eq("id", id);
    if (r.error) throw r.error;
  },

  // ── sources (all kinds — pdf/docx/faq/product/service/url/…) ──
  async listSources(): Promise<KSource[]> {
    const orgId = await requireOrgId();
    const [srcRes, assignRes] = await Promise.all([
      sb.from("agent_knowledge_sources").select("*").eq("org_id", orgId).order("uploaded_at", { ascending: false }),
      sb.from("agent_knowledge_assignments").select("agent_id, source_id").eq("org_id", orgId),
    ]);
    const assigns = assignRes.data ?? [];
    const byId: Record<string, string[]> = {};
    for (const a of assigns) byId[a.source_id] = [...(byId[a.source_id] ?? []), a.agent_id];
    return (srcRes.data ?? []).map((r: any) => rowToSource(r, byId[r.id] ?? []));
  },
  async createSource(input: Partial<KSource> & { content?: any }): Promise<KSource> {
    const orgId = await requireOrgId();
    const row = unwrap(
      await sb.from("agent_knowledge_sources").insert({
        org_id: orgId,
        collection_id: input.collectionId || null,
        name: input.name ?? "Untitled",
        kind: input.kind ?? "note",
        language: input.language ?? "en",
        status: input.status ?? "processing",
        size: input.size ?? null,
        active: input.active ?? true,
        permission: input.permission ?? "all",
        source_url: input.sourceUrl ?? null,
        tags: input.tags ?? [],
        content: (input as any).content ?? {},
      }).select().single()
    );
    return rowToSource(row);
  },
  async updateSource(id: string, patch: Partial<KSource> & { content?: any }): Promise<void> {
    const update: any = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.collectionId !== undefined) update.collection_id = patch.collectionId || null;
    if (patch.language !== undefined) update.language = patch.language;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.size !== undefined) update.size = patch.size;
    if (patch.active !== undefined) update.active = patch.active;
    if (patch.permission !== undefined) update.permission = patch.permission;
    if (patch.sourceUrl !== undefined) update.source_url = patch.sourceUrl;
    if (patch.tags !== undefined) update.tags = patch.tags;
    if ((patch as any).content !== undefined) update.content = (patch as any).content;
    if (patch.chunks !== undefined) update.chunks = patch.chunks;
    if (patch.version !== undefined) update.version = patch.version;
    if (patch.history !== undefined) update.history = patch.history;
    update.updated_at = new Date().toISOString();
    const r = await sb.from("agent_knowledge_sources").update(update).eq("id", id);
    if (r.error) throw r.error;
  },
  async setSourceStatus(id: string, status: KSource["status"]): Promise<void> {
    const r = await sb.from("agent_knowledge_sources")
      .update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (r.error) throw r.error;
  },
  async archiveSource(id: string): Promise<void> {
    await knowledgeRepo.updateSource(id, { status: "archived", active: false });
  },
  async restoreSource(id: string): Promise<void> {
    await knowledgeRepo.updateSource(id, { status: "indexed", active: true });
  },
  async deleteSource(id: string): Promise<void> {
    const r = await sb.from("agent_knowledge_sources").delete().eq("id", id);
    if (r.error) throw r.error;
  },

  // ── assignments ──
  async assign(agentId: string, sourceId: string): Promise<void> {
    const orgId = await requireOrgId();
    const r = await sb.from("agent_knowledge_assignments").upsert(
      { org_id: orgId, agent_id: agentId, source_id: sourceId },
      { onConflict: "agent_id,source_id" }
    );
    if (r.error) throw r.error;
  },
  async unassign(agentId: string, sourceId: string): Promise<void> {
    const r = await sb.from("agent_knowledge_assignments")
      .delete().eq("agent_id", agentId).eq("source_id", sourceId);
    if (r.error) throw r.error;
  },

  // ── FAQs / Products / Services / Website imports
  // All are stored as agent_knowledge_sources rows with the corresponding `kind`
  // and specifics inside the `content` jsonb column.
  async listFaqs(): Promise<KFAQ[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(await sb.from("agent_knowledge_sources").select("*").eq("org_id", orgId).eq("kind", "faq"));
    return (rows ?? []).map((r: any) => ({
      id: r.id, question: r.name, answer: r.content?.answer ?? "",
      category: r.content?.category ?? "General", language: r.language ?? "English",
      active: r.active, collectionId: r.collection_id ?? "", updatedAt: r.updated_at,
    }));
  },
  async createFaq(input: Partial<KFAQ> & { question: string; answer: string; collectionId: string }): Promise<KFAQ> {
    const src = await knowledgeRepo.createSource({
      name: input.question, kind: "faq", collectionId: input.collectionId,
      language: input.language ?? "English", status: "indexed", size: "1 entry",
      content: { answer: input.answer, category: input.category ?? "General" },
    } as any);
    return {
      id: src.id, question: input.question, answer: input.answer,
      category: input.category ?? "General", language: input.language ?? "English",
      active: input.active ?? true, collectionId: input.collectionId, updatedAt: src.updatedAt,
    };
  },
  async updateFaq(id: string, patch: Partial<KFAQ>): Promise<void> {
    const update: any = {};
    if (patch.question !== undefined) update.name = patch.question;
    if (patch.language !== undefined) update.language = patch.language;
    if (patch.collectionId !== undefined) update.collectionId = patch.collectionId;
    if (patch.active !== undefined) update.active = patch.active;
    if (patch.answer !== undefined || patch.category !== undefined) {
      // Merge into content jsonb
      const cur = unwrap(await sb.from("agent_knowledge_sources").select("content").eq("id", id).maybeSingle());
      const merged = { ...(cur?.content ?? {}) };
      if (patch.answer !== undefined) merged.answer = patch.answer;
      if (patch.category !== undefined) merged.category = patch.category;
      update.content = merged;
    }
    await knowledgeRepo.updateSource(id, update);
  },
  async deleteFaq(id: string): Promise<void> { await knowledgeRepo.deleteSource(id); },

  async listProducts(): Promise<KProduct[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(await sb.from("agent_knowledge_sources").select("*").eq("org_id", orgId).eq("kind", "product"));
    return (rows ?? []).map((r: any) => ({
      id: r.id, name: r.name,
      description: r.content?.description ?? "",
      features: r.content?.features ?? [],
      price: r.content?.price ?? "",
      category: r.content?.category ?? "General",
      availability: r.content?.availability ?? "in_stock",
      images: r.content?.images ?? [],
      relatedProductIds: r.content?.relatedProductIds ?? [],
      collectionId: r.collection_id ?? "",
      updatedAt: r.updated_at,
    }));
  },
  async createProduct(input: Partial<KProduct> & { name: string; collectionId: string }): Promise<KProduct> {
    const src = await knowledgeRepo.createSource({
      name: input.name, kind: "product", collectionId: input.collectionId, status: "indexed",
      content: {
        description: input.description ?? "", features: input.features ?? [],
        price: input.price ?? "", category: input.category ?? "General",
        availability: input.availability ?? "in_stock",
        images: input.images ?? [], relatedProductIds: input.relatedProductIds ?? [],
      },
    } as any);
    return {
      id: src.id, name: input.name, description: input.description ?? "",
      features: input.features ?? [], price: input.price ?? "",
      category: input.category ?? "General", availability: input.availability ?? "in_stock",
      images: input.images ?? [], relatedProductIds: input.relatedProductIds ?? [],
      collectionId: input.collectionId, updatedAt: src.updatedAt,
    };
  },
  async deleteProduct(id: string): Promise<void> { await knowledgeRepo.deleteSource(id); },

  async listServices(): Promise<KService[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(await sb.from("agent_knowledge_sources").select("*").eq("org_id", orgId).eq("kind", "service"));
    return (rows ?? []).map((r: any) => ({
      id: r.id, name: r.name,
      description: r.content?.description ?? "",
      features: r.content?.features ?? [],
      price: r.content?.price ?? "",
      availability: r.content?.availability ?? "available",
      collectionId: r.collection_id ?? "",
      updatedAt: r.updated_at,
    }));
  },
  async createService(input: Partial<KService> & { name: string; collectionId: string }): Promise<KService> {
    const src = await knowledgeRepo.createSource({
      name: input.name, kind: "service", collectionId: input.collectionId, status: "indexed",
      content: {
        description: input.description ?? "", features: input.features ?? [],
        price: input.price ?? "", availability: input.availability ?? "available",
      },
    } as any);
    return {
      id: src.id, name: input.name, description: input.description ?? "",
      features: input.features ?? [], price: input.price ?? "",
      availability: input.availability ?? "available",
      collectionId: input.collectionId, updatedAt: src.updatedAt,
    };
  },
  async deleteService(id: string): Promise<void> { await knowledgeRepo.deleteSource(id); },

  async listWebsiteImports(): Promise<KWebsiteImport[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(
      await sb.from("agent_knowledge_sources").select("*").eq("org_id", orgId).eq("kind", "url")
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id, rootUrl: r.source_url ?? r.name,
      mode: r.content?.mode ?? "homepage",
      pages: r.content?.pages ?? [],
      status: r.status, createdAt: r.uploaded_at,
      collectionId: r.collection_id ?? "",
    }));
  },
  async createWebsiteImport(input: Partial<KWebsiteImport> & { rootUrl: string; mode: KWebsiteImport["mode"]; collectionId: string }): Promise<KWebsiteImport> {
    const src = await knowledgeRepo.createSource({
      name: input.rootUrl, kind: "url", collectionId: input.collectionId,
      sourceUrl: input.rootUrl, size: `${(input.pages ?? [input.rootUrl]).length} page(s)`,
      tags: ["web-import"], status: "processing",
      content: { mode: input.mode, pages: input.pages ?? [input.rootUrl] },
    } as any);
    return {
      id: src.id, rootUrl: input.rootUrl, mode: input.mode,
      pages: input.pages ?? [input.rootUrl], status: "processing",
      createdAt: src.uploadedAt, collectionId: input.collectionId,
    };
  },
  async deleteWebsiteImport(id: string): Promise<void> { await knowledgeRepo.deleteSource(id); },
};

// ─── dashboard KPIs (org-scoped) ───────────────────────────────────────
function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeek(d = new Date()) {
  const x = startOfDay(d); const day = x.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // week starts Monday
  x.setDate(x.getDate() - diff); return x;
}

export interface AgentKpis {
  conversationsToday: number;
  leadsThisWeek: number;
  appointmentsBooked: number;
  handoverRate: number;
  agents: { total: number; live: number; draft: number; paused: number };
  channels: Record<string, number>;
  recent: { id: string; kind: "message" | "lead" | "appointment"; text: string; at: string }[];
  usageThisMonth: number;
}

export const dashboardKpisRepo = {
  async load(): Promise<AgentKpis> {
    const orgId = await requireOrgId();
    const todayIso = startOfDay().toISOString();
    const weekIso = startOfWeek().toISOString();
    const monthIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [convToday, leadsWeek, apptsBooked, convForRate, agents, recentMsgs, recentLeads, recentAppts, usage] = await Promise.all([
      sb.from("agent_conversations").select("id, channel, updated_at").eq("org_id", orgId).gte("updated_at", todayIso),
      sb.from("agent_leads").select("id").eq("org_id", orgId).gte("created_at", weekIso),
      sb.from("agent_appointments").select("id").eq("org_id", orgId).eq("status", "scheduled"),
      sb.from("agent_conversations").select("status").eq("org_id", orgId).gte("updated_at", weekIso),
      sb.from("agent_agents").select("status").eq("org_id", orgId),
      sb.from("agent_messages").select("id, text, at").eq("org_id", orgId).order("at", { ascending: false }).limit(4),
      sb.from("agent_leads").select("id, name, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(4),
      sb.from("agent_appointments").select("id, title, scheduled_at").eq("org_id", orgId).order("scheduled_at", { ascending: false }).limit(4),
      sb.from("agent_usage_events").select("units").eq("org_id", orgId).gte("created_at", monthIso),
    ]);

    const channels: Record<string, number> = {};
    for (const c of (convToday.data ?? [])) channels[c.channel] = (channels[c.channel] ?? 0) + 1;

    const totalWeek = (convForRate.data ?? []).length;
    const handedOver = (convForRate.data ?? []).filter((c: any) => c.status === "human" || c.status === "handover" || c.status === "escalated").length;
    const handoverRate = totalWeek > 0 ? Math.round((handedOver / totalWeek) * 100) : 0;

    const agentRows = agents.data ?? [];
    const agentCounts = {
      total: agentRows.length,
      live: agentRows.filter((a: any) => a.status === "live").length,
      draft: agentRows.filter((a: any) => a.status === "draft").length,
      paused: agentRows.filter((a: any) => a.status === "paused").length,
    };

    const recent = [
      ...(recentMsgs.data ?? []).map((r: any) => ({ id: r.id, kind: "message" as const, text: r.text?.slice(0, 90) ?? "", at: r.at })),
      ...(recentLeads.data ?? []).map((r: any) => ({ id: r.id, kind: "lead" as const, text: `New lead — ${r.name}`, at: r.created_at })),
      ...(recentAppts.data ?? []).map((r: any) => ({ id: r.id, kind: "appointment" as const, text: `Appointment — ${r.title}`, at: r.scheduled_at })),
    ].sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 6);

    const usageThisMonth = (usage.data ?? []).reduce((sum: number, u: any) => sum + (u.units ?? 0), 0);

    return {
      conversationsToday: (convToday.data ?? []).length,
      leadsThisWeek: (leadsWeek.data ?? []).length,
      appointmentsBooked: (apptsBooked.data ?? []).length,
      handoverRate,
      agents: agentCounts,
      channels,
      recent,
      usageThisMonth,
    };
  },
};

// ─── workflows ─────────────────────────────────────────────────────────
export const workflowsRepo = {
  async list(): Promise<Workflow[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(
      await sb.from("agent_workflows").select("*").eq("org_id", orgId).order("created_at", { ascending: false })
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id, name: r.name, trigger: r.trigger ?? "",
      steps: Array.isArray(r.steps) ? r.steps.length : 0,
      runs: r.runs ?? 0, status: r.status, updatedAt: r.updated_at,
    }));
  },
};

// ─── integrations ──────────────────────────────────────────────────────
export const integrationsRepo = {
  async list(): Promise<Integration[]> {
    const orgId = await requireOrgId();
    const rows = unwrap(
      await sb.from("agent_integrations").select("*").eq("org_id", orgId).order("name")
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id, name: r.name, category: r.category,
      connected: r.connected, icon: r.icon ?? "Plug",
      description: r.description ?? "",
    }));
  },
  async setConnected(id: string, connected: boolean): Promise<void> {
    const r = await sb.from("agent_integrations").update({
      connected, connected_at: connected ? new Date().toISOString() : null,
    }).eq("id", id);
    if (r.error) throw r.error;
  },
};

// ─── usage + audit (append-only) ───────────────────────────────────────
export const usageRepo = {
  async record(eventType: string, units = 1, meta: Record<string, unknown> = {}, agentId?: string, conversationId?: string) {
    const orgId = await requireOrgId();
    await sb.from("agent_usage_events").insert({
      org_id: orgId, event_type: eventType, units, meta,
      agent_id: agentId ?? null, conversation_id: conversationId ?? null,
    });
  },
};

export const auditRepo = {
  async log(action: string, entityType: string, entityId?: string, oldData?: unknown, newData?: unknown) {
    const orgId = await requireOrgId();
    const userId = await currentUserId();
    await sb.from("agent_audit_logs").insert({
      org_id: orgId, actor_user_id: userId, action, entity_type: entityType,
      entity_id: entityId ?? null,
      old_data: (oldData ?? null) as any, new_data: (newData ?? null) as any,
    });
  },
};

// ─── unified adapter with same shape as the mock `db` ──────────────────
export const dbRemote = {
  agents: agentsRepo,
  agentConfigs: agentConfigsRepo,
  conversations: conversationsRepo,
  leads: leadsRepo,
  appointments: appointmentsRepo,
  calls: callsRepo,
  knowledge: knowledgeRepo,
  workflows: workflowsRepo,
  integrations: integrationsRepo,
  usage: usageRepo,
  audit: auditRepo,
  kpis: dashboardKpisRepo,
};

export type DbRemote = typeof dbRemote;