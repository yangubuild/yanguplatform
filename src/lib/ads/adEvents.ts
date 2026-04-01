/**
 * YANGU Ad Event Tracking — records impressions, starts, completions, clicks, etc.
 */

import { supabase } from "@/integrations/supabase/client";
import type { AdEvent } from "./types";

/**
 * Record an ad event via the server-side RPC.
 * Returns the event ID on success, null on failure.
 */
export async function recordAdEvent(event: AdEvent): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("record_ad_event" as any, {
      p_event_type: event.event_type,
      p_ad_id: event.ad_id ?? null,
      p_placement_slot: event.placement_slot ?? null,
      p_provider: event.provider ?? null,
      p_campaign_id: event.campaign_id ?? null,
      p_watch_duration_ms: event.watch_duration_ms ?? null,
      p_device_info: event.device_info ?? null,
      p_session_id: event.session_id ?? null,
    });

    if (error) {
      console.error("[adEvents] recordAdEvent error:", error.message);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[adEvents] Unexpected error:", err);
    return null;
  }
}

/** Convenience wrappers */
export const recordAdImpression = (e: Omit<AdEvent, "event_type">) =>
  recordAdEvent({ ...e, event_type: "impression" });

export const recordAdStart = (e: Omit<AdEvent, "event_type">) =>
  recordAdEvent({ ...e, event_type: "start" });

export const recordAdCompletion = (e: Omit<AdEvent, "event_type">) =>
  recordAdEvent({ ...e, event_type: "completion" });

export const recordAdClick = (e: Omit<AdEvent, "event_type">) =>
  recordAdEvent({ ...e, event_type: "click" });

export const recordAdSkip = (e: Omit<AdEvent, "event_type">) =>
  recordAdEvent({ ...e, event_type: "skip" });

export const recordUnlockEvent = (e: Omit<AdEvent, "event_type">) =>
  recordAdEvent({ ...e, event_type: "unlock" });
