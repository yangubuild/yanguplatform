import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const diditApiKey = Deno.env.get("DIDIT_API_KEY") ?? Deno.env.get("DID_API_KEY");
  const diditWorkflowId = Deno.env.get("DIDIT_WORKFLOW_ID");
  const diditBaseUrl = Deno.env.get("DIDIT_BASE_URL") ?? "https://verification.didit.me";

  if (!diditApiKey || !diditWorkflowId) {
    return new Response(
      JSON.stringify({ error: "Didit KYC is not configured. Missing DIDIT_API_KEY or DIDIT_WORKFLOW_ID." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { member_id } = body;

    if (!member_id) {
      return new Response(
        JSON.stringify({ error: "member_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the team member
    const { data: member, error: memberError } = await supabase
      .from("management_team_members")
      .select("*")
      .eq("id", member_id)
      .single();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: "Team member not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already has a session, return existing URL if available
    if (member.didit_session_id && member.kyc_status === "pending") {
      // Try to get decision/status from existing session
      try {
        const decisionRes = await fetch(
          `${diditBaseUrl}/v3/session/${member.didit_session_id}/decision/`,
          {
            headers: {
              accept: "application/json",
              "x-api-key": diditApiKey,
            },
          }
        );
        if (decisionRes.ok) {
          const decision = await decisionRes.json();
          if (decision.url) {
            return new Response(
              JSON.stringify({ session_url: decision.url, session_id: member.didit_session_id }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch {
        // Fall through to create new session
      }
    }

    // Create new Didit verification session
    const callbackUrl = `${supabaseUrl}/functions/v1/management-kyc-webhook`;

    const createEndpoints = [
      `${diditBaseUrl}/v3/session/`,
      `${diditBaseUrl}/v2/session/`,
    ];

    let sessionData: any = null;
    let lastError = "";

    for (const endpoint of createEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            "x-api-key": diditApiKey,
          },
          body: JSON.stringify({
            workflow_id: diditWorkflowId,
            vendor_data: member_id,
            callback: callbackUrl,
          }),
        });

        const data = await res.json();
        if (res.ok && data.url) {
          sessionData = data;
          break;
        }
        lastError = JSON.stringify(data);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : "Unknown error";
      }
    }

    if (!sessionData) {
      return new Response(
        JSON.stringify({ error: `Failed to create Didit session: ${lastError}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store session ID on team member
    await supabase
      .from("management_team_members")
      .update({
        didit_session_id: sessionData.session_id ?? sessionData.id,
        kyc_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", member_id);

    return new Response(
      JSON.stringify({
        session_url: sessionData.url,
        session_id: sessionData.session_id ?? sessionData.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[management-kyc-session] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
