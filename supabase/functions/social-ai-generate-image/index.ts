import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { prompt, model = "google/gemini-3.1-flash-image-preview", aspect_ratio = "4:5" } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "missing_prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullPrompt = `Generate a high-quality social media post image. Aspect ratio: ${aspect_ratio}. 

${prompt}

Important: Create a polished, professional social media creative. Not a photograph — a designed post with visual hierarchy, clean layout, and eye-catching graphics.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await aiRes.text();
      console.error("AI error:", status, text);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If it's base64, upload to Supabase Storage for a persistent URL
    if (imageUrl.startsWith("data:image/")) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, supabaseKey);

        const base64Data = imageUrl.split(",")[1];
        const mimeMatch = imageUrl.match(/data:(image\/\w+);/);
        const ext = mimeMatch ? mimeMatch[1].split("/")[1] : "png";
        const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const fileName = `social-ai/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await sb.storage
          .from("social-media")
          .upload(fileName, bytes, { contentType: mimeMatch?.[1] || "image/png", upsert: true });

        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          // Fall back to returning the base64 URL
          return new Response(JSON.stringify({ image_url: imageUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: publicData } = sb.storage.from("social-media").getPublicUrl(fileName);
        return new Response(JSON.stringify({ image_url: publicData.publicUrl, storage_path: fileName }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (storageErr) {
        console.error("Storage error:", storageErr);
        // Fall back to base64
        return new Response(JSON.stringify({ image_url: imageUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ image_url: imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-ai-generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
