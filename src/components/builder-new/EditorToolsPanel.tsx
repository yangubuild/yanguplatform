import { useState, useMemo } from "react";
import { ChevronRight, Sparkles, Type, Image as ImageIcon, MousePointer, LayoutGrid, Square, Columns } from "lucide-react";
import { getEngine } from "@/lib/builder/engineRegistry";
import { resolveEngineModules } from "@/lib/builder/engineResolver";
import {
  resolveModules,
  groupModules,
  SHARED_LAYOUT_TOOLS,
  SHARED_PAGE_TOOLS,
  type EditorModule,
} from "@/lib/builder/moduleRegistry";
import type { CanvasSelection, SelectionKind } from "@/lib/builder/selectionTypes";

interface EditorToolsPanelProps {
  onToggleAdaChat: () => void;
  onAction: (action: string, payload?: any) => void;
  selectedSection: string | null;
  businessName: string;
  category: string | null;
  canvasSelection?: CanvasSelection | null;
}

const SELECTION_LABELS: Record<SelectionKind, { label: string; icon: typeof Type; color: string }> = {
  page: { label: "Page", icon: LayoutGrid, color: "text-muted-foreground" },
  section: { label: "Section", icon: Columns, color: "text-green-500" },
  text: { label: "Text", icon: Type, color: "text-green-500" },
  image: { label: "Image", icon: ImageIcon, color: "text-green-500" },
  button: { label: "Button", icon: MousePointer, color: "text-green-500" },
  card: { label: "Card / Item", icon: Square, color: "text-green-500" },
  background: { label: "Background", icon: LayoutGrid, color: "text-muted-foreground" },
};

const EDITOR_LABEL_BY_CATEGORY: Record<string, string> = {
  eshop: "Shop Editor",
  emenu: "Menu Editor",
  esite: "Site Editor",
  estore: "Store Editor",
  influencer: "Creator Editor",
  community: "Community Editor",
};

export function EditorToolsPanel({
  onToggleAdaChat,
  onAction,
  selectedSection,
  businessName,
  category,
  canvasSelection,
}: EditorToolsPanelProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Content");

  // Resolve category-specific modules from engine config
  const toolGroups = useMemo(() => {
    const engine = category ? getEngine(category) : undefined;
    const moduleKeys = engine ? resolveEngineModules(engine) : [];
    const categoryModules = resolveModules(moduleKeys);
    const grouped = groupModules(categoryModules);

    const result: { label: string; tools: EditorModule[] }[] = [];
    const groupOrder = ["Content", "Commerce", "Community", "Social"];
    for (const label of groupOrder) {
      if (grouped[label]?.length) {
        result.push({ label, tools: grouped[label] });
      }
    }
    result.push({ label: "Layout", tools: SHARED_LAYOUT_TOOLS });
    result.push({ label: "Page", tools: SHARED_PAGE_TOOLS });
    return result;
  }, [category]);

  const editorLabel = category
    ? (EDITOR_LABEL_BY_CATEGORY[category] || `${getEngine(category)?.label || category} Editor`)
    : "Site Editor";

  const selInfo = canvasSelection ? SELECTION_LABELS[canvasSelection.kind] : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {editorLabel}
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

      {/* Selection context indicator */}
      {canvasSelection && selInfo && (
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <selInfo.icon className={`h-3.5 w-3.5 ${selInfo.color}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${selInfo.color}`}>
                {selInfo.label} selected
                {canvasSelection.sectionIndex !== undefined && (
                  <span className="text-muted-foreground font-normal ml-1">
                    • Section {canvasSelection.sectionIndex + 1}
                  </span>
                )}
              </p>
              {canvasSelection.preview && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {canvasSelection.kind === "image"
                    ? "Image element"
                    : canvasSelection.preview}
                </p>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              {canvasSelection.tag}
            </span>
          </div>
        </div>
      )}

      {/* Fallback: legacy section indicator when no canvas selection */}
      {!canvasSelection && selectedSection && (
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

      <div className="px-4 py-3 border-t border-border shrink-0">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Click elements in preview to select them. Or ask{" "}
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
