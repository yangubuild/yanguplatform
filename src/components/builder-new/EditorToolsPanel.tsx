import { useState } from "react";
import {
  Type, Image, Palette, LayoutGrid, Plus, Trash2,
  ArrowUp, ArrowDown, Sparkles, ChevronRight,
  Eye, EyeOff, Move, Copy, Settings2
} from "lucide-react";

interface EditorToolsPanelProps {
  onToggleAdaChat: () => void;
  onAction: (action: string, payload?: any) => void;
  selectedSection: string | null;
  businessName: string;
  category: string | null;
}

const TOOL_GROUPS = [
  {
    label: "Content",
    tools: [
      { id: "edit_text", icon: Type, label: "Edit Text", description: "Click any text in the preview to edit" },
      { id: "replace_image", icon: Image, label: "Replace Image", description: "Click an image, then replace it" },
      { id: "change_colors", icon: Palette, label: "Change Colors", description: "Update brand colors and accents" },
    ],
  },
  {
    label: "Layout",
    tools: [
      { id: "add_section", icon: Plus, label: "Add Section", description: "Insert a new content section" },
      { id: "move_up", icon: ArrowUp, label: "Move Up", description: "Move selected section up" },
      { id: "move_down", icon: ArrowDown, label: "Move Down", description: "Move selected section down" },
      { id: "remove_section", icon: Trash2, label: "Remove Section", description: "Delete selected section" },
    ],
  },
  {
    label: "Page",
    tools: [
      { id: "toggle_grid", icon: LayoutGrid, label: "Grid / List", description: "Switch layout mode" },
      { id: "duplicate_section", icon: Copy, label: "Duplicate", description: "Copy selected section" },
      { id: "section_settings", icon: Settings2, label: "Section Settings", description: "Configure section options" },
    ],
  },
];

export function EditorToolsPanel({
  onToggleAdaChat,
  onAction,
  selectedSection,
  businessName,
  category,
}: EditorToolsPanelProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Content");

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Editor Tools</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {businessName || "Your Website"} • {category || "site"}
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

      {/* Tool groups */}
      <div className="flex-1 overflow-y-auto">
        {TOOL_GROUPS.map((group) => (
          <div key={group.label} className="border-b border-border">
            <button
              onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)}
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
                      <p className="text-sm font-medium text-foreground">{tool.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{tool.description}</p>
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
          💡 Click elements in the preview to select them, then use tools above to edit. Or ask <button onClick={onToggleAdaChat} className="text-primary font-medium hover:underline">Ada AI</button> for help.
        </p>
      </div>
    </div>
  );
}
