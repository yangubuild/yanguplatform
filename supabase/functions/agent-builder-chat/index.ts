// Yangu AI Agents — Composer skill router.
//
// One conversational turn of the Composer. The router classifies the user's
// intent into an internal skill, loads the real org-scoped data that skill
// needs, and returns a reply plus an optional inline UI payload the client
// renders inside the conversation.
//
// Skills: agent_builder, agent_manager, call_manager, campaign_manager,
// knowledge_manager, lead_manager, appointment_manager, analytics,
// phone_number_manager, troubleshooting.
//
// Request:  { threadId?, text, skill? }
// Response: { threadId, title, reply, skill, skillLabel, ui, config, missing[], ready, status }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

const SKILL_LABELS: Record<string, string> = {
  agent_builder: "Agent Builder",
  agent_manager: "Agent Manager",
  call_manager: "Call Manager",
  campaign_manager: "Campaign Manager",
  knowledge_manager: "Knowledge Manager",
  lead_manager: "Lead Manager",
  appointment_manager: "Appointment Manager",
  analytics: "Analytics",
  phone_number_manager: "Phone Number Manager",
  troubleshooting: "Call Analysis",
};

const BUILDER_INSTRUCTIONS = `You configure AI voice/chat agents for businesses.

Required before an agent is ready:
- businessName, agentName, type (inbound|outbound|support), purpose, languages (array), greeting, hours, appointments (boolean), escalation.
Optional but useful: products, targetCustomers, timezone, voice, transferNumber, qualificationQuestions (array of strings), faqs (array of {q,a}), objectives, prohibited, fallback, outcome.

Rules:
- INFER aggressively from what the user already wrote. Never re-ask something already stated or clearly implied.
- Ask ONE short question per turn, only for missing required fields, in the order listed.
- Never mention providers, APIs, JSON, models or webhooks.
- When every required field is known, set ready=true and reply with a one-sentence confirmation that the agent is ready to test.`;

async function callGateway(messages: unknown[], temperature = 0.3) {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("gateway error", res.status, detail.slice(0, 300));
    const message = res.status === 429
      ? "Yangu AI is busy. Please try again in a moment."
      : res.status === 402
      ? "AI credits are exhausted for this workspace. Add credits to continue."
      : "Yangu AI could not respond. Your conversation is saved.";
    throw { status: res.status, message };
  }
  return String((await res.json())?.choices?.[0]?.message?.content ?? "");
}

function parseJson(raw: string): any {
  try {
    return JSON.parse(raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* ignore */ } }
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = await requireUser(req, corsHeaders);
  if (gate.response) return gate.response;
  const userId = gate.user!.id;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const text = String(body?.text ?? "").trim();
  if (!text) return json({ error: "empty_text" }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: mem } = await db.from("org_memberships").select("org_id").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  let orgId = mem?.org_id as string | undefined;
  if (!orgId) {
    const { data: own } = await db.from("orgs").select("id").eq("owner_user_id", userId).limit(1).maybeSingle();
    orgId = own?.id;
  }
  if (!orgId) return json({ error: "no_org", message: "No workspace found for this account." }, 400);

  // Thread (ownership enforced explicitly).
  let thread: any;
  if (body?.threadId) {
    const { data } = await db.from("agent_threads").select("*").eq("id", body.threadId).maybeSingle();
    if (!data || data.org_id !== orgId) return json({ error: "thread_not_found" }, 404);
    thread = data;
  } else {
    const { data, error } = await db.from("agent_threads").insert({
      org_id: orgId, user_id: userId, title: text.slice(0, 60), status: "gathering", config: {},
    }).select().single();
    if (error) return json({ error: "thread_create_failed" }, 500);
    thread = data;
  }

  const { data: history } = await db.from("agent_thread_messages")
    .select("role, content, metadata").eq("thread_id", thread.id).order("created_at").limit(30);

  await db.from("agent_thread_messages").insert({
    thread_id: thread.id, org_id: orgId, role: "user", content: text,
  });

  const config = (thread.config ?? {}) as Record<string, unknown>;
  const threadContext = (config.__context ?? {}) as Record<string, unknown>;

  // Agents in this workspace — used for routing (name resolution) and results.
  const { data: agentRows } = await db.from("agent_agents")
    .select("id, name, type, status, phone_number, description, voice, language, deployed_at")
    .eq("org_id", orgId).order("created_at", { ascending: false }).limit(50);
  const agents = agentRows ?? [];

  // ─── 1. Route ────────────────────────────────────────────────────────
  let skill = typeof body?.skill === "string" && SKILL_LABELS[body.skill] ? body.skill : "";
  let params: Record<string, any> = {};

  if (!skill) {
    const routeSystem = `You are the Yangu AI Agents intent router. Pick exactly ONE skill for the user's latest message.

Skills:
- agent_builder: creating a new AI employee/agent, or continuing an in-progress agent setup conversation.
- agent_manager: list/open agents, change an existing agent's greeting, voice, languages, pause/resume it.
- call_manager: see calls, place a call to someone, review call history/recordings/transcripts.
- campaign_manager: call many customers, outbound campaigns, follow up with a list.
- knowledge_manager: give an agent business knowledge, documents, FAQs.
- lead_manager: leads, interested customers, contacts captured by agents.
- appointment_manager: bookings, appointments, scheduling someone.
- analytics: performance, metrics, how agents are doing.
- phone_number_manager: give an agent a phone number, connect/import a number.
- troubleshooting: why a call failed, diagnose problems.

Context:
- Agents in this workspace: ${agents.map((a: any) => `${a.name} (${a.type}, ${a.status})`).join("; ") || "none"}
- Active thread skill so far: ${config.__skill ?? "none"}
- Thread context (carry over when the user is vague): ${JSON.stringify(threadContext)}
- Agent setup in progress: ${config.agentName || config.businessName ? "yes" : "no"}

If the message continues the previous skill's conversation, keep that skill.

Reply with ONLY JSON:
{"skill":"...","agentName":"exact agent name if referenced else null","personName":"person to call if any else null","purpose":"short call purpose if any else null","timeframe":"today|yesterday|week|all","filter":"failed|unhappy|no_answer|interested|none"}`;

    try {
      const routed = parseJson(await callGateway([
        { role: "system", content: routeSystem },
        ...(history ?? []).slice(-6).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        { role: "user", content: text },
      ], 0));
      skill = SKILL_LABELS[routed?.skill] ? routed.skill : "agent_builder";
      params = routed ?? {};
    } catch (e: any) {
      return json({ error: "ai_error", message: e?.message ?? "Yangu AI could not respond." }, e?.status === 429 ? 429 : 502);
    }
  }

  const label = SKILL_LABELS[skill];
  const matchAgent = () => {
    const n = String(params.agentName ?? threadContext.agentName ?? "").toLowerCase();
    if (!n || n === "null") return agents[0] ?? null;
    return agents.find((a: any) => a.name.toLowerCase() === n)
      ?? agents.find((a: any) => a.name.toLowerCase().includes(n)) ?? agents[0] ?? null;
  };
  const sinceFor = (tf: string) => {
    const d = new Date();
    if (tf === "today") d.setHours(0, 0, 0, 0);
    else if (tf === "yesterday") d.setDate(d.getDate() - 1);
    else if (tf === "week") d.setDate(d.getDate() - 7);
    else d.setFullYear(d.getFullYear() - 5);
    return d.toISOString();
  };

  let reply = "";
  let ui: any = null;
  let nextConfig: Record<string, unknown> = { ...config, __skill: skill };
  let ready = Boolean(config.__ready);
  let missing: string[] = [];
  let title = thread.title;

  try {
    if (skill === "agent_builder") {
      const system = `You are Yangu, an AI operating platform. The active skill is "Agent Builder".
${BUILDER_INSTRUCTIONS}

Current known configuration (JSON): ${JSON.stringify(config)}

Reply with ONLY a JSON object, no markdown fences:
{"reply":"your next message to the user","config":{merged full configuration},"missing":["fieldNames"],"ready":true|false,"title":"short thread title"}`;
      const parsed = parseJson(await callGateway([
        { role: "system", content: system },
        ...(history ?? []).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        { role: "user", content: text },
      ], 0.4)) ?? {};
      const merged = typeof parsed.config === "object" && parsed.config ? parsed.config : config;
      nextConfig = { ...merged, __skill: skill, __context: threadContext };
      ready = Boolean(parsed.ready);
      nextConfig.__ready = ready;
      missing = Array.isArray(parsed.missing) ? parsed.missing : [];
      reply = String(parsed.reply ?? "").trim() || "Could you tell me a little more?";
      title = String(parsed.title ?? thread.title ?? "Agent setup").slice(0, 80);
      if (ready) ui = { type: "agent_ready", config: merged };
    } else if (skill === "agent_manager") {
      const wantsList = /\b(list|show|all|my|which|overview)\b/i.test(text) && !params.agentName;
      if (wantsList || agents.length === 0) {
        reply = agents.length
          ? `You have ${agents.length} AI ${agents.length === 1 ? "employee" : "employees"}.`
          : "You don't have any AI employees yet. Tell me what you need — for example \"create a receptionist for my hotel\" — and I'll build one.";
        ui = agents.length ? { type: "agent_list", agents } : null;
      } else {
        const a = matchAgent();
        if (!a) {
          reply = "I couldn't find that agent. Which one did you mean?";
        } else {
          nextConfig.__context = { ...threadContext, agentName: a.name, agentId: a.id };
          if (/voice/i.test(text)) {
            reply = `Pick a voice for ${a.name} — you can preview the change before it goes live.`;
            ui = { type: "voice_selector", agent: a };
          } else if (/greeting|first message|say when|opening/i.test(text)) {
            reply = `Here's ${a.name}'s greeting. Edit it and I'll push it live.`;
            ui = { type: "greeting_editor", agent: a, greeting: String(config.greeting ?? "") };
          } else if (/pause|stop|disable/i.test(text)) {
            reply = `Pause ${a.name}? It will stop answering until you resume it.`;
            ui = { type: "agent_run_state", agent: a, next: "pause" };
          } else if (/resume|activate|start|enable/i.test(text)) {
            reply = `Resume ${a.name} so it starts handling conversations again?`;
            ui = { type: "agent_run_state", agent: a, next: "resume" };
          } else if (/language|arabic|english|speak/i.test(text)) {
            reply = `Choose the languages ${a.name} should speak.`;
            ui = { type: "language_selector", agent: a };
          } else {
            reply = `Here's ${a.name}.`;
            ui = { type: "agent_list", agents: [a] };
          }
        }
      }
    } else if (skill === "call_manager" || skill === "troubleshooting") {
      const placing = /^(call|ring|dial|phone)\b/i.test(text) || (params.personName && params.personName !== "null");
      if (placing && skill === "call_manager") {
        const a = agents.find((x: any) => x.type === "outbound" && x.status === "live") ?? matchAgent();
        reply = a
          ? "Review the call before I place it."
          : "You'll need a live agent before I can place calls. Want me to build one?";
        ui = a
          ? {
            type: "call_confirm",
            agent: a,
            person: params.personName && params.personName !== "null" ? params.personName : "",
            purpose: params.purpose && params.purpose !== "null" ? params.purpose : "",
            fromNumber: a.phone_number ?? null,
          }
          : null;
      } else {
        const tf = String(params.timeframe ?? "week");
        let q = db.from("agent_calls")
          .select("id, agent_id, direction, caller_id, destination, status, outcome, duration_sec, cost, recording_url, transcript, started_at")
          .eq("org_id", orgId).gte("started_at", sinceFor(tf))
          .order("started_at", { ascending: false }).limit(25);
        const a = params.agentName && params.agentName !== "null" ? matchAgent() : null;
        if (a) q = q.eq("agent_id", a.id);
        if (skill === "troubleshooting" || params.filter === "failed") q = q.in("status", ["failed", "no-answer", "busy", "error"]);
        const { data: calls } = await q;
        const rows = calls ?? [];
        if (skill === "troubleshooting") {
          if (!rows.length) {
            reply = "No failed calls in that period — everything your agents attempted connected.";
          } else {
            const summary = await callGateway([
              { role: "system", content: "You are Yangu. In 2-4 short sentences, explain in plain business language why these calls did not succeed and what the owner should do. Never mention providers, APIs or internal fields." },
              { role: "user", content: JSON.stringify(rows.map((r: any) => ({ status: r.status, outcome: r.outcome, seconds: r.duration_sec, at: r.started_at }))) },
            ], 0.3);
            reply = summary.trim();
          }
          ui = rows.length ? { type: "call_list", calls: rows, agents } : null;
        } else {
          reply = rows.length
            ? `${rows.length} call${rows.length === 1 ? "" : "s"}${a ? ` for ${a.name}` : ""} in that period.`
            : "No calls recorded in that period yet. Once your agents start talking to customers their calls appear here — or I can place a test call.";
          ui = rows.length ? { type: "call_list", calls: rows, agents } : null;
        }
        if (a) nextConfig.__context = { ...threadContext, agentName: a.name, agentId: a.id };
      }
    } else if (skill === "campaign_manager") {
      const outbound = agents.filter((a: any) => a.type === "outbound");
      const { data: numbers } = await db.from("agent_phone_numbers")
        .select("id, number, label, status, agent_id").eq("org_id", orgId).limit(20);
      const { data: leads } = await db.from("agent_leads")
        .select("id, name, phone, intent, score, stage").eq("org_id", orgId).not("phone", "is", null)
        .order("created_at", { ascending: false }).limit(50);
      const callable = (outbound.length ? outbound : agents).filter((a: any) => a.status === "live" && a.phone_number);
      reply = callable.length
        ? "Pick who to call and I'll dial them one at a time — nothing happens until you launch."
        : agents.length
        ? "To run an outbound campaign you need a live agent with its own number. I can set that up — say \"give <agent> a number\"."
        : "You'll need an outbound agent first. Tell me who you want called and why, and I'll build the agent.";
      ui = {
        type: "campaign_form",
        agents: callable,
        numbers: numbers ?? [],
        contacts: leads ?? [],
        draft: {
          name: String(params.purpose && params.purpose !== "null" ? params.purpose : "").slice(0, 60) || "New campaign",
          objective: params.purpose && params.purpose !== "null" ? params.purpose : "",
        },
      };

    } else if (skill === "knowledge_manager") {
      const a = matchAgent();
      const { data: sources } = await db.from("agent_knowledge_sources")
        .select("id, name, kind, status, created_at").eq("org_id", orgId)
        .order("created_at", { ascending: false }).limit(10);
      reply = a
        ? `Add business knowledge for ${a.name} — paste text, add a document or point me at your website.`
        : "Add the business knowledge your agents should use when answering customers.";
      ui = { type: "knowledge_panel", agent: a, sources: sources ?? [] };
      if (a) nextConfig.__context = { ...threadContext, agentName: a.name, agentId: a.id };
    } else if (skill === "lead_manager") {
      const tf = String(params.timeframe ?? "week");
      let q = db.from("agent_leads").select("id, name, email, phone, intent, score, stage, source, created_at")
        .eq("org_id", orgId).gte("created_at", sinceFor(tf))
        .order("created_at", { ascending: false }).limit(25);
      if (params.filter === "interested") q = q.gte("score", 50);
      const { data: leads } = await q;
      const rows = leads ?? [];
      reply = rows.length
        ? `${rows.length} lead${rows.length === 1 ? "" : "s"} captured in that period.`
        : "No leads captured yet. Leads appear automatically once your agents qualify customers on calls or chat.";
      ui = rows.length ? { type: "lead_list", leads: rows } : null;
    } else if (skill === "appointment_manager") {
      const { data: appts } = await db.from("agent_appointments")
        .select("id, title, contact_name, channel, scheduled_at, duration_min, status")
        .eq("org_id", orgId).order("scheduled_at", { ascending: true }).limit(25);
      const rows = appts ?? [];
      reply = rows.length
        ? `${rows.length} appointment${rows.length === 1 ? "" : "s"} on the books.`
        : "No appointments yet. Your agents can book them during calls once appointment booking is switched on.";
      ui = rows.length ? { type: "appointment_list", appointments: rows } : null;
    } else if (skill === "analytics") {
      const since = sinceFor(String(params.timeframe ?? "week"));
      const { data: calls } = await db.from("agent_calls")
        .select("id, agent_id, status, outcome, duration_sec, cost, started_at")
        .eq("org_id", orgId).gte("started_at", since).limit(1000);
      const rows = calls ?? [];
      const done = rows.filter((r: any) => ["completed", "ended"].includes(String(r.status)));
      const totals = {
        calls: rows.length,
        connected: done.length,
        minutes: Math.round(rows.reduce((s: number, r: any) => s + (r.duration_sec ?? 0), 0) / 60),
        cost: Number(rows.reduce((s: number, r: any) => s + Number(r.cost ?? 0), 0).toFixed(2)),
        failed: rows.filter((r: any) => ["failed", "no-answer", "busy", "error"].includes(String(r.status))).length,
        live: agents.filter((a: any) => a.status === "live").length,
      };
      reply = rows.length
        ? `Your agents handled ${totals.calls} calls (${totals.minutes} minutes) in that period.`
        : "There's no call activity to analyse yet. Deploy an agent and give it a number, and performance will show up here.";
      ui = { type: "analytics", totals, agents };
    } else if (skill === "phone_number_manager") {
      const a = matchAgent();
      const { data: numbers } = await db.from("agent_phone_numbers")
        .select("id, number, label, status, agent_id, provider").eq("org_id", orgId).limit(20);
      reply = a
        ? `Connect a number to ${a.name}. Nothing is bought without your confirmation.`
        : "Let's set up a business number. Nothing is bought without your confirmation.";
      ui = { type: "phone_numbers", agent: a, numbers: numbers ?? [], agents };
      if (a) nextConfig.__context = { ...threadContext, agentName: a.name, agentId: a.id };
    }
  } catch (e: any) {
    return json({ error: "ai_error", message: e?.message ?? "Yangu AI could not respond." }, e?.status === 429 ? 429 : 502);
  }

  if (!reply) reply = "I'm not sure what you'd like me to do — could you say that another way?";

  const status = ready ? "ready" : thread.status === "deployed" ? "deployed" : "gathering";
  if (!thread.title || thread.title === text.slice(0, 60)) title = title || text.slice(0, 60);

  await db.from("agent_thread_messages").insert({
    thread_id: thread.id, org_id: orgId, role: "assistant", content: reply,
    metadata: { skill, skillLabel: label, ui, missing, ready },
  });
  await db.from("agent_threads").update({ config: nextConfig, status, title }).eq("id", thread.id);

  return json({
    threadId: thread.id, title, reply, skill, skillLabel: label, ui,
    config: nextConfig, missing, ready, status,
  });
});
