import { useState } from "react";
import {
  ChevronRight, LayoutGrid, List, Image, Plus,
  GripVertical, Type, Phone, MapPin, Store
} from "lucide-react";

interface EmenuEditorPanelProps {
  businessName: string;
  category: string | null;
  onAction: (action: string, payload?: any) => void;
}

type Section = "menu" | "categories" | "images" | "layout" | "business";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "menu", label: "Menu Items", icon: Type },
  { id: "categories", label: "Categories", icon: GripVertical },
  { id: "images", label: "Images", icon: Image },
  { id: "layout", label: "Layout", icon: LayoutGrid },
  { id: "business", label: "Business Info", icon: Store },
];

export function EmenuEditorPanel({ businessName, category, onAction }: EmenuEditorPanelProps) {
  const [expanded, setExpanded] = useState<Section | null>("menu");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [columns, setColumns] = useState<2 | 3>(2);

  const toggle = (s: Section) => setExpanded(expanded === s ? null : s);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">Menu Editor</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {businessName || "Your Menu"} • {category === "emenu" ? "eMenu" : category || "site"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {SECTIONS.map((sec) => (
          <div key={sec.id} className="border-b border-border">
            <button
              onClick={() => toggle(sec.id)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <sec.icon className="h-3.5 w-3.5" />
                {sec.label}
              </span>
              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded === sec.id ? "rotate-90" : ""}`} />
            </button>

            {expanded === sec.id && (
              <div className="px-4 pb-3 space-y-2">
                {sec.id === "menu" && (
                  <>
                    <p className="text-[11px] text-muted-foreground">Click any item in preview to edit name, price, description, or image.</p>
                    <button
                      onClick={() => onAction("add_menu_item")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Item
                    </button>
                  </>
                )}

                {sec.id === "categories" && (
                  <>
                    <button
                      onClick={() => onAction("add_category")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Category
                    </button>
                    <p className="text-[11px] text-muted-foreground">Drag to reorder. Click to rename.</p>
                  </>
                )}

                {sec.id === "images" && (
                  <>
                    <button
                      onClick={() => onAction("upload_image")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Image className="h-3.5 w-3.5" /> Upload Image
                    </button>
                    <button
                      onClick={() => onAction("ai_generate_image")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Image className="h-3.5 w-3.5" /> AI Generate
                    </button>
                    <p className="text-[11px] text-muted-foreground">Click any image in preview to replace it.</p>
                  </>
                )}

                {sec.id === "layout" && (
                  <div className="space-y-3">
                    {/* Grid / List */}
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Display Mode</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setLayoutMode("grid"); onAction("set_layout", { mode: "grid" }); }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${layoutMode === "grid" ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted"}`}
                        >
                          <LayoutGrid className="h-3 w-3" /> Grid
                        </button>
                        <button
                          onClick={() => { setLayoutMode("list"); onAction("set_layout", { mode: "list" }); }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${layoutMode === "list" ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted"}`}
                        >
                          <List className="h-3 w-3" /> List
                        </button>
                      </div>
                    </div>
                    {/* Columns */}
                    {layoutMode === "grid" && (
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Columns</label>
                        <div className="flex gap-1">
                          {([2, 3] as const).map((n) => (
                            <button
                              key={n}
                              onClick={() => { setColumns(n); onAction("set_columns", { columns: n }); }}
                              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${columns === n ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted"}`}
                            >
                              {n} cols
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {sec.id === "business" && (
                  <div className="space-y-2">
                    {[
                      { icon: Store, label: "Restaurant Name", action: "edit_business_name" },
                      { icon: Image, label: "Logo", action: "edit_logo" },
                      { icon: Phone, label: "Phone", action: "edit_phone" },
                      { icon: MapPin, label: "Address", action: "edit_address" },
                    ].map((item) => (
                      <button
                        key={item.action}
                        onClick={() => onAction(item.action)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                      >
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0">
        <p className="text-[11px] text-muted-foreground">
          Phase 3A • Core menu editing only
        </p>
      </div>
    </div>
  );
}
