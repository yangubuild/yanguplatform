import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SYSTEM_THEMES, type SocialTheme } from "@/data/socialThemes";
import { ThemePreviewCard } from "./ThemePreviewCard";

interface Props {
  open: boolean;
  onClose: () => void;
  selectedKeys: string[];
  customThemes: { key: string; name: string }[];
  onSave: (selectedKeys: string[], customThemes: { key: string; name: string }[]) => void;
}

const INITIAL_VISIBLE = 49;

export function ChooseThemesModal({ open, onClose, selectedKeys, customThemes, onSave }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedKeys));
  const [customs, setCustoms] = useState(customThemes);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAll, setShowAll] = useState(false);

  if (!open) return null;

  const allThemes: (SocialTheme & { isCustom?: boolean })[] = [
    ...SYSTEM_THEMES,
    ...customs.map((c) => ({
      key: c.key, name: c.name, templateCount: 0,
      mood: `Custom theme: ${c.name}`, colorHint: "user defined",
      isSystem: false, isCustom: true, category: "general" as const,
    })),
  ];

  const visibleThemes = showAll ? allThemes : allThemes.slice(0, INITIAL_VISIBLE);
  const hasMore = allThemes.length > INITIAL_VISIBLE;

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelected(next);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const key = `custom_${newName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    if (customs.some((c) => c.key === key)) return;
    setCustoms([...customs, { key, name: newName.trim() }]);
    setSelected(new Set([...selected, key]));
    setNewName("");
    setShowCreate(false);
  };

  const selectedCount = selected.size;
  const totalTemplates = allThemes.filter((t) => selected.has(t.key)).reduce((s, t) => s + t.templateCount, 0);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-[1100px] max-h-[85vh] flex flex-col mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Choose Themes</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visibleThemes.map((theme) => {
              const isSelected = selected.has(theme.key);
              return (
                <button
                  key={theme.key}
                  onClick={() => toggle(theme.key)}
                  className={`relative rounded-xl border-2 transition-colors overflow-hidden text-left ${
                    isSelected ? "border-accent" : "border-border hover:border-accent/30"
                  }`}
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <ThemePreviewCard themeKey={theme.key} className="!h-full !rounded-none" size="lg" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded bg-accent flex items-center justify-center z-10">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-foreground">{theme.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {theme.templateCount > 0 ? `${theme.templateCount} design template${theme.templateCount !== 1 ? "s" : ""}` : "Custom theme"}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Create Theme tile */}
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-xl border-2 border-dashed border-border hover:border-accent/30 transition-colors overflow-hidden text-left"
            >
              <div className="aspect-[3/4] flex flex-col items-center justify-center gap-2">
                <Plus className="h-8 w-8 text-muted-foreground/40" />
                <span className="text-sm font-medium text-muted-foreground">Create Theme</span>
              </div>
              <div className="p-2.5">
                <p className="text-xs text-muted-foreground">Add a new theme</p>
              </div>
            </button>
          </div>

          {/* View All button */}
          {hasMore && !showAll && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
                View all ({allThemes.length} templates)
              </Button>
            </div>
          )}
          {showAll && hasMore && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" size="sm" onClick={() => setShowAll(false)}>
                Show less
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <p className="text-sm text-muted-foreground">
            Selected {selectedCount} theme{selectedCount !== 1 ? "s" : ""}, {totalTemplates} template{totalTemplates !== 1 ? "s" : ""}
          </p>
          <Button
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={() => { onSave(Array.from(selected), customs); onClose(); }}
          >
            Save and Close
          </Button>
        </div>
      </div>

      {/* Create Theme Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Create theme</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Enter a theme name</p>
            <Input
              value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Spring Campaign" className="mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" disabled={!newName.trim()} onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
