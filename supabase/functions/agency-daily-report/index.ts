import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all active agencies
    const { data: agencies, error: agErr } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("status", "active");

    if (agErr) throw agErr;
    if (!agencies?.length) {
      return new Response(JSON.stringify({ message: "No active agencies" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const reports = [];

    for (const agency of agencies) {
      // Count referrals with KYC approved for this agency
      const { count: totalReferrals } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agency.id);

      const { count: kycApproved } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agency.id)
        .eq("kyc_status", "approved");

      const { count: todayKyc } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agency.id)
        .eq("kyc_status", "approved")
        .gte("created_at", `${today}T00:00:00Z`);

      // Active subscribers
      const { count: totalSubscribers } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agency.id)
        .eq("subscription_status", "active");

      const { count: todaySubscribers } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agency.id)
        .eq("subscription_status", "active")
        .gte("created_at", `${today}T00:00:00Z`);

      // KYC pass rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: kycAttempts30d } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agency.id)
        .in("kyc_status", ["approved", "rejected"])
        .gte("created_at", thirtyDaysAgo.toISOString());

      const { count: kycApproved30d } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agency.id)
        .eq("kyc_status", "approved")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const kycPassRate =
        (kycAttempts30d ?? 0) > 0
          ? ((kycApproved30d ?? 0) / (kycAttempts30d ?? 1)) * 100
          : 0;

      const reportData = {
        agency_name: agency.name,
        kyc_users_today: todayKyc ?? 0,
        total_kyc_users: kycApproved ?? 0,
        new_subscribers_today: todaySubscribers ?? 0,
        total_subscribers: totalSubscribers ?? 0,
        total_referrals: totalReferrals ?? 0,
        kyc_pass_rate: Math.round(kycPassRate * 100) / 100,
        fraud_rate: 0, // Placeholder — requires fraud flagging system
      };

      // Upsert daily report (one per agency per day)
      const { error: insertErr } = await supabase
        .from("agency_reports")
        .upsert(
          {
            agency_id: agency.id,
            report_type: "daily",
            report_date: today,
            data: reportData,
            status: "submitted",
          },
          { onConflict: "agency_id,report_type,report_date" }
        );

      if (insertErr) {
        // If upsert fails due to missing unique constraint, just insert
        await supabase.from("agency_reports").insert({
          agency_id: agency.id,
          report_type: "daily",
          report_date: today,
          data: reportData,
          status: "submitted",
        });
      }

      reports.push(reportData);
    }

    return new Response(
      JSON.stringify({
        message: `Daily reports generated for ${reports.length} agencies`,
        reports,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Daily report error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
