/**
 * Emenu Template-First Generation Engine
 *
 * Flow: classify → pool → pick 2 options → user chooses → generate with fidelity
 * Retry: if both rejected, serve next pair from pool (no repeats).
 *
 * LOCKED DESIGN RULE:
 * - Published emenu output is MOBILE-FIRST (phones are the primary viewport).
 * - The builder/editor workspace is DESKTOP-FIRST.
 * - Generated templates must render correctly on 360–414px without manual fixes.
 * - See EMENU_DESIGN_PRIORITIES in types.ts for enforcement constants.
 */

import { classifyMenuComplexity, getTemplatesForComplexity, type ClassificationInput } from "./templateClassifier";
import { getTemplate, getTemplateSectionOrder, getTemplateLayoutPatterns, type TemplatePreset } from "@/config/templateRegistry";
import type { MenuComplexity } from "./types";
import { MENU_CATEGORY_LABELS } from "./types";

// ─── Types ───

export interface EmenuGenerationInput {
  /** From onboarding / AI chat */
  businessType?: string;
  cuisineType?: string;
  userIdea?: string;
  estimatedItems?: number;
  /** User branding */
  businessName: string;
  logoUrl?: string;
  primaryColor?: string;
  /** Menu content (if already collected) */
  menuItems?: unknown[];
}

export interface TemplateOption {
  templateKey: string;
  label: string;
  description: string;
  icon: string;
  /** The classification group this belongs to */
  category: MenuComplexity;
  categoryLabel: string;
  /** Structural metadata from reference */
  sectionOrder: string[];
  layoutPatterns: string[];
}

export interface TemplateSelectionState {
  /** Current classification */
  category: MenuComplexity;
  categoryLabel: string;
  categoryDescription: string;
  /** Current pair shown to user */
  currentPair: [TemplateOption, TemplateOption];
  /** Keys already shown (for retry dedup) */
  shownKeys: Set<string>;
  /** All available keys in pool */
  poolKeys: string[];
  /** How many rounds of rejection so far */
  rejectionCount: number;
}

export interface GenerationBlueprint {
  templateKey: string;
  category: MenuComplexity;
  /** Enforced section ordering from saved template */
  sectionOrder: string[];
  /** Layout patterns to follow */
  layoutPatterns: string[];
  /** Branding to apply */
  branding: {
    businessName: string;
    logoUrl?: string;
    primaryColor: string;
    /** true if logo was AI-generated because user had none */
    logoIsGenerated: boolean;
  };
  /** Template patches to apply (structural fidelity) */
  templatePatches: TemplatePreset["patches"];
}

// ─── Classification ───

export function classifyEmenu(input: EmenuGenerationInput): MenuComplexity {
  return classifyMenuComplexity({
    businessType: input.businessType,
    cuisineType: input.cuisineType,
    userIdea: input.userIdea,
    estimatedItems: input.estimatedItems,
  });
}

// ─── Pool & Selection ───

function buildTemplateOption(templateKey: string, category: MenuComplexity): TemplateOption | null {
  const preset = getTemplate("emenu", templateKey);
  if (!preset) return null;
  return {
    templateKey,
    label: preset.label,
    description: preset.description,
    icon: preset.icon,
    category,
    categoryLabel: MENU_CATEGORY_LABELS[category].label,
    sectionOrder: getTemplateSectionOrder("emenu", templateKey),
    layoutPatterns: getTemplateLayoutPatterns("emenu", templateKey),
  };
}

/**
 * For reservation mode, return a single-template result (no 2-option selection).
 */
export interface SingleTemplateResult {
  category: "reservation";
  categoryLabel: string;
  categoryDescription: string;
  template: TemplateOption;
}

/**
 * Initialize template selection: classify input, build pool, return first pair.
 * For reservation mode, returns a SingleTemplateResult instead (no 2-option flow).
 */
export function initTemplateSelection(input: EmenuGenerationInput): TemplateSelectionState | SingleTemplateResult {
  const category = classifyEmenu(input);
  const poolKeys = getTemplatesForComplexity(category);
  const meta = MENU_CATEGORY_LABELS[category];

  // Reservation: always use the single gusto_reservation template — no 2-option selection
  if (category === "reservation") {
    const template = buildTemplateOption(poolKeys[0], category)!;
    return {
      category: "reservation",
      categoryLabel: meta.label,
      categoryDescription: meta.description,
      template,
    };
  }

  // Pick first two (structurally most different come first in registry order)
  const pair = pickNextPair(poolKeys, new Set());

  return {
    category,
    categoryLabel: meta.label,
    categoryDescription: meta.description,
    currentPair: pair.options,
    shownKeys: pair.shown,
    poolKeys,
    rejectionCount: 0,
  };
}

/** Type guard: check if result is a single-template reservation */
export function isSingleTemplateResult(
  result: TemplateSelectionState | SingleTemplateResult
): result is SingleTemplateResult {
  return result.category === "reservation" && "template" in result;
}

/**
 * Retry after user rejects both options.
 * Returns updated state with next pair, or cycles if pool exhausted.
 */
export function retryTemplateSelection(state: TemplateSelectionState): TemplateSelectionState {
  const pair = pickNextPair(state.poolKeys, state.shownKeys);

  return {
    ...state,
    currentPair: pair.options,
    shownKeys: pair.shown,
    rejectionCount: state.rejectionCount + 1,
  };
}

function pickNextPair(
  poolKeys: string[],
  alreadyShown: Set<string>
): { options: [TemplateOption, TemplateOption]; shown: Set<string> } {
  // Determine category from first key
  const category = getCategoryForKey(poolKeys[0]);

  // Filter to unseen
  let available = poolKeys.filter((k) => !alreadyShown.has(k));

  // If fewer than 2 unseen, reset (cycle) but shuffle order
  if (available.length < 2) {
    available = [...poolKeys];
    alreadyShown = new Set();
    // Shuffle to avoid exact same pair on cycle
    available = shuffleArray(available);
  }

  const first = buildTemplateOption(available[0], category)!;
  const second = buildTemplateOption(available[1], category)!;

  const newShown = new Set(alreadyShown);
  newShown.add(available[0]);
  newShown.add(available[1]);

  return { options: [first, second], shown: newShown };
}

function getCategoryForKey(key: string): MenuComplexity {
  if (key.includes("gusto") || key.includes("reservation")) return "reservation";
  if (key.includes("sweet_sips") || key.includes("sunday_bite") || key.includes("yumix_lite") || key.includes("yumix_minimal")) return "simple_cafe";
  return "bigger_menu";
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ─── Generation Blueprint ───

/**
 * Build the final generation blueprint from a chosen template.
 * This enforces structural fidelity to the saved template.
 */
export function buildGenerationBlueprint(
  templateKey: string,
  input: EmenuGenerationInput
): GenerationBlueprint {
  const preset = getTemplate("emenu", templateKey);
  if (!preset) throw new Error(`Unknown emenu template: ${templateKey}`);

  const category = getCategoryForKey(templateKey);
  const needsGeneratedLogo = !input.logoUrl;

  return {
    templateKey,
    category,
    sectionOrder: preset.reference?.sectionOrder ?? [],
    layoutPatterns: preset.reference?.layoutPatterns ?? [],
    branding: {
      businessName: input.businessName,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor || "#2563eb",
      logoIsGenerated: needsGeneratedLogo,
    },
    templatePatches: preset.patches,
  };
}

/**
 * Validate that generated sections follow the template's structural fidelity.
 * Returns repairs if sections deviate from saved template order.
 */
export function validateStructuralFidelity(
  blueprint: GenerationBlueprint,
  generatedSectionTypes: string[]
): { isValid: boolean; repairs: string[] } {
  const repairs: string[] = [];
  const expectedOrder = blueprint.sectionOrder;

  if (expectedOrder.length === 0) {
    return { isValid: true, repairs: [] };
  }

  // Check that all expected sections are present
  for (const expected of expectedOrder) {
    const normalizedExpected = expected.replace(/_dark|_split|_fullwidth|_cinematic|_4col|_grid|_row|_carousel|_duo|_cta|_nav_cta|_rating|_discount|_display_only/g, "");
    const found = generatedSectionTypes.some((s) => s.includes(normalizedExpected) || normalizedExpected.includes(s));
    if (!found) {
      repairs.push(`Missing section "${expected}" from template ${blueprint.templateKey}`);
    }
  }

  return {
    isValid: repairs.length === 0,
    repairs,
  };
}
