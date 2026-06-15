import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";

type LogoRequestBody = Record<string, unknown>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorJson(error: string, status = 200, code = "unknown_error") {
  return json({ ok: false, error, code }, status);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) return null;
  if (raw.length === 4) {
    const [, r, g, b] = raw;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return raw.toLowerCase();
}

function uniqueColors(colors: string[]): string[] {
  return [...new Set(colors.map((v) => v.toLowerCase()))];
}

function isCafeContext(category: string, businessType: string, menuType?: string): boolean {
  const text = [category, businessType, menuType].filter(Boolean).join(" ").toLowerCase();
  return ["cafe", "coffee", "tea", "espresso", "latte"].some((t) => text.includes(t));
}

const FOOD_BLOCKED = ["plate", "fork", "spoon", "grill", "serving dome", "cutlery", "chef hat", "flame", "burger", "pizza", "coffee cup", "tea cup", "coffee bean", "restaurant", "food"];

function getSymbolPolicy(category: string, businessType: string, menuType?: string): { allowed: string[]; blocked: string[] } {
  const cat = (category || "").toLowerCase();
  const isCafe = isCafeContext(category, businessType, menuType);
  // Emenu / food categories
  if (cat === "emenu" || cat === "restaurant" || cat === "cafe" || cat === "fine_dining" || isCafe) {
    if (isCafe) {
      return {
        allowed: ["coffee cup", "steam", "bean", "pastry", "cup and saucer"],
        blocked: ["camera", "house", "car", "electronics", "rocket"],
      };
    }
    return {
      allowed: ["plate", "fork", "spoon", "grill", "dish", "serving dome", "cutlery", "flame", "chef hat", "cloche"],
      blocked: ["camera", "house", "car", "electronics", "rocket", "coffee cup", "tea cup", "coffee bean"],
    };
  }
  if (cat === "eshop") {
    return {
      allowed: ["shopping bag", "cart", "price tag", "star", "gift box", "hanger", "store front"],
      blocked: [...FOOD_BLOCKED, "warehouse", "pallet", "factory"],
    };
  }
  if (cat === "estore") {
    return {
      allowed: ["shipping box", "warehouse", "handshake", "bar chart", "pallet", "truck", "factory", "weight scale"],
      blocked: [...FOOD_BLOCKED],
    };
  }
  if (cat === "esite") {
    return {
      allowed: ["briefcase", "office building", "calendar", "phone handset", "compass", "diploma", "graph", "target"],
      blocked: [...FOOD_BLOCKED],
    };
  }
  if (cat === "influencer") {
    return {
      allowed: ["sparkle", "star", "heart", "camera", "microphone", "play button"],
      blocked: [...FOOD_BLOCKED],
    };
  }
  if (cat === "community") {
    return {
      allowed: ["people group", "hands together", "circle of figures", "shield emblem", "flag"],
      blocked: [...FOOD_BLOCKED],
    };
  }
  // Default neutral business
  return {
    allowed: ["abstract mark", "monogram", "geometric shape", "wordmark"],
    blocked: [...FOOD_BLOCKED],
  };
}

function getFileExtension(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "png";
}

async function parseRequestBody(req: Request): Promise<LogoRequestBody> {
  const rawBody = await req.text();
  if (!rawBody.trim()) throw new Error("Request body is required");

  const parsed = JSON.parse(rawBody);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object");
  }

  return parsed as LogoRequestBody;
}

function extractGeneratedImageUrl(aiData: any): string | null {
  const b64Image = typeof aiData?.data?.[0]?.b64_json === "string"
    ? `data:image/png;base64,${aiData.data[0].b64_json}`
    : null;

  const candidates = [
    aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url,
    aiData?.choices?.[0]?.message?.images?.[0]?.image_url,
    aiData?.choices?.[0]?.message?.image_url?.url,
    aiData?.choices?.[0]?.message?.image_url,
    aiData?.data?.[0]?.url,
    b64Image,
  ];

  return candidates.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;
}

async function resolveImageAsset(imageUrl: string): Promise<{ bytes: Uint8Array; contentType: string; extension: string }> {
  const dataUrlMatch = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (dataUrlMatch) {
    const contentType = dataUrlMatch[1].toLowerCase();
    const base64Data = dataUrlMatch[2];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    return { bytes, contentType, extension: getFileExtension(contentType) };
  }

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "image/png";
  if (!contentType.startsWith("image/")) throw new Error(`Invalid generated image content type: ${contentType}`);

  return { bytes: new Uint8Array(buffer), contentType, extension: getFileExtension(contentType) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();

  if (req.method !== "POST") {
    return errorJson("Method not allowed", 405, "method_not_allowed");
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error(`[generate-logo][${requestId}] Missing backend config`, {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasAnonKey: Boolean(anonKey),
        hasServiceRoleKey: Boolean(serviceRoleKey),
      });
      return errorJson("Server configuration error", 500, "missing_backend_config");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorJson("Auth required", 401, "auth_required");
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authErr,
    } = await userClient.auth.getUser();

    if (authErr || !user) {
      console.error(`[generate-logo][${requestId}] Auth failed:`, authErr);
      return errorJson("Auth required", 401, "auth_required");
    }

    let body: LogoRequestBody;
    try {
      body = await parseRequestBody(req);
    } catch (parseError) {
      console.error(`[generate-logo][${requestId}] Request parse failed:`, parseError);
      return errorJson(
        parseError instanceof Error ? parseError.message : "Invalid request payload",
        400,
        "invalid_request_payload",
      );
    }

    const businessName = normalizeString(body.businessName) || normalizeString(body.business_name) || "My Restaurant";
    const slogan = normalizeString(body.slogan) || normalizeString(body.tagline) || "";
    const category = normalizeString(body.category) || "restaurant";
    const businessType = normalizeString(body.businessType) || normalizeString(body.business_type) || "restaurant";
    const menuType = normalizeString(body.menuType) || normalizeString(body.menu_type) || "";
    const style = normalizeString(body.style) || "clean professional food brand logo";

    const palette = uniqueColors(
      [normalizeColor(body.color), ...(Array.isArray(body.palette) ? body.palette.map(normalizeColor) : [])].filter(Boolean) as string[],
    );
    const primaryColor = palette[0] || "#b5622a";

    const { allowed, blocked } = getSymbolPolicy(category, businessType, menuType);

    const sloganRule = slogan
      ? `Include this exact slogan: "${slogan}".`
      : "Do NOT include any slogan, tagline, or subtitle text.";

    const isFoodCat = ["emenu", "restaurant", "cafe", "fine_dining"].includes((category || "").toLowerCase()) || isCafeContext(category, businessType, menuType);
    const negativeFoodRule = isFoodCat
      ? ""
      : "Do NOT use food, fork, plate, spoon, chef hat, cloche, burger, pizza, coffee, restaurant, or any culinary imagery.";

    const prompt = [
      `Create a professional logo for "${businessName}".`,
      `Display ONLY the exact text "${businessName}" — no other text, no placeholder text, no "Lorem Ipsum", no "Your Logo Name".`,
      sloganRule,
      `Business category: ${category}. Business type: ${businessType}${menuType ? ` / ${menuType}` : ""}.`,
      `Style: ${style}.`,
      `Use ONLY these symbols: ${allowed.join(", ")}. NEVER use: ${blocked.join(", ")}.`,
      negativeFoodRule,
      `Primary color: ${primaryColor}. Palette: ${palette.join(", ")}. Use only these colors plus black/white/gray neutrals.`,
      "Typography: clean, readable, balanced, professional.",
      "BACKGROUND: Fully transparent (alpha=0). No white, gray, colored, or gradient background. No shapes behind the logo. Logo elements float on pure transparency. Output as transparent PNG.",
    ].filter(Boolean).join(" ");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      console.error(`[generate-logo][${requestId}] Missing LOVABLE_API_KEY`);
      return errorJson("AI not configured", 500, "missing_ai_config");
    }

    let aiResponse: Response;
    try {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          temperature: 0.3,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });
    } catch (providerError) {
      console.error(`[generate-logo][${requestId}] AI request failed:`, providerError);
      return errorJson("AI generation failed", 200, "provider_request_failed");
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text().catch(() => "");
      console.error(`[generate-logo][${requestId}] AI error ${aiResponse.status}:`, errText);

      if (aiResponse.status === 402) {
        return errorJson("AI credits exhausted. Please try again later.", 200, "credits_exhausted");
      }

      return errorJson("AI generation failed", 200, "provider_error");
    }

    let aiData: any;
    try {
      aiData = await aiResponse.json();
    } catch (responseParseError) {
      console.error(`[generate-logo][${requestId}] AI response parse failed:`, responseParseError);
      return errorJson("AI returned an invalid response", 200, "invalid_provider_response");
    }

    const imageUrl = extractGeneratedImageUrl(aiData);
    if (!imageUrl) {
      console.error(`[generate-logo][${requestId}] No image in AI response:`, aiData);
      return errorJson("No image generated", 200, "missing_image_url");
    }

    let asset: { bytes: Uint8Array; contentType: string; extension: string };
    try {
      asset = await resolveImageAsset(imageUrl);
    } catch (assetError) {
      console.error(`[generate-logo][${requestId}] Generated image processing failed:`, assetError);
      return errorJson("Generated image could not be processed", 200, "invalid_generated_image");
    }

    try {
      const admin = createClient(supabaseUrl, serviceRoleKey);
      const path = `${user.id}/logos/${Date.now()}-${crypto.randomUUID()}-ai-logo.${asset.extension}`;

      const { error: uploadErr } = await admin.storage
        .from("builder-media")
        .upload(path, asset.bytes, { contentType: asset.contentType, upsert: false });

      if (uploadErr) {
        console.error(`[generate-logo][${requestId}] Upload error:`, uploadErr);
        return errorJson("Upload failed", 200, "storage_upload_failed");
      }

      const { data: publicData } = admin.storage.from("builder-media").getPublicUrl(path);
      if (!publicData?.publicUrl) {
        console.error(`[generate-logo][${requestId}] Public URL missing for storage path:`, path);
        return errorJson("Upload failed", 200, "missing_public_url");
      }

      return json({
        ok: true,
        image_url: publicData.publicUrl,
        logo_url: publicData.publicUrl,
        source: "ai_generated",
        storage_path: path,
        business_name: businessName,
        category,
      });
    } catch (storageError) {
      console.error(`[generate-logo][${requestId}] Storage step failed:`, storageError);
      return errorJson("Upload failed", 200, "storage_upload_failed");
    }
  } catch (e) {
    console.error(`[generate-logo][${requestId}] Unhandled error:`, e);
    return errorJson(e instanceof Error ? e.message : "Unknown error", 500, "unexpected_error");
  }
});
