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

    const body = await req.json();
    const { timeline, output } = body;

    // Build Shotstack payload from editor data
    const shotstackPayload = {
      timeline: timeline || {
        background: "#000000",
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "title",
                  text: "Video Preview",
                  style: "minimal",
                },
                start: 0,
                length: 5,
              },
            ],
          },
        ],
      },
      output: output || {
        format: "mp4",
        resolution: "hd",
        aspectRatio: "9:16",
      },
    };

    // POST to Shotstack render endpoint
    const renderRes = await fetch(`https://api.shotstack.io/${shotstackEnv}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": shotstackApiKey,
      },
      body: JSON.stringify(shotstackPayload),
    });

    const renderData = await renderRes.json();

    if (!renderRes.ok) {
      console.error("Shotstack render error:", renderData);
      return new Response(JSON.stringify({ error: "Shotstack render failed", details: renderData }), { status: 500, headers: corsHeaders });
    }

    const renderId = renderData?.response?.id;

    // Store render job in ai_video_generations table
    const { data: job, error: insertErr } = await supabase
      .from("ai_video_generations")
      .insert({
        user_id: user.id,
        provider: "shotstack",
        prompt: body.title || "Video Editor Export",
        params: { render_id: renderId, shotstack_env: shotstackEnv, editor_payload: body },
        status: "processing",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to store render job" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      success: true,
      render_id: renderId,
      job_id: job.id,
      message: "Render started successfully",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("video-render-start error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
