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

    const {
      prompt,
      model = "google/gemini-3.1-flash-image-preview",
      aspect_ratio = "4:5",
      mode = "generate",          // "generate" | "edit_template"
      template_image_url,         // URL of template to edit
      brand_colors = [],
      business_name = "",
      content_goal = "",
    } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "missing_prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages array based on mode
    let messages: any[];

    if (mode === "edit_template" && template_image_url) {
      // TEMPLATE EDITING MODE — edit existing template image
      const editPrompt = `You are a professional social media designer. You are given an existing social media design template.

Your task: EDIT this template while PRESERVING its layout, composition, and visual structure.

MODIFICATIONS TO MAKE:
${prompt}

${brand_colors.length > 0 ? `Apply these brand colors: ${brand_colors.join(", ")}` : ""}
${business_name ? `Business name: "${business_name}"` : ""}
${content_goal ? `Content goal: ${content_goal}` : ""}

CRITICAL RULES:
- KEEP the exact same layout structure and element positions
- KEEP the same visual hierarchy and composition
- ONLY modify: text content, colors, and swap images if instructed
- Do NOT redesign from scratch — this is an EDIT of the existing template
- Do NOT move or resize elements
- Preserve all decorative elements, shapes, and patterns
- The output should look like the same template with customized content
- Make all text legible and professional
- Maintain the same aspect ratio`;

      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: editPrompt },
            { type: "image_url", image_url: { url: template_image_url } },
          ],
        },
      ];
    } else {
      // STANDARD GENERATION MODE (fallback)
      const fullPrompt = `You are a professional social media graphic designer. Generate a high-quality designed social media post image.

Aspect ratio: ${aspect_ratio}

${prompt}

DESIGN RULES:
- Create a polished, professional social media CREATIVE DESIGN — not a photograph
- Use strong visual hierarchy: headline, supporting text, and visual elements
- Apply clean typography — readable, modern, and well-spaced
- Use bold, cohesive color blocking and shapes
- Include relevant icons, patterns, or abstract elements that reinforce the message
- Keep text on the image minimal (2-3 impactful lines maximum)
- Make it scroll-stopping — this should look like a premium branded post
- NO random or unrelated text — every word must relate to the topic
- NO stock photo look — this should look DESIGNED, like a Canva/Adobe Express output
- Ensure all text is fully legible against the background`;

      messages = [{ role: "user", content: fullPrompt }];
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
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
