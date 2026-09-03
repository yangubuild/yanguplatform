// Authenticated test-console endpoint backed by the same shared brain used by
// WhatsApp, web chat, and voice follow-ups.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runAgentBrain } from "../_shared/agentBrain.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supabaseUrl || !anonKey || !serviceKey) return response({ error: "not_configured" }, 503);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return response({ error: "unauthorized" }, 401);
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: authError } = await userClient.auth.getUser();
  if (authError || !userData.user) return response({ error: "unauthorized" }, 401);

  let payload: any;
  try { payload = await req.json(); } catch { return response({ error: "invalid_json" }, 400); }
  const text = typeof payload?.text === "string" ? payload.text.trim() : "";
  const agentId = typeof payload?.agentId === "string" ? payload.agentId : null;
  if (!text) return response({ error: "text_required" }, 400);
  if (text.length > 4000) return response({ error: "text_too_long" }, 400);

  const svc = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const userId = userData.user.id;
  const { data: memberships } = await svc.from("org_memberships").select("org_id").eq("user_id", userId);
  const memberOrgIds = (memberships ?? []).map((row: any) => row.org_id).filter(Boolean);
  let orgId = typeof payload?.orgId === "string" && memberOrgIds.includes(payload.orgId) ? payload.orgId : memberOrgIds[0] ?? null;
  if (!orgId) {
    const { data: owned } = await svc.from("orgs").select("id").eq("owner_user_id", userId).limit(1).maybeSingle();
    orgId = (owned as any)?.id ?? null;
  }
  if (!orgId) return response({ error: "organization_required" }, 403);

  let agentConfig = payload?.agentConfig ?? null;
  if (agentId) {
    const { data: agent } = await svc.from("agent_agents").select("id").eq("id", agentId).eq("org_id", orgId).maybeSingle();
    if (!agent) return response({ error: "agent_not_found" }, 404);
    if (!agentConfig) {
      const { data: config } = await svc.from("agent_configs")
        .select("config")
        .eq("agent_id", agentId).eq("org_id", orgId)
        .in("environment", ["live", "staging", "draft"])
        .order("version", { ascending: false }).limit(1).maybeSingle();
      agentConfig = (config as any)?.config ?? null;
    }
  }

  const result = await runAgentBrain({
    svc,
    apiKey,
    orgId,
    agentId,
    text,
    history: Array.isArray(payload?.history) ? payload.history : [],
    agentConfig,
    model: typeof payload?.model === "string" ? payload.model : undefined,
    channel: typeof payload?.channel === "string" ? payload.channel : "webchat",
    testMode: payload?.testMode === true,
    customerId: typeof payload?.customerId === "string" ? payload.customerId : null,
    customerPhone: typeof payload?.customerPhone === "string" ? payload.customerPhone : null,
    customerEmail: typeof payload?.customerEmail === "string" ? payload.customerEmail : null,
    customerName: typeof payload?.customerName === "string" ? payload.customerName : null,
  });

  return response(result);
});
