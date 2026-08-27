// Voice provider webhook receiver. Public endpoint (no JWT) — authenticity is
// checked with the shared secret when VAPI_WEBHOOK_SECRET is configured.
// Processing is idempotent: calls upsert on vapi_call_id.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-vapi-secret, x-vapi-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("VAPI_WEBHOOK_SECRET");
  if (expected) {
    const provided = req.headers.get("x-vapi-secret") ?? "";
    if (provided !== expected) {
      console.error("webhook rejected: bad secret");
      return json({ error: "unauthorized" }, 401);
    }
  }

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const msg = payload?.message ?? payload;
  const type = String(msg?.type ?? "");
  const call = msg?.call ?? {};
  const assistantId = call?.assistantId ?? msg?.assistant?.id ?? null;
  if (!assistantId || !call?.id) return json({ ok: true, ignored: true });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: agent } = await db
    .from("agent_agents")
    .select("id, org_id")
    .eq("vapi_assistant_id", assistantId)
    .maybeSingle();
  if (!agent) return json({ ok: true, ignored: "unknown_assistant" });

  const artifact = msg?.artifact ?? {};
  const startedAt = call.startedAt ?? msg?.startedAt ?? null;
  const endedAt = call.endedAt ?? msg?.endedAt ?? null;

  const row: Record<string, unknown> = {
    org_id: agent.org_id,
    agent_id: agent.id,
    vapi_call_id: call.id,
    direction: String(call.type ?? "").includes("outbound") ? "outbound" : "inbound",
    caller_id: call.customer?.number ?? null,
    destination: call.phoneNumber?.number ?? null,
    status: type === "status-update" ? (msg.status ?? call.status ?? null) : (call.status ?? null),
    started_at: startedAt,
    ended_at: endedAt,
  };
  if (type === "end-of-call-report") {
    row.status = "ended";
    row.outcome = msg.endedReason ?? null;
    row.cost = msg.cost ?? null;
    row.recording_url = msg.recordingUrl ?? artifact.recordingUrl ?? null;
    row.transcript = msg.transcript ?? artifact.transcript ?? null;
    row.duration_sec = msg.durationSeconds
      ? Math.round(Number(msg.durationSeconds))
      : (startedAt && endedAt ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000) : null);
    row.meta = { messages: artifact.messages ?? msg.messages ?? [], analysis: msg.analysis ?? null };
  }

  // Drop nulls so a later partial event can't erase data from an earlier one.
  for (const k of Object.keys(row)) if (row[k] === null || row[k] === undefined) delete row[k];
  row.org_id = agent.org_id; row.agent_id = agent.id; row.vapi_call_id = call.id;

  const { error } = await db.from("agent_calls").upsert(row, { onConflict: "vapi_call_id" });
  if (error) {
    console.error("webhook upsert failed", call.id, error.message);
    return json({ error: "persist_failed" }, 500);
  }
  return json({ ok: true, type });
});
