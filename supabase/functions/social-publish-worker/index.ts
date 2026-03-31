import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * YANGU Social Publish Worker
 * Cron-triggered edge function that:
 * 1. Claims due jobs atomically via claim_due_post_jobs RPC
 * 2. Publishes to platform via adapters
 * 3. Handles retries with exponential backoff
 * 4. Logs every attempt
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Retry delays (minutes) per attempt number ────────────
const RETRY_DELAYS = [10, 30, 60]; // 10min, 30min, 1hr

// ── Error categories ─────────────────────────────────────
type ErrorCategory =
  | "auth_expired"
  | "rate_limited"
  | "invalid_media"
  | "unsupported_format"
  | "platform_rejection"
  | "network_timeout"
  | "provider_outage"
  | "provider_not_ready"
  | "unknown";

// ── Provider readiness check (server-side) ───────────────
// Mirrors client-side providerReadiness.ts
// When managed keys are configured, flip these to true.
const PROVIDER_READY: Record<string, boolean> = {
  facebook: false,
  instagram: false,
  instagram_story: false,
  x: false,
  linkedin_company: false,
  linkedin_personal: false,
  tiktok: false,
  youtube: false,
  threads: false,
  pinterest: false,
  snapchat: false,
};

function isProviderReady(platform: string): boolean {
  return PROVIDER_READY[platform] === true;
}

function categorizeError(error: string): ErrorCategory {
  const lower = error.toLowerCase();
  if (lower.includes("token") || lower.includes("unauthorized") || lower.includes("401") || lower.includes("auth"))
    return "auth_expired";
  if (lower.includes("rate") || lower.includes("429") || lower.includes("too many"))
    return "rate_limited";
  if (lower.includes("media") || lower.includes("image") || lower.includes("video") || lower.includes("file"))
    return "invalid_media";
  if (lower.includes("format") || lower.includes("unsupported"))
    return "unsupported_format";
  if (lower.includes("rejected") || lower.includes("policy") || lower.includes("banned"))
    return "platform_rejection";
  if (lower.includes("timeout") || lower.includes("ETIMEDOUT") || lower.includes("ECONNRESET"))
    return "network_timeout";
  if (lower.includes("503") || lower.includes("502") || lower.includes("500") || lower.includes("unavailable"))
    return "provider_outage";
  return "unknown";
}

function isRetryable(category: ErrorCategory): boolean {
  return ["rate_limited", "network_timeout", "provider_outage", "unknown"].includes(category);
}

// Non-retryable: auth_expired, invalid_media, unsupported_format, platform_rejection
// These need user action, not more retries.

// ── Platform Variant Resolution ──────────────────────────
async function resolveVariantUrl(
  supabaseAdmin: ReturnType<typeof createClient>,
  baseUrl: string | null,
  platform: string,
  postId: string
): Promise<string | null> {
  // Try to find platform-specific rendered variant from designs linked to this post
  try {
    const { data: post } = await supabaseAdmin
      .from("social_posts")
      .select("metadata")
      .eq("id", postId)
      .single();

    const designId = (post?.metadata as any)?.design_id;
    if (designId) {
      const { data: variant } = await supabaseAdmin
        .from("social_platform_variants")
        .select("rendered_url")
        .eq("design_id", designId)
        .eq("platform", platform)
        .single();

      if (variant?.rendered_url) return variant.rendered_url;
    }
  } catch {
    // Fallback to base URL
  }
  return baseUrl;
}

// ── Platform Publish Adapters ────────────────────────────

interface PublishInput {
  accountId: string;
  caption: string;
  hashtags: string[];
  mediaUrl: string | null;
  platform: string;
  accessToken: string;
  refreshToken?: string;
  providerAccountId?: string;
}

interface PublishResult {
  success: boolean;
  externalPostId?: string;
  error?: string;
  errorCategory?: ErrorCategory;
}

// Each adapter is isolated per platform
const platformAdapters: Record<string, (input: PublishInput) => Promise<PublishResult>> = {
  async instagram(input: PublishInput): Promise<PublishResult> {
    try {
      // Step 1: Create media container
      const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${input.providerAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: input.mediaUrl,
            caption: buildCaption(input.caption, input.hashtags),
            access_token: input.accessToken,
          }),
        }
      );
      if (!containerRes.ok) {
        const err = await containerRes.text();
        return { success: false, error: err, errorCategory: categorizeError(err) };
      }
      const container = await containerRes.json();

      // Step 2: Publish container
      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${input.providerAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: container.id,
            access_token: input.accessToken,
          }),
        }
      );
      if (!publishRes.ok) {
        const err = await publishRes.text();
        return { success: false, error: err, errorCategory: categorizeError(err) };
      }
      const published = await publishRes.json();
      return { success: true, externalPostId: published.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg, errorCategory: categorizeError(msg) };
    }
  },

  async facebook(input: PublishInput): Promise<PublishResult> {
    try {
      const body: Record<string, string> = {
        message: buildCaption(input.caption, input.hashtags),
        access_token: input.accessToken,
      };
      if (input.mediaUrl) body.url = input.mediaUrl;

      const endpoint = input.mediaUrl
        ? `https://graph.facebook.com/v19.0/${input.providerAccountId}/photos`
        : `https://graph.facebook.com/v19.0/${input.providerAccountId}/feed`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err, errorCategory: categorizeError(err) };
      }
      const data = await res.json();
      return { success: true, externalPostId: data.id || data.post_id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg, errorCategory: categorizeError(msg) };
    }
  },

  async linkedin(input: PublishInput): Promise<PublishResult> {
    try {
      const postBody: Record<string, unknown> = {
        author: `urn:li:person:${input.providerAccountId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: buildCaption(input.caption, input.hashtags) },
            shareMediaCategory: input.mediaUrl ? "IMAGE" : "NONE",
            ...(input.mediaUrl
              ? {
                  media: [
                    {
                      status: "READY",
                      originalUrl: input.mediaUrl,
                    },
                  ],
                }
              : {}),
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      };

      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postBody),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err, errorCategory: categorizeError(err) };
      }
      const data = await res.json();
      return { success: true, externalPostId: data.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg, errorCategory: categorizeError(msg) };
    }
  },

  async x(input: PublishInput): Promise<PublishResult> {
    // X/Twitter posting goes through Outstand proxy in production
    // This is a direct adapter fallback
    try {
      const res = await fetch("https://api.x.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: buildCaption(input.caption, input.hashtags),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err, errorCategory: categorizeError(err) };
      }
      const data = await res.json();
      return { success: true, externalPostId: data.data?.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg, errorCategory: categorizeError(msg) };
    }
  },

  async tiktok(input: PublishInput): Promise<PublishResult> {
    try {
      // TikTok Content Posting API
      const initRes = await fetch(
        "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${input.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            post_info: {
              title: input.caption.slice(0, 150),
              privacy_level: "PUBLIC_TO_EVERYONE",
            },
            source_info: {
              source: "PULL_FROM_URL",
              video_url: input.mediaUrl,
            },
          }),
        }
      );
      if (!initRes.ok) {
        const err = await initRes.text();
        return { success: false, error: err, errorCategory: categorizeError(err) };
      }
      const data = await initRes.json();
      return { success: true, externalPostId: data.data?.publish_id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg, errorCategory: categorizeError(msg) };
    }
  },
};

function buildCaption(caption: string, hashtags: string[]): string {
  if (!hashtags?.length) return caption;
  const tags = hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
  return `${caption}\n\n${tags}`;
}

// ── Main Worker Logic ────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Atomically claim due jobs (max 10 per run)
    const { data: jobs, error: claimErr } = await supabaseAdmin.rpc("claim_due_post_jobs", {
      limit_count: 10,
    });

    if (claimErr) {
      console.error("Failed to claim jobs:", claimErr);
      return new Response(JSON.stringify({ error: "Claim failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No due jobs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Claimed ${jobs.length} jobs for publishing`);

    const results: Array<{ jobId: string; status: string; error?: string }> = [];

    // Step 2: Process each job sequentially to avoid API flooding
    for (const job of jobs) {
      // Log claim event
      await supabaseAdmin.from("social_post_job_events").insert({
        job_id: job.id,
        event_type: "claimed",
        message: `Job claimed for publishing (attempt ${job.attempts + 1}/${job.max_attempts})`,
      });

      // Fetch connected account credentials
      const { data: account, error: accErr } = await supabaseAdmin
        .from("social_connected_accounts")
        .select("*")
        .eq("id", job.account_id)
        .single();

      if (accErr || !account) {
        await failJob(supabaseAdmin, job, "Account not found or disconnected", "auth_expired", false);
        results.push({ jobId: job.id, status: "failed", error: "Account not found" });
        continue;
      }

      // Check if token exists
      const accessToken = account.access_token;
      if (!accessToken) {
        await failJob(supabaseAdmin, job, "Access token missing — reconnect required", "auth_expired", false);

        // Mark account as needing reconnection
        await supabaseAdmin
          .from("social_connected_accounts")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", job.account_id);

        results.push({ jobId: job.id, status: "failed", error: "Token missing" });
        continue;
      }

      // Resolve correct variant URL for platform
      const variantUrl = await resolveVariantUrl(supabaseAdmin, job.variant_url, job.platform, job.post_id);

      // Guard: block publish without valid media (if job expects media)
      if (!variantUrl && job.variant_url !== null) {
        await failJob(supabaseAdmin, job, "No platform variant available — regenerate variants", "invalid_media", false);
        results.push({ jobId: job.id, status: "failed", error: "Missing platform variant" });
        continue;
      }

      // Log publishing attempt
      await supabaseAdmin.from("social_post_job_events").insert({
        job_id: job.id,
        event_type: "publishing",
        message: `Publishing to ${job.platform}`,
      });

      // Get the adapter
      const adapter = platformAdapters[job.platform];
      if (!adapter) {
        await failJob(supabaseAdmin, job, `Unsupported platform: ${job.platform}`, "unsupported_format", false);
        results.push({ jobId: job.id, status: "failed", error: "Unsupported platform" });
        continue;
      }

      // Execute publish
      const result = await adapter({
        accountId: job.account_id,
        caption: job.caption,
        hashtags: job.hashtags || [],
        mediaUrl: variantUrl,
        platform: job.platform,
        accessToken,
        refreshToken: account.refresh_token || undefined,
        providerAccountId: account.provider_account_id || undefined,
      });

      if (result.success) {
        // SUCCESS
        await supabaseAdmin
          .from("social_post_jobs")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            external_post_id: result.externalPostId || null,
            attempts: job.attempts + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        await supabaseAdmin.from("social_post_job_events").insert({
          job_id: job.id,
          event_type: "published",
          message: `Successfully published to ${job.platform}`,
          metadata: { external_post_id: result.externalPostId },
        });

        // Update the parent post target status
        await supabaseAdmin
          .from("social_post_targets")
          .update({
            status: "published",
            provider_post_id: result.externalPostId,
            published_at: new Date().toISOString(),
          })
          .eq("post_id", job.post_id)
          .eq("account_id", job.account_id);

        results.push({ jobId: job.id, status: "published" });
      } else {
        // FAILURE — decide retry or final fail
        const errorCategory = result.errorCategory || categorizeError(result.error || "");
        const canRetry = isRetryable(errorCategory) && job.attempts + 1 < job.max_attempts;

        await failJob(supabaseAdmin, job, result.error || "Unknown error", errorCategory, canRetry);

        // If auth expired, mark account
        if (errorCategory === "auth_expired") {
          await supabaseAdmin
            .from("social_connected_accounts")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .eq("id", job.account_id);
        }

        results.push({ jobId: job.id, status: canRetry ? "retrying" : "failed", error: result.error });
      }

      // Brief pause between jobs to respect rate limits
      await new Promise((r) => setTimeout(r, 2000));
    }

    return new Response(
      JSON.stringify({ processed: jobs.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Worker error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Worker failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Helper: Fail or retry a job ──────────────────────────

async function failJob(
  supabase: ReturnType<typeof createClient>,
  job: any,
  errorMsg: string,
  errorCategory: ErrorCategory,
  canRetry: boolean
) {
  const newAttempts = job.attempts + 1;

  if (canRetry) {
    const delayMinutes = RETRY_DELAYS[Math.min(newAttempts - 1, RETRY_DELAYS.length - 1)];
    const nextRetry = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

    await supabase
      .from("social_post_jobs")
      .update({
        status: "retrying",
        attempts: newAttempts,
        last_error: errorMsg,
        next_retry_at: nextRetry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await supabase.from("social_post_job_events").insert({
      job_id: job.id,
      event_type: "retry_scheduled",
      message: `Retry ${newAttempts}/${job.max_attempts} in ${delayMinutes}min`,
      error_code: errorCategory,
      metadata: { next_retry_at: nextRetry, error: errorMsg },
    });
  } else {
    await supabase
      .from("social_post_jobs")
      .update({
        status: "failed",
        attempts: newAttempts,
        last_error: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await supabase.from("social_post_job_events").insert({
      job_id: job.id,
      event_type: "failed",
      message: `Permanently failed: ${errorMsg}`,
      error_code: errorCategory,
    });

    // Update parent post target
    await supabase
      .from("social_post_targets")
      .update({
        status: "failed",
        error: errorMsg,
      })
      .eq("post_id", job.post_id)
      .eq("account_id", job.account_id);
  }
}
