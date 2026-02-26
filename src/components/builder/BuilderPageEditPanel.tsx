import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Save, Loader2, Layout, Sun, Moon, Palette, MessageCircle } from "lucide-react";
import type { PageEditSettings, LayoutPreset } from "@/config/builderCoreSections";
import { DEFAULT_PAGE_SETTINGS } from "@/config/builderCoreSections";

// ─── Color palette grid ───
const COLOR_PALETTE = [
  "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1",
  "#0f172a", "#1e293b", "#334155", "#475569", "#64748b",
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

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

        {/* Background color — Grid picker */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Background Color</Label>
          <div className="grid grid-cols-5 gap-1.5">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => update({ background_color: color })}
                className={`h-8 w-full rounded-md border-2 transition-all ${
                  local.background_color === color
                    ? "border-primary ring-2 ring-primary/30 scale-110"
                    : "border-border hover:border-muted-foreground/40"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          {local.background_color && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded border border-border shrink-0"
                  style={{ backgroundColor: local.background_color }}
                />
                <span className="text-xs text-muted-foreground">{local.background_color}</span>
              </div>
              <button
                onClick={() => update({ background_color: "" })}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Floating Chat / CTA */}
        <div className="space-y-3 border border-border rounded-lg p-3">
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
          {local.floating_cta && (
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-medium">Chat Channel</Label>
              <Select
                value={local.floating_cta_channel || "whatsapp"}
                onValueChange={(v) => update({ floating_cta_channel: v as any })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">
                    <span className="flex items-center gap-2"><MessageCircle className="h-3 w-3" /> WhatsApp</span>
                  </SelectItem>
                  <SelectItem value="yangu">
                    <span className="flex items-center gap-2"><MessageCircle className="h-3 w-3" /> Yangu Messages</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {(local.floating_cta_channel || "whatsapp") === "whatsapp" && (
                <div className="space-y-1">
                  <Label className="text-xs">WhatsApp Number</Label>
                  <input
                    value={local.floating_cta_whatsapp || ""}
                    onChange={(e) => update({ floating_cta_whatsapp: e.target.value })}
                    placeholder="+1234567890"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}
            </div>
          )}
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
