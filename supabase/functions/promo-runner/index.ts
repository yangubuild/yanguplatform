import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- Auth: require service secret for cron/admin calls ---
    const authSecret = req.headers.get("x-cron-secret") || req.headers.get("authorization");
    const expectedSecret = Deno.env.get("CRON_SECRET");
    if (!expectedSecret || authSecret !== `Bearer ${expectedSecret}`) {
      // Also allow admin users
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authErr } = await userClient.auth.getUser();
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Verify admin role
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const callerRoles = (roles ?? []).map((r: any) => r.role);
      if (!callerRoles.includes("admin") && !callerRoles.includes("owner")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Find active milestone campaigns
    const { data: campaigns, error: cErr } = await admin
      .from("promo_campaigns")
      .select("*")
      .eq("is_active", true)
      .eq("trigger_type", "milestone");

    if (cErr) throw cErr;
    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let granted = 0;

    for (const campaign of campaigns) {
      const trigger = campaign.trigger_payload as { metric?: string; threshold?: number } | null;
      if (!trigger?.metric || !trigger?.threshold) continue;

      if (trigger.metric === "credits_spent_month") {
        // Find users who spent >= threshold this month and haven't redeemed
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: spenders } = await admin
          .from("credit_transactions")
          .select("user_id, amount")
          .eq("transaction_type", "spend")
          .gte("created_at", startOfMonth.toISOString());

        if (!spenders) continue;

        // Aggregate by user
        const totals: Record<string, number> = {};
        for (const tx of spenders) {
          totals[tx.user_id] = (totals[tx.user_id] || 0) + Math.abs(tx.amount);
        }

        // Get already redeemed user IDs
        const { data: redeemed } = await admin
          .from("promo_redemptions")
          .select("user_id")
          .eq("campaign_id", campaign.id);

        const redeemedSet = new Set((redeemed || []).map((r: any) => r.user_id));

        for (const [userId, total] of Object.entries(totals)) {
          if (total >= trigger.threshold && !redeemedSet.has(userId)) {
            const { error } = await admin.rpc("grant_promo", {
              p_campaign_key: campaign.key,
              p_user_id: userId,
            });
            if (!error) granted++;
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: granted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("promo-runner error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
