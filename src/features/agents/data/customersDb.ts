/**
 * Customer Identity + Persistent Memory data layer.
 *
 * Canonical customer records live in the existing `agent_contacts` table
 * (extended in Phase 2) — no duplicate CRM system was created.
 * Identity matching, timeline reads and memory writes go through
 * organization-scoped security-definer RPCs so no client can bypass RLS.
 */

import { supabase } from "@/integrations/supabase/client";
import { requireOrgId } from "./repo/orgContext";

const sb = supabase as any;

function unwrap(res: { data: unknown; error: any }): any {
  if (res.error) throw res.error;
  return res.data;
}

export interface Customer {
  id: string;
  orgId: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  phoneE164: string | null;
  company: string | null;
  jobTitle: string | null;
  language: string | null;
  timezone: string | null;
  location: string | null;
  source: string | null;
  status: string;
  tags: string[];
  ownerUserId: string | null;
  channel: string | null;
  lastInteractionAt: string | null;
  consent: Record<string, unknown>;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerIdentity {
  id: string;
  identityType: string;
  identityValue: string;
  isVerified: boolean;
  source: string | null;
  createdAt: string;
}

export interface CustomerMemory {
  id: string;
  memoryType: string;
  memoryKey: string | null;
  content: string;
  confidence: number;
  sourceType: string | null;
  sourceId: string | null;
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerEvent {
  id: string;
  eventType: string;
  title: string | null;
  refType: string | null;
  refId: string | null;
  agentId: string | null;
  occurredAt: string;
}

export interface CustomerContext {
  customer: Record<string, unknown> | null;
  memories: Array<{ memory_type: string; memory_key: string | null; content: string; confidence: number; updated_at: string }>;
  recent_events: Array<{ event_type: string; title: string | null; ref_type: string | null; ref_id: string | null; occurred_at: string }>;
}

function rowToCustomer(r: any): Customer {
  return {
    id: r.id,
    orgId: r.org_id,
    name: r.name ?? null,
    firstName: r.first_name ?? null,
    lastName: r.last_name ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    phoneE164: r.phone_e164 ?? null,
    company: r.company ?? null,
    jobTitle: r.job_title ?? null,
    language: r.language ?? null,
    timezone: r.timezone ?? null,
    location: r.location ?? null,
    source: r.source ?? null,
    status: r.status ?? "active",
    tags: r.tags ?? [],
    ownerUserId: r.owner_user_id ?? null,
    channel: r.channel ?? null,
    lastInteractionAt: r.last_interaction_at ?? null,
    consent: r.consent ?? {},
    customFields: r.custom_fields ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const customersRepo = {
  async list(search?: string): Promise<Customer[]> {
    const orgId = await requireOrgId();
    let q = sb
      .from("agent_contacts")
      .select("*")
      .eq("org_id", orgId)
      .order("last_interaction_at", { ascending: false, nullsFirst: false })
      .limit(200);
    const term = search?.trim();
    if (term) {
      const like = `%${term}%`;
      q = q.or(
        `name.ilike.${like},email.ilike.${like},phone.ilike.${like},company.ilike.${like}`,
      );
    }
    return ((await q.then(unwrap)) ?? []).map(rowToCustomer);
  },

  async get(id: string): Promise<Customer | null> {
    const row = unwrap(await sb.from("agent_contacts").select("*").eq("id", id).maybeSingle());
    return row ? rowToCustomer(row) : null;
  },

  async update(id: string, patch: Partial<Customer>): Promise<Customer> {
    const payload: Record<string, unknown> = {};
    const map: Record<string, string> = {
      name: "name", firstName: "first_name", lastName: "last_name",
      email: "email", phone: "phone", company: "company", jobTitle: "job_title",
      language: "language", timezone: "timezone", location: "location",
      source: "source", status: "status", tags: "tags", ownerUserId: "owner_user_id",
      consent: "consent", customFields: "custom_fields",
    };
    for (const [k, col] of Object.entries(map)) {
      if (k in patch) payload[col] = (patch as any)[k];
    }
    const row = unwrap(
      await sb.from("agent_contacts").update(payload).eq("id", id).select("*").maybeSingle(),
    );
    return rowToCustomer(row);
  },

  /** Deterministic identity resolution — phone/email only, never name alone. */
  async resolve(input: { phone?: string | null; email?: string | null; name?: string | null; channel?: string | null }): Promise<string | null> {
    const orgId = await requireOrgId();
    const { data, error } = await sb.rpc("agent_resolve_customer_for_org", {
      p_org_id: orgId,
      p_phone: input.phone ?? null,
      p_email: input.email ?? null,
      p_name: input.name ?? null,
      p_channel: input.channel ?? null,
    });
    if (error) throw error;
    return (data as string) ?? null;
  },

  async identities(customerId: string): Promise<CustomerIdentity[]> {
    const rows = unwrap(
      await sb
        .from("agent_customer_identities")
        .select("*")
        .eq("contact_id", customerId)
        .order("created_at", { ascending: true }),
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      identityType: r.identity_type,
      identityValue: r.identity_value,
      isVerified: !!r.is_verified,
      source: r.source ?? null,
      createdAt: r.created_at,
    }));
  },

  async timeline(customerId: string, limit = 100): Promise<CustomerEvent[]> {
    const rows = unwrap(
      await sb
        .from("agent_customer_events")
        .select("*")
        .eq("contact_id", customerId)
        .order("occurred_at", { ascending: false })
        .limit(limit),
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      eventType: r.event_type,
      title: r.title ?? null,
      refType: r.ref_type ?? null,
      refId: r.ref_id ?? null,
      agentId: r.agent_id ?? null,
      occurredAt: r.occurred_at,
    }));
  },

  async memories(customerId: string): Promise<CustomerMemory[]> {
    const rows = unwrap(
      await sb
        .from("agent_customer_memories")
        .select("*")
        .eq("contact_id", customerId)
        .order("updated_at", { ascending: false }),
    );
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      memoryType: r.memory_type,
      memoryKey: r.memory_key ?? null,
      content: r.content,
      confidence: Number(r.confidence ?? 0),
      sourceType: r.source_type ?? null,
      sourceId: r.source_id ?? null,
      agentId: r.agent_id ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async saveMemory(input: {
    customerId: string;
    memoryType: string;
    content: string;
    memoryKey?: string | null;
    confidence?: number;
    sourceType?: string | null;
    sourceId?: string | null;
    agentId?: string | null;
  }): Promise<string> {
    const { data, error } = await sb.rpc("agent_save_customer_memory", {
      p_contact_id: input.customerId,
      p_memory_type: input.memoryType,
      p_content: input.content,
      p_memory_key: input.memoryKey ?? null,
      p_confidence: input.confidence ?? 0.7,
      p_source_type: input.sourceType ?? "manual",
      p_source_id: input.sourceId ?? null,
      p_agent_id: input.agentId ?? null,
    });
    if (error) throw error;
    return data as string;
  },

  async deleteMemory(memoryId: string): Promise<void> {
    const { error } = await sb.rpc("agent_delete_customer_memory", { p_memory_id: memoryId });
    if (error) throw error;
  },

  /** Relevance + recency limited context for agent prompts. Never a full dump. */
  async context(customerId: string, memoryLimit = 8, eventLimit = 10): Promise<CustomerContext | null> {
    const { data, error } = await sb.rpc("agent_get_customer_context", {
      p_contact_id: customerId,
      p_memory_limit: memoryLimit,
      p_event_limit: eventLimit,
    });
    if (error) throw error;
    return (data as CustomerContext) ?? null;
  },

  async calls(customerId: string): Promise<any[]> {
    return (
      unwrap(
        await sb
          .from("agent_calls")
          .select("*")
          .eq("contact_id", customerId)
          .order("started_at", { ascending: false }),
      ) ?? []
    );
  },

  async conversations(customerId: string): Promise<any[]> {
    return (
      unwrap(
        await sb
          .from("agent_conversations")
          .select("*")
          .eq("contact_id", customerId)
          .order("created_at", { ascending: false }),
      ) ?? []
    );
  },

  async appointments(customerId: string): Promise<any[]> {
    return (
      unwrap(
        await sb
          .from("agent_appointments")
          .select("*")
          .eq("contact_id", customerId)
          .order("scheduled_at", { ascending: false }),
      ) ?? []
    );
  },
};

/**
 * Builds a short, human-readable context block an agent can be given.
 * Returns an empty string when nothing genuine is stored — the agent must
 * never be handed fabricated history.
 */
export function formatCustomerContext(ctx: CustomerContext | null): string {
  if (!ctx?.customer) return "";
  const lines: string[] = [];
  const c = ctx.customer as Record<string, any>;
  const ident = [c.name, c.company && `at ${c.company}`, c.job_title].filter(Boolean).join(" ");
  if (ident) lines.push(`Known customer: ${ident}.`);
  if (ctx.memories?.length) {
    lines.push("Known facts:");
    for (const m of ctx.memories) lines.push(`- [${m.memory_type}] ${m.content}`);
  }
  if (ctx.recent_events?.length) {
    lines.push("Recent activity:");
    for (const e of ctx.recent_events.slice(0, 5)) {
      lines.push(`- ${new Date(e.occurred_at).toISOString().slice(0, 16).replace("T", " ")} ${e.title ?? e.event_type}`);
    }
  }
  return lines.join("\n");
}
