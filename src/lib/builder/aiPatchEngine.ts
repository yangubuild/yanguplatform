/**
 * AI Patch Engine — Safe structured editing for builder surfaces.
 * 
 * AI chat produces a "patch plan" (structured JSON operations).
 * This engine validates and applies patches while enforcing category boundaries.
 */

import { getEngine } from "./engineRegistry";
import { mergeIntoDefault } from "@/lib/builderDefaults";
import type { SeedSection } from "./types";

// ─── Patch Plan Types ───

export type PatchOperation =
  | { op: "update_section"; sectionId: string; patch: Record<string, unknown> }
  | { op: "add_section"; templateKey: string; position?: number }
  | { op: "remove_section"; sectionId: string }
  | { op: "reorder_sections"; sectionIds: string[] }
  | { op: "update_theme"; patch: Record<string, unknown> }
  | { op: "replace_media"; sectionId: string; mediaPatch: Record<string, unknown> }
  // Category-specific ops
  | { op: "add_item"; categoryId: string; itemPatch: Record<string, unknown> }       // emenu
  | { op: "add_product"; productPatch: Record<string, unknown> }                      // eshop/estore
  | { op: "add_event"; eventPatch: Record<string, unknown> }                          // community
  | { op: "add_program"; programPatch: Record<string, unknown> }                      // community
  | { op: "add_link"; linkPatch: Record<string, unknown> };                           // influencer

export interface PatchPlan {
  operations: PatchOperation[];
}

export interface PatchResult {
  applied: PatchOperation[];
  rejected: { op: PatchOperation; reason: string }[];
  warnings: string[];
}

// ─── Category boundary refusal messages ───

const REFUSAL_MESSAGES: Record<string, Record<string, string>> = {
  influencer: {
    booking: "Influencer pages don't support booking calendars. Try adding a booking link CTA instead.",
    calendar: "Influencer pages don't support calendars. Use a link to an external scheduling tool.",
    listings: "Property listings aren't available for Influencer. Consider a featured links section.",
    cart: "Influencer pages don't have shopping carts. Use affiliate links or product pins instead.",
    checkout: "Checkout isn't available for Influencer pages. Link to an external shop instead.",
    menu: "Menu sections are for Emenu only. Try a featured products pin section.",
    member_signup: "Member signup is for Community pages. Use a contact/tips section instead.",
  },
  community: {
    cart: "Community pages don't support shopping carts. Use membership tiers instead.",
    checkout: "Checkout isn't available for Community. Consider a donation or membership payment flow.",
    menu: "Menu ordering is for Emenu only.",
    products: "Product catalogs are for Eshop/Estore. Use resources or programs instead.",
    affiliate: "Affiliate blocks are for Influencer pages.",
    bio: "Bio links are for Influencer pages. Use an About section instead.",
  },
  emenu: {
    member_signup: "Member directories are for Community pages. Try a contact or WhatsApp section.",
    listings: "Property listings are for Esite. Use menu categories instead.",
    booking: "Booking calendars are for Esite hospitality. Use a reservation contact instead.",
    affiliate: "Affiliate blocks are for Influencer pages.",
  },
  eshop: {
    menu: "Menu sections are for Emenu only. Use product collections instead.",
    booking: "Booking calendars are for Esite only.",
    listings: "Property listings are for Esite only. Use product grid instead.",
    member_signup: "Member signup is for Community pages.",
  },
  estore: {
    menu: "Menu sections are for Emenu only.",
    booking: "Booking calendars are for Esite only.",
    cart: "Estore uses quote requests, not shopping carts.",
    checkout: "Estore uses quote requests instead of checkout.",
  },
  esite: {
    menu: "Menu ordering is for Emenu only.",
    affiliate: "Affiliate blocks are for Influencer pages.",
    member_signup: "Member signup is for Community pages.",
    live_selling: "Live selling is for Influencer pages.",
  },
};

// ─── Patch Application ───

/**
 * Validates and applies a patch plan against engine boundaries.
 * Returns applied ops, rejected ops with reasons, and warnings.
 */
export function applyPatchPlan(
  engineKey: string,
  currentSections: SeedSection[],
  plan: PatchPlan
): PatchResult {
  const engine = getEngine(engineKey);
  if (!engine) {
    return {
      applied: [],
      rejected: plan.operations.map((op) => ({ op, reason: "Unknown engine" })),
      warnings: [],
    };
  }

  const rules = engine.aiGenerationRules;
  const applied: PatchOperation[] = [];
  const rejected: { op: PatchOperation; reason: string }[] = [];
  const warnings: string[] = [];

  for (const op of plan.operations) {
    const rejection = checkBoundary(engineKey, op, rules);
    if (rejection) {
      rejected.push({ op, reason: rejection });
      continue;
    }

    // Operation-specific validation
    switch (op.op) {
      case "add_section": {
        const template = engine.templates?.find((t) => t.key === op.templateKey);
        if (!template) {
          rejected.push({ op, reason: `Template "${op.templateKey}" not found for ${engineKey}` });
        } else {
          applied.push(op);
        }
        break;
      }

      case "update_section": {
        // Ensure deep-merge into defaults
        applied.push(op);
        break;
      }

      case "remove_section":
      case "reorder_sections":
      case "update_theme":
      case "replace_media":
        applied.push(op);
        break;

      // Category-specific ops
      case "add_item":
        if (engineKey !== "emenu") {
          rejected.push({ op, reason: "add_item is only available for Emenu" });
        } else {
          applied.push(op);
        }
        break;

      case "add_product":
        if (!["eshop", "estore"].includes(engineKey)) {
          rejected.push({ op, reason: "add_product is only available for Eshop/Estore" });
        } else {
          applied.push(op);
        }
        break;

      case "add_event":
      case "add_program":
        if (engineKey !== "community") {
          rejected.push({ op, reason: `${op.op} is only available for Community` });
        } else {
          applied.push(op);
        }
        break;

      case "add_link":
        if (engineKey !== "influencer") {
          rejected.push({ op, reason: "add_link is only available for Influencer" });
        } else {
          applied.push(op);
        }
        break;

      default:
        rejected.push({ op, reason: "Unknown operation" });
    }
  }

  if (rejected.length> 0) {
    warnings.push(`${rejected.length} operation(s) were rejected due to category boundaries.`);
  }

  return { applied, rejected, warnings };
}

// ─── Boundary Checking ───

function checkBoundary(
  engineKey: string,
  op: PatchOperation,
  rules?: { forbiddenSectionTypes: string[]; allowedSectionTypes: string[] }
): string | null {
  if (!rules) return null;

  // Check add_section against forbidden types
  if (op.op === "add_section") {
    const engine = getEngine(engineKey);
    const template = engine?.templates?.find((t) => t.key === op.templateKey);
    if (template && rules.forbiddenSectionTypes.includes(template.sectionType)) {
      const refusal = REFUSAL_MESSAGES[engineKey]?.[template.sectionType];
      return refusal || `Section type "${template.sectionType}" is not allowed for ${engineKey}`;
    }
  }

  return null;
}

/**
 * Get the refusal message for a disallowed feature request.
 * Used by AI chat to explain why a request was rejected.
 */
export function getRefusalMessage(engineKey: string, requestedFeature: string): string | null {
  // Check direct match
  const directRefusal = REFUSAL_MESSAGES[engineKey]?.[requestedFeature];
  if (directRefusal) return directRefusal;

  // Check if the feature is in forbidden list
  const engine = getEngine(engineKey);
  if (engine?.aiGenerationRules?.forbiddenSectionTypes.includes(requestedFeature)) {
    return `"${requestedFeature}" is not available for ${engine.label} pages. This feature belongs to a different category.`;
  }

  return null;
}
