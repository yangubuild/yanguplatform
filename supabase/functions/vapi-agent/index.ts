// Secure server-side bridge between Yangu and the voice infrastructure.
// Actions: status | diagnostics | agent_status | deploy | update | pause | resume
//        | sync_calls | list_numbers | assign_number | create_number | import_number
//        | place_call | get_call | web_test
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

/** Safe, user-facing message for a provider failure — never leaks secrets. */
function providerMessage(e: unknown): string {
  if (e instanceof VapiError) {
    if (e.status === 401 || e.status === 403) return "Voice provider authentication failed.";
    if (e.status === 404) return "That item could not be found at the voice provider.";
    if (e.status === 429) return "The voice provider is busy. Please try again in a moment.";
    if (e.status === 400) {
      const d: any = e.detail;
      const m = typeof d === "string" ? d : d?.message;
      return `Voice provider rejected the request: ${String(Array.isArray(m) ? m.join(", ") : m ?? "invalid request").slice(0, 180)}`;
    }
  }
  return "Unable to reach voice provider.";
}

function productError(error: string, fallback?: string): string {
  const messages: Record<string, string> = {
    auth_failed: "Voice service connection needs attention.",
    not_configured: "Voice service connection needs attention.",
    no_number: "Connect a phone number before making calls.",
    no_outbound_number: "No outbound phone number is connected yet.",
    not_deployed: "This agent hasn't been deployed yet.",
    international_not_supported: "Your current calling number doesn't support this destination.",
    provider_unavailable: "Voice service is temporarily unavailable. Try again.",
  };
  return messages[error] ?? fallback ?? "Voice service is temporarily unavailable. Try again.";
}

function shortId(id?: string | null) {
  return id ? `${String(id).slice(0, 8)}…` : null;
}

/** Normalise user-entered phone input to E.164 (+<digits>) where possible.
 *  Accepts "+971 50 123 4567", "00971501234567", "971501234567". */
function toE164(raw: unknown): string {
  let v = String(raw ?? "").trim().replace(/[\s\-().]/g, "");
  if (!v) return "";
  if (v.startsWith("00")) v = `+${v.slice(2)}`;
  if (!v.startsWith("+")) v = `+${v.replace(/\D/g, "")}`;
  else v = `+${v.slice(1).replace(/\D/g, "")}`;
  return v;
}

const isE164 = (v: string) => /^\+[1-9]\d{6,15}$/.test(v);


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = await requireUser(req, corsHeaders);
  if (gate.response) return gate.response;
  const userId = gate.user!.id;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const action = String(body?.action ?? "");
  const db = admin();

  const keyPresent = Boolean(Deno.env.get("VAPI_API_KEY"));

  /** Resolve the caller's active org (membership first, then ownership). */
  async function resolveOrg(): Promise<string | null> {
    const { data: mem } = await db.from("org_memberships").select("org_id").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (mem?.org_id) return mem.org_id as string;
    const { data: own } = await db.from("orgs").select("id").eq("owner_user_id", userId).limit(1).maybeSingle();
    return (own?.id as string) ?? null;
  }

  // Resolve the agent and verify the caller belongs to its org.
  async function loadAgent(agentId: string) {
    const { data: agent, error } = await db.from("agent_agents").select("*").eq("id", agentId).maybeSingle();
    if (error || !agent) return { agent: null, error: json({ ok: false, error: "agent_not_found", message: "That agent could not be found." }, 404) };
    const { data: allowed } = await db.rpc("org_role_in", {
      _org_id: agent.org_id, _user_id: userId, _roles: ["owner", "admin", "editor"],
    });
    if (!allowed) return { agent: null, error: json({ ok: false, error: "forbidden", message: "You don't have access to this agent." }, 403) };
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

  /** Map a provider call object onto our agent_calls row shape. */
  function callRow(orgId: string, agentId: string, c: any) {
    return {
      org_id: orgId,
      agent_id: agentId,
      vapi_call_id: c.id,
      direction: String(c.type ?? "").includes("outbound") ? "outbound" : "inbound",
      caller_id: c.customer?.number ?? null,
      destination: c.phoneNumber?.number ?? c.customer?.number ?? null,
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
      meta: { messages: c.messages ?? c.artifact?.messages ?? [], summary: c.summary ?? c.analysis?.summary ?? null },
    };
  }

  if (!keyPresent && action !== "status" && action !== "web_test") {
    return json({ ok: false, error: "not_configured", message: "The voice provider is not connected yet." }, 400);
  }

  try {
    switch (action) {
      case "status": {
        // Reports whether the voice infrastructure is reachable — no secrets returned.
        if (!keyPresent) return json({ connected: false, reason: "not_configured" });
        try {
          await vapiFetch("/assistant?limit=1");
          return json({ connected: true });
        } catch (e) {
          const st = e instanceof VapiError ? e.status : 500;
          return json({ connected: false, reason: st === 401 ? "invalid_key" : "provider_error" });
        }
      }

      /** Read-only end-to-end connectivity report used by the UI and support. */
      case "diagnostics": {
        const result: Record<string, unknown> = {
          ok: true,
          keyPresent,
          secretName: "VAPI_API_KEY",
          authorization: "Bearer",
          assistantsApi: { ok: false, httpStatus: null },
          phoneNumbersApi: { ok: false, httpStatus: null },
          callsApi: { ok: false, httpStatus: null },
          webVoiceReady: Boolean(Deno.env.get("VAPI_PUBLIC_KEY")),
        };
        try {
          const assistants = await vapiFetch("/assistant?limit=100");
          const list = Array.isArray(assistants) ? assistants : [];
          result.auth = "pass";
          result.assistantsApi = { ok: true, httpStatus: 200 };
          result.assistantCount = list.length;
          result.assistants = list.map((a: any) => ({ id: a.id, name: a.name, updatedAt: a.updatedAt ?? null }));
        } catch (e) {
          return json({
            ok: false, keyPresent, auth: e instanceof VapiError && e.status === 401 ? "fail_auth" : "fail",
            assistantsApi: { ok: false, httpStatus: e instanceof VapiError ? e.status : 500 },
            message: providerMessage(e),
          });
        }
        try {
          const numbers = await vapiFetch("/phone-number?limit=50");
          const list = Array.isArray(numbers) ? numbers : [];
          result.phoneNumbersApi = { ok: true, httpStatus: 200 };
          result.numberCount = list.length;
          result.numbers = list.map((n: any) => ({
            id: n.id, number: n.number, provider: n.provider, status: n.status ?? null,
            assistantId: n.assistantId ?? null,
          }));
        } catch (e) {
          result.phoneNumbersApi = { ok: false, httpStatus: e instanceof VapiError ? e.status : 500 };
          result.numberCount = null;
          result.numbersMessage = providerMessage(e);
        }
        try {
          const calls = await vapiFetch("/call?limit=100");
          const list = Array.isArray(calls) ? calls : [];
          result.callsApi = { ok: true, httpStatus: 200 };
          result.callCount = list.length;
        } catch (e) {
          result.callsApi = { ok: false, httpStatus: e instanceof VapiError ? e.status : 500 };
          result.callCount = null;
          result.callsMessage = providerMessage(e);
        }
        return json(result);
      }

      /** Real provider state for one local agent — never guesses. */
      case "agent_status": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        const base = {
          ok: true,
          agentId: agent.id,
          name: agent.name,
          localStatus: agent.status,
          assistantId: agent.vapi_assistant_id ?? null,
          phoneNumber: agent.phone_number ?? null,
          phoneNumberId: agent.vapi_phone_number_id ?? null,
          deployedAt: agent.deployed_at ?? null,
        };
        if (!agent.vapi_assistant_id) {
          return json({ ...base, state: "not_deployed", message: "Not deployed to voice provider." });
        }
        try {
          const a: any = await vapiFetch(`/assistant/${agent.vapi_assistant_id}`);
          return json({
            ...base,
            state: "deployed",
            provider: {
              name: a.name ?? null,
              model: a.model?.model ?? null,
              modelProvider: a.model?.provider ?? null,
              voice: a.voice?.voiceId ?? null,
              voiceProvider: a.voice?.provider ?? null,
              transcriber: a.transcriber ? `${a.transcriber.provider ?? ""} ${a.transcriber.model ?? ""}`.trim() : null,
              firstMessage: a.firstMessage ?? null,
              systemPrompt: String(a.model?.messages?.[0]?.content ?? "").slice(0, 4000) || null,
              updatedAt: a.updatedAt ?? null,
            },
          });
        } catch (e) {
          if (e instanceof VapiError && e.status === 404) {
            return json({ ...base, state: "provider_missing", message: "Agent could not be found in the voice provider. Deploy it again." });
          }
          return json({ ...base, state: "provider_unreachable", message: providerMessage(e) });
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
          return json({ ok: false, error: "deploy_failed", message: providerMessage(e) }, 502);
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
            return json({ ok: false, error: "provider_error", message: providerMessage(e) }, 502);
          }
        }
        await db.from("agent_agents").update({ status: next }).eq("id", agent.id);
        return json({ ok: true, status: next });
      }

      case "sync_calls": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        if (!agent.vapi_assistant_id) {
          return json({ ok: true, synced: 0, reason: "not_deployed", message: "Not deployed to voice provider." });
        }
        const calls = await vapiFetch(`/call?assistantId=${agent.vapi_assistant_id}&limit=100`);
        let synced = 0;
        for (const c of Array.isArray(calls) ? calls : []) {
          const { error: upErr } = await db.from("agent_calls")
            .upsert(callRow(agent.org_id, agent.id, c), { onConflict: "vapi_call_id" });
          if (upErr) console.error("call upsert failed", c.id, upErr.message);
          else synced++;
        }
        return json({ ok: true, synced });
      }

      case "list_numbers": {
        const orgId = String(body.orgId ?? "") || (await resolveOrg());
        if (!orgId) return json({ ok: false, error: "no_org", message: "No workspace found for this account." }, 400);
        const { data: allowed } = await db.rpc("is_org_member", { _org_id: orgId, _user_id: userId });
        if (!allowed) return json({ ok: false, error: "forbidden", message: "You don't have access to this workspace." }, 403);
        const numbers = await vapiFetch("/phone-number?limit=50");
        const list = (Array.isArray(numbers) ? numbers : []).map((n: any) => ({
          id: n.id,
          number: n.number ?? null,
          provider: n.provider ?? "vapi",
          assistantId: n.assistantId ?? null,
          name: n.name ?? null,
          // Provider-issued (free) numbers are US-oriented; imported carrier
          // numbers are the ones that reliably support international dialling.
          outboundCapable: n.provider !== "vapi" || Boolean(n.number?.startsWith("+1")),
        }));
        return json({ ok: true, numbers: list, count: list.length });
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
        return json({ ok: true, number: updated.number ?? null, id: updated.id });
      }

      /** Provision a provider number. Chargeable — requires explicit confirmation. */
      case "create_number": {
        if (body.confirm !== true) {
          return json({ ok: false, error: "confirm_required", message: "Confirm before creating a number." }, 400);
        }
        const orgId = await resolveOrg();
        if (!orgId) return json({ ok: false, error: "no_org", message: "No workspace found for this account." }, 400);
        const areaCode = String(body.areaCode ?? "").replace(/\D/g, "").slice(0, 3);
        const created = await vapiFetch("/phone-number", {
          method: "POST",
          body: {
            provider: "vapi",
            ...(areaCode ? { numberDesiredAreaCode: areaCode } : {}),
            ...(body.agentId ? {} : {}),
          },
        });
        await db.from("agent_phone_numbers").upsert({
          org_id: orgId, vapi_phone_number_id: created.id, number: created.number,
          provider: created.provider ?? "vapi", status: "available",
        }, { onConflict: "vapi_phone_number_id" });
        return json({ ok: true, id: created.id, number: created.number ?? null, provider: created.provider ?? "vapi" });
      }

      /** Import an existing carrier number (Twilio). Credentials are passed straight
       *  through to the provider and never stored by Yangu. */
      case "import_number": {
        if (body.confirm !== true) {
          return json({ ok: false, error: "confirm_required", message: "Confirm before connecting a number." }, 400);
        }
        const orgId = await resolveOrg();
        if (!orgId) return json({ ok: false, error: "no_org", message: "No workspace found for this account." }, 400);
        const number = toE164(body.number);
        const sid = String(body.accountSid ?? "").trim();
        const token = String(body.authToken ?? "").trim();
        if (!isE164(number)) {
          return json({ ok: false, error: "invalid_number", message: "Enter the number in international format, e.g. +971501234567." }, 400);
        }
        if (!sid || !token) {
          return json({ ok: false, error: "missing_credentials", message: "Carrier account SID and auth token are required." }, 400);
        }
        const created = await vapiFetch("/phone-number", {
          method: "POST",
          body: { provider: "twilio", number, twilioAccountSid: sid, twilioAuthToken: token },
        });
        await db.from("agent_phone_numbers").upsert({
          org_id: orgId, vapi_phone_number_id: created.id, number: created.number ?? number,
          provider: "twilio", status: "available",
        }, { onConflict: "vapi_phone_number_id" });
        return json({ ok: true, id: created.id, number: created.number ?? number, provider: "twilio" });
      }

      case "place_call": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        if (!agent.vapi_assistant_id) {
          return json({ ok: false, error: "not_deployed", message: productError("not_deployed") }, 400);
        }
        const to = toE164(body.to);
        if (!isE164(to)) {
          return json({ ok: false, error: "invalid_number", message: "Enter the number to call in international format, e.g. +971501234567." }, 400);
        }

        // Resolve the ID from the provider itself. Never send a local ID,
        // displayed number, stale mapping, or undefined identifier to Vapi.
        const numberRows = await vapiFetch("/phone-number?limit=50");
        const providerNumbers = Array.isArray(numberRows) ? numberRows : [];
        const selected = agent.vapi_phone_number_id
          ? providerNumbers.find((n: any) => n.id === agent.vapi_phone_number_id)
          : providerNumbers[0];
        if (!selected?.id) {
          console.warn("vapi place_call blocked", {
            reason: "no_number", agentId: agent.id, assistantIdPresent: true,
            phoneNumberIdPresent: false, customerNumberPresent: true,
          });
          return json({ ok: false, error: "no_number", message: "No outbound phone number is connected yet." }, 400);
        }
        const numberId = String(selected.id);
        const fromNumber = selected.number ?? null;
        const isUaeDestination = to.startsWith("+971");
        // Provider-issued numbers are currently US-oriented. Do not claim that
        // they support UAE/international routes without a carrier-backed number.
        if (isUaeDestination && selected.provider === "vapi") {
          return json({
            ok: false,
            error: "international_not_supported",
            message: "This calling number is not configured for UAE/international outbound calls.",
          }, 400);
        }

        const providerPayload = {
          assistantId: String(agent.vapi_assistant_id),
          phoneNumberId: numberId,
          customer: { number: to, name: body.name ? String(body.name).slice(0, 80) : undefined },
        };
        let call: any;
        try {
          call = await vapiFetch("/call", { method: "POST", body: providerPayload });
        } catch (e) {
          console.error("vapi create call failed", {
            vapiStatus: e instanceof VapiError ? e.status : 500,
            vapiResponse: e instanceof VapiError ? e.detail : String(e),
            request: {
              assistantId: providerPayload.assistantId,
              phoneNumberId: providerPayload.phoneNumberId,
              customerNumber: `${to.slice(0, 4)}••••${to.slice(-4)}`,
            },
            secretName: "VAPI_API_KEY",
            authorization: "Bearer",
          });
          if (e instanceof VapiError && (e.status === 401 || e.status === 403)) {
            return json({ ok: false, error: "auth_failed", message: productError("auth_failed") }, 502);
          }
          return json({
            ok: false,
            error: "provider_unavailable",
            message: e instanceof VapiError && e.status === 400
              ? "The voice service rejected this call configuration. Check the agent and calling number."
              : productError("provider_unavailable"),
          }, 502);
        }
        await db.from("agent_calls").upsert({
          org_id: agent.org_id, agent_id: agent.id, vapi_call_id: call.id,
          direction: "outbound", destination: to, contact_name: body.name ? String(body.name).slice(0, 80) : null,
          status: call.status ?? "queued", started_at: call.createdAt ?? new Date().toISOString(),
          meta: { purpose: body.purpose ? String(body.purpose).slice(0, 300) : null, from: fromNumber },
        }, { onConflict: "vapi_call_id" });
        return json({ ok: true, callId: call.id, status: call.status ?? "queued", from: fromNumber, to });
      }

      /** Poll one call's real provider state and persist it. */
      case "get_call": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        const callId = String(body.callId ?? "");
        if (!callId) return json({ ok: false, error: "missing_call", message: "No call reference was provided." }, 400);
        const c: any = await vapiFetch(`/call/${callId}`);
        await db.from("agent_calls").upsert(callRow(agent.org_id, agent.id, c), { onConflict: "vapi_call_id" });
        return json({
          ok: true,
          callId: c.id,
          status: c.status ?? null,
          endedReason: c.endedReason ?? null,
          startedAt: c.startedAt ?? c.createdAt ?? null,
          endedAt: c.endedAt ?? null,
          durationSec: c.startedAt && c.endedAt
            ? Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)
            : null,
          cost: c.cost ?? null,
          transcript: c.transcript ?? c.artifact?.transcript ?? null,
          recordingUrl: c.recordingUrl ?? c.artifact?.recordingUrl ?? null,
          summary: c.summary ?? c.analysis?.summary ?? null,
        });
      }

      /** Browser voice test. Needs a publishable provider key — never the private one. */
      case "web_test": {
        const { agent, error } = await loadAgent(String(body.agentId));
        if (error) return error;
        const publicKey = Deno.env.get("VAPI_PUBLIC_KEY");
        if (!agent.vapi_assistant_id) {
          return json({ ok: true, available: false, reason: "not_deployed", message: "Not deployed to voice provider — deploy this agent first." });
        }
        if (!publicKey) {
          return json({
            ok: true, available: false, reason: "public_key_missing",
            message: "Browser voice testing needs a publishable voice key to be configured.",
          });
        }
        return json({ ok: true, available: true, publicKey, assistantId: agent.vapi_assistant_id });
      }

      default:
        return json({ ok: false, error: "unknown_action", message: "That action is not supported." }, 400);

    }
  } catch (e) {
    const status = e instanceof VapiError ? e.status : 500;
    console.error("vapi-agent failure", action, e instanceof VapiError ? e.detail : e);
    return json({
      ok: false,
      error: status === 429 ? "rate_limited" : status === 401 ? "auth_failed" : "provider_error",
      message: providerMessage(e),
    }, status === 429 ? 429 : 502);
  }
});
