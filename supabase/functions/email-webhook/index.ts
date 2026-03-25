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

  try {
    const body = await req.json();
    const { type, data } = body;

    // Resend webhook events: email.opened, email.clicked, email.delivered, email.bounced
    console.log(`[email-webhook] Received event: ${type}`, JSON.stringify(data));

    if (type === "email.opened") {
      // Increment open_count for matching triggers
      // Resend provides the email_id and to address
      const { error } = await supabase.rpc("increment_email_trigger_stat", {
        p_stat: "open_count",
      });
      if (error) console.error("[email-webhook] open_count increment error:", error);
    }

    if (type === "email.clicked") {
      const { error } = await supabase.rpc("increment_email_trigger_stat", {
        p_stat: "click_count",
      });
      if (error) console.error("[email-webhook] click_count increment error:", error);
    }

    // Log all events to audit_logs for traceability
    await supabase.from("audit_logs").insert({
      action: `email_webhook_${type}`,
      entity_type: "email_campaign",
      entity_id: data?.email_id ?? null,
      new_data: body,
    });

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[email-webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
