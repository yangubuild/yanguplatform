/**
 * YANGU Social Media — Service Index
 * Re-exports all social media services from a single entry point.
 */

export { providerRegistry } from "./providerInterface";
export type { SocialProviderAdapter } from "./providerInterface";
export { outstandAdapter } from "./outstandAdapter";
export { postLifecycleService } from "./postLifecycleService";
export { analyticsService } from "./analyticsService";
export { libraryService } from "./libraryService";
export { templateService, designService, applyBrandToTemplate, resolveLayersWithOverrides } from "./templateService";
export type { BrandConfig } from "./templateService";
export { variationGenerationService } from "./variationGenerationService";
export { resizeEngine, PLATFORM_ASPECT_MAP, CANVAS_SIZES, ALL_PLATFORMS } from "./resizeEngine";
export { publishGuards } from "./publishGuards";

export {
  brandContextBuilder,
  aiProfileRulesEngine,
  topicEngine,
  captionGenerator,
  postVariantGenerator,
  mediaPromptBuilder,
  platformAdaptationEngine,
} from "./aiEngine";

// Register Outstand as default provider on module load
import { providerRegistry } from "./providerInterface";
import { outstandAdapter } from "./outstandAdapter";
providerRegistry.register(outstandAdapter);
