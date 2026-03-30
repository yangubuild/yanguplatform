/**
 * YANGU — Template Editor Modal
 * Opens when clicking a template. Shows the template image with editable layers on top.
 * Supports text editing, image replacement, color changes, and logo toggle.
 */

import { useState, useMemo } from "react";
import { X, Type, Image, Palette, Sparkles, RotateCcw, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { TemplateLayer, TemplateColorSlots, LayerOverride, TemplateLayerStyle } from "@/types/templateDesign";
import { resolveLayersWithOverrides, type BrandConfig } from "@/services/socialMedia/templateService";

interface Props {
  open: boolean;
  onClose: () => void;
  templateName: string;
  templateImageUrl: string;
  baseLayers: TemplateLayer[];
  colorSlots: TemplateColorSlots;
  initialOverrides?: LayerOverride[];
  initialColorOverrides?: Partial<TemplateColorSlots>;
  brand?: BrandConfig | null;
  onSave: (layerOverrides: LayerOverride[], colorOverrides: Partial<TemplateColorSlots>) => void;
  onAIEdit?: (instruction: string) => void;
  isAIEditing?: boolean;
}

export function TemplateEditorModal({
  open,
  onClose,
  templateName,
  templateImageUrl,
  baseLayers,
  colorSlots,
  initialOverrides = [],
  initialColorOverrides = {},
  brand,
  onSave,
  onAIEdit,
  isAIEditing,
}: Props) {
  const [layerOverrides, setLayerOverrides] = useState<LayerOverride[]>(initialOverrides);
  const [colorOverrides, setColorOverrides] = useState<Partial<TemplateColorSlots>>(initialColorOverrides);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");

  const resolvedLayers = useMemo(
    () => resolveLayersWithOverrides(baseLayers, layerOverrides),
    [baseLayers, layerOverrides]
  );

  const selectedLayer = resolvedLayers.find((l) => l.id === selectedLayerId);

  // Get editable text/image/cta layers
  const textLayers = resolvedLayers.filter((l) => l.layer_type === "text" && !l.locked);
  const imageLayers = resolvedLayers.filter((l) => l.layer_type === "image" && !l.locked);
  const ctaLayers = resolvedLayers.filter((l) => l.role === "cta" && !l.locked);

  if (!open) return null;

  const updateLayerOverride = (layerId: string, patch: Partial<LayerOverride>) => {
    setLayerOverrides((prev) => {
      const existing = prev.find((o) => o.layer_id === layerId);
      if (existing) {
        return prev.map((o) =>
          o.layer_id === layerId
            ? { ...o, ...patch, style: patch.style ? { ...o.style, ...patch.style } : o.style }
            : o
        );
      }
      return [...prev, { layer_id: layerId, ...patch }];
    });
  };

  const updateColorSlot = (slot: keyof TemplateColorSlots, value: string) => {
    setColorOverrides((prev) => ({ ...prev, [slot]: value }));
  };

  const handleReset = () => {
    setLayerOverrides(initialOverrides);
    setColorOverrides(initialColorOverrides);
    toast.info("Reset to original");
  };

  const handleSave = () => {
    onSave(layerOverrides, colorOverrides);
    toast.success("Design saved");
    onClose();
  };

  const handleAIEdit = () => {
    if (!aiInstruction.trim() || !onAIEdit) return;
    onAIEdit(aiInstruction.trim());
    setAiInstruction("");
  };

  // Merge colorSlots with overrides for display
  const activeColors: TemplateColorSlots = { ...colorSlots, ...colorOverrides };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-[1200px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Edit Design</h2>
            <span className="text-sm text-muted-foreground">— {templateName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button size="sm" onClick={handleSave}>Save Design</Button>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body: Canvas + Side Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center p-6 bg-muted/10 overflow-auto">
            <div className="relative inline-block max-w-full max-h-full">
              {/* Base template image */}
              <img
                src={templateImageUrl}
                alt={templateName}
                className="max-w-full max-h-[65vh] rounded-lg shadow-lg"
              />

              {/* Editable layer overlays */}
              {resolvedLayers.filter((l) => !l.locked && l.layer_type !== "background").map((layer) => {
                const isSelected = selectedLayerId === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`absolute cursor-pointer transition-all ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-1"
                        : "hover:ring-1 hover:ring-accent/40"
                    }`}
                    style={{
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      width: `${layer.width}%`,
                      height: `${layer.height}%`,
                      transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
                    }}
                    title={`${layer.layer_type}: ${layer.role || "element"}`}
                  >
                    {/* Visual indicator */}
                    {isSelected && (
                      <div className="absolute -top-5 left-0 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded font-medium capitalize">
                        {layer.role || layer.layer_type}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side panel */}
          <div className="w-80 border-l border-border bg-card overflow-y-auto shrink-0">
            <Tabs defaultValue="text" className="h-full flex flex-col">
              <TabsList className="w-full grid grid-cols-4 px-3 pt-3">
                <TabsTrigger value="text" className="text-xs gap-1">
                  <Type className="h-3.5 w-3.5" /> Text
                </TabsTrigger>
                <TabsTrigger value="images" className="text-xs gap-1">
                  <Image className="h-3.5 w-3.5" /> Images
                </TabsTrigger>
                <TabsTrigger value="colors" className="text-xs gap-1">
                  <Palette className="h-3.5 w-3.5" /> Colors
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI
                </TabsTrigger>
              </TabsList>

              {/* Text Tab */}
              <TabsContent value="text" className="flex-1 p-4 space-y-4">
                {textLayers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No editable text layers in this template.</p>
                ) : (
                  textLayers.map((layer) => (
                    <div key={layer.id} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground capitalize">
                        {layer.role || "Text"}
                      </label>
                      <Input
                        value={
                          layerOverrides.find((o) => o.layer_id === layer.id)?.content ??
                          layer.content ??
                          ""
                        }
                        onChange={(e) =>
                          updateLayerOverride(layer.id, { content: e.target.value })
                        }
                        placeholder={`Enter ${layer.role || "text"}...`}
                        className="text-sm"
                      />
                      {layer.style?.fontFamily && (
                        <p className="text-[10px] text-muted-foreground">
                          Font: {layer.style.fontFamily}
                        </p>
                      )}
                    </div>
                  ))
                )}

                {/* CTA layers */}
                {ctaLayers.length > 0 && (
                  <>
                    <div className="border-t border-border pt-3 mt-3">
                      <p className="text-xs font-semibold text-foreground mb-2">Call to Action</p>
                    </div>
                    {ctaLayers.map((layer) => (
                      <Input
                        key={layer.id}
                        value={
                          layerOverrides.find((o) => o.layer_id === layer.id)?.content ??
                          layer.content ??
                          ""
                        }
                        onChange={(e) =>
                          updateLayerOverride(layer.id, { content: e.target.value })
                        }
                        placeholder="CTA text..."
                        className="text-sm"
                      />
                    ))}
                  </>
                )}
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="flex-1 p-4 space-y-4">
                {imageLayers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No replaceable image zones in this template.</p>
                ) : (
                  imageLayers.map((layer) => (
                    <div key={layer.id} className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground capitalize">
                        {layer.role || "Image"}
                      </label>
                      {(layerOverrides.find((o) => o.layer_id === layer.id)?.src || layer.src) && (
                        <img
                          src={layerOverrides.find((o) => o.layer_id === layer.id)?.src || layer.src || ""}
                          alt={layer.role || "image"}
                          className="w-full h-24 object-cover rounded-lg border border-border"
                        />
                      )}
                      <Input
                        value={
                          layerOverrides.find((o) => o.layer_id === layer.id)?.src ?? layer.src ?? ""
                        }
                        onChange={(e) =>
                          updateLayerOverride(layer.id, { src: e.target.value })
                        }
                        placeholder="Image URL..."
                        className="text-xs"
                      />
                    </div>
                  ))
                )}

                {/* Logo section */}
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Logo</p>
                  {brand?.logoUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={brand.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded border border-border" />
                      <p className="text-xs text-muted-foreground">
                        {brand.useLogo ? "Logo will appear on design" : "Logo disabled"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No logo configured. Set one in Brand Styles.</p>
                  )}
                </div>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors" className="flex-1 p-4 space-y-4">
                <p className="text-xs font-semibold text-foreground mb-1">Template Color Slots</p>
                {(["primary", "secondary", "accent", "background", "textPrimary", "textSecondary"] as const).map(
                  (slot) => {
                    const value = activeColors[slot];
                    if (!value && !colorSlots[slot]) return null;
                    return (
                      <div key={slot} className="flex items-center gap-3">
                        <input
                          type="color"
                          value={value || "#000000"}
                          onChange={(e) => updateColorSlot(slot, e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border border-border"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground capitalize">{slot.replace(/([A-Z])/g, " $1")}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{value || "inherit"}</p>
                        </div>
                      </div>
                    );
                  }
                )}

                {brand && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold text-foreground mb-2">Brand Colors</p>
                    <div className="flex gap-1">
                      {[brand.primaryColor, brand.secondaryColor, brand.accentColor]
                        .filter(Boolean)
                        .map((c, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded border border-border cursor-pointer hover:ring-2 ring-accent"
                            style={{ backgroundColor: c }}
                            title={`Apply ${c} to a slot`}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* AI Tab */}
              <TabsContent value="ai" className="flex-1 p-4 space-y-4">
                <p className="text-xs font-semibold text-foreground">AI Template Edit</p>
                <p className="text-xs text-muted-foreground">
                  Describe changes and AI will modify text, colors, and images while preserving the template layout.
                </p>
                <textarea
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder="e.g. Make this a restaurant promo, change headline to 'Weekend Brunch Special', use warm orange tones..."
                  className="w-full h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!aiInstruction.trim() || isAIEditing || !onAIEdit}
                  onClick={handleAIEdit}
                >
                  {isAIEditing ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI editing...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Apply AI Edit
                    </>
                  )}
                </Button>

                <div className="border-t border-border pt-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Quick edits:</p>
                  {[
                    "Change headline to match my brand",
                    "Make it feel more premium",
                    "Generate 5 variations",
                    "Adapt for Instagram story",
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => setAiInstruction(cmd)}
                      className="block w-full text-left text-xs text-accent hover:underline py-0.5"
                    >
                      → {cmd}
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
