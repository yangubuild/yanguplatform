// YANGU Builder — Template hook for main content switching
// Uses the Blueprint Registry to resolve correct schema + variant on switch.

import {
  getEngineBlueprint,
  getContentSectionSchema,
  surfaceTypeToEngineKey,
} from "@/config/blueprintRegistry";

export interface TemplateResult {
  schema: Record<string, unknown>;
  variant: string | undefined;
  allowed: string[];
}

/**
 * Resolve the correct default schema and variant when switching main content.
 * Called by MainContentSwitcher after the RPC completes.
 */
export function applyTemplateForMainContent(
  surfaceType: string,
  industry: string | undefined,
  mainContentType: string,
  variant?: string
): TemplateResult {
  const engineKey = surfaceTypeToEngineKey(surfaceType);
  const bp = getEngineBlueprint(engineKey);
  const slot = bp?.slots.main_content;

  // Schema from contracts (or empty)
  const schema = getContentSectionSchema(mainContentType);

  // Resolve variant: use provided, else engine default, else first allowed
  const allowedVariants = slot?.variants?.allowed ?? [];
  const resolvedVariant =
    variant && allowedVariants.includes(variant)
      ? variant
      : slot?.variants?.default ?? allowedVariants[0];

  // Apply variant to schema
  if (resolvedVariant && slot?.variants?.field) {
    const fieldKey = slot.variants.field.replace("schema.", "");
    schema[fieldKey] = resolvedVariant;
  }

  console.log("TEMPLATE_HOOK", { engineKey, surfaceType, industry, mainContentType, resolvedVariant });

  return {
    schema,
    variant: resolvedVariant,
    allowed: slot?.allowed_switch_targets ?? [],
  };
}
