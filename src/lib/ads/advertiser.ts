/**
 * YANGU Advertiser Services — account creation, KYC, campaign management.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  AdvertiserAccount,
  AdvertiserKyc,
  AdvertiserCampaign,
  AdReviewEntry,
} from "./types";

// ── Advertiser Account ─────────────────────────────────────

export async function createAdvertiserAccount(
  input: Pick<AdvertiserAccount, "business_name" | "country" | "contact_name" | "email" | "phone" | "website">
): Promise<AdvertiserAccount | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("advertiser_accounts")
    .insert({ ...input, user_id: user.id } as any)
    .select()
    .single();

  if (error) { console.error("[advertiser] create error:", error.message); return null; }
  return data as unknown as AdvertiserAccount;
}

export async function getMyAdvertiserAccount(): Promise<AdvertiserAccount | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("advertiser_accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data as unknown as AdvertiserAccount) ?? null;
}

// ── Advertiser KYC ─────────────────────────────────────────

export async function submitBusinessKyc(
  advertiserId: string,
  docs: Record<string, unknown> = {}
): Promise<AdvertiserKyc | null> {
  const { data, error } = await supabase
    .from("advertiser_kyc")
    .insert({ advertiser_id: advertiserId, submitted_docs: docs, status: "pending" } as any)
    .select()
    .single();

  if (error) { console.error("[advertiser] kyc submit error:", error.message); return null; }
  return data as unknown as AdvertiserKyc;
}

/** Admin: review KYC */
export async function reviewBusinessKyc(
  kycId: string,
  status: "approved" | "rejected",
  reviewNotes?: string
): Promise<boolean> {
  const { error } = await supabase
    .from("advertiser_kyc")
    .update({
      status,
      review_notes: reviewNotes ?? null,
      reviewed_at: new Date().toISOString(),
    } as any)
    .eq("id", kycId);

  if (error) { console.error("[advertiser] kyc review error:", error.message); return false; }
  return true;
}

// ── Advertiser Campaigns ───────────────────────────────────

export async function createAdvertiserCampaign(
  input: Pick<AdvertiserCampaign, "advertiser_id" | "name" | "campaign_type" | "target_views" | "target_clicks" | "budget_cents" | "duration_seconds" | "country_targets">
): Promise<AdvertiserCampaign | null> {
  const { data, error } = await supabase
    .from("advertiser_campaigns")
    .insert(input as any)
    .select()
    .single();

  if (error) { console.error("[advertiser] campaign create error:", error.message); return null; }
  return data as unknown as AdvertiserCampaign;
}

// ── Ad Review ──────────────────────────────────────────────

export async function submitAdForReview(
  adId: string,
  campaignId?: string
): Promise<AdReviewEntry | null> {
  const { data, error } = await supabase
    .from("ad_review_queue")
    .insert({
      ad_id: adId,
      campaign_id: campaignId ?? null,
      status: "pending_review",
    } as any)
    .select()
    .single();

  if (error) { console.error("[advertiser] ad review submit error:", error.message); return null; }
  return data as unknown as AdReviewEntry;
}

/** Admin: review ad */
export async function reviewAdCampaign(
  reviewId: string,
  status: "approved" | "rejected",
  notes?: string,
  rejectionReason?: string
): Promise<boolean> {
  const { error } = await supabase
    .from("ad_review_queue")
    .update({
      status,
      approval_notes: notes ?? null,
      rejection_reason: rejectionReason ?? null,
      reviewed_at: new Date().toISOString(),
    } as any)
    .eq("id", reviewId);

  if (error) { console.error("[advertiser] ad review error:", error.message); return false; }
  return true;
}
