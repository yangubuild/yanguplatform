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

    const body = await req.json();
    const { provider = "heygen", payload } = body;

    const providerKeys: Record<string, string> = {
      heygen: "HEYGEN_API_KEY",
      did: "DID_API_KEY",
      creatify: "CREATIFY_API_KEY",
    };

    const apiKeyEnv = providerKeys[provider];
    const apiKey = apiKeyEnv ? Deno.env.get(apiKeyEnv) : null;

    if (!apiKey) {
      // No API key — insert blocked job
      const { data: job, error: insertErr } = await supabase
        .from("avatar_training_jobs")
        .insert({
          user_id: user.id,
          provider,
          payload: payload || {},
          status: "not_enabled",
          error: `Avatar training is not enabled for provider "${provider}". The API key is not configured.`,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Insert error:", insertErr);
        return new Response(JSON.stringify({ error: "Failed to create training job" }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify({
        job,
        training_available: false,
        message: `Avatar training is not enabled. The "${provider}" API key is not configured.`,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── HeyGen Training Flow ───
    if (provider === "heygen") {
      // Step 1: Create photo avatar group
      const createGroupRes = await fetch("https://api.heygen.com/v2/photo_avatar/avatar_group/create", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          name: payload?.name || `Avatar-${Date.now()}`,
        }),
      });

      const createGroupData = await createGroupRes.json();
      console.log("HeyGen create group response:", JSON.stringify(createGroupData));

      if (!createGroupRes.ok || createGroupData?.error) {
        const errMsg = createGroupData?.error?.message || createGroupData?.message || "Failed to create avatar group";
        const { data: job } = await supabase
          .from("avatar_training_jobs")
          .insert({
            user_id: user.id,
            provider,
            payload: { ...payload, heygen_error: createGroupData },
            status: "failed",
            error: errMsg,
          })
          .select()
          .single();

        return new Response(JSON.stringify({ job, error: errMsg }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const groupId = createGroupData?.data?.group_id;

      // Step 2: Add image/video look to the group if we have an upload URL
      if (payload?.image_url) {
        const addLookRes = await fetch("https://api.heygen.com/v2/photo_avatar/avatar_group/add", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            group_id: groupId,
            image_url: payload.image_url,
          }),
        });
        const addLookData = await addLookRes.json();
        console.log("HeyGen add look response:", JSON.stringify(addLookData));
      }

      // Step 3: Train the group
      const trainRes = await fetch("https://api.heygen.com/v2/photo_avatar/train", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ group_id: groupId }),
      });

      const trainData = await trainRes.json();
      console.log("HeyGen train response:", JSON.stringify(trainData));

      const initialStatus = trainRes.ok ? "pending" : "failed";
      const trainError = trainRes.ok ? null : (trainData?.error?.message || trainData?.message || "Training request failed");

      const { data: job, error: insertErr } = await supabase
        .from("avatar_training_jobs")
        .insert({
          user_id: user.id,
          provider,
          payload: { ...payload, group_id: groupId, train_response: trainData },
          status: initialStatus,
          error: trainError,
          avatar_id: groupId,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Insert error:", insertErr);
        return new Response(JSON.stringify({ error: "Failed to create training job" }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify({
        job,
        training_available: true,
        message: trainRes.ok ? "Training started! This may take several minutes." : trainError,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── Other providers: not yet implemented ───
    const { data: job, error: insertErr } = await supabase
      .from("avatar_training_jobs")
      .insert({
        user_id: user.id,
        provider,
        payload: payload || {},
        status: "not_enabled",
        error: `Training endpoint for "${provider}" is not yet implemented.`,
      })
      .select()
      .single();

    if (insertErr) {
      return new Response(JSON.stringify({ error: "Failed to create training job" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      job,
      training_available: false,
      message: `Training for "${provider}" is not yet implemented.`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("avatar-train-start error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
