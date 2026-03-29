import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OUTSTAND_API_KEY = Deno.env.get("OUTSTAND_API_KEY");
    if (!OUTSTAND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OUTSTAND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, ...params } = body;

    // Route to the appropriate Outstand API action
    switch (action) {
      case "get_connect_url":
        // Phase 2: call Outstand API to get OAuth URL
        return jsonResponse({ url: `https://outstand.com/oauth/connect?provider=${params.provider}` });

      case "oauth_callback":
        // Phase 2: exchange code for tokens via Outstand
        return jsonResponse({ account: { id: "placeholder", provider: params.provider || "unknown" } });

      case "list_accounts":
        // Phase 2: fetch connected accounts from Outstand
        return jsonResponse({ accounts: [] });

      case "create_post":
        // Phase 2: create post via Outstand API
        return jsonResponse({ id: "post_placeholder" });

      case "schedule_post":
        // Phase 2: schedule post via Outstand API
        return jsonResponse({ id: "scheduled_placeholder" });

      case "fetch_analytics":
        // Phase 2: fetch analytics from Outstand
        return jsonResponse({ metrics: {} });

      case "webhook":
        // Phase 2: process incoming webhook from Outstand
        return jsonResponse({ received: true });

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function jsonResponse(data: Record<string, any>) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
