/**
 * YANGU Social Media — Multi-Post Variation Generation + Auto-Scheduling
 * 
 * Pipeline: Generate → Format → Schedule → Queue for publishing
 * - Generates minimum 4 post variations from a single template
 * - Auto-assigns scheduled_at based on posts_per_day cadence
 * - Links posts to connected accounts and platforms
 * - No download/export — posts stay in-system for publishing only
 */

import { supabase } from "@/integrations/supabase/client";
import { postLifecycleService } from "./postLifecycleService";
import { designService } from "./templateService";
import type { LayerOverride, TemplateColorSlots, TemplateAspectRatio } from "@/types/templateDesign";
import type { SocialPost } from "@/types/socialMedia";

// ── Types ────────────────────────────────────────────────

export interface PlatformVisuals {
  instagram_feed?: string;   // 1:1
  instagram_story?: string;  // 9:16
  tiktok?: string;           // 9:16
  facebook?: string;         // 1:1 or 4:5
  linkedin?: string;         // 1:1 or 16:9
}

export interface GeneratedPostVariation {
  variation_index: number;
  content: {
    text: string;
    caption: string;
    hashtags: string[];
  };
  layer_overrides: LayerOverride[];
  color_overrides: Partial<TemplateColorSlots>;
  platform_visuals: PlatformVisuals;
  scheduled_at?: string;
  status: "draft" | "scheduled";
}

export interface VariationGenerationInput {
  template_id: string;
  workspace_id: string;
  topic?: string;
  goal?: string;
  instructions?: string;
  brand_colors?: TemplateColorSlots;
  fonts?: Record<string, string>;
  logo_url?: string;
  count?: number; // minimum 4
  target_account_ids?: string[];
  posts_per_day?: number;
  start_date?: string; // defaults to tomorrow
}

export interface VariationGenerationResult {
  posts: SocialPost[];
  designs: string[]; // design IDs
  scheduled_count: number;
}

// ── Platform Aspect Ratio Map ────────────────────────────

const PLATFORM_ASPECTS: Record<string, TemplateAspectRatio> = {
  instagram_feed: "1:1",
  instagram_story: "9:16",
  tiktok: "9:16",
  facebook: "4:5",
  linkedin: "1:1",
};

// ── Auto-Scheduling Engine ───────────────────────────────

function computeScheduleSlots(
  count: number,
  postsPerDay: number,
  startDate?: string
): string[] {
  const slots: string[] = [];
  const start = startDate
    ? new Date(startDate)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return d;
      })();

  // Posting hours spread across the day (9am, 12pm, 3pm, 6pm, 8pm)
  const postingHours = [9, 12, 15, 18, 20];

  let dayOffset = 0;
  let slotInDay = 0;

  for (let i = 0; i < count; i++) {
    const slotDate = new Date(start);
    slotDate.setDate(slotDate.getDate() + dayOffset);

    const hourIndex = slotInDay % postingHours.length;
    slotDate.setHours(postingHours[hourIndex], 0, 0, 0);

    slots.push(slotDate.toISOString());

    slotInDay++;
    if (slotInDay >= postsPerDay) {
      slotInDay = 0;
      dayOffset++;
    }
  }

  return slots;
}

// ── Variation Generation Service ─────────────────────────

export const variationGenerationService = {
  /**
   * Generate 4+ post variations from a single template.
   * Pipeline: AI Generate → Create Designs → Create Posts → Auto-Schedule
   */
  async generateVariations(input: VariationGenerationInput): Promise<VariationGenerationResult> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const count = Math.max(input.count || 4, 4); // Minimum 4

    // Step 1: Call AI to generate variations
    const aiVariations = await this.callAIGeneration(input, count);

    // Step 2: Compute schedule slots
    const postsPerDay = input.posts_per_day || 2;
    const scheduleSlots = computeScheduleSlots(count, postsPerDay, input.start_date);

    // Step 3: Create designs + posts for each variation
    const posts: SocialPost[] = [];
    const designIds: string[] = [];

    for (let i = 0; i < aiVariations.length; i++) {
      const variation = aiVariations[i];
      const scheduledFor = scheduleSlots[i] || null;

      try {
        // Create the generated design
        const design = await designService.createDesign({
          workspace_id: input.workspace_id,
          template_id: input.template_id,
          user_id: userData.user.id,
          title: variation.content.text.slice(0, 80),
          layer_overrides: variation.layer_overrides || [],
          color_overrides: variation.color_overrides || {},
          font_overrides: input.fonts || {},
          logo_url: input.logo_url,
          aspect_ratio: "1:1",
          ai_prompt: input.instructions || input.topic || "",
        });

        designIds.push(design.id);

        // Create the design variation record
        await supabase.from("social_design_variations").insert({
          parent_design_id: design.id,
          variation_index: i,
          layer_overrides: JSON.parse(JSON.stringify(variation.layer_overrides || [])),
          color_overrides: JSON.parse(JSON.stringify(variation.color_overrides || {})),
          caption: variation.content.caption,
          status: "ready",
        });

        // Build caption with hashtags
        const fullCaption = [
          variation.content.caption,
          "",
          variation.content.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "),
        ]
          .join("\n")
          .trim();

        // Create the social post
        const post = await postLifecycleService.createDraft({
          workspace_id: input.workspace_id,
          caption: fullCaption,
          source_type: "ai_generated",
          content_type: "image",
          media_urls: design.rendered_image_url ? [design.rendered_image_url] : [],
          target_account_ids: input.target_account_ids || [],
          ai_generation_mode: "template_variation",
          ai_prompt: input.instructions || input.topic,
          topic_id: undefined,
          scheduled_for: scheduledFor || undefined,
        });

        // Link design to post
        await designService.updateDesign(design.id, {
          status: "ready",
        });

        // Update post → link design via metadata
        await supabase
          .from("social_posts")
          .update({
            metadata: { design_id: design.id, variation_index: i },
          } as any)
          .eq("id", post.id);

        // Auto-schedule if we have a slot
        if (scheduledFor) {
          await postLifecycleService.schedulePost(post.id, scheduledFor);
          posts.push({ ...post, status: "scheduled", scheduled_for: scheduledFor });
        } else {
          posts.push(post);
        }

        // Rate limit protection: 2s between creations
        if (i < aiVariations.length - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err) {
        console.error(`Variation ${i} creation failed:`, err);
        // Continue with remaining variations
      }
    }

    return {
      posts,
      designs: designIds,
      scheduled_count: posts.filter((p) => p.status === "scheduled").length,
    };
  },

  /**
   * Call the AI edge function to generate content variations.
   */
  async callAIGeneration(
    input: VariationGenerationInput,
    count: number
  ): Promise<GeneratedPostVariation[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) throw new Error("Not authenticated");

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/social-ai-template-edit`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        template_id: input.template_id,
        instruction: input.instructions || `Create ${count} unique social media post variations about: ${input.topic || "the brand"}. Goal: ${input.goal || "engagement"}`,
        brand_colors: input.brand_colors || {},
        fonts: input.fonts || {},
        logo_url: input.logo_url,
        topic: input.topic,
        variation_count: count,
        mode: "multi_variation",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI variation generation failed:", response.status, errText);

      // Return fallback empty variations with placeholder content
      return Array.from({ length: count }, (_, i) => ({
        variation_index: i,
        content: {
          text: `${input.topic || "Post"} - Variation ${i + 1}`,
          caption: `${input.topic || "Check this out"} ✨`,
          hashtags: ["socialmedia", "content"],
        },
        layer_overrides: [],
        color_overrides: {},
        platform_visuals: {},
        status: "draft" as const,
      }));
    }

    const data = await response.json();
    const variations = data.variations || [];

    // Map AI response to our format, ensuring minimum count
    const result: GeneratedPostVariation[] = [];
    for (let i = 0; i < count; i++) {
      const v = variations[i] || {};
      result.push({
        variation_index: i,
        content: {
          text: v.caption || v.text || `Variation ${i + 1}`,
          caption: v.caption || `${input.topic || "Post"} variation ${i + 1}`,
          hashtags: v.hashtags || [],
        },
        layer_overrides: v.layer_overrides || [],
        color_overrides: v.color_overrides || {},
        platform_visuals: {},
        status: "draft",
      });
    }

    return result;
  },

  /**
   * Get platform-specific aspect ratios for a post.
   * Used for auto-resize: repositions elements without breaking layout.
   */
  getPlatformAspects(): Record<string, TemplateAspectRatio> {
    return { ...PLATFORM_ASPECTS };
  },

  /**
   * Compute schedule preview without creating posts.
   */
  previewSchedule(
    count: number,
    postsPerDay: number,
    startDate?: string
  ): { slots: string[]; endDate: string } {
    const slots = computeScheduleSlots(count, postsPerDay, startDate);
    return {
      slots,
      endDate: slots[slots.length - 1] || new Date().toISOString(),
    };
  },
};
