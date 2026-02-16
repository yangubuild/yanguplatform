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

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Verify caller is owner/admin
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authErr,
    } = await userClient.auth.getUser();

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const callerRoles = (roles ?? []).map((r: any) => r.role);
    if (!callerRoles.includes("owner") && !callerRoles.includes("admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, role } = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "email and role are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Look up the pending invite to get token (invite ID)
    const { data: invite, error: inviteErr } = await adminClient
      .from("admin_invites")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (inviteErr || !invite) {
      console.error("Could not find pending invite for", email, inviteErr);
      throw new Error("No pending invite found for this email");
    }

    const inviteToken = invite.id;
    const inviteLink = `https://yangu.io/auth/login?invite=${inviteToken}`;

    // Send email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Yangu <noreply@yangu.com>",
        to: [email],
        subject: `You've been invited to join the Yangu team`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#141414;border-radius:16px;border:1px solid #222;overflow:hidden;">
    <div style="padding:32px 32px 24px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">You're Invited 🎉</h1>
      <p style="color:#999;font-size:14px;margin:0;">You've been invited to join the Yangu management team.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="background:#1a1a1a;border-radius:12px;padding:20px;border:1px solid #2a2a2a;">
        <p style="color:#ccc;font-size:14px;margin:0 0 4px;">Role assigned</p>
        <p style="color:#fff;font-size:18px;font-weight:600;margin:0;text-transform:capitalize;">${role}</p>
      </div>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <p style="color:#999;font-size:13px;margin:0 0 16px;">
        Sign up or log in with <strong style="color:#fff;">${email}</strong> and your role will be assigned automatically.
      </p>
      <a href="${inviteLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
        Get Started
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #222;text-align:center;">
      <p style="color:#555;font-size:11px;margin:0;">Yangu · Powered by innovation</p>
    </div>
  </div>
</body>
</html>
        `.trim(),
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend error:", errBody);
      throw new Error(`Resend API error: ${resendRes.status}`);
    }

    const resendData = await resendRes.json();

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-invite-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
