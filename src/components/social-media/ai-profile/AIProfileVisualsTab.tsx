import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Image, Palette, Layers, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { SYSTEM_THEMES } from "@/data/socialThemes";
import { ChooseThemesModal } from "./ChooseThemesModal";

interface Props {
  profile: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

type MediaType = "Image" | "Design" | "GIF" | "Meme" | "AI Image";

const DEFAULT_SELECTED_KEYS = ["border", "fonts", "influencer", "interface", "threads"];

export function AIProfileVisualsTab({ profile, onUpdate, onSave, isSaving }: Props) {
  const [themesOpen, setThemesOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [showThemesPicker, setShowThemesPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  const metadata = (profile.visual_metadata as Record<string, unknown>) || {};
  const selectedMediaTypes = (metadata.media_types as MediaType[]) || ["Design"];
  const mediaMix = (metadata.media_mix as Record<string, number>) || { Design: 100 };
  const useStock = (metadata.use_stock as boolean) ?? true;
  const useLogo = (metadata.use_logo as boolean) ?? false;
  const brandColors = (metadata.brand_colors as string[]) || ["#c47a3a", "#ffffff", "#152A20"];
  const selectedThemeKeys = (metadata.selected_themes as string[]) || DEFAULT_SELECTED_KEYS;
  const customThemes = (metadata.custom_themes as { key: string; name: string }[]) || [];

  const selectedThemes = selectedThemeKeys
    .map((k) => SYSTEM_THEMES.find((t) => t.key === k) || customThemes.find((c) => c.key === k))
    .filter(Boolean) as { key?: string; name: string; templateCount?: number }[];

  const totalTemplates = selectedThemes.reduce((s, t) => s + (("templateCount" in t ? t.templateCount : 0) || 0), 0);

  const updateMeta = (patch: Record<string, unknown>) => {
    onUpdate("visual_metadata", { ...metadata, ...patch });
  };

  const handleSave = async () => {
    updateMeta({
      media_types: selectedMediaTypes,
      media_mix: mediaMix,
      use_stock: useStock,
      use_logo: useLogo,
      brand_colors: brandColors,
      selected_themes: selectedThemeKeys,
      custom_themes: customThemes,
    });
    await onSave();
    setSaved(true);
    toast.success("Visual settings saved");
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleMediaType = (type: MediaType) => {
    const current = [...selectedMediaTypes];
    const idx = current.indexOf(type);
    if (idx >= 0 && current.length > 1) current.splice(idx, 1);
    else if (idx < 0) current.push(type);
    updateMeta({ media_types: current });
  };

  const addColor = () => {
    const colors = [...brandColors];
    colors.push("#888888");
    updateMeta({ brand_colors: colors });
  };

  const removeColor = (idx: number) => {
    const colors = brandColors.filter((_, i) => i !== idx);
    updateMeta({ brand_colors: colors });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* Left column */}
      <div className="space-y-4">
        {/* THEMES */}
        <CollapsibleSection title="Themes" subtitle="Design templates used when generating posts" open={themesOpen} onToggle={() => setThemesOpen(!themesOpen)} saved={saved}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">Enabled Themes</p>
            <Button size="sm" variant="outline" onClick={() => setShowThemesPicker(true)}>Choose Themes</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {selectedThemes.slice(0, 4).map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 mb-2 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-accent/40" />
                </div>
                <p className="text-xs font-medium text-foreground">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{("templateCount" in t ? t.templateCount : 0) || 0} Designs</p>
              </div>
            ))}
          </div>
          {selectedThemes.length > 4 && (
            <p className="text-xs text-muted-foreground">+{selectedThemes.length - 4} more themes selected</p>
          )}
        </CollapsibleSection>

        {/* BRAND STYLES */}
        <CollapsibleSection title="Brand Styles" subtitle="Choose how your business presents itself" open={brandOpen} onToggle={() => setBrandOpen(!brandOpen)} saved={saved}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Use logo on post</p>
              <p className="text-xs text-muted-foreground">Show logo on generated designs that support logos.</p>
            </div>
            <Switch checked={useLogo} onCheckedChange={(v) => updateMeta({ use_logo: v })} />
          </div>

          <p className="text-sm font-semibold text-foreground mb-2">Brand Colors</p>
          <div className="flex items-center gap-1 mb-4">
            {brandColors.map((c, i) => (
              <div
                key={i}
                className="h-8 flex-1 rounded relative group cursor-pointer"
                style={{ backgroundColor: c }}
              >
                <button
                  onClick={() => removeColor(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[8px] items-center justify-center hidden group-hover:flex"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={addColor}
              className="h-8 w-8 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-sm font-semibold text-foreground mb-2">Font</p>
          <p className="text-xs text-muted-foreground mb-2">Choose which fonts to use in your designs.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title Font</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground">
                <option>Default (Theme Font)</option>
                <option>Lufga</option>
                <option>Inter</option>
                <option>Playfair Display</option>
                <option>Montserrat</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Body Font</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground">
                <option>Default (Theme Font)</option>
                <option>Inter</option>
                <option>Lufga</option>
                <option>Open Sans</option>
                <option>Roboto</option>
              </select>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-lg border border-border bg-muted/10">
            <p className="text-sm font-medium text-foreground mb-1">Font Preview</p>
            <p className="text-lg font-bold text-foreground">The quick brown fox</p>
            <p className="text-sm text-muted-foreground">jumps over the lazy dog. 0123456789</p>
          </div>
        </CollapsibleSection>

        {/* DESIGN SETTINGS */}
        <CollapsibleSection title="Design settings" subtitle="Media mix and aspect ratios" open={designOpen} onToggle={() => setDesignOpen(!designOpen)} saved={saved}>
          <p className="text-sm font-semibold text-foreground mb-1">Media Mix</p>
          <p className="text-xs text-muted-foreground mb-3">How often each media type should appear in generated posts</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["Image", "Design", "GIF", "Meme", "AI Image"] as MediaType[]).map((type) => {
              const icons: Record<string, React.ReactNode> = {
                Image: <Image className="h-3.5 w-3.5" />,
                Design: <Palette className="h-3.5 w-3.5" />,
                GIF: <Layers className="h-3.5 w-3.5" />,
                Meme: <span className="text-sm">😀</span>,
                "AI Image": <Sparkles className="h-3.5 w-3.5" />,
              };
              return (
                <button
                  key={type}
                  onClick={() => toggleMediaType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    selectedMediaTypes.includes(type)
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/40"
                  }`}
                >
                  {selectedMediaTypes.includes(type) && <span>✓</span>}
                  {icons[type]}
                  {type}
                </button>
              );
            })}
          </div>

          {selectedMediaTypes.map((type) => (
            <div key={type} className="flex items-center gap-4 mb-3">
              <div className="w-24">
                <p className="text-sm font-medium text-foreground">{type}</p>
                <p className="text-[10px] text-muted-foreground">
                  {type === "Image" ? "Only photo, from library or stock" :
                   type === "Design" ? "Templated graphics with text and photos" :
                   type === "AI Image" ? "AI-generated artwork" : type}
                </p>
              </div>
              <div className="flex-1">
                <Slider
                  value={[mediaMix[type] || Math.floor(100 / selectedMediaTypes.length)]}
                  onValueChange={([v]) => updateMeta({ media_mix: { ...mediaMix, [type]: v } })}
                  min={0} max={100} step={5}
                  className="flex-1"
                />
              </div>
              <span className="text-sm font-medium text-foreground w-12 text-right">
                {mediaMix[type] || Math.floor(100 / selectedMediaTypes.length)}%
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between mt-4 mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Media aspect ratio</p>
              <p className="text-xs text-muted-foreground">Set the default aspect ratio for generated posts</p>
            </div>
            <select className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground">
              <option>Use template ratio</option>
              <option>1:1 Square</option>
              <option>4:5 Portrait</option>
              <option>9:16 Story</option>
              <option>16:9 Landscape</option>
            </select>
          </div>
          <Button size="sm" variant="outline" className="mt-1">Resize per social</Button>
        </CollapsibleSection>

        {/* IMAGES */}
        <CollapsibleSection title="Images" subtitle="Stock and library image settings" open={imagesOpen} onToggle={() => setImagesOpen(!imagesOpen)} saved={saved}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Use stock images</p>
              <p className="text-xs text-muted-foreground">Use stock photos in addition to your library when generating designs</p>
            </div>
            <Switch checked={useStock} onCheckedChange={(v) => updateMeta({ use_stock: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Library Images</p>
              <p className="text-xs text-muted-foreground">Upload images to your library to use them in your designs</p>
            </div>
            <Button size="sm" variant="outline">Go to library</Button>
          </div>
        </CollapsibleSection>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Save Visual Settings
          </Button>
        </div>
      </div>

      {/* Right column — Design Examples */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Design Examples</h3>
            <p className="text-[10px] text-muted-foreground">Using placeholder text and photos</p>
          </div>
          <div className="space-y-4">
            {selectedThemes.slice(0, 3).map((t) => (
              <div key={t.name}>
                <div className="rounded-xl border border-border bg-gradient-to-br from-muted/30 to-muted/10 aspect-square flex flex-col items-center justify-center p-4">
                  <Layers className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">{t.name} Template</p>
                  <p className="text-[10px] text-muted-foreground/60">{("templateCount" in t ? t.templateCount : 0) || 0} designs</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">From theme: {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Picker Modal */}
      <ChooseThemesModal
        open={showThemesPicker}
        onClose={() => setShowThemesPicker(false)}
        selectedKeys={selectedThemeKeys}
        customThemes={customThemes}
        onSave={(keys, customs) => {
          updateMeta({ selected_themes: keys, custom_themes: customs });
          handleSave();
        }}
      />
    </div>
  );
}

function CollapsibleSection({
  title, subtitle, open, onToggle, saved, children,
}: {
  title: string; subtitle: string; open: boolean; onToggle: () => void; saved: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-2">
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {saved && <span className="text-xs text-green-500 font-medium">Saved</span>}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  );
}
