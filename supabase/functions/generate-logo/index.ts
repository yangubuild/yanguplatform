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
const VALIDATOR_MODEL = "google/gemini-2.5-flash";
const PLACEHOLDER_TEXT = [
  "lorem ipsum",
  "your logo name",
  "put your slogan",
  "sample text",
  "brand name",
  "logo name",
  "your slogan",
];

type GenerateLogoInput = {
  businessName: string;
  slogan?: string;
  category: string;
  businessType: string;
  menuType?: string;
  style?: string;
  primaryColor: string;
  palette: string[];
};

type ValidationResult = {
  valid: boolean;
  reasons: string[];
  detectedText: string[];
  exactBusinessName: boolean;
  extraTextDetected: boolean;
  placeholderTextDetected: boolean;
  categoryMatch: boolean;
  transparentBackground: boolean;
  readableTypography: boolean;
  usesRequestedColors: boolean;
  usesCoffeeVisual: boolean;
};

type ResolvedImageAsset = {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
};

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
  return [...new Set(colors.map((value) => value.toLowerCase()))];
}

function inferBusinessNameFromPrompt(prompt: string): string {
  const quotedMatch = prompt.match(/["“”']([^"“”']+)["“”']/);
  return quotedMatch?.[1]?.trim() || "";
}

function parseInput(body: Record<string, unknown>): GenerateLogoInput {
  const prompt = normalizeString(body.prompt);
  const businessName =
    normalizeString(body.businessName) ||
    normalizeString(body.business_name) ||
    inferBusinessNameFromPrompt(prompt) ||
    "My Restaurant";
  const slogan = normalizeString(body.slogan) || normalizeString(body.tagline) || undefined;
  const category = normalizeString(body.category) || "restaurant";
  const businessType = normalizeString(body.businessType) || normalizeString(body.business_type) || "restaurant";
  const menuType = normalizeString(body.menuType) || normalizeString(body.menu_type) || undefined;
  const style = normalizeString(body.style) || undefined;
  const palette = uniqueColors(
    [
      normalizeColor(body.color),
      ...(Array.isArray(body.palette) ? body.palette.map(normalizeColor) : []),
      ...(Array.isArray(body.brandColors) ? body.brandColors.map(normalizeColor) : []),
    ].filter(Boolean) as string[],
  );
  const primaryColor = palette[0] || "#b5622a";

  return {
    businessName,
    slogan,
    category,
    businessType,
    menuType,
    style,
    primaryColor,
    palette: palette.length > 0 ? palette : [primaryColor],
  };
}

function getContextText(input: GenerateLogoInput): string {
  return [input.category, input.businessType, input.menuType].filter(Boolean).join(" ").toLowerCase();
}

function isCafeContext(input: GenerateLogoInput): boolean {
  const text = getContextText(input);
  return ["cafe", "coffee", "tea", "espresso", "latte", "bubble tea"].some((token) => text.includes(token));
}

function getAllowedSymbols(input: GenerateLogoInput): string[] {
  if (isCafeContext(input)) {
    return ["coffee cup", "steam", "bean", "pastry", "cup and saucer"];
  }

  return ["plate", "fork", "spoon", "grill", "dish", "serving dome", "cutlery", "flame"];
}

function getBlockedSymbols(input: GenerateLogoInput): string[] {
  const blocked = ["camera", "house", "car", "electronics", "flower", "rocket"];
  if (!isCafeContext(input)) {
    blocked.push("coffee cup", "tea cup", "coffee bean", "espresso machine", "latte art");
  }
  return blocked;
}

function dedupe(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function getFileExtension(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    case "image/gif":
      return "gif";
    default:
      return "png";
  }
}

async function resolveImageAsset(imageUrl: string): Promise<ResolvedImageAsset> {
  const dataUrlMatch = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (dataUrlMatch) {
    const contentType = dataUrlMatch[1].toLowerCase();
    const base64Data = dataUrlMatch[2];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    return {
      bytes,
      contentType,
      extension: getFileExtension(contentType),
    };
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch generated image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "image/png";

  return {
    bytes: new Uint8Array(buffer),
    contentType,
    extension: getFileExtension(contentType),
  };
}

async function callGateway(lovableKey: string, payload: Record<string, unknown>) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${errorText}`);
  }

  return await response.json();
}

function extractImageUrl(aiData: any): string | null {
  return aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
}

function extractMessageText(aiData: any): string {
  const content = aiData?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
}

function parseValidatorJson(content: string): Record<string, unknown> | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function buildPrompt(input: GenerateLogoInput, retryReasons: string[] = []): string {
  const exactTextRule = input.slogan
    ? `Use ONLY this exact business name text: "${input.businessName}". If you include a slogan, use ONLY this exact slogan: "${input.slogan}".`
    : `Use ONLY this exact business name text: "${input.businessName}". Do NOT include any slogan or any extra text.`;

  return [
    `Create a professional food-business logo for "${input.businessName}".`,
    exactTextRule,
    "Never generate placeholder text such as Lorem Ipsum, Your Logo Name, Put your slogan, sample text, or invented words.",
    `Business context: category=${input.category}; business_type=${input.businessType}; menu_type=${input.menuType || "not_provided"}.`,
    `Allowed symbols only: ${getAllowedSymbols(input).join(", ")}.`,
    `Blocked symbols: ${getBlockedSymbols(input).join(", ")}.`,
    `Primary brand color: ${input.primaryColor}. Approved palette: ${input.palette.join(", ")}. Use the primary color prominently and only add black, white, or subtle gray as supporting neutrals. Do not introduce random unrelated colors.`,
    input.style ? `Requested style: ${input.style}.` : "Requested style: clean, balanced, readable, professional restaurant branding.",
    "Typography must be clean, readable, correctly spelled, and visually balanced.",
    "CRITICAL BACKGROUND RULE: The logo MUST have a fully transparent background (alpha channel = 0). Do NOT render ANY background — no white, no gray, no colored, no gradient, no circle, no rectangle, no shape behind the logo. The logo elements (text + icon only) must float on pure transparency. Output as PNG with alpha transparency. Think of it as a sticker with no backing.",
    retryReasons.length ? `Previous attempt was rejected for: ${retryReasons.join(", ")}. Fix every issue.` : "",
  ].filter(Boolean).join(" ");
}

async function validateGeneratedLogo(lovableKey: string, imageUrl: string, input: GenerateLogoInput): Promise<ValidationResult> {
  const isImageUrl = imageUrl.startsWith("data:image/") || /^https?:\/\//.test(imageUrl);
  if (!isImageUrl) {
    return {
      valid: false,
      reasons: ["invalid_image_output"],
      detectedText: [],
      exactBusinessName: false,
      extraTextDetected: true,
      placeholderTextDetected: false,
      categoryMatch: false,
      transparentBackground: false,
      readableTypography: false,
      usesRequestedColors: false,
      usesCoffeeVisual: false,
    };
  }

  const validatorPrompt = [
    "You are validating a generated business logo. Return ONLY minified JSON.",
    `Business name that must appear exactly: "${input.businessName}".`,
    input.slogan
      ? `Allowed slogan only if visible: "${input.slogan}".`
      : "No slogan is allowed in the logo.",
    `Business context: category=${input.category}; business_type=${input.businessType}; menu_type=${input.menuType || "not_provided"}.`,
    isCafeContext(input)
      ? "Coffee visuals are allowed for this logo."
      : "Coffee and tea visuals are NOT allowed for this logo.",
    `Requested primary color: ${input.primaryColor}. Allowed palette: ${input.palette.join(", ")}.`,
    "Check for these failures: wrong business name, any extra text, placeholder text, unrelated symbols, coffee visuals when not allowed, unreadable or distorted typography, messy composition, non-transparent or boxed background, and random unrelated colors.",
    "Return JSON with keys: exactBusinessName, extraTextDetected, placeholderTextDetected, detectedText, categoryMatch, transparentBackground, readableTypography, usesRequestedColors, usesCoffeeVisual, reasons.",
  ].join(" ");

  const aiData = await callGateway(lovableKey, {
    model: VALIDATOR_MODEL,
    temperature: 0,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: validatorPrompt },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    }],
  });

  const parsed = parseValidatorJson(extractMessageText(aiData)) || {};
  const detectedText = Array.isArray(parsed.detectedText)
    ? parsed.detectedText.map((value) => String(value))
    : [];
  const joinedText = detectedText.join(" ").toLowerCase();
  const placeholderTextDetected = Boolean(parsed.placeholderTextDetected) || PLACEHOLDER_TEXT.some((value) => joinedText.includes(value));
  const result: ValidationResult = {
    valid: false,
    reasons: [],
    detectedText,
    exactBusinessName: Boolean(parsed.exactBusinessName),
    extraTextDetected: Boolean(parsed.extraTextDetected),
    placeholderTextDetected,
    categoryMatch: Boolean(parsed.categoryMatch),
    transparentBackground: Boolean(parsed.transparentBackground),
    readableTypography: Boolean(parsed.readableTypography),
    usesRequestedColors: Boolean(parsed.usesRequestedColors),
    usesCoffeeVisual: Boolean(parsed.usesCoffeeVisual),
  };

  result.reasons = dedupe([
    ...(Array.isArray(parsed.reasons) ? parsed.reasons.map((value) => String(value)) : []),
    ...(!result.exactBusinessName ? ["business_name_mismatch"] : []),
    ...(result.extraTextDetected ? ["extra_text_detected"] : []),
    ...(result.placeholderTextDetected ? ["placeholder_text_detected"] : []),
    ...(!result.categoryMatch ? ["category_mismatch"] : []),
    ...(!result.transparentBackground ? ["background_not_transparent"] : []),
    ...(!result.readableTypography ? ["readability_issue"] : []),
    ...(!result.usesRequestedColors ? ["color_mismatch"] : []),
    ...(result.usesCoffeeVisual && !isCafeContext(input) ? ["coffee_visual_mismatch"] : []),
  ]);

  result.valid =
    result.exactBusinessName &&
    !result.extraTextDetected &&
    !result.placeholderTextDetected &&
    result.categoryMatch &&
    result.transparentBackground &&
    result.readableTypography &&
    result.usesRequestedColors &&
    (!result.usesCoffeeVisual || isCafeContext(input));

  return result;
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

    const body = await req.json();
    const input = parseInput(body);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ ok: false, error: "AI not configured" }, 500);

    let imageUrl: string | null = null;
    let validation: ValidationResult | null = null;
    let attempts = 0;
    let retryReasons: string[] = [];
    const maxAttempts = 4;

    while (!imageUrl && attempts < maxAttempts) {
      attempts++;
      try {
        const aiData = await callGateway(lovableKey, {
          model: IMAGE_MODEL,
          temperature: 0.3,
          messages: [{ role: "user", content: buildPrompt(input, retryReasons) }],
          modalities: ["image", "text"],
        });

        const candidateImageUrl = extractImageUrl(aiData);
        if (!candidateImageUrl) {
          retryReasons = ["no_image_returned"];
          continue;
        }

        validation = await validateGeneratedLogo(lovableKey, candidateImageUrl, input);
        if (!validation.valid) {
          retryReasons = validation.reasons.slice(0, 5);
          console.warn(`[generate-logo] Validation rejected attempt ${attempts}:`, retryReasons);
          continue;
        }

        imageUrl = candidateImageUrl;
      } catch (error) {
        console.error(`[generate-logo] generation attempt ${attempts} failed:`, error);
        retryReasons = [error instanceof Error ? error.message : "generation_error"];
      }
    }

    if (!imageUrl) return json({ ok: false, error: "Logo validation failed after auto-regeneration" }, 502);

    const imageAsset = await resolveImageAsset(imageUrl);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const timestamp = Date.now();
    const path = `${userId}/logos/${timestamp}-${crypto.randomUUID()}-ai-logo.${imageAsset.extension}`;
    const { error: uploadErr } = await admin.storage
      .from("builder-media")
      .upload(path, imageAsset.bytes, { contentType: imageAsset.contentType, upsert: false });

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
      business_name: input.businessName,
      category: input.category,
      attempts,
      validation: {
        placeholder_text_blocked: true,
        category_filtered: true,
        transparent_png_required: true,
        auto_regeneration_enabled: true,
        last_rejection_reasons: validation?.valid ? [] : (validation?.reasons || retryReasons),
      },
    });
  } catch (e) {
    console.error("[generate-logo] error:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
