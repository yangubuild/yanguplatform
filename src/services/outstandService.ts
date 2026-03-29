// @ts-nocheck - Outstand API service scaffold
// Phase 1: typed interfaces and service stubs for Outstand social media integration

import { supabase } from "@/integrations/supabase/client";

// ── Types ────────────────────────────────────────────────

export interface OutstandConnectParams {
  provider: string;
  redirectUrl: string;
}

export interface OutstandConnectedAccount {
  id: string;
  provider: string;
  provider_user_id: string;
  display_name: string;
  avatar_url?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
}

export interface OutstandPostPayload {
  content: string;
  media_urls?: string[];
  scheduled_at?: string;
  target_accounts: string[];
}

export interface OutstandAnalyticsQuery {
  account_id: string;
  start_date: string;
  end_date: string;
  metrics?: string[];
}

export interface OutstandWebhookEvent {
  event_type: string;
  account_id: string;
  data: Record<string, any>;
  timestamp: string;
}

// ── Service Functions ────────────────────────────────────

/** Get OAuth connect URL for a social provider via Outstand */
export async function getConnectUrl(params: OutstandConnectParams): Promise<string> {
  const { data, error } = await supabase.functions.invoke("outstand-proxy", {
    body: { action: "get_connect_url", ...params },
  });
  if (error) throw error;
  return data.url;
}

/** Handle OAuth callback and save connected account */
export async function handleOAuthCallback(code: string, state: string): Promise<OutstandConnectedAccount> {
  const { data, error } = await supabase.functions.invoke("outstand-proxy", {
    body: { action: "oauth_callback", code, state },
  });
  if (error) throw error;
  return data.account;
}

/** List connected accounts for the current workspace */
export async function listConnectedAccounts(): Promise<OutstandConnectedAccount[]> {
  const { data, error } = await supabase.functions.invoke("outstand-proxy", {
    body: { action: "list_accounts" },
  });
  if (error) throw error;
  return data.accounts || [];
}

/** Create a social post */
export async function createPost(payload: OutstandPostPayload): Promise<{ id: string }> {
  const { data, error } = await supabase.functions.invoke("outstand-proxy", {
    body: { action: "create_post", ...payload },
  });
  if (error) throw error;
  return data;
}

/** Schedule a social post */
export async function schedulePost(payload: OutstandPostPayload): Promise<{ id: string }> {
  const { data, error } = await supabase.functions.invoke("outstand-proxy", {
    body: { action: "schedule_post", ...payload },
  });
  if (error) throw error;
  return data;
}

/** Fetch analytics for an account */
export async function fetchAnalytics(query: OutstandAnalyticsQuery): Promise<Record<string, any>> {
  const { data, error } = await supabase.functions.invoke("outstand-proxy", {
    body: { action: "fetch_analytics", ...query },
  });
  if (error) throw error;
  return data;
}
