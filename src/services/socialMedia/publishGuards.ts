/**
 * YANGU — Publishing Guards & Validation
 * Pre-publish checks to block invalid jobs from entering the queue.
 */

import { supabase } from "@/integrations/supabase/client";

export interface PublishValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const publishGuards = {
  /**
   * Full pre-publish validation before creating jobs.
   */
  async validateBeforePublish(params: {
    postId: string;
    workspaceId: string;
    targets: Array<{ platform: string; accountId: string }>;
    scheduledAt: string;
    caption: string;
  }): Promise<PublishValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Block past scheduling
    const scheduledDate = new Date(params.scheduledAt);
    if (scheduledDate <= new Date()) {
      errors.push("Cannot schedule posts in the past. Choose a future date/time.");
    }

    // 2. Must have at least one target
    if (!params.targets.length) {
      errors.push("No target accounts selected. Connect at least one social account.");
    }

    // 3. Caption must not be empty
    if (!params.caption?.trim()) {
      errors.push("Post caption is empty.");
    }

    // 4. Validate each target account exists and is active
    for (const target of params.targets) {
      const { data: account, error } = await supabase
        .from("social_connected_accounts")
        .select("id, status, platform, display_name")
        .eq("id", target.accountId)
        .single();

      if (error || !account) {
        errors.push(`Account ${target.accountId} not found. It may have been disconnected.`);
        continue;
      }

      if ((account as any).status === "expired") {
        errors.push(
          `${(account as any).display_name || target.platform} token expired — reconnect before publishing.`
        );
      } else if ((account as any).status !== "active") {
        errors.push(
          `${(account as any).display_name || target.platform} is not active (status: ${(account as any).status}).`
        );
      }
    }

    // 5. Check for duplicate jobs (same post + account + time window)
    const { data: existingJobs } = await supabase
      .from("social_post_jobs")
      .select("id, platform, account_id, status")
      .eq("post_id", params.postId)
      .in("status", ["queued", "processing", "retrying"] as any[]);

    if (existingJobs?.length) {
      const dupeAccounts = params.targets.filter((t) =>
        existingJobs.some(
          (j: any) => j.account_id === t.accountId && j.platform === t.platform
        )
      );
      if (dupeAccounts.length) {
        errors.push(
          `Duplicate jobs exist for: ${dupeAccounts.map((d) => d.platform).join(", ")}. Cancel existing jobs first.`
        );
      }
    }

    // 6. Caption length warnings per platform
    for (const target of params.targets) {
      const maxLen = PLATFORM_CAPTION_LIMITS[target.platform] || 2200;
      if (params.caption.length > maxLen) {
        warnings.push(
          `Caption exceeds ${target.platform} limit (${params.caption.length}/${maxLen} chars). It may be truncated.`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  /**
   * Validate that platform variants exist for a design before publishing.
   */
  async validateVariantsExist(
    designId: string,
    platforms: string[]
  ): Promise<{ valid: boolean; missing: string[] }> {
    const { data: variants } = await supabase
      .from("social_platform_variants")
      .select("platform")
      .eq("design_id", designId);

    const existing = new Set((variants || []).map((v: any) => v.platform));
    const missing = platforms.filter((p) => !existing.has(p));

    return { valid: missing.length === 0, missing };
  },
};

const PLATFORM_CAPTION_LIMITS: Record<string, number> = {
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  x: 280,
  tiktok: 2200,
};
