/**
 * StudioAIEngine — Central AI routing service for YANGU Studio tools.
 *
 * Responsibilities:
 * 1. Detect which tool is requesting AI
 * 2. Route to the correct provider
 * 3. Handle subscription/quota gating
 * 4. Save results to Studio Assets
 * 5. Return preview-ready output
 *
 * No direct provider calls from UI — everything goes through here.
 */

import { supabase } from "@/integrations/supabase/client";
import { generateCreatifyVideo, type CreatifyParams, type CreatifyResult } from "@/lib/ai/creatify";
import { generateIdeogramImage, type IdeogramParams, type IdeogramResult } from "@/lib/ai/ideogram";
import { generateQwenImage, type QwenParams, type QwenResult } from "@/lib/ai/qwen";
import { generateGeminiImage, type GeminiResult } from "@/lib/ai/gemini";

// ─── Types ───────────────────────────────────────────────

export type StudioTool =
  | "product-video"
  | "ai-shorts"
  | "image-ads"
  | "ad-clone"
  | "avatar-creator"
  | "video-editor";

export type ImageProvider = "gemini" | "ideogram" | "qwen";
export type VideoProvider = "creatify";
export type TextProvider = "ada";

export interface StudioJobBase {
  tool: StudioTool;
  userId?: string;
}

// ── Video Generation ──

export interface VideoGenerateRequest extends StudioJobBase {
  type: "video.generate";
  provider?: VideoProvider;
  prompt: string;
  params?: CreatifyParams;
}

export interface VideoGenerateResult {
  ok: boolean;
  generationId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  storagePath?: string;
  error?: string;
}

// ── Image Generation ──

export interface ImageGenerateRequest extends StudioJobBase {
  type: "image.generate";
  provider?: ImageProvider;
  prompt: string;
  chatId?: string;
  params?: IdeogramParams | QwenParams;
}

export interface ImageGenerateResult {
  ok: boolean;
  generationId?: string;
  imageUrl?: string;
  storagePath?: string;
  error?: string;
}

// ── Script Generation (ADA AI) ──

export interface ScriptGenerateRequest extends StudioJobBase {
  type: "script.generate";
  prompt: string;
  style?: string;
  context?: Record<string, unknown>;
}

export interface ScriptGenerateResult {
  ok: boolean;
  script?: string;
  error?: string;
}

// ── Talking Avatar ──

export interface AvatarSpeakRequest extends StudioJobBase {
  type: "avatar.speak";
  imageUrl: string;
  text?: string;
  audioUrl?: string;
  voiceId?: string;
}

export interface AvatarSpeakResult {
  ok: boolean;
  videoUrl?: string;
  mediaId?: string;
  providerUsed?: string;
  error?: string;
}

// ── Union types ──

export type StudioRequest =
  | VideoGenerateRequest
  | ImageGenerateRequest
  | ScriptGenerateRequest
  | AvatarSpeakRequest;

export type StudioResult =
  | VideoGenerateResult
  | ImageGenerateResult
  | ScriptGenerateResult
  | AvatarSpeakResult;

// ── Subscription check ──

export interface SubscriptionGate {
  allowed: boolean;
  plan?: string;
  reason?: string;
}

// ─── Helpers ─────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const session = (await supabase.auth.getSession()).data.session;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

/**
 * Check whether user's plan allows a paid tool.
 * Returns { allowed: true } for paid users, { allowed: false, reason } for free users.
 */
export async function checkSubscriptionGate(tool: StudioTool): Promise<SubscriptionGate> {
  const PAID_TOOLS: StudioTool[] = ["ai-shorts", "product-video", "video-editor"];

  if (!PAID_TOOLS.includes(tool)) {
    return { allowed: true, plan: "any" };
  }

  const { data: quotaResult } = await supabase.rpc("check_and_increment_quota", {
    p_quota_key: `studio_${tool.replace("-", "_")}`,
  });

  const result = quotaResult as { ok: boolean; code: string; tier?: string } | null;

  // If no config exists or quota is disabled, allow
  if (!result || result.code === "NO_CONFIG" || result.code === "DISABLED" || result.code === "UNLIMITED") {
    return { allowed: true, plan: result?.tier || "free" };
  }

  if (result.ok) {
    return { allowed: true, plan: result.tier || "free" };
  }

  return {
    allowed: false,
    plan: result.tier || "free",
    reason: result.code === "QUOTA_REACHED" ? "quota_reached" : "upgrade_required",
  };
}

// ─── Main dispatch ───────────────────────────────────────

export async function executeStudioJob(request: StudioRequest): Promise<StudioResult> {
  switch (request.type) {
    case "video.generate":
      return handleVideoGenerate(request);
    case "image.generate":
      return handleImageGenerate(request);
    case "script.generate":
      return handleScriptGenerate(request);
    case "avatar.speak":
      return handleAvatarSpeak(request);
    default:
      return { ok: false, error: "Unknown job type" } as StudioResult;
  }
}

// ─── Video Generation ────────────────────────────────────

async function handleVideoGenerate(req: VideoGenerateRequest): Promise<VideoGenerateResult> {
  try {
    const result: CreatifyResult = await generateCreatifyVideo(req.prompt, req.params || {});

    if (!result.ok) {
      return { ok: false, error: result.error || "Video generation failed" };
    }

    const firstVideo = result.videos?.[0];
    return {
      ok: true,
      generationId: result.generation_id,
      videoUrl: firstVideo?.url,
      thumbnailUrl: firstVideo?.thumbnail_url || undefined,
      storagePath: firstVideo?.storage_path,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Video generation error" };
  }
}

// ─── Image Generation ────────────────────────────────────

async function handleImageGenerate(req: ImageGenerateRequest): Promise<ImageGenerateResult> {
  const provider = req.provider || "gemini";

  try {
    switch (provider) {
      case "gemini": {
        const result: GeminiResult = await generateGeminiImage(req.prompt, req.chatId || "");
        if (!result.ok) return { ok: false, error: result.error };
        const img = result.images?.[0];
        return { ok: true, generationId: result.generation_id, imageUrl: img?.url, storagePath: img?.storage_path };
      }
      case "ideogram": {
        const result: IdeogramResult = await generateIdeogramImage(req.prompt, (req.params as IdeogramParams) || {});
        if (!result.ok) return { ok: false, error: result.error };
        const img = result.images?.[0];
        return { ok: true, generationId: result.generation_id, imageUrl: img?.url, storagePath: img?.storage_path };
      }
      case "qwen": {
        const result: QwenResult = await generateQwenImage(req.prompt, (req.params as QwenParams) || {});
        if (!result.ok) return { ok: false, error: result.error };
        const img = result.images?.[0];
        return { ok: true, generationId: result.generation_id, imageUrl: img?.url, storagePath: img?.storage_path };
      }
      default:
        return { ok: false, error: `Unknown image provider: ${provider}` };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Image generation error" };
  }
}

// ─── Script Generation (ADA AI) ──────────────────────────

async function handleScriptGenerate(req: ScriptGenerateRequest): Promise<ScriptGenerateResult> {
  try {
    const headers = await getAuthHeaders();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const messages = [
      {
        role: "user",
        content: req.style
          ? `Write a ${req.style.toLowerCase()} video script about: ${req.prompt}. Keep it under 1000 characters, engaging, and ready for a video voiceover.`
          : `Write a video script about: ${req.prompt}. Keep it under 1000 characters, engaging, and ready for a video voiceover.`,
      },
    ];

    const res = await fetch(`${supabaseUrl}/functions/v1/ada-chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, stream: false }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || data?.message || "Script generation failed" };
    }

    return { ok: true, script: data.content };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Script generation error" };
  }
}

// ─── Talking Avatar ──────────────────────────────────────

async function handleAvatarSpeak(req: AvatarSpeakRequest): Promise<AvatarSpeakResult> {
  try {
    const headers = await getAuthHeaders();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const body: Record<string, unknown> = {
      image_url: req.imageUrl,
    };
    if (req.text) body.text = req.text;
    if (req.audioUrl) body.audio_url = req.audioUrl;
    if (req.voiceId) body.voice_id = req.voiceId;

    const res = await fetch(`${supabaseUrl}/functions/v1/talking-avatar`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return { ok: false, error: data?.error || "Avatar speech generation failed" };
    }

    return {
      ok: true,
      videoUrl: data.video_url,
      mediaId: data.media_id,
      providerUsed: data.provider_used,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Avatar speak error" };
  }
}
