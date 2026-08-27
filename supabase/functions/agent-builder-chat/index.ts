// Conversational Agent Builder skill.
// One turn of the prompt-first builder: takes the user's message, infers what
// is already known, asks only what is missing, and returns the merged agent
// configuration. Thread + messages + config are persisted server-side.
//
// Request:  { threadId?, text, skill? }
// Response: { threadId, title, reply, config, missing[], ready, status }

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

// Registry so more Yangu skills can be added later without a new interface.
const SKILLS: Record<string, { label: string; instructions: string }> = {
  agent_builder: {
    label: "Agent Builder",
    instructions: `You configure AI voice/chat agents for businesses.

Required before an agent is ready:
- businessName, agentName, type (inbound|outbound|support), purpose, languages (array), greeting, hours, appointments (boolean), escalation.
Optional but useful: products, targetCustomers, timezone, voice, transferNumber, qualificationQuestions (array of strings), faqs (array of {q,a}), objectives, prohibited, fallback, outcome.

Rules:
- INFER aggressively from what the user already wrote. Never re-ask something already stated or clearly implied.
- Ask ONE short question per turn, only for missing required fields, in the order listed.
- For simple agents keep setup fast; ask deeper questions only when the user describes something sophisticated.
- Never mention providers, APIs, JSON, models or webhooks.
- When every required field is known, set ready=true and reply with a one-sentence confirmation that the agent is ready to test.`,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = await requireUser(req, corsHeaders);
  if (gate.response) return gate.response;
  const userId = gate.user!.id;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const text = String(body?.text ?? "").trim();
  if (!text) return json({ error: "empty_text" }, 400);
  const skill = SKILLS[String(body?.skill ?? "agent_builder")] ?? SKILLS.agent_builder;

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Resolve the caller's org.
  const { data: mem } = await db.from("org_memberships").select("org_id").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  let orgId = mem?.org_id as string | undefined;
  if (!orgId) {
    const { data: own } = await db.from("orgs").select("id").eq("owner_user_id", userId).limit(1).maybeSingle();
    orgId = own?.id;
  }
  if (!orgId) return json({ error: "no_org", message: "No workspace found for this account." }, 400);

  // Load or create the thread (ownership enforced explicitly).
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
    .select("role, content").eq("thread_id", thread.id).order("created_at").limit(40);

  await db.from("agent_thread_messages").insert({
    thread_id: thread.id, org_id: orgId, role: "user", content: text,
  });

  const system = `You are Yangu, an AI operating platform. The active skill is "${skill.label}".
${skill.instructions}

Current known configuration (JSON): ${JSON.stringify(thread.config ?? {})}

Reply with ONLY a JSON object, no markdown fences:
{"reply":"your next message to the user","config":{merged full configuration},"missing":["fieldNames"],"ready":true|false,"title":"short thread title"}`;

  const messages = [
    { role: "system", content: system },
    ...(history ?? []).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    { role: "user", content: text },
  ];

  let aiRes: Response;
  try {
    aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.4 }),
    });
  } catch (e) {
    console.error("gateway network failure", e);
    return json({ error: "ai_unavailable", message: "Yangu AI is unreachable right now. Your conversation is saved." }, 503);
  }
  if (!aiRes.ok) {
    const detail = await aiRes.text();
    console.error("gateway error", aiRes.status, detail.slice(0, 300));
    const message = aiRes.status === 429
      ? "Yangu AI is busy. Please try again in a moment."
      : aiRes.status === 402
      ? "AI credits are exhausted for this workspace. Add credits to continue."
      : "Yangu AI could not respond. Your conversation is saved.";
    return json({ error: "ai_error", message }, aiRes.status === 429 ? 429 : 502);
  }

  const raw = (await aiRes.json())?.choices?.[0]?.message?.content ?? "";
  let parsed: any = null;
  try {
    parsed = JSON.parse(String(raw).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());
  } catch {
    parsed = { reply: String(raw).slice(0, 1200), config: thread.config ?? {}, missing: [], ready: false };
  }

  const config = typeof parsed.config === "object" && parsed.config ? parsed.config : (thread.config ?? {});
  const ready = Boolean(parsed.ready);
  const reply = String(parsed.reply ?? "").trim() || "Could you tell me a little more?";
  const title = String(parsed.title ?? thread.title ?? "Agent setup").slice(0, 80);
  const status = ready ? "ready" : "gathering";

  await db.from("agent_thread_messages").insert({
    thread_id: thread.id, org_id: orgId, role: "assistant", content: reply,
    metadata: { skill: skill.label, missing: parsed.missing ?? [], ready },
  });
  await db.from("agent_threads").update({ config, status, title }).eq("id", thread.id);

  return json({
    threadId: thread.id, title, reply, config,
    missing: Array.isArray(parsed.missing) ? parsed.missing : [],
    ready, status, skill: skill.label,
  });
});
