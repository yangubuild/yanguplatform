import type { Selection, Category } from "./types/builder.types";
import { CATEGORY_CONFIGS } from "./types/builder.types";
import { CheckCircle2 } from "lucide-react";

interface SelectionPanelProps {
  selections: Selection[];
  category: Category | null;
}

export function SelectionPanel({ selections, category }: SelectionPanelProps) {
  if (selections.length === 0 && !category) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
        <p className="text-sm">Your selections will appear here as you chat with Ada.</p>
      </div>
    );
  }

  const grouped = selections.reduce<Record<string, Selection[]>>((acc, s) => {
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
    confirm: "Confirmation",
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
    </div>
  );
}
