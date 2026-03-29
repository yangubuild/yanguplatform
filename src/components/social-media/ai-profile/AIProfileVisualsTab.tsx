import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Image, Palette, Layers, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface Props {
  profile: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

type MediaType = "Image" | "Design" | "GIF" | "Meme" | "AI Image";

const defaultThemes = [
  { name: "Border", count: 9, selected: true },
  { name: "Fonts", count: 18, selected: true },
  { name: "Influencer", count: 13, selected: true },
  { name: "Interface", count: 7, selected: true },
  { name: "Notes", count: 10, selected: false },
  { name: "Simply Image", count: 1, selected: false },
  { name: "Threads", count: 9, selected: true },
  { name: "Tweet", count: 3, selected: false },
  { name: "Fresh Pop", count: 16, selected: false },
  { name: "Cyber", count: 8, selected: false },
  { name: "Dashed", count: 7, selected: false },
  { name: "Elegance", count: 10, selected: false },
  { name: "Era", count: 15, selected: false },
  { name: "Memes 1", count: 23, selected: false },
];

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
  const [themes, setThemes] = useState(defaultThemes);

  const handleSave = async () => {
    onUpdate("visual_metadata", {
      ...metadata,
      media_types: selectedMediaTypes,
      media_mix: mediaMix,
      use_stock: useStock,
      use_logo: useLogo,
      brand_colors: brandColors,
      selected_themes: themes.filter((t) => t.selected).map((t) => t.name),
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
    onUpdate("visual_metadata", { ...metadata, media_types: current });
  };

  const selectedThemes = themes.filter((t) => t.selected);
  const totalTemplates = selectedThemes.reduce((s, t) => s + t.count, 0);

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {selectedThemes.slice(0, 4).map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 mb-2 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-accent/40" />
                </div>
                <p className="text-xs font-medium text-foreground">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.count} Designs</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* BRAND STYLES */}
        <CollapsibleSection title="Brand Styles" subtitle="Choose how your business presents itself" open={brandOpen} onToggle={() => setBrandOpen(!brandOpen)} saved={saved}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Use logo on post</p>
              <p className="text-xs text-muted-foreground">Show logo on generated designs that support logos.</p>
            </div>
            <Switch checked={useLogo} onCheckedChange={(v) => onUpdate("visual_metadata", { ...metadata, use_logo: v })} />
          </div>

          <p className="text-sm font-semibold text-foreground mb-2">Brand Colors</p>
          <div className="flex items-center gap-1 mb-4">
            {brandColors.map((c, i) => (
              <div key={i} className="h-8 flex-1 rounded" style={{ backgroundColor: c }} />
            ))}
            <button className="h-8 w-8 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
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
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Body Font</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground">
                <option>Default (Theme Font)</option>
              </select>
            </div>
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
                Meme: "😀",
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
                  {typeof icons[type] === "string" ? icons[type] : icons[type]}
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
                  onValueChange={([v]) => onUpdate("visual_metadata", { ...metadata, media_mix: { ...mediaMix, [type]: v } })}
                  min={0} max={100} step={5}
                  className="flex-1"
                />
              </div>
              <span className="text-sm font-medium text-foreground w-12 text-right">{mediaMix[type] || Math.floor(100 / selectedMediaTypes.length)}%</span>
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
        </CollapsibleSection>

        {/* IMAGES */}
        <CollapsibleSection title="Images" subtitle="Stock and library image settings" open={imagesOpen} onToggle={() => setImagesOpen(!imagesOpen)} saved={saved}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Use stock images</p>
              <p className="text-xs text-muted-foreground">Use stock photos in addition to your library when generating designs</p>
            </div>
            <Switch checked={useStock} onCheckedChange={(v) => onUpdate("visual_metadata", { ...metadata, use_stock: v })} />
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
                  <p className="text-[10px] text-muted-foreground/60">{t.count} designs</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">From theme: {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Picker Modal */}
      {showThemesPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Choose Themes</h2>
                <p className="text-xs text-muted-foreground">Select themes for post generation. Click a theme to see its templates.</p>
              </div>
              <button onClick={() => setShowThemesPicker(false)} className="p-2 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {themes.map((theme, idx) => (
                  <button
                    key={theme.name}
                    onClick={() => {
                      const next = [...themes];
                      next[idx] = { ...theme, selected: !theme.selected };
                      setThemes(next);
                    }}
                    className={`relative rounded-xl border-2 transition-colors overflow-hidden ${
                      theme.selected ? "border-accent" : "border-border hover:border-accent/30"
                    }`}
                  >
                    <div className="aspect-[3/4] bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-foreground/40">{theme.name}</span>
                    </div>
                    {theme.selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-white text-[10px]">✓</span>
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground">{theme.name}</p>
                      <p className="text-[10px] text-muted-foreground">{theme.count} design templates</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Selected {selectedThemes.length} themes, {totalTemplates} templates</p>
              <Button onClick={() => { setShowThemesPicker(false); handleSave(); }}>Save and Close</Button>
            </div>
          </div>
        </div>
      )}
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
