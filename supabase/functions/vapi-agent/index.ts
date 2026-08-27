// Secure server-side bridge between Yangu and the voice infrastructure.
// Actions: deploy | update | pause | resume | sync_calls | list_numbers | assign_number | status
// The private provider key is only ever read inside this function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/require-auth.ts";
import { vapiFetch, VapiError, buildAssistantPayload, type AgentBuildConfig } from "../_shared/vapi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

function webhookUrl() {
  const base = Deno.env.get("SUPABASE_URL")!;
  return `${base}/functions/v1/vapi-webhook`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = await requireUser(req, corsHeaders);
  if (gate.response) return gate.response;
  const userId = gate.user!.id;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const action = String(body?.action ?? "");
  const db = admin();

  // Resolve the agent and verify the caller belongs to its org.
  async function loadAgent(agentId: string) {
    const { data: agent, error } = await db.from("agent_agents").select("*").eq("id", agentId).maybeSingle();
    if (error || !agent) return { agent: null, error: json({ error: "agent_not_found" }, 404) };
    const { data: allowed } = await db.rpc("org_role_in", {
      _org_id: agent.org_id, _user_id: userId, _roles: ["owner", "admin", "editor"],
    });
    if (!allowed) return { agent: null, error: json({ error: "forbidden" }, 403) };
    return { agent, error: null as Response | null };
  }

  async function agentConfig(agent: any): Promise<AgentBuildConfig> {
    const { data: cfg } = await db
      .from("agent_configs")
      .select("config")
      .eq("agent_id", agent.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const c = (cfg?.config ?? {}) as AgentBuildConfig;
    return {
      agentName: agent.name,
      type: agent.type,
      languages: c.languages ?? (agent.language ? [agent.language] : ["English"]),
      voice: c.voice ?? agent.voice ?? undefined,
      ...c,
    };
  }

  try {
    switch (action) {
      case "status": {
        // Reports whether the voice infrastructure is reachable — no secrets returned.
        if (!Deno.env.get("VAPI_API_KEY")) return json({ connected: false, reason: "not_configured" });
        try {
          await vapiFetch("/assistant?limit=1");
          return json({ connected: true });
        } catch (e) {
          const st = e instanceof VapiError ? e.status : 500;
          return json({ connected: false, reason: st === 401 ? "invalid_key" : "provider_error" });
        }
      }

      case "deploy":
      case "update": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        const cfg = await agentConfig(agent);
        const payload = buildAssistantPayload(cfg, webhookUrl(), Deno.env.get("VAPI_WEBHOOK_SECRET") ?? undefined);
        try {
          const assistant = agent.vapi_assistant_id
            ? await vapiFetch(`/assistant/${agent.vapi_assistant_id}`, { method: "PATCH", body: payload })
            : await vapiFetch("/assistant", { method: "POST", body: payload });
          await db.from("agent_agents").update({
            vapi_assistant_id: assistant.id,
            status: action === "deploy" ? "live" : agent.status,
            deployed_at: new Date().toISOString(),
            last_deploy_error: null,
          }).eq("id", agent.id);
          return json({ ok: true, assistantId: assistant.id, status: action === "deploy" ? "live" : agent.status });
        } catch (e) {
          const detail = e instanceof VapiError ? e.detail : String(e);
          console.error("vapi deploy failed", agent.id, detail);
          await db.from("agent_agents").update({
            status: agent.status === "live" ? "live" : "draft",
            last_deploy_error: typeof detail === "string" ? detail.slice(0, 500) : JSON.stringify(detail).slice(0, 500),
          }).eq("id", agent.id);
          return json({
            ok: false,
            error: "deploy_failed",
            message: "We couldn't deploy your agent. Your configuration has been saved as a draft.",
          }, 502);
        }
      }

      case "pause":
      case "resume": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        const next = action === "pause" ? "paused" : "live";
        // Detach / reattach the number so a paused agent stops taking calls.
        if (agent.vapi_phone_number_id) {
          try {
            await vapiFetch(`/phone-number/${agent.vapi_phone_number_id}`, {
              method: "PATCH",
              body: { assistantId: action === "pause" ? null : agent.vapi_assistant_id },
            });
          } catch (e) {
            console.error("vapi number toggle failed", agent.id, e instanceof VapiError ? e.detail : e);
            return json({ ok: false, error: "provider_error", message: "Could not update the phone routing. Nothing was changed." }, 502);
          }
        }
        await db.from("agent_agents").update({ status: next }).eq("id", agent.id);
        return json({ ok: true, status: next });
      }

      case "sync_calls": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        if (!agent.vapi_assistant_id) return json({ ok: true, synced: 0, reason: "not_deployed" });
        const calls = await vapiFetch(`/call?assistantId=${agent.vapi_assistant_id}&limit=100`);
        let synced = 0;
        for (const c of Array.isArray(calls) ? calls : []) {
          const row = {
            org_id: agent.org_id,
            agent_id: agent.id,
            vapi_call_id: c.id,
            direction: c.type?.includes("outbound") ? "outbound" : "inbound",
            caller_id: c.customer?.number ?? null,
            destination: c.phoneNumber?.number ?? null,
            status: c.status ?? null,
            outcome: c.endedReason ?? null,
            duration_sec: c.startedAt && c.endedAt
              ? Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)
              : null,
            cost: c.cost ?? null,
            recording_url: c.recordingUrl ?? c.artifact?.recordingUrl ?? null,
            transcript: c.transcript ?? c.artifact?.transcript ?? null,
            started_at: c.startedAt ?? c.createdAt ?? null,
            ended_at: c.endedAt ?? null,
            meta: { messages: c.messages ?? c.artifact?.messages ?? [] },
          };
          const { error: upErr } = await db.from("agent_calls").upsert(row, { onConflict: "vapi_call_id" });
          if (upErr) console.error("call upsert failed", c.id, upErr.message);
          else synced++;
        }
        return json({ ok: true, synced });
      }

      case "list_numbers": {
        const orgId = String(body.orgId ?? "");
        const { data: allowed } = await db.rpc("is_org_member", { _org_id: orgId, _user_id: userId });
        if (!allowed) return json({ error: "forbidden" }, 403);
        const numbers = await vapiFetch("/phone-number?limit=50");
        return json({
          ok: true,
          numbers: (Array.isArray(numbers) ? numbers : []).map((n: any) => ({
            id: n.id, number: n.number, provider: n.provider, assistantId: n.assistantId ?? null, name: n.name ?? null,
          })),
        });
      }

      case "assign_number": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        if (!agent.vapi_assistant_id) return json({ ok: false, error: "not_deployed", message: "Deploy the agent before assigning a number." }, 400);
        const numberId = String(body.phoneNumberId ?? "");
        const updated = await vapiFetch(`/phone-number/${numberId}`, {
          method: "PATCH",
          body: { assistantId: agent.vapi_assistant_id },
        });
        await db.from("agent_agents").update({
          vapi_phone_number_id: updated.id, phone_number: updated.number ?? null,
        }).eq("id", agent.id);
        await db.from("agent_phone_numbers").upsert({
          org_id: agent.org_id, vapi_phone_number_id: updated.id, number: updated.number,
          provider: updated.provider ?? "vapi", status: "assigned", agent_id: agent.id,
        }, { onConflict: "vapi_phone_number_id" });
        return json({ ok: true, number: updated.number ?? null });
      }

      case "place_call": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        if (!agent.vapi_assistant_id) {
          return json({ ok: false, error: "not_deployed", message: "Deploy this agent before it can make calls." }, 400);
        }
        if (!agent.vapi_phone_number_id) {
          return json({ ok: false, error: "no_number", message: "Give this agent a phone number before it can make calls." }, 400);
        }
        const to = String(body.to ?? "").trim();
        if (!/^\+?[0-9\s\-()]{7,20}$/.test(to)) {
          return json({ ok: false, error: "invalid_number", message: "That doesn't look like a valid phone number." }, 400);
        }
        const call = await vapiFetch("/call", {
          method: "POST",
          body: {
            assistantId: agent.vapi_assistant_id,
            phoneNumberId: agent.vapi_phone_number_id,
            customer: { number: to.replace(/[\s\-()]/g, ""), name: body.name ? String(body.name).slice(0, 80) : undefined },
          },
        });
        await db.from("agent_calls").upsert({
          org_id: agent.org_id, agent_id: agent.id, vapi_call_id: call.id,
          direction: "outbound", destination: to, contact_name: body.name ? String(body.name).slice(0, 80) : null,
          status: call.status ?? "queued", started_at: call.createdAt ?? new Date().toISOString(),
          meta: { purpose: body.purpose ? String(body.purpose).slice(0, 300) : null },
        }, { onConflict: "vapi_call_id" });
        return json({ ok: true, callId: call.id, status: call.status ?? "queued" });
      }

      default:
        return json({ error: "unknown_action" }, 400);

    }
  } catch (e) {
    const status = e instanceof VapiError ? e.status : 500;
    console.error("vapi-agent failure", action, e instanceof VapiError ? e.detail : e);
    return json({
      ok: false,
      error: status === 429 ? "rate_limited" : "provider_error",
      message: status === 429
        ? "The voice service is busy. Please try again in a moment."
        : "The voice service could not complete that request. Nothing was changed.",
    }, status === 429 ? 429 : 502);
  }
});
