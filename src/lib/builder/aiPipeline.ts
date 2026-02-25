/**
 * AI Generation Pipeline — Canonical orchestrator for draft surface generation.
 * Template-first: AI picks from engine.templates only.
 * Validates against engine.aiGenerationRules before writing.
 */

import { getEngine } from "./engineRegistry";
import type { BuilderEngine, SeedSection, SectionTemplate } from "./types";
import { getDefaultSchema, mergeIntoDefault } from "@/lib/builderDefaults";

// ─── Types ───

export interface DraftGenerationInput {
  engineKey: string;
  /** Optional imported profile data (name, description, logo, colors, images) */
  sourceData?: Record<string, unknown>;
  /** Merged onboarding answers (manual + ai + conditional) */
  answers: Record<string, unknown>;
}

export interface DraftGenerationOutput {
  surfaceTitle: string;
  surfaceDescription: string;
  slug: string;
  sections: SeedSection[];
  theme: {
    primaryColor: string;
    derivedPalette?: Record<string, string>;
  };
  assets: { type: string; url: string }[];
  /** Which industry was resolved */
  industry?: string;
  /** Validation repairs that were auto-applied */
  repairs: string[];
}

export interface ValidationResult {
  valid: boolean;
  repairs: string[];
  cleanedSections: SeedSection[];
}

// ─── Draft Generation ───

/**
 * Generates a draft surface from engine config + answers.
 * Does NOT call AI gateway — this is the local orchestrator that
 * assembles sections from engine templates and merges AI-generated schemas.
 */
export function generateDraftFromAnswers(input: DraftGenerationInput): DraftGenerationOutput {
  const engine = getEngine(input.engineKey);
  if (!engine) throw new Error(`Unknown engine: ${input.engineKey}`);

  const { answers, sourceData } = input;
  const merged = { ...answers, ...(sourceData || {}) };

  // Resolve name / title
  const nameKey = engine.key === "influencer" ? "display_name" :
                  engine.key === "community" ? "community_name" : "business_name";
  const title = String(merged[nameKey] || merged.business_name || "Untitled");
  const description = String(merged.business_description || merged.description || merged.community_purpose || "");

  // Resolve slug
  const slug = String(merged.slug || title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

  // Resolve industry for conditional modules
  const industry = String(merged.industry || merged.niche || "");

  // Build sections from engine defaults + conditional templates
  let sections = buildSectionsFromEngine(engine, merged, industry);

  // Validate and auto-repair
  const validation = validateDraft(input.engineKey, sections);
  sections = validation.cleanedSections;

  // Theme
  const primaryColor = String(merged.primary_color || "#2563eb");

  // Assets
  const assets: { type: string; url: string }[] = [];
  if (merged.logo_url) assets.push({ type: "logo", url: String(merged.logo_url) });
  if (merged.avatar_url) assets.push({ type: "avatar", url: String(merged.avatar_url) });
  if (merged.hero_banner_url) assets.push({ type: "banner", url: String(merged.hero_banner_url) });
  if (merged.cover_image_url) assets.push({ type: "cover", url: String(merged.cover_image_url) });

  return {
    surfaceTitle: title,
    surfaceDescription: description,
    slug,
    sections,
    theme: { primaryColor },
    assets,
    industry: industry || undefined,
    repairs: validation.repairs,
  };
}

// ─── Section Assembly ───

function buildSectionsFromEngine(
  engine: BuilderEngine,
  answers: Record<string, unknown>,
  industry: string
): SeedSection[] {
  // Start with engine's default sections
  const sections: SeedSection[] = engine.defaultSections.map((s) => ({
    type: s.type,
    schema: mergeIntoDefault(s.type, s.schema),
  }));

  // Inject answer data into hero section
  const heroIdx = sections.findIndex((s) => s.type === "hero");
  if (heroIdx >= 0) {
    const nameKey = engine.key === "influencer" ? "display_name" :
                    engine.key === "community" ? "community_name" : "business_name";
    sections[heroIdx].schema = mergeIntoDefault("hero", {
      ...sections[heroIdx].schema,
      headline: String(answers[nameKey] || ""),
      subheadline: String(answers.business_description || answers.description || answers.bio || ""),
    });
  }

  // Inject contact data if present
  const contactIdx = sections.findIndex((s) => s.type === "contact");
  if (contactIdx >= 0) {
    sections[contactIdx].schema = mergeIntoDefault("contact", {
      ...sections[contactIdx].schema,
      email: String(answers.contact_email || ""),
      phone: String(answers.contact_phone || ""),
      address: String(answers.location || ""),
    });
  }

  // Add industry-conditional templates
  if (industry && engine.conditionalQuestions?.[industry]) {
    const conditional = engine.conditionalQuestions[industry];
    const extraTemplates = engine.templates?.filter((t) =>
      conditional.extraModules?.some((m) => t.key.includes(m) || t.sectionType.includes(m))
    );
    if (extraTemplates) {
      for (const tmpl of extraTemplates) {
        if (!sections.some((s) => s.type === tmpl.sectionType)) {
          sections.push({
            type: tmpl.sectionType,
            schema: mergeIntoDefault(tmpl.sectionType, tmpl.schema),
          });
        }
      }
    }
  }

  return sections;
}

// ─── Validation ───

/**
 * Validates draft sections against engine boundaries.
 * Auto-repairs by removing invalid sections.
 */
export function validateDraft(
  engineKey: string,
  sections: SeedSection[],
): ValidationResult {
  const engine = getEngine(engineKey);
  if (!engine) return { valid: true, repairs: [], cleanedSections: sections };

  const rules = engine.aiGenerationRules;
  if (!rules) return { valid: true, repairs: [], cleanedSections: sections };

  const repairs: string[] = [];
  const cleaned: SeedSection[] = [];

  for (const section of sections) {
    // Check forbidden list (hard block)
    if (rules.forbiddenSectionTypes.includes(section.type)) {
      repairs.push(`Removed forbidden section type "${section.type}" for ${engineKey}`);
      continue;
    }
    cleaned.push(section);
  }

  return {
    valid: repairs.length === 0,
    repairs,
    cleanedSections: cleaned,
  };
}

// ─── Template Helpers ───

/**
 * Get allowed templates for an engine (for AI to choose from).
 */
export function getAllowedTemplates(engineKey: string): SectionTemplate[] {
  const engine = getEngine(engineKey);
  if (!engine) return [];
  return engine.templates || [];
}

/**
 * Check if a section type is allowed for an engine.
 */
export function isSectionAllowed(engineKey: string, sectionType: string): boolean {
  const engine = getEngine(engineKey);
  if (!engine?.aiGenerationRules) return true;
  return !engine.aiGenerationRules.forbiddenSectionTypes.includes(sectionType);
}
