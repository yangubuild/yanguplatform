import { useState, useMemo } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { getEngine } from "@/lib/builder/engineRegistry";
import { resolveEngineModules } from "@/lib/builder/engineResolver";
import {
  resolveModules,
  groupModules,
  SHARED_LAYOUT_TOOLS,
  SHARED_PAGE_TOOLS,
  type EditorModule,
} from "@/lib/builder/moduleRegistry";

interface EditorToolsPanelProps {
  onToggleAdaChat: () => void;
  onAction: (action: string, payload?: any) => void;
  selectedSection: string | null;
  businessName: string;
  category: string | null;
}

export function EditorToolsPanel({
  onToggleAdaChat,
  onAction,
  selectedSection,
  businessName,
  category,
}: EditorToolsPanelProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Content");

  // Resolve category-specific modules from engine config
  const toolGroups = useMemo(() => {
    const engine = category ? getEngine(category) : undefined;
    const moduleKeys = engine ? resolveEngineModules(engine) : [];
    const categoryModules = resolveModules(moduleKeys);
    const grouped = groupModules(categoryModules);

    // Build ordered groups: Content first, then others, then shared Layout + Page
    const result: { label: string; tools: EditorModule[] }[] = [];

    // Category-specific groups
    const groupOrder = ["Content", "Commerce", "Community", "Social"];
    for (const label of groupOrder) {
      if (grouped[label]?.length) {
        result.push({ label, tools: grouped[label] });
      }
    }

    // Shared groups
    result.push({ label: "Layout", tools: SHARED_LAYOUT_TOOLS });
    result.push({ label: "Page", tools: SHARED_PAGE_TOOLS });

    return result;
  }, [category]);

  const engineLabel = category
    ? (getEngine(category)?.label || category)
    : "Website";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {engineLabel} Editor
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {businessName || "Your Website"}
            </p>
          </div>
          <button
            onClick={onToggleAdaChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ada AI
          </button>
        </div>
      </div>

      {/* Selected section indicator */}
      {selectedSection && (
        <div className="px-4 py-2 bg-primary/5 border-b border-primary/20">
          <p className="text-[11px] text-primary font-medium">
            Section #{parseInt(selectedSection) + 1} selected
          </p>
        </div>
      )}

      {/* Tool groups — driven by engine.editorModules */}
      <div className="flex-1 overflow-y-auto">
        {toolGroups.map((group) => (
          <div key={group.label} className="border-b border-border">
            <button
              onClick={() =>
                setExpandedGroup(expandedGroup === group.label ? null : group.label)
              }
              className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
            >
              {group.label}
              <ChevronRight
                className={`h-3.5 w-3.5 transition-transform ${
                  expandedGroup === group.label ? "rotate-90" : ""
                }`}
              />
            </button>
            {expandedGroup === group.label && (
              <div className="px-3 pb-3 space-y-1">
                {group.tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => onAction(tool.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-muted/80 transition-colors group"
                  >
                    <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                      <tool.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {tool.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick tip */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          💡 Click elements in preview to edit directly. Or ask{" "}
          <button
            onClick={onToggleAdaChat}
            className="text-primary font-medium hover:underline"
          >
            Ada AI
          </button>{" "}
          for help.
        </p>
      </div>
    </div>
  );
}
