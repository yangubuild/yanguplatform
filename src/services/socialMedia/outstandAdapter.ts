/**
 * YANGU Social Media — Outstand Provider Adapter
 * First implementation of the SocialProviderAdapter interface.
 */

import { supabase } from "@/integrations/supabase/client";
import type { SocialProviderAdapter } from "./providerInterface";
import type {
  SocialProvider,
  SocialConnectedAccount,
  ProviderConnectResult,
  ProviderCallbackResult,
  ProviderPublishResult,
  ProviderAnalyticsResult,
  ProviderError,
  AnalyticsDateRange,
} from "@/types/socialMedia";

async function invokeProxy<T = Record<string, unknown>>(
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("outstand-proxy", {
    body,
  });
  if (error) {
    throw {
      code: "OUTSTAND_ERROR",
      message: error.message || "Outstand proxy error",
      provider: "outstand",
      retryable: false,
      raw: error,
    } as ProviderError;
  }
  return data as T;
}

export const outstandAdapter: SocialProviderAdapter = {
  name: "outstand",

  async getConnectUrl({ provider, redirectUrl, workspaceId }) {
    const data = await invokeProxy<{ url: string; state?: string }>({
      action: "get_connect_url",
      provider,
      redirectUrl,
      workspaceId,
    });
    return { url: data.url, state: data.state };
  },

  async handleCallback({ code, state, workspaceId }) {
    const data = await invokeProxy<{ account: SocialConnectedAccount }>({
      action: "oauth_callback",
      code,
      state,
      workspaceId,
    });
    return { account: data.account };
  },

  async listAccounts(workspaceId) {
    const data = await invokeProxy<{ accounts: SocialConnectedAccount[] }>({
      action: "list_accounts",
      workspaceId,
    });
    return data.accounts || [];
  },

  async refreshAccount(accountId) {
    const data = await invokeProxy<{ account: SocialConnectedAccount }>({
      action: "refresh_account",
      accountId,
    });
    return data.account;
  },

  async disconnectAccount(accountId) {
    await invokeProxy({ action: "disconnect_account", accountId });
  },

  async publishPost({ accountId, caption, mediaUrls, platformPayload }) {
    const data = await invokeProxy<ProviderPublishResult>({
      action: "publish_post",
      accountId,
      caption,
      media_urls: mediaUrls,
      platform_payload: platformPayload,
    });
    return data;
  },

  async schedulePost({
    accountId,
    caption,
    mediaUrls,
    scheduledFor,
    platformPayload,
  }) {
    const data = await invokeProxy<ProviderPublishResult>({
      action: "schedule_post",
      accountId,
      caption,
      media_urls: mediaUrls,
      scheduled_for: scheduledFor,
      platform_payload: platformPayload,
    });
    return data;
  },

  async fetchAnalytics({ accountId, dateRange, metrics }) {
    const data = await invokeProxy<ProviderAnalyticsResult>({
      action: "fetch_analytics",
      accountId,
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
      metrics,
    });
    return data;
  },

  async handleWebhook(payload) {
    await invokeProxy({ action: "webhook", ...payload });
  },

  async healthCheck() {
    try {
      await invokeProxy({ action: "health" });
      return { ok: true };
    } catch {
      return { ok: false, message: "Outstand proxy unreachable" };
    }
  },

  mapError(error: unknown): ProviderError {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as ProviderError).code === "string"
    ) {
      return error as ProviderError;
    }
    return {
      code: "UNKNOWN",
      message: error instanceof Error ? error.message : String(error),
      provider: "outstand",
      retryable: false,
      raw: error,
    };
  },
};
