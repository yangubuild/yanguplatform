import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Save, Loader2, Layout, Sun, Moon, Palette } from "lucide-react";
import type { PageEditSettings, LayoutPreset } from "@/config/builderCoreSections";
import { DEFAULT_PAGE_SETTINGS } from "@/config/builderCoreSections";

interface BuilderPageEditPanelProps {
  settings: PageEditSettings;
  onSave: (settings: PageEditSettings) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

export function BuilderPageEditPanel({ settings, onSave, onClose, isSaving }: BuilderPageEditPanelProps) {
  const [local, setLocal] = useState<PageEditSettings>(settings);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(settings);
    setDirty(false);
  }, [settings]);

  const update = (partial: Partial<PageEditSettings>) => {
    setLocal((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  };

  return (
    <aside className="w-80 border-l border-border flex flex-col bg-sidebar overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Page Edit</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Layout selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Layout</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => update({ layout: "layout_a" })}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                local.layout === "layout_a"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="space-y-1 mx-auto w-full max-w-[80px]">
                <div className="h-2 bg-muted-foreground/20 rounded-sm" />
                <div className="h-6 bg-muted-foreground/10 rounded-sm" />
                <div className="h-8 bg-muted-foreground/15 rounded-sm" />
                <div className="h-3 bg-muted-foreground/10 rounded-sm" />
                <div className="h-2 bg-muted-foreground/20 rounded-sm" />
              </div>
              <p className="text-xs mt-2 font-medium">Layout A</p>
            </button>
            <button
              onClick={() => update({ layout: "layout_b" })}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                local.layout === "layout_b"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="space-y-1 mx-auto w-full max-w-[80px]">
                <div className="flex gap-1">
                  <div className="h-2 bg-muted-foreground/20 rounded-sm flex-1" />
                  <div className="h-2 bg-muted-foreground/20 rounded-sm w-4" />
                </div>
                <div className="h-8 bg-muted-foreground/15 rounded-sm" />
                <div className="grid grid-cols-2 gap-1">
                  <div className="h-5 bg-muted-foreground/10 rounded-sm" />
                  <div className="h-5 bg-muted-foreground/10 rounded-sm" />
                </div>
                <div className="h-3 bg-muted-foreground/10 rounded-sm" />
                <div className="h-2 bg-muted-foreground/20 rounded-sm" />
              </div>
              <p className="text-xs mt-2 font-medium">Layout B</p>
            </button>
          </div>
        </div>

        {/* Theme mode */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Theme</Label>
          <Select value={local.theme_mode} onValueChange={(v) => update({ theme_mode: v as any })}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <span className="flex items-center gap-2"><Sun className="h-3 w-3" /> Light</span>
              </SelectItem>
              <SelectItem value="dark">
                <span className="flex items-center gap-2"><Moon className="h-3 w-3" /> Dark</span>
              </SelectItem>
              <SelectItem value="both">
                <span className="flex items-center gap-2"><Palette className="h-3 w-3" /> Auto (System)</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Background color */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Background Color</Label>
          <div className="flex gap-2">
            <Input
              value={local.background_color}
              onChange={(e) => update({ background_color: e.target.value })}
              placeholder="e.g. #f5f5f5 or leave empty"
              className="text-sm flex-1"
            />
            {local.background_color && (
              <div
                className="h-9 w-9 rounded border border-border shrink-0"
                style={{ backgroundColor: local.background_color }}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">Leave empty for default theme background</p>
        </div>

        {/* Floating CTA toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs font-medium">Floating Chat / CTA</Label>
            <p className="text-xs text-muted-foreground">Show sticky bottom button</p>
          </div>
          <Switch
            checked={local.floating_cta}
            onCheckedChange={(checked) => update({ floating_cta: checked })}
          />
        </div>
      </div>

      {/* Save */}
      <div className="p-4 border-t border-border">
        <Button className="w-full gap-2" disabled={!dirty || isSaving} onClick={() => onSave(local)}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Page Settings
        </Button>
      </div>
    </aside>
  );
}
