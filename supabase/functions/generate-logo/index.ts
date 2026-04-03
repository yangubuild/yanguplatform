import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Category-aware symbol mapping
const CATEGORY_SYMBOLS: Record<string, string> = {
  restaurant: "plate, fork, knife, chef hat, dining table",
  cafe: "coffee cup, steam, beans, pastry, latte art",
  fast_food: "burger, fries, hot dog, takeaway box, flame grill",
  fine_dining: "wine glass, elegant plate, candelabra, fine cutlery",
  bakery: "bread loaf, wheat, croissant, rolling pin, oven",
  juice_bar: "fruit, smoothie glass, citrus slice, blender",
  pizza: "pizza slice, oven, cheese wheel, Italian flag",
  grill: "flame, grill grate, steak, smoke, BBQ tongs",
  catering: "serving dome, buffet tray, chef hat, banquet table",
  dessert: "cupcake, ice cream cone, macaron, whisk",
  seafood: "fish, wave, anchor, shrimp, shell",
  default: "plate, fork, spoon, chef hat, food dish",
};

function getCategorySymbols(category: string, businessType: string): string {
  const key = category?.toLowerCase() || "";
  const typeKey = businessType?.toLowerCase() || "";
  // Check businessType first for more specific match
  for (const [k, v] of Object.entries(CATEGORY_SYMBOLS)) {
    if (typeKey.includes(k) || key.includes(k)) return v;
  }
  return CATEGORY_SYMBOLS.default;
}

function getNegativePrompt(category: string, businessType: string): string {
  const lower = (category + " " + businessType).toLowerCase();
  const negatives: string[] = [];
  // Prevent coffee visuals for non-cafe businesses
  if (!lower.includes("cafe") && !lower.includes("coffee") && !lower.includes("tea")) {
    negatives.push("no coffee cups", "no tea cups", "no coffee beans");
  }
  if (!lower.includes("pizza")) {
    negatives.push("no pizza");
  }
  if (!lower.includes("sushi") && !lower.includes("japanese")) {
    negatives.push("no chopsticks", "no sushi");
  }
  return negatives.length > 0 ? ` AVOID: ${negatives.join(", ")}.` : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, error: "Auth required" }, 401);
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: authUser }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUser) return json({ ok: false, error: "Auth required" }, 401);
    const userId = authUser.id;

    const { prompt, businessName, category, businessType, color, style } = await req.json();

    // Build context-aware prompt
    const name = businessName || "My Restaurant";
    const cat = category || "emenu";
    const bType = businessType || "restaurant";
    const brandColor = color || "#b5622a";
    const symbols = getCategorySymbols(cat, bType);
    const negatives = getNegativePrompt(cat, bType);
    const styleHint = style || "modern minimalist";

    const fullPrompt = prompt || `Create a professional ${styleHint} logo for a ${bType} called "${name}". 
The logo MUST use ONLY these food/restaurant symbols as design elements: ${symbols}.${negatives}
Primary brand color: ${brandColor}. 
CRITICAL: The logo MUST have a completely transparent background (PNG with alpha channel). No white background, no colored background, no background at all.
The text "${name}" must be clearly readable and integrated into the design.
Output a clean, high-resolution professional restaurant brand logo suitable for digital menu headers and mobile screens.`;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ ok: false, error: "AI not configured" }, 500);

    // Generate with retry logic for validation
    let imageUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (!imageUrl && attempts < maxAttempts) {
      attempts++;
      const retryHint = attempts > 1 ? " Make sure the logo symbols match the business type exactly. Do NOT use unrelated food symbols." : "";

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: fullPrompt + retryHint }],
          modalities: ["image", "text"],
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error(`[generate-logo] AI error (attempt ${attempts}):`, aiRes.status, errText);
        if (attempts >= maxAttempts) return json({ ok: false, error: "Image generation failed" }, 502);
        continue;
      }

      const aiData = await aiRes.json();
      const base64Url = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!base64Url) {
        console.error(`[generate-logo] No image (attempt ${attempts}):`, JSON.stringify(aiData).slice(0, 500));
        if (attempts >= maxAttempts) return json({ ok: false, error: "No image returned" }, 502);
        continue;
      }
      imageUrl = base64Url;
    }

    if (!imageUrl) return json({ ok: false, error: "Generation failed after retries" }, 502);

    // Upload to builder-media bucket
    const base64Data = imageUrl.split(",")[1];
    if (!base64Data) return json({ ok: false, error: "Invalid image data" }, 502);

    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const timestamp = Date.now();
    const path = `${userId}/logos/${timestamp}-ai-logo.png`;
    const { error: uploadErr } = await admin.storage
      .from("builder-media")
      .upload(path, bytes, { contentType: "image/png", upsert: false });

    if (uploadErr) {
      console.error("[generate-logo] Upload error:", uploadErr);
      return json({ ok: false, error: "Upload failed" }, 500);
    }

    const { data: publicData } = admin.storage.from("builder-media").getPublicUrl(path);

    return json({
      ok: true,
      image_url: publicData.publicUrl,
      source: "ai_generated",
      storage_path: path,
      business_name: name,
      category: cat,
    });
  } catch (e) {
    console.error("[generate-logo] error:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
