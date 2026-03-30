/**
 * YANGU Social Media — Post Lifecycle Service
 * Central business logic for post state transitions.
 *
 * draft → ready → scheduled → publishing → published
 *                                         → failed
 * Any → archived
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  SocialPost,
  PostStatus,
  CreatePostInput,
  UpdatePostInput,
} from "@/types/socialMedia";
import { providerRegistry } from "./providerInterface";

const VALID_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ["ready", "scheduled", "archived"],
  ready: ["draft", "scheduled", "publishing", "archived"],
  scheduled: ["draft", "ready", "publishing", "archived"],
  publishing: ["published", "failed"],
  published: ["archived"],
  failed: ["draft", "ready", "scheduled", "archived"],
  archived: ["draft"],
};

function canTransition(from: PostStatus, to: PostStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const postLifecycleService = {
  /** Create a new draft post */
  async createDraft(input: CreatePostInput): Promise<SocialPost> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const mediaUrls = input.media_urls || [];
    const primaryMedia = mediaUrls.length > 0 ? mediaUrls[0] : null;

    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        content: input.caption,
        platform: "multi",
        status: "draft",
        created_by: user.user.id,
        media_urls: mediaUrls,
        primary_media_url: primaryMedia,
        source_type: input.source_type || "manual",
        content_type: input.content_type || (mediaUrls.length > 0 ? "image" : "text"),
        category_id: input.category_id || null,
        topic_id: input.topic_id || null,
        ai_generation_mode: input.ai_generation_mode || null,
        ai_prompt: input.ai_prompt || null,
        scheduled_for: input.scheduled_for || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Create post targets for each selected account
    if (input.target_account_ids?.length) {
      const targets = input.target_account_ids.map((account_id) => ({
        post_id: data.id,
        account_id,
        status: "draft",
      }));
      await supabase.from("social_post_targets").insert(targets);
    }

    return this.mapToPost(data);
  },

  /** Save/update a draft */
  async saveDraft(input: UpdatePostInput): Promise<SocialPost> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.caption !== undefined) updates.content = input.caption;
    if (input.media_urls !== undefined) updates.media_urls = input.media_urls;
    if (input.scheduled_for !== undefined) updates.scheduled_for = input.scheduled_for;
    if (input.status !== undefined) updates.status = input.status;

    const { data, error } = await supabase
      .from("social_posts")
      .update(updates)
      .eq("id", input.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToPost(data);
  },

  /** Duplicate a post as a new draft */
  async duplicatePost(postId: string): Promise<SocialPost> {
    const { data: original, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error || !original) throw error || new Error("Post not found");

    return this.createDraft({
      workspace_id: "",
      caption: original.content,
      source_type: "duplicated",
      content_type: original.media_urls?.length ? "image" : "text",
      media_urls: original.media_urls || [],
      target_account_ids: [],
    });
  },

  /** Schedule a post for future publishing */
  async schedulePost(postId: string, scheduledFor: string): Promise<SocialPost> {
    return this.transitionStatus(postId, "scheduled", { scheduled_for: scheduledFor });
  },

  /** Unschedule a post back to draft */
  async unschedulePost(postId: string): Promise<SocialPost> {
    return this.transitionStatus(postId, "draft", { scheduled_for: null });
  },

  /** Publish a post immediately */
  async publishNow(postId: string): Promise<SocialPost> {
    const post = await this.transitionStatus(postId, "publishing");

    try {
      const provider = providerRegistry.getDefault();
      if (!provider) {
        return this.transitionStatus(postId, "failed", {
          error_message: "No provider configured",
        });
      }

      // Get targets
      const { data: targets } = await supabase
        .from("social_post_targets")
        .select("*")
        .eq("post_id", postId);

      // Publish to each target
      for (const target of targets || []) {
        try {
          const result = await provider.publishPost({
            accountId: target.account_id || "",
            caption: post.caption,
            mediaUrls: post.media_urls,
          });

          await supabase
            .from("social_post_targets")
            .update({
              status: "published",
              provider_post_id: result.provider_post_id,
              published_at: new Date().toISOString(),
            })
            .eq("id", target.id);
        } catch (err) {
          await supabase
            .from("social_post_targets")
            .update({
              status: "failed",
              error: err instanceof Error ? err.message : String(err),
            })
            .eq("id", target.id);
        }
      }

      return this.transitionStatus(postId, "published", {
        published_at: new Date().toISOString(),
      });
    } catch {
      return this.transitionStatus(postId, "failed");
    }
  },

  /** Retry a failed post */
  async retryFailedPost(postId: string): Promise<SocialPost> {
    return this.publishNow(postId);
  },

  /** Archive a post */
  async archivePost(postId: string): Promise<SocialPost> {
    return this.transitionStatus(postId, "archived");
  },

  /** Restore an archived post to draft */
  async restoreToDraft(postId: string): Promise<SocialPost> {
    return this.transitionStatus(postId, "draft");
  },

  /** Delete a post permanently */
  async deletePost(postId: string): Promise<void> {
    await supabase.from("social_post_targets").delete().eq("post_id", postId);
    const { error } = await supabase.from("social_posts").delete().eq("id", postId);
    if (error) throw error;
  },

  /** Internal: transition post status with validation */
  async transitionStatus(
    postId: string,
    newStatus: PostStatus,
    extraUpdates?: Record<string, unknown>
  ): Promise<SocialPost> {
    const { data: current, error: fetchErr } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (fetchErr || !current) throw fetchErr || new Error("Post not found");

    const currentStatus = current.status as PostStatus;
    if (!canTransition(currentStatus, newStatus)) {
      throw new Error(
        `Invalid transition: ${currentStatus} → ${newStatus}`
      );
    }

    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...extraUpdates,
      })
      .eq("id", postId)
      .select()
      .single();

    if (error) throw error;

    // Log publish event
    await supabase.from("social_publish_events").insert({
      event_type: `post_${newStatus}`,
      post_target_id: null,
      data: { post_id: postId, from: currentStatus, to: newStatus },
    });

    return this.mapToPost(data);
  },

  /** Map DB row to domain type */
  mapToPost(row: Record<string, unknown>): SocialPost {
    const mediaUrls = (row.media_urls as string[]) || [];
    const primaryMedia = (row.primary_media_url as string) || null;
    return {
      id: row.id as string,
      workspace_id: (row.workspace_id as string) || "",
      created_by: (row.created_by as string) || "",
      source_type: (row.source_type as string as any) || "manual",
      content_type: (row.content_type as string as any) || (mediaUrls.length ? "image" : "text"),
      caption: row.content as string,
      status: row.status as PostStatus,
      primary_media_url: primaryMedia,
      media_urls: mediaUrls,
      approval_status: (row.approval_status as string as any) || "none",
      platform: row.platform as string,
      category_id: (row.category_id as string) || undefined,
      topic_id: (row.topic_id as string) || undefined,
      ai_generation_mode: (row.ai_generation_mode as string) || undefined,
      ai_prompt: (row.ai_prompt as string) || undefined,
      scheduled_for: row.scheduled_for as string | null,
      published_at: row.published_at as string | null,
      error_message: (row.error_message as string) || undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  },
};
