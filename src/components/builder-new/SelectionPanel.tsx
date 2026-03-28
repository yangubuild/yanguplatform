import type { Selection, Category } from "./types/builder.types";
import { CATEGORY_CONFIGS } from "./types/builder.types";
import { CheckCircle2, Sparkles } from "lucide-react";

interface SelectionPanelProps {
  selections: Selection[];
  category: Category | null;
  generatedHtml: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function SelectionPanel({ selections, category, generatedHtml, isGenerating, onGenerate }: SelectionPanelProps) {
  const hasConfirm = selections.some((s) => s.type === "confirm");

  if (selections.length === 0 && !category) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
        <p className="text-sm">Your selections will appear here as you chat with Ada.</p>
      </div>
    );
  }

  const grouped = selections.reduce<Record<string, Selection[]>>((acc, s) => {
    if (s.type === "confirm") return acc;
    (acc[s.type] ??= []).push(s);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    category: "Category",
    scope: "Website Type",
    assets: "Assets",
    sections: "Sections",
    delivery_apps: "Delivery Apps",
    style_category: "Style",
    style_specific: "Specific Style",
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
        Your Selections
      </h3>

      {category && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Detected Category</p>
          <p className="text-sm font-medium text-foreground">
            {CATEGORY_CONFIGS[category].label} ({CATEGORY_CONFIGS[category].domain})
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-2">
            {typeLabels[type] || type}
          </p>
          <div className="flex flex-col gap-1">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Generate button */}
      {hasConfirm && !generatedHtml && (
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating..." : "🚀 Generate Website"}
        </button>
      )}

      {generatedHtml && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
          <p className="text-sm font-medium text-primary">✅ Website Generated</p>
          <p className="text-xs text-muted-foreground mt-1">Preview is shown on the right</p>
        </div>
      )}
    </div>
  );
}
