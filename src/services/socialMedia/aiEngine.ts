/**
 * YANGU Social Media — AI Generation Engine
 * Architecture for AI-powered content generation.
 *
 * Layers:
 * 1. Brand Context Builder
 * 2. AI Profile Rules Engine
 * 3. Topic Engine
 * 4. Caption Generator
 * 5. Post Variant Generator
 * 6. Media Prompt Builder
 * 7. Platform Adaptation Engine
 */

import type {
  SocialBrandProfile,
  SocialTopic,
  SocialProvider,
  SocialPostVariant,
} from "@/types/socialMedia";

// ── Interfaces ───────────────────────────────────────────

export interface BrandContext {
  business_name: string;
  business_summary: string;
  audience: string[];
  offers: string[];
  tone_clues: string[];
  keywords: string[];
  cta_ideas: string[];
  industry?: string;
  competitors?: string[];
}

export interface AiProfileRules {
  tone: string;
  caption_style: string;
  max_caption_length?: number;
  hashtag_behavior: "none" | "minimal" | "moderate" | "heavy";
  emoji_level: "none" | "light" | "moderate" | "heavy";
  line_break_style: "compact" | "spaced" | "paragraph";
  cta_style: string;
  banned_phrases: string[];
  required_elements: string[];
}

export interface CaptionRequest {
  topic: string;
  style: "short" | "long" | "story" | "educational" | "promotional";
  brand_context: BrandContext;
  rules: AiProfileRules;
  platform?: SocialProvider;
  additional_context?: string;
}

export interface CaptionResult {
  caption: string;
  hashtags: string[];
  cta: string;
  character_count: number;
  variant_label: string;
}

export interface TopicGenerationRequest {
  brand_context: BrandContext;
  existing_topics: string[];
  count: number;
  category?: string;
}

export interface MediaPromptRequest {
  caption: string;
  brand_context: BrandContext;
  style: string;
  aspect_ratio?: string;
}

export interface PlatformAdaptation {
  platform: SocialProvider;
  original_caption: string;
  brand_context: BrandContext;
  rules: AiProfileRules;
}

// ── Service Contracts ────────────────────────────────────

/** 1. Brand Context Builder — extracts business intelligence from inputs */
export const brandContextBuilder = {
  /** Build context from workspace data + library items */
  async build(params: {
    website?: string;
    description?: string;
    libraryTexts?: string[];
    existingProfile?: SocialBrandProfile;
  }): Promise<BrandContext> {
    // Will call AI model (Gemini/GPT via Lovable AI) to extract
    return {
      business_name: "",
      business_summary: params.description || "",
      audience: [],
      offers: [],
      tone_clues: [],
      keywords: [],
      cta_ideas: [],
    };
  },

  /** Extract context from a website URL */
  async extractFromWebsite(url: string): Promise<Partial<BrandContext>> {
    // Will call edge function to scrape + AI extract
    return { business_summary: `Extracted from ${url}` };
  },
};

/** 2. AI Profile Rules Engine — converts brand profile to generation rules */
export const aiProfileRulesEngine = {
  /** Convert a brand profile into actionable AI rules */
  toRules(profile: SocialBrandProfile): AiProfileRules {
    return {
      tone: profile.tone_of_voice || "professional",
      caption_style: profile.brand_voice || "informative",
      hashtag_behavior: "moderate",
      emoji_level: (profile.emoji_policy as AiProfileRules["emoji_level"]) || "light",
      line_break_style:
        (profile.line_break_style as AiProfileRules["line_break_style"]) || "spaced",
      cta_style: profile.preferred_ctas?.[0] || "Learn more",
      banned_phrases: profile.banned_terms || [],
      required_elements: [],
    };
  },

  /** Validate a caption against the rules */
  validate(
    caption: string,
    rules: AiProfileRules
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    for (const phrase of rules.banned_phrases) {
      if (caption.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push(`Contains banned phrase: "${phrase}"`);
      }
    }
    if (rules.max_caption_length && caption.length > rules.max_caption_length) {
      issues.push(`Exceeds max length of ${rules.max_caption_length}`);
    }
    return { valid: issues.length === 0, issues };
  },
};

/** 3. Topic Engine — generates and manages content topics */
export const topicEngine = {
  /** Generate topic suggestions using AI */
  async generateTopics(
    request: TopicGenerationRequest
  ): Promise<Array<{ title: string; description: string; category?: string }>> {
    // Will call AI model to generate topic ideas
    return [];
  },

  /** Generate subtopics for a parent topic */
  async generateSubtopics(
    topic: SocialTopic,
    brandContext: BrandContext,
    count: number
  ): Promise<string[]> {
    return [];
  },
};

/** 4. Caption Generator — creates captions with AI */
export const captionGenerator = {
  /** Generate a single caption */
  async generate(request: CaptionRequest): Promise<CaptionResult> {
    // Will call Lovable AI (Gemini/GPT) to generate
    return {
      caption: "",
      hashtags: [],
      cta: "",
      character_count: 0,
      variant_label: "A",
    };
  },

  /** Generate multiple caption variants */
  async generateVariants(
    request: CaptionRequest,
    count: number
  ): Promise<CaptionResult[]> {
    const results: CaptionResult[] = [];
    const labels = ["A", "B", "C", "D", "E"];
    for (let i = 0; i < count; i++) {
      const result = await this.generate(request);
      results.push({ ...result, variant_label: labels[i] || `V${i + 1}` });
    }
    return results;
  },
};

/** 5. Post Variant Generator — creates full post variations */
export const postVariantGenerator = {
  /** Generate multiple post options from a single idea */
  async generateFromIdea(params: {
    idea: string;
    brandContext: BrandContext;
    rules: AiProfileRules;
    targetPlatforms: SocialProvider[];
    count?: number;
  }): Promise<
    Array<{
      caption: string;
      hashtags: string[];
      media_prompt?: string;
      platforms: SocialProvider[];
    }>
  > {
    return [];
  },
};

/** 6. Media Prompt Builder — generates prompts for image/design generation */
export const mediaPromptBuilder = {
  /** Create an image generation prompt from caption + brand context */
  async buildPrompt(request: MediaPromptRequest): Promise<string> {
    return `Create a ${request.style} social media image for: ${request.caption}`;
  },

  /** Suggest visual directions for a post */
  async suggestVisuals(
    caption: string,
    brandContext: BrandContext
  ): Promise<string[]> {
    return [];
  },
};

/** 7. Platform Adaptation Engine — transforms content for specific platforms */
export const platformAdaptationEngine = {
  /** Character limits per platform */
  limits: {
    x: 280,
    instagram: 2200,
    facebook: 63206,
    linkedin_company: 3000,
    linkedin_personal: 3000,
    tiktok: 2200,
    threads: 500,
    pinterest: 500,
    youtube: 5000,
    instagram_story: 0,
    snapchat: 0,
  } as Record<SocialProvider, number>,

  /** Adapt a base caption for a specific platform */
  async adapt(params: PlatformAdaptation): Promise<SocialPostVariant> {
    const limit = this.limits[params.platform] || 2200;
    let adapted = params.original_caption;

    if (adapted.length > limit && limit > 0) {
      adapted = adapted.substring(0, limit - 3) + "...";
    }

    return {
      id: crypto.randomUUID(),
      post_id: "",
      platform: params.platform,
      adapted_caption: adapted,
      hashtags: [],
      cta: null,
      character_count: adapted.length,
      created_at: new Date().toISOString(),
    };
  },

  /** Adapt for all target platforms at once */
  async adaptForAll(
    caption: string,
    platforms: SocialProvider[],
    brandContext: BrandContext,
    rules: AiProfileRules
  ): Promise<SocialPostVariant[]> {
    return Promise.all(
      platforms.map((platform) =>
        this.adapt({
          platform,
          original_caption: caption,
          brand_context: brandContext,
          rules,
        })
      )
    );
  },
};
