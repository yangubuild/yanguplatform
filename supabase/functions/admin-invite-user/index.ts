import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("authorization") ?? "";

    // 1. Verify caller identity
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

    // 2. Verify caller is owner or admin
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

    // 3. Parse request
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

    const cleanEmail = email.toLowerCase().trim();

    // 4. Insert into admin_invites (upsert pending)
    const { data: invite, error: inviteErr } = await adminClient
      .from("admin_invites")
      .upsert(
        {
          email: cleanEmail,
          role,
          invited_by: user.id,
          status: "pending",
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "email,role",
          ignoreDuplicates: false,
        }
      )
      .select("id")
      .single();

    if (inviteErr) {
      console.error("Failed to upsert admin_invite:", inviteErr);
      // If unique constraint error on pending, return friendly message
      if (inviteErr.message?.includes("admin_invites_unique_pending")) {
        return new Response(
          JSON.stringify({ error: "A pending invite already exists for this email and role" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw inviteErr;
    }

    // 5. Use Supabase Auth admin invite — creates user in auth.users & triggers
    //    the auth-email-hook which sends the branded invite email via noreply@yangu.io
    const { data: authInvite, error: authInviteErr } =
      await adminClient.auth.admin.inviteUserByEmail(cleanEmail, {
        redirectTo: `https://yangu.io/auth/login?invite=${invite?.id}`,
        data: {
          invited_role: role,
          invite_id: invite?.id,
        },
      });

    if (authInviteErr) {
      // If user already exists, that's OK — the invite record is still created
      // and accept_pending_invite will assign the role on next login
      if (
        authInviteErr.message?.includes("already been registered") ||
        authInviteErr.message?.includes("already exists")
      ) {
        console.log("User already exists, invite record created for role assignment on login");
        return new Response(
          JSON.stringify({
            success: true,
            invite_id: invite?.id,
            user_exists: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.error("auth.admin.inviteUserByEmail error:", authInviteErr);
      throw authInviteErr;
    }

    console.log("Invite sent successfully", {
      invite_id: invite?.id,
      auth_user_id: authInvite?.user?.id,
      email: cleanEmail,
      role,
    });

    return new Response(
      JSON.stringify({
        success: true,
        invite_id: invite?.id,
        auth_user_id: authInvite?.user?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("admin-invite-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
