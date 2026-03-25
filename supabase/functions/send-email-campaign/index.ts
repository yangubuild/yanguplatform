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

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Authenticate
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { trigger_id, subject, html_content, from_email, test_email } = body;

    const isTest = !!test_email;

    // If test mode, send to single email
    if (isTest) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from_email || "YANGU <noreply@notify.yangu.io>",
          to: [test_email],
          subject: subject || "Test Campaign Email",
          html: html_content || "<p>This is a test email from YANGU Management.</p>",
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        throw new Error(`Resend error [${resendRes.status}]: ${JSON.stringify(resendData)}`);
      }

      return new Response(
        JSON.stringify({ success: true, test: true, resend_id: resendData.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Production send: fetch recipients from profiles based on trigger conditions
    if (!trigger_id) {
      return new Response(
        JSON.stringify({ error: "trigger_id is required for campaign sends" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get trigger config
    const { data: trigger, error: triggerError } = await supabase
      .from("email_triggers")
      .select("*")
      .eq("id", trigger_id)
      .single();

    if (triggerError || !trigger) {
      return new Response(
        JSON.stringify({ error: "Trigger not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch target profiles (all users with email)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email")
      .not("email", "is", null);

    if (profilesError) throw profilesError;

    const recipients = (profiles ?? [])
      .map((p: any) => p.email)
      .filter((e: string | null): e is string => !!e);

    let sentCount = 0;
    const batchSize = 50;

    // Send in batches via Resend batch API
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      for (const email of batch) {
        try {
          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: from_email || "YANGU <noreply@notify.yangu.io>",
              to: [email],
              subject: subject || trigger.trigger_name || "YANGU Update",
              html: html_content || trigger.template_content || "<p>Hello from YANGU</p>",
            }),
          });

          if (resendRes.ok) {
            sentCount++;
          } else {
            const errBody = await resendRes.text();
            console.error(`[send-email-campaign] Failed for ${email}: ${errBody}`);
          }
        } catch (err) {
          console.error(`[send-email-campaign] Error sending to ${email}:`, err);
        }
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Update trigger stats
    await supabase
      .from("email_triggers")
      .update({
        last_sent_at: new Date().toISOString(),
        sent_count: (trigger.sent_count || 0) + sentCount,
        fire_count: (trigger.fire_count || 0) + 1,
        last_fired_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", trigger_id);

    return new Response(
      JSON.stringify({ success: true, sent_count: sentCount, total_recipients: recipients.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[send-email-campaign] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
