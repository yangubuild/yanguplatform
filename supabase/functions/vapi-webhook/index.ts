// Voice provider webhook receiver. Public endpoint (no JWT) — authenticity is
// enforced with the shared secret VAPI_WEBHOOK_SECRET, which is also written
// onto every assistant's server configuration when an agent is deployed.
// Processing is idempotent: calls upsert on vapi_call_id.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-vapi-secret, x-vapi-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Constant-time string comparison — avoids leaking the secret via timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/** Redacted description of the caller, for rejection logs only. */
function requestFingerprint(req: Request) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: (req.headers.get("user-agent") ?? "").slice(0, 120),
    secretHeaderPresent: Boolean(req.headers.get("x-vapi-secret")),
  };
}

/** Pull the useful, structured bits out of the provider's analysis payload. */
function parseAnalysis(msg: any) {
  const analysis = msg?.analysis ?? {};
  const structured = analysis.structuredData ?? {};
  const rawSentiment = String(
    structured.sentiment ?? structured.customerSentiment ?? analysis.sentiment ?? "",
  ).toLowerCase();
  const sentiment = ["positive", "neutral", "negative"].includes(rawSentiment) ? rawSentiment : null;
  const summary = typeof analysis.summary === "string" ? analysis.summary
    : typeof msg?.summary === "string" ? msg.summary : null;
  return {
    summary,
    sentiment,
    successEvaluation: analysis.successEvaluation ?? null,
    structuredData: Object.keys(structured).length ? structured : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("VAPI_WEBHOOK_SECRET");
  if (!expected) {
    // Fail closed: an unverifiable webhook is never processed.
    console.error("webhook rejected: VAPI_WEBHOOK_SECRET is not configured");
    return json({ error: "not_configured" }, 503);
  }
  const provided = req.headers.get("x-vapi-secret") ?? "";
  if (!provided || !safeEqual(provided, expected)) {
    console.warn("webhook rejected: invalid shared secret", requestFingerprint(req));
    return json({ error: "unauthorized" }, 401);
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
    const parsed = parseAnalysis(msg);
    row.status = "ended";
    row.outcome = msg.endedReason ?? null;
    row.cost = msg.cost ?? null;
    row.recording_url = msg.recordingUrl ?? artifact.recordingUrl ?? null;
    row.transcript = msg.transcript ?? artifact.transcript ?? null;
    row.duration_sec = msg.durationSeconds
      ? Math.round(Number(msg.durationSeconds))
      : (startedAt && endedAt ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000) : null);
    row.meta = {
      messages: artifact.messages ?? msg.messages ?? [],
      analysis: msg.analysis ?? null,
      summary: parsed.summary,
      sentiment: parsed.sentiment,
      endedReason: msg.endedReason ?? null,
      successEvaluation: parsed.successEvaluation,
      structuredData: parsed.structuredData,
    };
  }

  // Drop nulls so a later partial event can't erase data from an earlier one.
  for (const k of Object.keys(row)) if (row[k] === null || row[k] === undefined) delete row[k];
  row.org_id = agent.org_id; row.agent_id = agent.id; row.vapi_call_id = call.id;

  const { error } = await db.from("agent_calls").upsert(row, { onConflict: "vapi_call_id" });
  if (error) {
    console.error("webhook upsert failed", call.id, error.message);
    return json({ error: "persist_failed" }, 500);
  }

  if (type === "end-of-call-report") {
    // ── Customer identity + call memory (real provider data only) ──
    try {
      const customerNumber = row.direction === "outbound" ? row.destination : row.caller_id;
      if (customerNumber) {
        const { data: customerId } = await db.rpc("agent_resolve_customer", {
          p_org_id: agent.org_id,
          p_phone: customerNumber,
          p_email: null,
          p_name: null,
          p_channel: "phone",
          p_create: true,
        });
        if (customerId) {
          const { data: callRow } = await db
            .from("agent_calls").select("id, contact_id")
            .eq("vapi_call_id", call.id).maybeSingle();
          if (callRow && !callRow.contact_id) {
            await db.from("agent_calls").update({ contact_id: customerId }).eq("id", callRow.id);
          }
          const parsed = parseAnalysis(msg);
          if (parsed.summary && String(parsed.summary).trim()) {
            // Durable, genuinely useful context: the provider's own call summary.
            // Idempotent: webhook retries must not duplicate memories.
            const { data: existing } = await db.from("agent_customer_memories")
              .select("id").eq("contact_id", customerId)
              .eq("memory_type", "fact").eq("memory_key", `call_summary:${call.id}`)
              .maybeSingle();
            if (!existing) await db.from("agent_customer_memories").insert({
              org_id: agent.org_id,
              contact_id: customerId,
              memory_type: "fact",
              memory_key: `call_summary:${call.id}`,
              content: String(parsed.summary).slice(0, 2000),
              confidence: 0.8,
              source_type: "call",
              source_id: callRow?.id ?? null,
              agent_id: agent.id,
            });
          }
          if (callRow) {
            await db.from("agent_customer_events").upsert({
              org_id: agent.org_id,
              contact_id: customerId,
              event_type: "call_completed",
              title: `${row.direction === "outbound" ? "Outbound" : "Inbound"} call completed`,
              ref_type: "call",
              ref_id: callRow.id,
              agent_id: agent.id,
            }, { onConflict: "contact_id,event_type,ref_type,ref_id", ignoreDuplicates: true });
          }
        }
      }
    } catch (e) {
      // Identity/memory enrichment must never break call recording.
      console.error("customer enrichment failed", (e as Error).message);
    }

    // Operational audit trail — identifiers and outcome only, never transcripts.
    await db.from("agent_audit_logs").insert({
      org_id: agent.org_id,
      action: "call_completed",
      entity_type: "call",
      new_data: {
        vapi_call_id: call.id,
        direction: row.direction,
        outcome: row.outcome ?? null,
        duration_sec: row.duration_sec ?? null,
      },
      meta: { agent_id: agent.id, source: "vapi_webhook" },
    });
  }

  return json({ ok: true, type });
});
