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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const shotstackApiKey = Deno.env.get("SHOTSTACK_API_KEY");
    const shotstackEnv = Deno.env.get("SHOTSTACK_ENV") || "stage";

    if (!shotstackApiKey) {
      return new Response(JSON.stringify({ error: "Shotstack API key not configured" }), { status: 500, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const jobId = url.searchParams.get("job_id");

    if (!jobId) {
      return new Response(JSON.stringify({ error: "job_id is required" }), { status: 400, headers: corsHeaders });
    }

    // Fetch the job from DB
    const { data: job, error: jobErr } = await supabase
      .from("ai_video_generations")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: corsHeaders });
    }

    const params = job.params as Record<string, unknown>;
    const renderId = params?.render_id as string;

    if (!renderId) {
      return new Response(JSON.stringify({ job, status: job.status }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // If already done, return cached result
    if (job.status === "completed" || job.status === "failed") {
      return new Response(JSON.stringify({
        job,
        status: job.status,
        video_url: (job.result_videos as any)?.[0]?.url || null,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Poll Shotstack
    const statusRes = await fetch(`https://api.shotstack.io/${shotstackEnv}/render/${renderId}`, {
      headers: { "x-api-key": shotstackApiKey },
    });

    const statusData = await statusRes.json();
    const renderStatus = statusData?.response?.status;
    const videoUrl = statusData?.response?.url;

    if (renderStatus === "done" && videoUrl) {
      // Update DB
      await supabase
        .from("ai_video_generations")
        .update({
          status: "completed",
          result_videos: [{ url: videoUrl, format: "mp4" }],
        })
        .eq("id", jobId);

      return new Response(JSON.stringify({
        status: "completed",
        video_url: videoUrl,
        job_id: jobId,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (renderStatus === "failed") {
      const errorMsg = statusData?.response?.error || "Render failed";
      await supabase
        .from("ai_video_generations")
        .update({ status: "failed", error: errorMsg })
        .eq("id", jobId);

      return new Response(JSON.stringify({
        status: "failed",
        error: errorMsg,
        job_id: jobId,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Still processing
    return new Response(JSON.stringify({
      status: "processing",
      shotstack_status: renderStatus,
      job_id: jobId,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("video-render-status error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
