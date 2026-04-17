import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Trash2, ImageIcon, Sparkles, Upload, Search, Loader2, X, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCtaSelector, getDefaultCtaForSurface, resolveButtonTextForCta } from "@/components/builder/editors/ItemCtaSelector";
import { ColorPopup } from "@/components/builder-new/editor-popups/ColorPopup";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProductCardData } from "@/lib/builder/selectionTypes";

interface ProductCardEditorModalProps {
  open: boolean;
  product: ProductCardData | null;
  onClose: () => void;
  onSave: (product: ProductCardData) => void;
  surfaceType?: string;
}

interface ProductDeleteConfirmModalProps {
  open: boolean;
  product: ProductCardData | null;
  onClose: () => void;
  onConfirm: (product: ProductCardData) => void;
}

interface StockResult {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  author: string;
  sourceUrl: string;
}

export function ProductCardEditorModal({ open, product, onClose, onSave, surfaceType }: ProductCardEditorModalProps) {
  const [draft, setDraft] = useState<ProductCardData | null>(product);
  const [images, setImages] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [ctaValue, setCtaValue] = useState("add_to_cart");
  const [buttonText, setButtonText] = useState("+ Add");
  const [actionType, setActionType] = useState("checkout");
  const [actionUrl, setActionUrl] = useState("");
  const [badgeEnabled, setBadgeEnabled] = useState(false);
  const [badgeText, setBadgeText] = useState("");
  const [stock, setStock] = useState("");

  // Eshop/Estore-only extended commerce fields
  const isCommerce = surfaceType === "eshop" || surfaceType === "estore";
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [material, setMaterial] = useState("");
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [available, setAvailable] = useState(true);

  // AI description state
  const [generatingDesc, setGeneratingDesc] = useState(false);

  // Image picker state
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  useEffect(() => {
    setDraft(product);
    if (product?.imageSrc) {
      setImages([product.imageSrc]);
    } else {
      setImages([]);
    }
    setActiveImageIdx(0);
    const defaults = getDefaultCtaForSurface(surfaceType);
    const nextCtaValue = product?.ctaAction || defaults.ctaAction;
    setCtaValue(nextCtaValue);
    setButtonText(
      nextCtaValue === "custom"
        ? (product?.buttonText || "")
        : (product?.buttonText || resolveButtonTextForCta(nextCtaValue, surfaceType))
    );
    setActionType(product?.actionType || defaults.actionType);
    setActionUrl(product?.actionUrl || "");
    setBadgeEnabled(product?.badgeEnabled ?? Boolean(product?.badgeText));
    setBadgeText(product?.badgeText || "");
    setStock("");
    // Reset commerce extras
    const meta = (product as any)?.meta || {};
    setBrand(meta.brand || "");
    setCategory(meta.category || "");
    setSubcategory(meta.subcategory || "");
    setDiscountPct(meta.discountPct || "");
    setDiscountLabel(meta.discountLabel || "");
    setSizes(Array.isArray(meta.sizes) ? meta.sizes : []);
    setSizeInput("");
    setColors(Array.isArray(meta.colors) ? meta.colors : []);
    setMaterial(meta.material || "");
    setWeight(meta.weight || "");
    setDimensions(meta.dimensions || "");
    setSpecifications(meta.specifications || "");
    setAvailable(meta.available !== false);
  }, [product, surfaceType]);

  useEffect(() => {
    if (!open || ctaValue === "custom") return;
    setButtonText(resolveButtonTextForCta(ctaValue, surfaceType));
  }, [ctaValue, open, surfaceType]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !draft) return null;

  const handleAddImage = (url: string) => {
    if (images.length >= 10) { toast.info("Max 10 images"); return; }
    setImages((prev) => [...prev, url]);
    setActiveImageIdx(images.length); // show new image
    setImagePickerOpen(false);
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (activeImageIdx >= images.length - 1) setActiveImageIdx(Math.max(0, images.length - 2));
  };

  const handleGenerateDescription = async () => {
    if (!draft.name.trim()) { toast.info("Enter a product name first"); return; }
    setGeneratingDesc(true);
    try {
      const res = await supabase.functions.invoke("ada-chat", {
        body: {
          messages: [
            { role: "system", content: "You are a product copywriter. Write a short, appealing 1-2 sentence product description. Return ONLY the description text, no quotes." },
            { role: "user", content: `Write a short product description for: ${draft.name}${draft.price ? ` priced at ${draft.price}` : ""}` },
          ],
        },
      });
      const text = res.data?.choices?.[0]?.message?.content || res.data?.content || "";
      if (text.trim()) {
        setDraft((prev) => prev ? { ...prev, description: text.trim() } : prev);
        toast.success("Description generated!");
      } else {
        toast.error("No description returned");
      }
    } catch {
      toast.error("Failed to generate description");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSave = () => {
    if (!draft) return;
    const nextButtonText = ctaValue === "custom"
      ? buttonText.trim()
      : resolveButtonTextForCta(ctaValue, surfaceType);

    const meta = isCommerce ? {
      brand: brand.trim(),
      category: category.trim(),
      subcategory: subcategory.trim(),
      discountPct: discountPct.trim(),
      discountLabel: discountLabel.trim(),
      sizes,
      colors,
      material: material.trim(),
      weight: weight.trim(),
      dimensions: dimensions.trim(),
      specifications: specifications.trim(),
      available,
    } : undefined;

    onSave({
      ...draft,
      imageSrc: images[0] || draft.imageSrc,
      badgeEnabled,
      badgeText: badgeEnabled ? badgeText.trim() : "",
      ctaAction: ctaValue,
      buttonText: nextButtonText,
      actionType,
      actionUrl: actionUrl.trim(),
      ...(meta ? { meta } : {}),
    } as ProductCardData);
  };

  const addSize = () => {
    const v = sizeInput.trim();
    if (!v) return;
    if (sizes.includes(v)) { setSizeInput(""); return; }
    setSizes((prev) => [...prev, v]);
    setSizeInput("");
  };
  const removeSize = (s: string) => setSizes((prev) => prev.filter((x) => x !== s));
  const removeColor = (c: string) => setColors((prev) => prev.filter((x) => x !== c));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
        <div
          className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Edit Product</h2>
            <p className="mt-1 text-sm text-muted-foreground">Update product details, images, and button settings.</p>
          </div>

          <div className="space-y-4 px-6 py-5">
            {/* Image Gallery */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Images</Label>
              {images.length > 0 ? (
                <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
                  <img
                    src={images[activeImageIdx] || images[0]}
                    alt={draft.name || "Product"}
                    className="h-40 w-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveImageIdx((prev) => (prev + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-2 h-2 rounded-full ${idx === activeImageIdx ? "bg-white" : "bg-white/40"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => handleRemoveImage(activeImageIdx)}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-destructive"
                    title="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6 mr-2" /> No images
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setImagePickerOpen(true)} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Image
              </Button>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Item Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                placeholder="Product name"
              />
            </div>

            {/* Brand + Category (Eshop / Estore only) */}
            {isCommerce && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Brand</Label>
                    <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Apparel" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subcategory</Label>
                  <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="e.g. T-Shirts" />
                </div>
              </>
            )}

            {/* Description + AI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Description</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={generatingDesc}
                  className="h-7 text-xs gap-1 text-accent hover:text-accent"
                >
                  {generatingDesc ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Generate with AI
                </Button>
              </div>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                placeholder="Short product description"
                rows={3}
              />
            </div>

            {/* Price + Stock */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Price</Label>
                <Input
                  value={draft.price}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, price: e.target.value } : prev)}
                  placeholder="Price"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Stock</Label>
                <Input
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            {/* Eshop / Estore: Discount, Variants, Logistics */}
            {isCommerce && (
              <>
                <div className="space-y-3 rounded-xl border border-orange-500/40 bg-orange-500/5 p-4">
                  <h4 className="text-sm font-semibold text-foreground">Discount</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Percentage (%)</Label>
                      <Input value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} placeholder="e.g. 25" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Discount Label</Label>
                      <Input value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)} placeholder="e.g. SUMMER25" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <h4 className="text-sm font-semibold text-foreground">Variants</h4>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Available Sizes</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {sizes.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                          {s}
                          <button type="button" onClick={() => removeSize(s)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
                        placeholder="e.g. M, 32, 8.5"
                        className="flex-1"
                      />
                      <Button size="sm" type="button" onClick={addSize} className="gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Color Variations</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => removeColor(c)}
                          className="h-7 w-7 rounded-full border-2 border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                          title={`Click to remove ${c}`}
                        />
                      ))}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setColorPickerOpen((v) => !v)}
                          className="h-7 w-7 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
                          title="Add color"
                        >
                          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        {colorPickerOpen && (
                          <div className="absolute z-50 mt-2 left-0">
                            <ColorPopup
                              currentColor=""
                              label="Pick variation color"
                              onClose={() => setColorPickerOpen(false)}
                              onApply={(hex) => {
                                if (!colors.includes(hex)) setColors((prev) => [...prev, hex]);
                                setColorPickerOpen(false);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {colors.length > 0 && (
                      <p className="text-[11px] text-muted-foreground">Click a swatch to remove it.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <h4 className="text-sm font-semibold text-foreground">Logistics</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Material</Label>
                      <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. 100% cotton" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Weight</Label>
                      <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 250g" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Dimensions</Label>
                    <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="e.g. 30 × 20 × 5 cm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Specifications</Label>
                    <Textarea value={specifications} onChange={(e) => setSpecifications(e.target.value)} placeholder="Any additional product specs" rows={2} />
                  </div>
                  <label className="flex items-center gap-2 pt-1">
                    <Checkbox checked={available} onCheckedChange={(v) => setAvailable(Boolean(v))} />
                    <span className="text-sm text-foreground">Product is available</span>
                  </label>
                </div>
              </>
            )}

            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Badge</h4>
                  <p className="text-xs text-muted-foreground">Show an optional badge on this product card.</p>
                </div>
                <Switch checked={badgeEnabled} onCheckedChange={(checked) => setBadgeEnabled(Boolean(checked))} />
              </div>

              {badgeEnabled && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Badge Text</Label>
                  <Input
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. Popular"
                  />
                </div>
              )}
            </div>

            {/* Button Config Section */}
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
              <h4 className="text-sm font-semibold text-foreground">Button Config</h4>
              <ItemCtaSelector
                value={ctaValue}
                onChange={setCtaValue}
                buttonText={buttonText}
                onButtonTextChange={setButtonText}
                actionType={actionType}
                onActionTypeChange={setActionType}
                actionUrl={actionUrl}
                onActionUrlChange={setActionUrl}
                surfaceType={surfaceType}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!draft.name.trim()}>Save Item</Button>
          </div>
        </div>
      </div>

      {/* Image Picker Overlay */}
      {imagePickerOpen && (
        <ProductImagePicker
          onSelect={handleAddImage}
          onClose={() => setImagePickerOpen(false)}
          productName={draft.name}
        />
      )}
    </>
  );
}

/* ─── Image Picker (AI / Upload / Stock) ─── */

function ProductImagePicker({ onSelect, onClose, productName }: { onSelect: (url: string) => void; onClose: () => void; productName: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Add Product Image</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <Tabs defaultValue="ai" className="flex-1 flex flex-col min-h-0 p-4">
          <TabsList className="w-full h-9 shrink-0">
            <TabsTrigger value="ai" className="text-xs gap-1.5 flex-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Generate
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs gap-1.5 flex-1">
              <Upload className="h-3.5 w-3.5" /> Upload
            </TabsTrigger>
            <TabsTrigger value="stock" className="text-xs gap-1.5 flex-1">
              <Search className="h-3.5 w-3.5" /> Stock
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ai" className="mt-3 flex-1">
            <AiImagePane onSelect={onSelect} defaultPrompt={productName} />
          </TabsContent>
          <TabsContent value="upload" className="mt-3 flex-1">
            <UploadImagePane onSelect={onSelect} />
          </TabsContent>
          <TabsContent value="stock" className="mt-3 flex-1 flex flex-col min-h-0">
            <StockImagePane onSelect={onSelect} defaultQuery={productName} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AiImagePane({ onSelect, defaultPrompt }: { onSelect: (url: string) => void; defaultPrompt: string }) {
  const [prompt, setPrompt] = useState(defaultPrompt ? `Professional photo of ${defaultPrompt}` : "");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setPreview(null);
    try {
      const res = await supabase.functions.invoke("ada-generate-image", { body: { prompt: prompt.trim(), model: "google/gemini-2.5-flash-image" } });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as any;
      let url: string | null = data?.image_url || data?.url || data?.images?.[0]?.url || null;
      if (!url && data?.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
        url = data.choices[0].message.images[0].image_url.url;
      }
      if (!url) throw new Error("No image returned");
      setPreview(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the image..." className="flex-1 text-sm" onKeyDown={(e) => e.key === "Enter" && generate()} />
        <Button size="sm" onClick={generate} disabled={generating || !prompt.trim()} className="gap-1.5">
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {generating && <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>}
      {preview && !generating && (
        <div className="space-y-2">
          <img src={preview} alt="AI generated" className="w-full max-h-[250px] object-contain rounded-lg border border-border" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={generate}>Regenerate</Button>
            <Button size="sm" onClick={() => onSelect(preview)}>Use This</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadImagePane({ onSelect }: { onSelect: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in"); return; }
      const path = `${session.user.id}/editor/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("builder-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("builder-media").getPublicUrl(path);
      onSelect(pub.publicUrl);
      toast.success("Uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onSelect]);

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
      ) : (
        <>
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <label className="cursor-pointer">
            <span className="text-sm font-medium text-accent hover:underline">Choose image</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
          <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WebP · Max 20MB</p>
        </>
      )}
    </div>
  );
}

function StockImagePane({ onSelect, defaultQuery }: { onSelect: (url: string) => void; defaultQuery: string }) {
  const [query, setQuery] = useState(defaultQuery || "");
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setQuery(q);
    try {
      const { data, error } = await supabase.functions.invoke("builder-stock-search", { body: { query: q, mediaType: "image", page: 1 } });
      if (error) throw error;
      if (data?.ok) setResults(data.results || []);
      else toast.error("Search failed");
    } catch { toast.error("Could not search"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search(query)} placeholder="Search stock photos..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-[150px]">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {results.map((r) => (
              <button key={r.id} onClick={() => onSelect(r.fullUrl)} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                <img src={r.thumbUrl} alt={r.author} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{query ? "No results" : "Search for photos"}</p>
            {query && !loading && <Button variant="outline" size="sm" className="mt-2" onClick={() => search(query)}>Search</Button>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ─── */

export function ProductDeleteConfirmModal({ open, product, onClose, onConfirm }: ProductDeleteConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Delete product</h2>
          <p className="mt-1 text-sm text-muted-foreground">This removes only the selected product card.</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-foreground">
            Delete <span className="font-semibold">{product.name || "this product"}</span> from the canvas?
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(product)}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
