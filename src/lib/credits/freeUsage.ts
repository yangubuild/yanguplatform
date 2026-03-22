/**
 * Free usage enforcement helpers for promo credits.
 * Limits: 5 images, 2 videos for users who claimed dashboard credits.
 */

import { supabase } from "@/integrations/supabase/client";

export const FREE_IMAGE_LIMIT = 5;
export const FREE_VIDEO_LIMIT = 2;

export interface FreeUsageState {
  claimed: boolean;
  imagesUsed: number;
  imagesLeft: number;
  videosUsed: number;
  videosLeft: number;
}

export async function getFreeUsageState(): Promise<FreeUsageState> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { claimed: false, imagesUsed: 0, imagesLeft: 0, videosUsed: 0, videosLeft: 0 };
  }

  const { data } = await supabase
    .from("profiles")
    .select("dashboard_credit_claimed, free_images_used, free_videos_used")
    .eq("id", user.id)
    .single();

  if (!data) {
    return { claimed: false, imagesUsed: 0, imagesLeft: 0, videosUsed: 0, videosLeft: 0 };
  }

  const claimed = data.dashboard_credit_claimed === true;
  const imagesUsed = data.free_images_used ?? 0;
  const videosUsed = data.free_videos_used ?? 0;

  return {
    claimed,
    imagesUsed,
    imagesLeft: claimed ? Math.max(0, FREE_IMAGE_LIMIT - imagesUsed) : 0,
    videosUsed,
    videosLeft: claimed ? Math.max(0, FREE_VIDEO_LIMIT - videosUsed) : 0,
  };
}

export function canUseFreeImage(state: FreeUsageState): boolean {
  return state.claimed && state.imagesLeft> 0;
}

export function canUseFreeVideo(state: FreeUsageState): boolean {
  return state.claimed && state.videosLeft> 0;
}

export type ConsumeResult = { ok: boolean; code?: string; used?: number; limit?: number };

/** Atomically consume one free image generation. Call AFTER successful generation. */
export async function consumeFreeImage(): Promise<ConsumeResult> {
  const { data, error } = await supabase.rpc("consume_free_image");
  if (error) return { ok: false, code: error.message };
  return (data as unknown as ConsumeResult) ?? { ok: false, code: "NO_RESPONSE" };
}

/** Atomically consume one free video generation. Call AFTER successful generation. */
export async function consumeFreeVideo(): Promise<ConsumeResult> {
  const { data, error } = await supabase.rpc("consume_free_video");
  if (error) return { ok: false, code: error.message };
  return (data as unknown as ConsumeResult) ?? { ok: false, code: "NO_RESPONSE" };
}
