/**
 * Builder Engine type definitions.
 * Each category (emenu, esite, eshop, estore, influencer, community)
 * has a BuilderEngine config that drives onboarding, editing, and publishing.
 */

export interface IndustryOption {
  value: string;
  label: string;
}

export interface QuestionField {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "color" | "switch" | "checkbox" | "file" | "slug";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** For slug fields, the domain to show in preview */
  slugDomain?: string;
  /** Key of the field to auto-derive slug from */
  slugSource?: string;
  /** Conditional: only show if another field has a truthy value */
  showIf?: string;
  /** Default value */
  defaultValue?: string | boolean;
  /** Hint text below the field */
  hint?: string;
  /** Grid column span (1 or 2, default 2 = full width) */
  colSpan?: 1 | 2;
}

export interface QuestionStep {
  title: string;
  subtitle?: string;
  fields: QuestionField[];
  continueLabel?: string;
}

export interface SeedSection {
  type: string;
  schema: Record<string, unknown>;
}

export interface BuilderEngine {
  /** Unique key: emenu, esite, eshop, estore, influencer, community */
  key: string;
  /** Surface type stored in builder_surfaces */
  surfaceType: string;
  /** Display label */
  label: string;
  /** Short description */
  description: string;
  /** Domain for publishing */
  publishDomain: string;
  /** Industry options */
  industries: IndustryOption[];
  /** Steps for "Build Manually" wizard */
  manualSteps: QuestionStep[];
  /** Short question set for "Build with AI" */
  aiQuestions: QuestionField[];
  /** Default seed sections when creating */
  defaultSections: SeedSection[];
  /** Which editor modules to show in right panel */
  editorModules: string[];
  /** Extra modules unlocked per industry */
  industryModules?: Record<string, string[]>;
  /** Icon name from lucide-react */
  icon: string;
}
