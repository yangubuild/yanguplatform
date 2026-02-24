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

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { ad_image_url, competitor_url, studio_project_id } = body;

    if (!ad_image_url) {
      return new Response(JSON.stringify({ error: "ad_image_url is required" }), { status: 400, headers: corsHeaders });
    }

    // Step 1: Analyze ad image using Gemini vision
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI provider not configured" }), { status: 500, headers: corsHeaders });
    }

    const analysisPrompt = `You are an expert advertising analyst. Analyze this ad image and return a structured JSON object with the following fields:
- offer: The main offer or value proposition (string)
- copy: The primary ad copy text visible (string)  
- headline: The headline text (string)
- cta_text: The call-to-action text (string)
- layout_summary: Brief description of the layout structure (string)
- colors: Array of dominant colors described as names (string[])
- format: One of "square", "story", "landscape", "portrait" (string)
- style_notes: Brief notes on visual style, fonts, effects (string)
- brand_name: The brand name if visible (string or null)

Return ONLY valid JSON, no markdown.`;

    const geminiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: [
            { type: "text", text: analysisPrompt },
            { type: "image_url", image_url: { url: ad_image_url } },
          ] },
        ],
        max_tokens: 1500,
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini analysis failed:", errText);
      return new Response(JSON.stringify({ error: "AI analysis failed", details: errText }), { status: 500, headers: corsHeaders });
    }

    const geminiData = await geminiRes.json();
    const rawAnalysis = geminiData.choices?.[0]?.message?.content || "{}";

    // Parse analysis JSON (strip markdown fences if present)
    let analysis: Record<string, unknown>;
    try {
      const cleaned = rawAnalysis.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { raw: rawAnalysis, error: "Could not parse structured analysis" };
    }

    // Step 2: Fetch brand_blueprint if project provided
    let brandContext = "";
    if (studio_project_id) {
      const { data: project } = await supabase
        .from("studio_projects")
        .select("brand_blueprint, brand_name, brand_description")
        .eq("id", studio_project_id)
        .single();

      if (project?.brand_blueprint) {
        const bp = project.brand_blueprint as Record<string, unknown>;
        brandContext = `\nBrand: ${project.brand_name || ""}. ${bp.tone ? `Tone: ${bp.tone}.` : ""} ${bp.colors ? `Colors: ${JSON.stringify(bp.colors)}.` : ""}`;
      }
    }

    // Step 3: Generate recreated ad variations using Gemini image generation
    const recreationPrompt = `Create a professional advertising image that recreates this concept:
Headline: ${(analysis as any).headline || ""}
Offer: ${(analysis as any).offer || ""}
CTA: ${(analysis as any).cta_text || ""}
Style: ${(analysis as any).style_notes || ""}
Format: ${(analysis as any).format || "square"}
${brandContext}

Make it look professional, modern, and high-converting. Use bold typography and clear visual hierarchy.`;

    // Generate 2 variations
    const variations: Array<{ variation_index: number; file_url: string | null; metadata: Record<string, unknown> }> = [];

    for (let i = 0; i < 2; i++) {
      try {
        const imgRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [
              { role: "user", content: `${recreationPrompt}\n\nVariation ${i + 1}: ${i === 0 ? "Bold and direct style" : "Clean and minimal style"}` },
            ],
            max_tokens: 2000,
          }),
        });

        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const content = imgData.choices?.[0]?.message?.content;
          // Check for inline image data
          const parts = imgData.choices?.[0]?.message?.parts || [];
          const imagePart = parts.find((p: any) => p.inline_data?.mime_type?.startsWith("image/"));

          variations.push({
            variation_index: i,
            file_url: imagePart ? `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}` : null,
            metadata: { prompt: recreationPrompt, style: i === 0 ? "bold" : "minimal", content_preview: content?.substring(0, 200) },
          });
        }
      } catch (e) {
        console.error(`Variation ${i} generation failed:`, e);
        variations.push({ variation_index: i, file_url: null, metadata: { error: String(e) } });
      }
    }

    // Step 4: Save to studio_assets if project provided
    const savedAssets: unknown[] = [];
    if (studio_project_id) {
      for (const v of variations) {
        const { data: asset, error: insertErr } = await supabase
          .from("studio_assets")
          .insert({
            user_id: user.id,
            project_id: studio_project_id,
            asset_type: "image",
            title: `Ad Clone - Variation ${v.variation_index + 1}`,
            file_url: v.file_url,
            generation_prompt: recreationPrompt,
            variation_index: v.variation_index,
            metadata: { source: "ad-clone", analysis, ...v.metadata },
          })
          .select()
          .single();

        if (asset) savedAssets.push(asset);
        if (insertErr) console.error("Insert error:", insertErr);
      }
    }

    return new Response(JSON.stringify({
      analysis,
      variations,
      saved_assets: savedAssets,
      competitor_url: competitor_url || null,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("ad-clone-analyze error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
