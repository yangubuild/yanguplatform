import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function mapDiditStatus(rawStatus: string | null | undefined): "approved" | "rejected" | "pending" {
  const normalized = (rawStatus ?? "").toLowerCase().trim();
  if (["approved", "verified", "completed"].includes(normalized)) return "approved";
  if (["declined", "rejected", "failed", "denied"].includes(normalized)) return "rejected";
  return "pending";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    console.log("[management-kyc-webhook] Received:", JSON.stringify(body));

    const sessionId = body.session_id ?? body.id;
    const rawStatus = body.status ?? body.decision ?? body.verification_status;
    const vendorData = body.vendor_data; // This is the member_id

    if (!sessionId && !vendorData) {
      return new Response(
        JSON.stringify({ error: "Missing session_id and vendor_data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the team member by session ID or vendor_data (member_id)
    let member: any = null;

    if (vendorData) {
      const { data } = await supabase
        .from("management_team_members")
        .select("*")
        .eq("id", vendorData)
        .single();
      member = data;
    }

    if (!member && sessionId) {
      const { data } = await supabase
        .from("management_team_members")
        .select("*")
        .eq("didit_session_id", sessionId)
        .single();
      member = data;
    }

    if (!member) {
      console.error("[management-kyc-webhook] Member not found for session:", sessionId, "vendor:", vendorData);
      return new Response(
        JSON.stringify({ error: "Team member not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mappedStatus = mapDiditStatus(rawStatus);
    const now = new Date().toISOString();

    const updateData: Record<string, any> = {
      kyc_status: mappedStatus,
      updated_at: now,
      kyc_data: body,
    };

    if (mappedStatus === "approved") {
      updateData.is_active = true;
      updateData.kyc_completed_at = now;
    } else if (mappedStatus === "rejected") {
      updateData.is_active = false;
    }

    const { error: updateError } = await supabase
      .from("management_team_members")
      .update(updateData)
      .eq("id", member.id);

    if (updateError) {
      console.error("[management-kyc-webhook] Update error:", updateError);
      throw updateError;
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      action: `management_kyc_${mappedStatus}`,
      entity_type: "management_team_member",
      entity_id: member.id,
      new_data: { status: mappedStatus, didit_session_id: sessionId },
    });

    console.log(`[management-kyc-webhook] Member ${member.id} KYC ${mappedStatus}`);

    return new Response(
      JSON.stringify({ success: true, status: mappedStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[management-kyc-webhook] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
