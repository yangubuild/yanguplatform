/**
 * YANGU — Campaign Batch Engine
 * Plans, generates, and schedules structured multi-day campaigns.
 * 
 * Flow: Plan → Generate → Schedule → Track
 */

import { supabase } from "@/integrations/supabase/client";
import { variationGenerationService } from "./variationGenerationService";
import type { SocialProvider } from "@/types/socialMedia";

// ── Types ────────────────────────────────────────────────

export type CampaignGoal = "sales" | "awareness" | "engagement" | "education" | "launch" | "community";
export type CampaignStatus = "draft" | "generating" | "scheduled" | "active" | "paused" | "completed";
export type CampaignDuration = 7 | 14 | 30;

export interface CampaignInput {
  workspace_id: string;
  name: string;
  duration_days: CampaignDuration;
  posts_per_day: number;
  campaign_goal: CampaignGoal;
  selected_template_ids: string[];
  selected_platforms: string[];
  start_date: string;
  topic_focus?: string;
}

export interface CampaignPlanItem {
  day_number: number;
  slot_number: number;
  content_bucket: string;
  topic_angle: string;
  cta_style: string;
  template_id: string;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  duration_days: number;
  posts_per_day: number;
  total_posts: number;
  campaign_goal: string;
  selected_template_ids: string[];
  selected_platforms: string[];
  start_date: string;
  status: CampaignStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CampaignItem {
  id: string;
  campaign_id: string;
  day_number: number;
  slot_number: number;
  content_bucket: string;
  topic_angle: string | null;
  cta_style: string | null;
  template_id: string | null;
  post_id: string | null;
  design_id: string | null;
  status: string;
  scheduled_for: string | null;
  created_at: string;
}

// ── Content Bucket Definitions ───────────────────────────

const GOAL_BUCKETS: Record<CampaignGoal, string[]> = {
  sales: ["product_highlight", "offer_discount", "testimonial", "urgency", "cta_post", "feature_value"],
  awareness: ["brand_intro", "mission_value", "educational", "visual_identity", "audience_community", "behind_scenes"],
  engagement: ["question", "poll_prompt", "relatable", "reaction_opinion", "conversation_starter", "challenge"],
  education: ["tip", "how_to", "myth_fact", "mini_lesson", "explainer", "quick_guide"],
  launch: ["teaser", "countdown", "reveal", "feature_spotlight", "early_access", "launch_day"],
  community: ["user_spotlight", "thank_you", "milestone", "feedback_ask", "story_share", "collaboration"],
};

const BUCKET_CTA_STYLES: Record<string, string[]> = {
  product_highlight: ["Shop now", "Learn more", "See details"],
  offer_discount: ["Grab the deal", "Use code", "Limited time"],
  testimonial: ["See what others say", "Join them", "Read more"],
  urgency: ["Don't miss out", "Last chance", "Act now"],
  cta_post: ["Click the link", "DM us", "Comment below"],
  feature_value: ["Discover why", "Try it today", "See the difference"],
  brand_intro: ["Follow us", "Learn more", "Welcome"],
  mission_value: ["Join our mission", "Share if you agree", "Stand with us"],
  educational: ["Save this", "Share with a friend", "Bookmark"],
  visual_identity: ["This is us", "Our vibe", "Stay tuned"],
  audience_community: ["Tag a friend", "You relate?", "Join us"],
  behind_scenes: ["Peek inside", "Behind the curtain", "Real talk"],
  question: ["Tell us below", "Drop your answer", "We want to know"],
  poll_prompt: ["Vote now", "A or B?", "Which one?"],
  relatable: ["Double tap if you agree", "Tag someone", "Share this"],
  reaction_opinion: ["Agree or disagree?", "Hot take", "Your thoughts?"],
  conversation_starter: ["Let's talk", "Share your story", "Comment below"],
  challenge: ["Try this", "Challenge accepted?", "Show us yours"],
  tip: ["Save for later", "Try this today", "Pro tip"],
  how_to: ["Follow these steps", "Easy guide", "Step by step"],
  myth_fact: ["Did you know?", "Myth busted", "True or false?"],
  mini_lesson: ["Learn in 60s", "Quick lesson", "Knowledge drop"],
  explainer: ["Here's how", "Explained simply", "Breaking it down"],
  quick_guide: ["Your guide", "Start here", "Easy reference"],
  teaser: ["Something's coming", "Stay tuned", "Guess what?"],
  countdown: ["Days to go", "Mark your calendar", "Almost time"],
  reveal: ["It's here!", "Introducing", "The wait is over"],
  feature_spotlight: ["Check this out", "New feature", "You asked, we built"],
  early_access: ["Get early access", "Be first", "Exclusive preview"],
  launch_day: ["Now live!", "Available today", "Let's go!"],
  user_spotlight: ["Shoutout to", "Featured member", "Community star"],
  thank_you: ["Thank you!", "We appreciate you", "Grateful"],
  milestone: ["We did it!", "Celebrating", "Big milestone"],
  feedback_ask: ["Tell us what you think", "Your feedback matters", "Rate us"],
  story_share: ["Our story", "A moment we love", "Throwback"],
  collaboration: ["Together with", "Partnered up", "Collab alert"],
};

// ── Topic Angle Generation ───────────────────────────────

function generateTopicAngle(bucket: string, index: number, topicFocus?: string): string {
  const prefix = topicFocus ? `${topicFocus} — ` : "";
  const bucketLabel = bucket.replace(/_/g, " ");
  return `${prefix}${bucketLabel} #${index + 1}`;
}

// ── Campaign Planning Engine ─────────────────────────────

function buildContentPlan(input: CampaignInput): CampaignPlanItem[] {
  const totalPosts = input.duration_days * input.posts_per_day;
  const buckets = GOAL_BUCKETS[input.campaign_goal] || GOAL_BUCKETS.engagement;
  const templates = input.selected_template_ids;
  const plan: CampaignPlanItem[] = [];

  let bucketIndex = 0;

  for (let day = 1; day <= input.duration_days; day++) {
    for (let slot = 1; slot <= input.posts_per_day; slot++) {
      const bucket = buckets[bucketIndex % buckets.length];
      const templateId = templates[(bucketIndex) % templates.length];
      const ctaOptions = BUCKET_CTA_STYLES[bucket] || ["Learn more"];
      const cta = ctaOptions[bucketIndex % ctaOptions.length];

      plan.push({
        day_number: day,
        slot_number: slot,
        content_bucket: bucket,
        topic_angle: generateTopicAngle(bucket, bucketIndex, input.topic_focus),
        cta_style: cta,
        template_id: templateId,
      });

      bucketIndex++;
    }
  }

  return plan;
}

// ── Schedule Slot Calculator ─────────────────────────────

const POSTING_HOURS = [9, 12, 15, 18, 20];

function computeCampaignSlots(
  durationDays: number,
  postsPerDay: number,
  startDate: string
): string[] {
  const slots: string[] = [];
  const start = new Date(startDate);

  for (let day = 0; day < durationDays; day++) {
    for (let slot = 0; slot < postsPerDay; slot++) {
      const d = new Date(start);
      d.setDate(d.getDate() + day);
      const hourIndex = slot % POSTING_HOURS.length;
      d.setHours(POSTING_HOURS[hourIndex], 0, 0, 0);
      slots.push(d.toISOString());
    }
  }

  return slots;
}

// ── Campaign Engine ──────────────────────────────────────

export const campaignEngine = {
  /**
   * Create a campaign and its content plan (no generation yet).
   */
  async createCampaign(input: CampaignInput): Promise<Campaign> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const totalPosts = input.duration_days * input.posts_per_day;

    // Create campaign record
    const { data: campaign, error } = await supabase
      .from("social_campaigns")
      .insert({
        workspace_id: input.workspace_id,
        user_id: userData.user.id,
        name: input.name,
        duration_days: input.duration_days,
        posts_per_day: input.posts_per_day,
        total_posts: totalPosts,
        campaign_goal: input.campaign_goal,
        selected_template_ids: input.selected_template_ids,
        selected_platforms: input.selected_platforms,
        start_date: input.start_date,
        status: "draft",
        metadata: { topic_focus: input.topic_focus || null },
      } as any)
      .select()
      .single();

    if (error) throw error;

    // Build and store content plan
    const plan = buildContentPlan(input);
    const scheduleSlots = computeCampaignSlots(input.duration_days, input.posts_per_day, input.start_date);

    const items = plan.map((item, i) => ({
      campaign_id: campaign.id,
      day_number: item.day_number,
      slot_number: item.slot_number,
      content_bucket: item.content_bucket,
      topic_angle: item.topic_angle,
      cta_style: item.cta_style,
      template_id: item.template_id,
      scheduled_for: scheduleSlots[i] || null,
      status: "planned",
    }));

    const { error: itemsErr } = await supabase
      .from("social_campaign_items")
      .insert(items as any);

    if (itemsErr) throw itemsErr;

    return campaign as unknown as Campaign;
  },

  /**
   * Generate all posts for a campaign in chunks.
   * Returns a progress callback for UI updates.
   */
  async generateCampaign(
    campaignId: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ generated: number; failed: number }> {
    // Update status to generating
    await supabase
      .from("social_campaigns")
      .update({ status: "generating", updated_at: new Date().toISOString() } as any)
      .eq("id", campaignId);

    // Fetch campaign + items
    const { data: campaign } = await supabase
      .from("social_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (!campaign) throw new Error("Campaign not found");

    const { data: items } = await supabase
      .from("social_campaign_items")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("day_number")
      .order("slot_number");

    if (!items || items.length === 0) throw new Error("No campaign items found");

    let generated = 0;
    let failed = 0;
    const CHUNK_SIZE = 4; // Generate in batches of 4

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);

      for (const item of chunk) {
        try {
          const templateId = item.template_id || (campaign as any).selected_template_ids?.[0];
          if (!templateId) {
            failed++;
            continue;
          }

          // Generate a single post variation for this campaign item
          const result = await variationGenerationService.generateVariations({
            template_id: templateId,
            workspace_id: (campaign as any).workspace_id,
            topic: item.topic_angle || item.content_bucket,
            goal: (campaign as any).campaign_goal,
            instructions: `Campaign: ${(campaign as any).name}. Content type: ${item.content_bucket.replace(/_/g, " ")}. CTA: ${item.cta_style || "Learn more"}. Create exactly 1 unique post.`,
            count: 1,
            posts_per_day: 1,
            start_date: item.scheduled_for || undefined,
            target_account_ids: [],
          });

          if (result.posts.length > 0) {
            const post = result.posts[0];
            const designId = result.designs[0] || null;

            // Link post to campaign
            await supabase
              .from("social_posts")
              .update({ campaign_id: campaignId } as any)
              .eq("id", post.id);

            // Update campaign item with post/design references
            await supabase
              .from("social_campaign_items")
              .update({
                post_id: post.id,
                design_id: designId,
                status: "generated",
              } as any)
              .eq("id", item.id);

            generated++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`Campaign item ${item.id} generation failed:`, err);
          await supabase
            .from("social_campaign_items")
            .update({ status: "failed" } as any)
            .eq("id", item.id);
          failed++;
        }

        onProgress?.(generated + failed, items.length);

        // Rate limit protection
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    // Update campaign status
    const finalStatus = failed === items.length ? "draft" : "scheduled";
    await supabase
      .from("social_campaigns")
      .update({
        status: finalStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(campaign as any).metadata,
          generation_result: { generated, failed, completed_at: new Date().toISOString() },
        },
      } as any)
      .eq("id", campaignId);

    return { generated, failed };
  },

  /**
   * Get campaign with summary stats.
   */
  async getCampaign(campaignId: string): Promise<Campaign & { items: CampaignItem[]; stats: CampaignStats }> {
    const { data: campaign, error } = await supabase
      .from("social_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error || !campaign) throw error || new Error("Not found");

    const { data: items } = await supabase
      .from("social_campaign_items")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("day_number")
      .order("slot_number");

    const campaignItems = (items || []) as unknown as CampaignItem[];

    const stats: CampaignStats = {
      planned: campaignItems.filter((i) => i.status === "planned").length,
      generated: campaignItems.filter((i) => i.status === "generated").length,
      scheduled: campaignItems.filter((i) => i.status === "scheduled").length,
      published: campaignItems.filter((i) => i.status === "published").length,
      failed: campaignItems.filter((i) => i.status === "failed").length,
      waiting: campaignItems.filter((i) => i.status === "waiting_provider").length,
    };

    return {
      ...(campaign as unknown as Campaign),
      items: campaignItems,
      stats,
    };
  },

  /**
   * List campaigns for a workspace.
   */
  async listCampaigns(workspaceId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from("social_campaigns")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Campaign[];
  },

  /**
   * Pause or resume a campaign.
   */
  async togglePause(campaignId: string, paused: boolean): Promise<void> {
    await supabase
      .from("social_campaigns")
      .update({
        status: paused ? "paused" : "active",
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", campaignId);
  },

  /**
   * Regenerate a single campaign item.
   */
  async regenerateItem(itemId: string): Promise<void> {
    const { data: item } = await supabase
      .from("social_campaign_items")
      .select("*, social_campaigns(*)")
      .eq("id", itemId)
      .single();

    if (!item) throw new Error("Item not found");

    const campaign = (item as any).social_campaigns;
    const templateId = item.template_id || campaign?.selected_template_ids?.[0];

    if (!templateId) throw new Error("No template available");

    const result = await variationGenerationService.generateVariations({
      template_id: templateId,
      workspace_id: campaign.workspace_id,
      topic: item.topic_angle || item.content_bucket,
      goal: campaign.campaign_goal,
      instructions: `Regenerate: ${item.content_bucket.replace(/_/g, " ")}. CTA: ${item.cta_style || "Learn more"}.`,
      count: 1,
      posts_per_day: 1,
      start_date: item.scheduled_for || undefined,
    });

    if (result.posts.length > 0) {
      await supabase
        .from("social_posts")
        .update({ campaign_id: campaign.id } as any)
        .eq("id", result.posts[0].id);

      await supabase
        .from("social_campaign_items")
        .update({
          post_id: result.posts[0].id,
          design_id: result.designs[0] || null,
          status: "generated",
        } as any)
        .eq("id", itemId);
    }
  },

  /**
   * Preview the content plan without creating anything.
   */
  previewPlan(input: CampaignInput): CampaignPlanItem[] {
    return buildContentPlan(input);
  },

  /**
   * Preview schedule slots.
   */
  previewSchedule(input: CampaignInput): string[] {
    return computeCampaignSlots(input.duration_days, input.posts_per_day, input.start_date);
  },
};

export interface CampaignStats {
  planned: number;
  generated: number;
  scheduled: number;
  published: number;
  failed: number;
  waiting: number;
}
