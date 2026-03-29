/**
 * YANGU Social Media Engine — Canonical Domain Types
 * Single source of truth for all social media module entities.
 */

// ── Enums ────────────────────────────────────────────────

export type SocialProvider =
  | "facebook"
  | "instagram"
  | "instagram_story"
  | "x"
  | "linkedin_company"
  | "linkedin_personal"
  | "tiktok"
  | "youtube"
  | "threads"
  | "pinterest"
  | "snapchat";

export type PostStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "archived";

export type PostSourceType =
  | "manual"
  | "ai_generated"
  | "imported"
  | "duplicated";

export type PostContentType =
  | "text"
  | "image"
  | "carousel"
  | "video"
  | "mixed";

export type AccountConnectionStatus =
  | "active"
  | "disconnected"
  | "expired"
  | "error"
  | "pending";

export type OnboardingStep =
  | "create_workspace"
  | "content_plan"
  | "connect_socials"
  | "instagram_help";

export type PublishEventType =
  | "post_created"
  | "post_scheduled"
  | "post_publishing"
  | "post_published"
  | "post_failed"
  | "post_archived"
  | "post_deleted"
  | "account_connected"
  | "account_disconnected"
  | "webhook_received";

export type LibraryItemType =
  | "image"
  | "video"
  | "document"
  | "pdf"
  | "website_import"
  | "text_import"
  | "csv_import"
  | "product"
  | "event"
  | "service"
  | "person"
  | "project"
  | "content"
  | "announcement";

export type LibraryItemStatus =
  | "pending"
  | "processing"
  | "ready"
  | "error";

export type TopicSourceType =
  | "manual"
  | "ai_generated"
  | "imported";

export type ApprovalStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

// ── Core Entities ────────────────────────────────────────

export interface SocialWorkspace {
  id: string;
  user_id: string;
  org_id?: string | null;
  name: string;
  slug?: string | null;
  business_website?: string | null;
  business_description?: string | null;
  industry?: string | null;
  target_audience?: string | null;
  posting_goals: string[];
  posting_frequency: number | null;
  timezone?: string | null;
  status: string;
  onboarding_completed: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SocialConnectedAccount {
  id: string;
  workspace_id: string;
  user_id: string;
  provider: SocialProvider;
  provider_account_id?: string | null;
  provider_account_name?: string | null;
  account_type?: string | null;
  account_handle?: string | null;
  avatar_url?: string | null;
  status: AccountConnectionStatus;
  scopes?: string[] | null;
  last_synced_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SocialBrandProfile {
  id: string;
  workspace_id: string;
  user_id: string;
  tone_of_voice?: string | null;
  brand_voice?: string | null;
  caption_rules: string[];
  banned_terms: string[];
  preferred_ctas: string[];
  hashtag_rules?: string | null;
  emoji_policy?: string | null;
  line_break_style?: string | null;
  language?: string | null;
  audience_notes?: string | null;
  positioning?: string | null;
  visual_style?: string | null;
  brand_keywords: string[];
  negative_keywords: string[];
  target_audience?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SocialTopicCategory {
  id: string;
  workspace_id: string;
  title: string;
  color?: string | null;
  sort_order: number;
  enabled: boolean;
  description?: string | null;
  created_at: string;
}

export interface SocialTopic {
  id: string;
  workspace_id: string;
  category_id?: string | null;
  title: string;
  description?: string | null;
  enabled: boolean;
  sort_order: number;
  source_type: TopicSourceType;
  color?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface SocialLibraryItem {
  id: string;
  workspace_id: string;
  user_id: string;
  item_type: LibraryItemType;
  title: string;
  description?: string | null;
  file_url?: string | null;
  thumbnail_url?: string | null;
  source_url?: string | null;
  extracted_text?: string | null;
  extracted_metadata?: Record<string, unknown> | null;
  tags: string[];
  status: LibraryItemStatus;
  processing_error?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  workspace_id: string;
  created_by: string;
  source_type: PostSourceType;
  content_type: PostContentType;
  title?: string | null;
  caption: string;
  status: PostStatus;
  ai_generation_mode?: string | null;
  ai_prompt?: string | null;
  topic_id?: string | null;
  category_id?: string | null;
  scheduled_for?: string | null;
  published_at?: string | null;
  outstand_post_id?: string | null;
  primary_media_url?: string | null;
  media_urls: string[];
  approval_status: ApprovalStatus;
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
  platform?: string | null; // legacy compat
  created_at: string;
  updated_at: string;
  // Joined relations
  targets?: SocialPostTarget[];
  variants?: SocialPostVariant[];
}

export interface SocialPostVariant {
  id: string;
  post_id: string;
  platform: SocialProvider;
  adapted_caption: string;
  hashtags: string[];
  cta?: string | null;
  character_count: number;
  platform_payload?: Record<string, unknown> | null;
  preview_json?: Record<string, unknown> | null;
  created_at: string;
}

export interface SocialPostTarget {
  id: string;
  post_id: string;
  connected_account_id: string;
  provider: SocialProvider;
  provider_post_id?: string | null;
  publish_status: PostStatus;
  scheduled_for?: string | null;
  published_at?: string | null;
  last_error?: string | null;
  metrics_summary?: Record<string, unknown> | null;
  created_at: string;
}

export interface SocialPublishEvent {
  id: string;
  workspace_id: string;
  post_id?: string | null;
  target_id?: string | null;
  event_type: PublishEventType;
  source?: string | null;
  payload?: Record<string, unknown> | null;
  status?: string | null;
  created_at: string;
}

export interface SocialAnalyticsSnapshot {
  id: string;
  workspace_id: string;
  connected_account_id?: string | null;
  post_id?: string | null;
  provider?: SocialProvider | null;
  snapshot_date: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;
  saves: number;
  followers: number;
  engagement_rate: number;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

export interface SocialOnboardingState {
  id: string;
  user_id: string;
  workspace_id?: string | null;
  completed_steps: OnboardingStep[];
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ── Aggregate / Summary Types ────────────────────────────

export interface SocialHomeSummary {
  onboarding_progress: {
    completed_steps: string[];
    total_steps: number;
    is_completed: boolean;
  };
  connected_accounts_count: number;
  drafts_count: number;
  scheduled_count: number;
  published_count: number;
  topics_count: number;
  library_items_count: number;
  ai_profile_complete: boolean;
  analytics_ready: boolean;
}

export interface PostCounts {
  drafts: number;
  scheduled: number;
  published: number;
  failed: number;
  archived: number;
}

export interface AnalyticsDateRange {
  start_date: string;
  end_date: string;
}

export interface AnalyticsSummary {
  total_impressions: number;
  total_clicks: number;
  total_engagement: number;
  total_followers: number;
  avg_engagement_rate: number;
  by_account: Array<{
    account_id: string;
    provider: SocialProvider;
    display_name: string;
    impressions: number;
    clicks: number;
    engagement_rate: number;
  }>;
}

// ── Form / Input Types ───────────────────────────────────

export interface CreatePostInput {
  workspace_id: string;
  caption: string;
  source_type: PostSourceType;
  content_type: PostContentType;
  title?: string;
  topic_id?: string;
  category_id?: string;
  media_urls?: string[];
  scheduled_for?: string;
  target_account_ids: string[];
  ai_prompt?: string;
  ai_generation_mode?: string;
}

export interface UpdatePostInput {
  id: string;
  caption?: string;
  title?: string;
  status?: PostStatus;
  topic_id?: string | null;
  media_urls?: string[];
  scheduled_for?: string | null;
  target_account_ids?: string[];
}

export interface CreateWorkspaceInput {
  name?: string;
  business_website?: string;
  business_description?: string;
  posting_goals?: string[];
  posting_frequency?: number;
  timezone?: string;
}

export interface UpdateBrandProfileInput {
  tone_of_voice?: string;
  brand_voice?: string;
  caption_rules?: string[];
  banned_terms?: string[];
  preferred_ctas?: string[];
  hashtag_rules?: string;
  emoji_policy?: string;
  language?: string;
  audience_notes?: string;
  positioning?: string;
  visual_style?: string;
  brand_keywords?: string[];
  negative_keywords?: string[];
}

export interface ImportLibraryInput {
  item_type: LibraryItemType;
  title: string;
  description?: string;
  file_url?: string;
  source_url?: string;
  tags?: string[];
}

// ── Provider / Integration Types ─────────────────────────

export interface ProviderConnectResult {
  url: string;
  state?: string;
}

export interface ProviderCallbackResult {
  account: SocialConnectedAccount;
}

export interface ProviderPublishResult {
  provider_post_id: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderAnalyticsResult {
  metrics: SocialAnalyticsSnapshot[];
}

export interface ProviderError {
  code: string;
  message: string;
  provider: string;
  retryable: boolean;
  raw?: unknown;
}
