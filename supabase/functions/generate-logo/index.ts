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

const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";

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

function getAllowedSymbols(isCafe: boolean): string[] {
  if (isCafe) return ["coffee cup", "steam", "bean", "pastry", "cup and saucer"];
  return ["plate", "fork", "spoon", "grill", "dish", "serving dome", "cutlery", "flame"];
}

function getBlockedSymbols(isCafe: boolean): string[] {
  const blocked = ["camera", "house", "car", "electronics", "flower", "rocket"];
  if (!isCafe) blocked.push("coffee cup", "tea cup", "coffee bean");
  return blocked;
}

function getFileExtension(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "png";
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
  return { bytes: new Uint8Array(buffer), contentType, extension: getFileExtension(contentType) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ ok: false, error: "Auth required" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ ok: false, error: "Auth required" }, 401);

    const body = await req.json();
    const businessName = normalizeString(body.businessName) || normalizeString(body.business_name) || "My Restaurant";
    const slogan = normalizeString(body.slogan) || normalizeString(body.tagline) || "";
    const category = normalizeString(body.category) || "restaurant";
    const businessType = normalizeString(body.businessType) || normalizeString(body.business_type) || "restaurant";
    const menuType = normalizeString(body.menuType) || normalizeString(body.menu_type) || "";
    const style = normalizeString(body.style) || "clean professional food brand logo";

    const palette = uniqueColors(
      [normalizeColor(body.color), ...(Array.isArray(body.palette) ? body.palette.map(normalizeColor) : [])].filter(Boolean) as string[]
    );
    const primaryColor = palette[0] || "#b5622a";

    const isCafe = isCafeContext(category, businessType, menuType);
    const allowed = getAllowedSymbols(isCafe);
    const blocked = getBlockedSymbols(isCafe);

    const sloganRule = slogan
      ? `Include this exact slogan: "${slogan}".`
      : "Do NOT include any slogan, tagline, or subtitle text.";

    const prompt = [
      `Create a professional logo for "${businessName}".`,
      `Display ONLY the exact text "${businessName}" — no other text, no placeholder text, no "Lorem Ipsum", no "Your Logo Name".`,
      sloganRule,
      `Business: ${category} / ${businessType}${menuType ? ` / ${menuType}` : ""}.`,
      `Style: ${style}.`,
      `Use ONLY these symbols: ${allowed.join(", ")}. NEVER use: ${blocked.join(", ")}.`,
      `Primary color: ${primaryColor}. Palette: ${palette.join(", ")}. Use only these colors plus black/white/gray neutrals.`,
      "Typography: clean, readable, balanced, professional.",
      "BACKGROUND: Fully transparent (alpha=0). No white, gray, colored, or gradient background. No shapes behind the logo. Logo elements float on pure transparency. Output as transparent PNG.",
    ].join(" ");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ ok: false, error: "AI not configured" }, 500);

    // Single attempt — no expensive validation loop
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`[generate-logo] AI error ${aiResponse.status}:`, errText);
      if (aiResponse.status === 402) {
        return json({ ok: false, error: "AI credits exhausted. Please try again later.", code: "credits_exhausted" }, 402);
      }
      return json({ ok: false, error: "AI generation failed" }, 502);
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("[generate-logo] No image in AI response");
      return json({ ok: false, error: "No image generated" }, 502);
    }

    // Upload to storage
    const asset = await resolveImageAsset(imageUrl);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const path = `${user.id}/logos/${Date.now()}-${crypto.randomUUID()}-ai-logo.${asset.extension}`;

    const { error: uploadErr } = await admin.storage
      .from("builder-media")
      .upload(path, asset.bytes, { contentType: asset.contentType, upsert: false });

    if (uploadErr) {
      console.error("[generate-logo] Upload error:", uploadErr);
      return json({ ok: false, error: "Upload failed" }, 500);
    }

    const { data: publicData } = admin.storage.from("builder-media").getPublicUrl(path);

    return json({
      ok: true,
      image_url: publicData.publicUrl,
      logo_url: publicData.publicUrl,
      source: "ai_generated",
      storage_path: path,
      business_name: businessName,
      category,
    });
  } catch (e) {
    console.error("[generate-logo] error:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
