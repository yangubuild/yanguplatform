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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user from their JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campaign_key } = await req.json();
    if (!campaign_key || typeof campaign_key !== "string" || campaign_key.length > 100) {
      return new Response(JSON.stringify({ error: "campaign_key required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check if already redeemed before calling grant_promo
    const { data: existing } = await adminClient
      .from("promo_redemptions")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["granted", "dismissed"])
      .limit(1)
      .maybeSingle();

    // Also need campaign_id lookup for the check
    const { data: campaign } = await adminClient
      .from("promo_campaigns")
      .select("id, is_active, starts_at, ends_at")
      .eq("key", campaign_key)
      .maybeSingle();

    if (!campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate campaign is active and in window
    const now = new Date();
    if (
      !campaign.is_active ||
      (campaign.starts_at && new Date(campaign.starts_at) > now) ||
      (campaign.ends_at && new Date(campaign.ends_at) < now)
    ) {
      return new Response(JSON.stringify({ error: "Campaign is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already redeemed for this specific campaign
    const { data: existingRedemption } = await adminClient
      .from("promo_redemptions")
      .select("id")
      .eq("campaign_id", campaign.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRedemption) {
      return new Response(JSON.stringify({ ok: true, alreadyRedeemed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call grant_promo (which also has ON CONFLICT guard)
    const { error } = await adminClient.rpc("grant_promo", {
      p_campaign_key: campaign_key,
      p_user_id: user.id,
    });

    if (error) {
      console.error("grant_promo error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, alreadyRedeemed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("promo-claim error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
