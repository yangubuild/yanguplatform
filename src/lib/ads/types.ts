/**
 * YANGU Ads & Unlock System — Canonical Types
 */

// ── Unlock Engine ──────────────────────────────────────────

export type UnlockDecision =
  | "ALLOW"
  | "REQUIRE_AD"
  | "REQUIRE_CREDITS"
  | "REQUIRE_PAYMENT"
  | "PLAN_LIMIT_EXCEEDED";

export interface UnlockEligibility {
  decision: UnlockDecision;
  reason?: string;
  rule_id?: string;
  credits_needed?: number;
}

export interface UnlockActionEntry {
  action_key: string;
  label: string;
  description: string | null;
  category: string | null;
  is_enabled: boolean;
}

export interface UnlockRule {
  id: string;
  action_key: string;
  plan_id: string | null;
  free_limit: number | null;
  ad_required: boolean;
  credits_required: number | null;
  payment_required: boolean;
  plan_limit: number | null;
  time_unlock_minutes: number | null;
  is_enabled: boolean;
  notes: string | null;
}

// ── Ad System ──────────────────────────────────────────────

export type AdProvider = "admob" | "direct" | "internal";
export type AdFormat = "rewarded_video" | "image" | "poster";
export const AD_DURATION_OPTIONS = [5, 8, 10, 15, 20] as const;
export const AD_MAX_DURATION = 20;

export type AdEventType =
  | "impression"
  | "start"
  | "completion"
  | "skip"
  | "click"
  | "unlock";

export interface AdEvent {
  event_type: AdEventType;
  ad_id?: string;
  placement_slot?: string;
  provider?: string;
  campaign_id?: string;
  watch_duration_ms?: number;
  device_info?: Record<string, unknown>;
  session_id?: string;
}

export interface PlacementSlot {
  slot_key: string;
  label: string;
  description: string | null;
  supported_formats: string[];
  is_enabled: boolean;
}

// ── Advertiser ─────────────────────────────────────────────

export type AdvertiserStatus = "pending" | "approved" | "rejected" | "flagged";

export interface AdvertiserAccount {
  id: string;
  user_id: string;
  business_name: string;
  country: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linked_surface_id: string | null;
  status: AdvertiserStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type AdvertiserKycStatus = "pending" | "approved" | "rejected" | "flagged";

export interface AdvertiserKyc {
  id: string;
  advertiser_id: string;
  status: AdvertiserKycStatus;
  submitted_docs: Record<string, unknown>;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

// ── Advertiser Campaigns ───────────────────────────────────

export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "paused"
  | "active"
  | "completed";

export interface AdvertiserCampaign {
  id: string;
  advertiser_id: string;
  name: string;
  campaign_type: string;
  ad_ids: string[];
  target_views: number | null;
  target_clicks: number | null;
  delivered_views: number;
  delivered_clicks: number;
  budget_cents: number | null;
  spent_cents: number;
  billing_status: string;
  country_targets: string[];
  audience_targeting: Record<string, unknown>;
  duration_seconds: number;
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
}

// ── Ad Review ──────────────────────────────────────────────

export type AdReviewStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "paused"
  | "active"
  | "completed";

export interface AdReviewEntry {
  id: string;
  ad_id: string;
  campaign_id: string | null;
  status: AdReviewStatus;
  rejection_reason: string | null;
  approval_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
}
