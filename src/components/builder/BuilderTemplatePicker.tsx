import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, LayoutTemplate, Loader2 } from "lucide-react";
import { getTemplatesForEngine, mergeTemplateSchema, type TemplatePreset } from "@/config/templateRegistry";
import { surfaceTypeToEngineKey } from "@/config/blueprintRegistry";
import { toast } from "sonner";

interface BuilderTemplatePickerProps {
  surfaceType: string;
  sections: Array<{
    id: string;
    section_type: string;
    schema: Record<string, unknown>;
    core_slot?: string | null;
    isMissing?: boolean;
  }>;
  onApply: (sectionId: string, schema: Record<string, unknown>) => Promise<void>;
}

export function BuilderTemplatePicker({ surfaceType, sections, onApply }: BuilderTemplatePickerProps) {
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  const engineKey = surfaceTypeToEngineKey(surfaceType);
  const templates = getTemplatesForEngine(engineKey);

  if (templates.length === 0) return null;

  const applyTemplate = async (template: TemplatePreset) => {
    setApplying(template.key);
    try {
      const patches = template.patches;

      for (const [slotKey, patch] of Object.entries(patches)) {
        if (!patch) continue;

        // Find matching section strictly by core_slot only
        const section = sections.find(
          (s) => !s.isMissing && s.core_slot === slotKey
        );

        if (section) {
          const mergedSchema = mergeTemplateSchema(
            section.schema as Record<string, unknown>,
            patch.schema
          );
          await onApply(section.id, mergedSchema);
        }
      }

      setApplied(template.key);
      toast.success(`Template "${template.label}" applied!`);
      setTimeout(() => setApplied(null), 3000);
    } catch (err) {
      console.error("Template apply error:", err);
      toast.error("Failed to apply template");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="h-4 w-4 text-primary" />
        <label className="text-xs font-medium">Templates</label>
      </div>
      <div className="space-y-2">
        {templates.map((t) => (
          <button
            key={t.key}
            onClick={() => applyTemplate(t)}
            disabled={!!applying}
            className={`w-full text-left border rounded-lg p-3 transition-all hover:border-primary/50 hover:bg-accent/5 ${
              applied === t.key ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{t.label}</span>
                  {applying === t.key && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  {applied === t.key && <Check className="h-3 w-3 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
