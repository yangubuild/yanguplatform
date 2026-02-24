import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const url = new URL(req.url);
    const jobId = url.searchParams.get("job_id");

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const heygenApiKey = Deno.env.get("HEYGEN_API_KEY");

    if (jobId) {
      // Get specific job
      const { data: job, error } = await supabase
        .from("avatar_training_jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .single();

      if (error || !job) {
        return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: corsHeaders });
      }

      // If pending/processing and HeyGen key available, poll HeyGen for status
      if (heygenApiKey && job.provider === "heygen" && (job.status === "pending" || job.status === "processing")) {
        const payload = job.payload as Record<string, unknown>;
        const groupId = payload?.group_id as string || job.avatar_id;

        if (groupId) {
          try {
            const statusRes = await fetch(`https://api.heygen.com/v2/photo_avatar/avatar_group/${groupId}`, {
              headers: {
                "accept": "application/json",
                "x-api-key": heygenApiKey,
              },
            });

            const statusData = await statusRes.json();
            console.log("HeyGen group status:", JSON.stringify(statusData));

            const trainingStatus = statusData?.data?.status;

            if (trainingStatus === "completed" || trainingStatus === "trained") {
              await supabase
                .from("avatar_training_jobs")
                .update({
                  status: "completed",
                  avatar_id: groupId,
                })
                .eq("id", jobId);

              return new Response(JSON.stringify({
                job: { ...job, status: "completed", avatar_id: groupId },
              }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            if (trainingStatus === "failed") {
              const errMsg = statusData?.data?.error || "Training failed at provider";
              await supabase
                .from("avatar_training_jobs")
                .update({ status: "failed", error: errMsg })
                .eq("id", jobId);

              return new Response(JSON.stringify({
                job: { ...job, status: "failed", error: errMsg },
              }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            // Still processing — update status
            if (job.status === "pending") {
              await supabase
                .from("avatar_training_jobs")
                .update({ status: "processing" })
                .eq("id", jobId);
            }

            return new Response(JSON.stringify({
              job: { ...job, status: "processing" },
              heygen_status: trainingStatus,
            }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          } catch (pollErr) {
            console.error("HeyGen poll error:", pollErr);
          }
        }
      }

      return new Response(JSON.stringify({ job }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // List all jobs for user
    const { data: jobs, error } = await supabase
      .from("avatar_training_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return new Response(JSON.stringify({ jobs: jobs || [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("avatar-train-status error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
