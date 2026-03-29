/**
 * YANGU Social Media — Provider Interface
 * Provider-agnostic contract for social media integrations.
 * Outstand is the first adapter. Later: native Meta, LinkedIn, TikTok, etc.
 */

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

export interface SocialProviderAdapter {
  readonly name: string;

  /** Get OAuth connect URL for a social provider */
  getConnectUrl(params: {
    provider: SocialProvider;
    redirectUrl: string;
    workspaceId: string;
  }): Promise<ProviderConnectResult>;

  /** Handle OAuth callback and exchange code for tokens */
  handleCallback(params: {
    code: string;
    state: string;
    workspaceId: string;
  }): Promise<ProviderCallbackResult>;

  /** List connected accounts for a workspace */
  listAccounts(workspaceId: string): Promise<SocialConnectedAccount[]>;

  /** Refresh account data / resync */
  refreshAccount(accountId: string): Promise<SocialConnectedAccount>;

  /** Disconnect an account */
  disconnectAccount(accountId: string): Promise<void>;

  /** Publish a post to a specific account */
  publishPost(params: {
    accountId: string;
    caption: string;
    mediaUrls?: string[];
    scheduledFor?: string;
    platformPayload?: Record<string, unknown>;
  }): Promise<ProviderPublishResult>;

  /** Schedule a post */
  schedulePost(params: {
    accountId: string;
    caption: string;
    mediaUrls?: string[];
    scheduledFor: string;
    platformPayload?: Record<string, unknown>;
  }): Promise<ProviderPublishResult>;

  /** Fetch analytics for an account */
  fetchAnalytics(params: {
    accountId: string;
    dateRange: AnalyticsDateRange;
    metrics?: string[];
  }): Promise<ProviderAnalyticsResult>;

  /** Process incoming webhook event */
  handleWebhook(payload: Record<string, unknown>): Promise<void>;

  /** Check provider health / availability */
  healthCheck(): Promise<{ ok: boolean; message?: string }>;

  /** Map provider-specific error to standard error */
  mapError(error: unknown): ProviderError;
}

/** Registry of available providers */
export class ProviderRegistry {
  private adapters = new Map<string, SocialProviderAdapter>();

  register(adapter: SocialProviderAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): SocialProviderAdapter | undefined {
    return this.adapters.get(name);
  }

  getDefault(): SocialProviderAdapter | undefined {
    return this.adapters.get("outstand");
  }

  list(): string[] {
    return Array.from(this.adapters.keys());
  }
}

export const providerRegistry = new ProviderRegistry();
