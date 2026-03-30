import { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Plus, Image, Palette, Layers, Sparkles, Loader2, MoreVertical, ArrowLeft, Search, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SYSTEM_THEMES } from "@/data/socialThemes";
import { getThemePreviewImage } from "@/data/themePreviewImages";
import { ChooseThemesModal } from "./ChooseThemesModal";
import { ThemePreviewCard } from "./ThemePreviewCard";
import { TemplateEditorModal } from "./TemplateEditorModal";
import type { TemplateLayer, TemplateColorSlots, LayerOverride } from "@/types/templateDesign";

interface Props {
  profile: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

type MediaType = "Image" | "Design" | "GIF" | "Meme" | "AI Image";

const DEFAULT_SELECTED_KEYS = ["bold-tech", "classic", "fonts", "era", "influencer"];

const COLOR_PRESETS = [
  ["#ffffff", "#9b87f5", "#000000"],
  ["#1a1033", "#e84672", "#ffffff"],
  ["#1a3a5c", "#7cb3e0", "#ffffff"],
  ["#c9c0f0", "#1a1a2e", "#ffffff"],
  ["#e8834a", "#ffffff", "#1a1033"],
  ["#b5472a", "#d4d0cc", "#2a2a2a"],
  ["#6dc8b5", "#ffffff", "#2a7fb5"],
  ["#e8a0b0", "#f5f0e8", "#4a4a4a"],
];

export function AIProfileVisualsTab({ profile, onUpdate, onSave, isSaving }: Props) {
  const [themesOpen, setThemesOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [showThemesPicker, setShowThemesPicker] = useState(false);
  const [editingThemeKey, setEditingThemeKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Brand color state
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [editPaletteMode, setEditPaletteMode] = useState(false);
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);

  // Logo
  const logoInputRef = useRef<HTMLInputElement>(null);

  const metadata = (profile.visual_metadata as Record<string, unknown>) || {};
  const selectedMediaTypes = (metadata.media_types as MediaType[]) || ["Design"];
  const mediaMix = (metadata.media_mix as Record<string, number>) || { Design: 100 };
  const useStock = (metadata.use_stock as boolean) ?? true;
  const useLogo = (metadata.use_logo as boolean) ?? false;
  const logoUrl = (metadata.logo_url as string) || "";
  const brandColors = (metadata.brand_colors as string[]) || ["#c47a3a", "#ffffff", "#152A20"];
  const selectedThemeKeys = (metadata.selected_themes as string[]) || DEFAULT_SELECTED_KEYS;
  const customThemes = (metadata.custom_themes as { key: string; name: string }[]) || [];
  const titleFont = (metadata.title_font as string) || "Default (Theme Font)";
  const bodyFont = (metadata.body_font as string) || "Default (Theme Font)";

  // Get first selected theme for the main display
  const firstSelectedTheme = selectedThemeKeys.length > 0
    ? SYSTEM_THEMES.find((t) => t.key === selectedThemeKeys[0])
    : SYSTEM_THEMES[0];

  // All selected themes for design examples
  const selectedThemes = selectedThemeKeys
    .map((k) => SYSTEM_THEMES.find((t) => t.key === k) || customThemes.find((c) => c.key === k))
    .filter(Boolean) as { key?: string; name: string; templateCount?: number }[];

  const updateMeta = (patch: Record<string, unknown>) => {
    onUpdate("visual_metadata", { ...metadata, ...patch });
  };

  const handleSave = async () => {
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

  const updateColor = (idx: number, color: string) => {
    const colors = [...brandColors];
    colors[idx] = color;
    updateMeta({ brand_colors: colors });
  };

  const addColor = () => {
    updateMeta({ brand_colors: [...brandColors, "#888888"] });
    setColorPickerIndex(brandColors.length);
  };

  const removeColor = (idx: number) => {
    const colors = brandColors.filter((_, i) => i !== idx);
    updateMeta({ brand_colors: colors });
    if (colorPickerIndex === idx) setColorPickerIndex(null);
  };

  const applyPreset = (preset: string[]) => {
    updateMeta({ brand_colors: [...preset] });
    setShowPresets(false);
    setEditPaletteMode(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateMeta({ logo_url: url });
    toast.success("Logo uploaded");
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

          {/* Selected theme cards (up to 3) + Add Theme card */}
          <div className="flex gap-4 mb-3 flex-wrap">
            {selectedThemes.slice(0, 3).map((t) => {
              const key = ("key" in t ? t.key : "") as string;
              const name = t.name;
              const count = ("templateCount" in t ? t.templateCount : 0) || 0;
              return (
                <div
                  key={key}
                  className="w-40 rounded-xl border border-border bg-muted/20 overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent/40 transition-all"
                  onClick={() => setEditingThemeKey(key)}
                >
                  <ThemePreviewCard themeKey={key} size="lg" showText={false} className="!rounded-none !h-auto aspect-[4/5]" />
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-foreground">{name}</p>
                    <p className="text-[10px] text-muted-foreground">{count} Designs · Click to edit</p>
                  </div>
                </div>
              );
            })}

            {/* + Add Theme card */}
            <button
              onClick={() => setShowThemesPicker(true)}
              className="w-40 rounded-xl border-2 border-dashed border-border hover:border-accent/30 transition-colors flex flex-col items-center justify-center gap-2 min-h-[200px]"
            >
              <Plus className="h-8 w-8 text-muted-foreground/40" />
              <span className="text-sm font-medium text-muted-foreground">Add Theme</span>
            </button>
          </div>

          {selectedThemeKeys.length > 3 && (
            <p className="text-xs text-muted-foreground">+{selectedThemeKeys.length - 3} more themes selected</p>
          )}
        </CollapsibleSection>

        {/* BRAND STYLES */}
        <CollapsibleSection title="Brand Styles" subtitle="Choose how your business presents itself" open={brandOpen} onToggle={() => setBrandOpen(!brandOpen)} saved={saved}>
          {/* Logo toggle + upload */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Use logo on post</p>
              <p className="text-xs text-muted-foreground">Show logo on generated designs that support logos.</p>
            </div>
            <Switch checked={useLogo} onCheckedChange={(v) => updateMeta({ use_logo: v })} />
          </div>

          {useLogo && (
            <div className="mb-4">
              {logoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="Brand logo" className="h-12 w-12 rounded-lg object-contain border border-border bg-muted/20" />
                  <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}>Change Logo</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}>
                  Upload Logo
                </Button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          )}

          {/* Brand Colors */}
          {!editPaletteMode && !showPresets ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Brand Colors</p>
                <div className="relative">
                  <button onClick={() => setPaletteMenuOpen(!paletteMenuOpen)} className="p-1 hover:bg-muted/30 rounded">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {paletteMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                      <button onClick={() => { setEditPaletteMode(true); setPaletteMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/30">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => { applyPreset([...brandColors]); setPaletteMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/30">
                        <Layers className="h-3.5 w-3.5" /> Duplicate
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Color bar display */}
              <div className="flex items-center gap-1 mb-4">
                <div className="flex flex-1 h-8 rounded-lg overflow-hidden border border-border">
                  {brandColors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setColorPickerIndex(colorPickerIndex === i ? null : i)}
                      className="flex-1 relative group"
                      style={{ backgroundColor: c }}
                    >
                      {colorPickerIndex === i && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Pencil className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button onClick={addColor} className="h-8 w-8 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Inline color picker */}
              {colorPickerIndex !== null && colorPickerIndex < brandColors.length && (
                <div className="mb-4 p-3 rounded-lg border border-border bg-card shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Color Picker</p>
                    <button onClick={() => setColorPickerIndex(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                  </div>
                  <input
                    type="color"
                    value={brandColors[colorPickerIndex]}
                    onChange={(e) => updateColor(colorPickerIndex, e.target.value)}
                    className="w-full h-32 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">HEX</span>
                    <Input
                      value={brandColors[colorPickerIndex]}
                      onChange={(e) => updateColor(colorPickerIndex, e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </>
          ) : showPresets ? (
            /* Presets view */
            <>
              <button onClick={() => setShowPresets(false)} className="flex items-center gap-1.5 text-sm text-foreground mb-3 hover:text-accent">
                <ArrowLeft className="h-4 w-4" /> Presets
              </button>
              <div className="space-y-2">
                {COLOR_PRESETS.map((preset, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="flex flex-1 h-8 rounded-lg overflow-hidden border border-border">
                      {preset.map((c, j) => (
                        <div key={j} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <button onClick={() => applyPreset(preset)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Edit palette view */
            <>
              <button onClick={() => setEditPaletteMode(false)} className="flex items-center gap-1.5 text-sm text-foreground mb-3 hover:text-accent">
                <ArrowLeft className="h-4 w-4" /> Edit palette
              </button>
              <div className="flex items-center gap-2 mb-3">
                {brandColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setColorPickerIndex(colorPickerIndex === i ? null : i)}
                    className={`h-10 w-10 rounded-lg border-2 ${colorPickerIndex === i ? "border-accent" : "border-border"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button onClick={addColor} className="h-10 w-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {colorPickerIndex !== null && colorPickerIndex < brandColors.length && (
                <div className="mb-3 p-3 rounded-lg border border-border bg-card shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Color Picker</p>
                    <button onClick={() => setColorPickerIndex(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                  </div>
                  <input
                    type="color"
                    value={brandColors[colorPickerIndex]}
                    onChange={(e) => updateColor(colorPickerIndex, e.target.value)}
                    className="w-full h-32 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">HEX</span>
                    <Input
                      value={brandColors[colorPickerIndex]}
                      onChange={(e) => updateColor(colorPickerIndex, e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowPresets(true)}>
                  <Search className="h-3.5 w-3.5 mr-1" /> Search presets
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditPaletteMode(false); setColorPickerIndex(null); }}>Cancel</Button>
                <Button size="sm" onClick={() => { setEditPaletteMode(false); setColorPickerIndex(null); toast.success("Palette saved"); }}>Save</Button>
              </div>
            </>
          )}

          {/* Font section */}
          <p className="text-sm font-semibold text-foreground mb-2 mt-4">Font</p>
          <p className="text-xs text-muted-foreground mb-2">Choose which fonts to use in your designs.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title Font</label>
              <select
                value={titleFont}
                onChange={(e) => updateMeta({ title_font: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option>Default (Theme Font)</option><option>Montserrat</option><option>Inter</option><option>Playfair Display</option><option>Lufga</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Body Font</label>
              <select
                value={bodyFont}
                onChange={(e) => updateMeta({ body_font: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option>Default (Theme Font)</option><option>Montserrat</option><option>Inter</option><option>Open Sans</option><option>Roboto</option>
              </select>
            </div>
          </div>
          <details className="mt-3">
            <summary className="text-sm font-medium text-foreground cursor-pointer">Font Preview</summary>
            <div className="p-3 rounded-lg border border-border bg-muted/10 mt-2">
              <p className="text-lg font-bold text-foreground">The quick brown fox</p>
              <p className="text-sm text-muted-foreground">jumps over the lazy dog. 0123456789</p>
            </div>
          </details>
        </CollapsibleSection>

        {/* DESIGN SETTINGS */}
        <CollapsibleSection title="Design settings" subtitle="Media mix and aspect ratios" open={designOpen} onToggle={() => setDesignOpen(!designOpen)} saved={saved}>
          <p className="text-sm font-semibold text-foreground mb-1">Media Mix</p>
          <p className="text-xs text-muted-foreground mb-3">How often each media type should appear in generated posts</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["Image", "Design", "GIF", "Meme", "AI Image"] as MediaType[]).map((type) => {
              const icons: Record<string, React.ReactNode> = {
                Image: <Image className="h-3.5 w-3.5" />, Design: <Palette className="h-3.5 w-3.5" />,
                GIF: <Layers className="h-3.5 w-3.5" />, Meme: <span className="text-sm">😀</span>,
                "AI Image": <Sparkles className="h-3.5 w-3.5" />,
              };
              return (
                <button key={type} onClick={() => toggleMediaType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    selectedMediaTypes.includes(type) ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/40"
                  }`}>
                  {selectedMediaTypes.includes(type) && <span>✓</span>}
                  {icons[type]}{type}
                </button>
              );
            })}
          </div>
          {selectedMediaTypes.map((type) => (
            <div key={type} className="flex items-center gap-4 mb-3">
              <div className="w-24">
                <p className="text-sm font-medium text-foreground">{type}</p>
              </div>
              <div className="flex-1">
                <Slider value={[mediaMix[type] || Math.floor(100 / selectedMediaTypes.length)]} onValueChange={([v]) => updateMeta({ media_mix: { ...mediaMix, [type]: v } })} min={0} max={100} step={5} className="flex-1" />
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
              <option>Use template ratio</option><option>1:1 Square</option><option>4:5 Portrait</option><option>9:16 Story</option><option>16:9 Landscape</option>
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

        <div className="flex justify-center pt-2">
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
            {(selectedThemes.length > 0 ? selectedThemes.slice(0, 3) : SYSTEM_THEMES.slice(0, 3)).map((t) => {
              const key = ("key" in t ? t.key : t.name) as string;
              return (
                <div key={key}>
                  <ThemePreviewCard themeKey={key} size="lg" className="aspect-square" />
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-muted-foreground">From theme: {t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{("templateCount" in t ? t.templateCount : 0) || 0} designs</p>
                  </div>
                </div>
              );
            })}
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
        }}
      />

      {/* Template Editor Modal */}
      {editingThemeKey && (() => {
        const theme = SYSTEM_THEMES.find((t) => t.key === editingThemeKey);
        const imageUrl = getThemePreviewImage(editingThemeKey);
        if (!theme || !imageUrl) return null;
        const now = new Date().toISOString();
        const fallbackLayers: TemplateLayer[] = [
          { id: `${editingThemeKey}-headline`, template_id: editingThemeKey, layer_type: "text", role: "headline", sort_order: 0, x: 10, y: 15, width: 80, height: 12, style: { fontSize: 32, fontWeight: 700, color: "#ffffff", textAlign: "center" }, content: "Your Headline Here", src: null, locked: false, created_at: now },
          { id: `${editingThemeKey}-sub`, template_id: editingThemeKey, layer_type: "text", role: "subheadline", sort_order: 1, x: 10, y: 30, width: 80, height: 8, style: { fontSize: 18, fontWeight: 400, color: "#ffffff", textAlign: "center" }, content: "Add your subtext", src: null, locked: false, created_at: now },
          { id: `${editingThemeKey}-cta`, template_id: editingThemeKey, layer_type: "cta", role: "cta", sort_order: 2, x: 30, y: 75, width: 40, height: 8, style: { fontSize: 14, fontWeight: 600, color: "#ffffff", backgroundColor: "#e84672", borderRadius: 8, textAlign: "center" }, content: "Learn More", src: null, locked: false, created_at: now },
        ];
        const brandConfig = {
          primaryColor: brandColors[0],
          secondaryColor: brandColors[1],
          accentColor: brandColors[2],
          titleFont,
          bodyFont,
          logoUrl,
          useLogo,
        };
        return (
          <TemplateEditorModal
            open={!!editingThemeKey}
            onClose={() => setEditingThemeKey(null)}
            templateName={theme.name}
            templateImageUrl={imageUrl}
            baseLayers={fallbackLayers}
            colorSlots={{}}
            brand={brandConfig}
            onSave={(layerOverrides, colorOverrides) => {
              console.log("Design saved:", { themeKey: editingThemeKey, layerOverrides, colorOverrides });
              toast.success("Design edits saved");
            }}
          />
        );
      })()}
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
