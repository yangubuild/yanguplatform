import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Trash2, Pencil, Package, Upload, Sparkles, Link2, Search, Loader2, Star } from "lucide-react";
import { BuilderMediaPicker, type MediaValue } from "../BuilderMediaPicker";
import { MediaPickerList } from "../media/MediaPickerList";
import type { MediaAsset } from "../media/MediaPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
  surfaceId?: string;
}

// ─── Types ───

interface ProductCategory {
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  name: string;
  children: string[];
}

interface Product {
  name: string;
  brand: string;
  category: string;
  description: string;
  images: string[];
  media: MediaAsset[];
  price: string;
  compare_at_price: string;
  supplier_cost: string;
  stock_quantity: string;
  discount_percent: string;
  discount_label: string;
  sizes: string[];
  colors: ProductColor[];
  material: string;
  weight: string;
  dimensions: string;
  specifications: string;
  is_available: boolean;
  listed_on_eshop_connect?: boolean;
  cta_action: string;
}

interface ProductColor {
  name: string;
  hex: string;
  image_url: string;
}

const PRESET_COLORS = [
  { name: "Red", hex: "#DC2626" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Green", hex: "#16A34A" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Purple", hex: "#9333EA" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Brown", hex: "#92400E" },
];

// ─── Main Products Editor ───

export function ProductsEditor({ schema, update, surfaceId }: FormProps) {
  const navigate = useNavigate();
  const currency = (schema.currency as string) || "UGX";
  const categories = ((schema.categories as any[]) || []).map((c: any) => ({
    name: c.name || "",
    subcategories: (c.subcategories || []).map((s: any) => ({
      name: s.name || "",
      children: s.children || [],
    })),
  })) as ProductCategory[];

  const products = ((schema.products as any[]) || []).map((p: any) => {
    // Migrate legacy images[] to media[]
    const legacyImages: string[] = p.images || [];
    const existingMedia: MediaAsset[] = p.media || [];
    const media: MediaAsset[] = existingMedia.length > 0
      ? existingMedia
      : legacyImages.filter(Boolean).map((url: string) => ({ type: "image" as const, src: url, provider: "url" as const }));
    return {
    name: p.name || "",
    brand: p.brand || "",
    category: p.category || "",
    description: p.description || "",
    images: legacyImages,
    media,
    price: p.price || "",
    compare_at_price: p.compare_at_price || "",
    supplier_cost: p.supplier_cost || "",
    stock_quantity: p.stock_quantity || "",
    discount_percent: p.discount_percent || "",
    discount_label: p.discount_label || "",
    sizes: p.sizes || [],
    colors: p.colors || [],
    material: p.material || "",
    weight: p.weight || "",
    dimensions: p.dimensions || "",
    specifications: p.specifications || "",
    is_available: p.is_available !== false,
    listed_on_eshop_connect: p.listed_on_eshop_connect || false,
    cta_action: p.cta_action || "add_to_cart",
  }}) as Product[];

  // Dialog state
  const [showAddMethodDialog, setShowAddMethodDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editProductIndex, setEditProductIndex] = useState<number | null>(null);
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [editCatIndex, setEditCatIndex] = useState<number | null>(null);

  // Product form state
  const [pName, setPName] = useState("");
  const [pBrand, setPBrand] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pImages, setPImages] = useState<string[]>([]);
  const [pMedia, setPMedia] = useState<MediaAsset[]>([]);
  const [pPrice, setPPrice] = useState("");
  const [pCompareAtPrice, setPCompareAtPrice] = useState("");
  const [pSupplierCost, setPSupplierCost] = useState("");
  const [pStock, setPStock] = useState("");
  const [pDiscountPct, setPDiscountPct] = useState("");
  const [pDiscountLabel, setPDiscountLabel] = useState("");
  const [pSizes, setPSizes] = useState<string[]>([]);
  const [pSizeInput, setPSizeInput] = useState("");
  const [pColors, setPColors] = useState<ProductColor[]>([]);
  const [pMaterial, setPMaterial] = useState("");
  const [pWeight, setPWeight] = useState("");
  const [pDimensions, setPDimensions] = useState("");
  const [pSpecs, setPSpecs] = useState("");
  const [pAvailable, setPAvailable] = useState(true);
  const [pListedOnEshop, setPListedOnEshop] = useState(false);
  const [pCtaAction, setPCtaAction] = useState("add_to_cart");
  const [pDraftMedia, setPDraftMedia] = useState<MediaValue>({ type: "none", source: "url", url: "", alt: "", fit: "cover" });
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingSpecs, setIsGeneratingSpecs] = useState(false);

  // Category form state
  const [catName, setCatName] = useState("");
  const [catSubs, setCatSubs] = useState<Subcategory[]>([]);
  const [subInput, setSubInput] = useState("");

  // ─── Stats ───
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

  // ─── Category helpers ───
  const openCreateCat = () => {
    setEditCatIndex(null);
    setCatName("");
    setCatSubs([]);
    setShowCatDialog(true);
  };

  const openEditCat = (i: number) => {
    setEditCatIndex(i);
    setCatName(categories[i].name);
    setCatSubs([...categories[i].subcategories]);
    setShowCatDialog(true);
  };

  const saveCat = () => {
    const updated = [...categories];
    const catData: ProductCategory = { name: catName, subcategories: catSubs };
    if (editCatIndex !== null) {
      updated[editCatIndex] = catData;
    } else {
      updated.push(catData);
    }
    update({ categories: updated });
    setShowCatDialog(false);
  };

  const deleteCat = (i: number) => {
    if (!confirm(`Delete "${categories[i].name}" and all subcategories?`)) return;
    update({ categories: categories.filter((_, j) => j !== i) });
  };

  const addSubcategory = () => {
    if (!subInput.trim()) return;
    setCatSubs([...catSubs, { name: subInput.trim(), children: [] }]);
    setSubInput("");
  };

  // ─── Product helpers ───
  const openAddProduct = () => {
    setShowAddMethodDialog(true);
  };

  const openManualAdd = () => {
    setShowAddMethodDialog(false);
    setEditProductIndex(null);
    setPName(""); setPBrand(""); setPCategory(categories[0]?.name || "");
    setPDesc(""); setPImages([]); setPMedia([]); setPPrice(""); setPCompareAtPrice(""); setPSupplierCost(""); setPStock("");
    setPDiscountPct(""); setPDiscountLabel("");
    setPSizes([]); setPSizeInput(""); setPColors([]);
    setPMaterial(""); setPWeight(""); setPDimensions("");
    setPSpecs(""); setPAvailable(true); setPListedOnEshop(false); setPCtaAction("add_to_cart");
    setPDraftMedia({ type: "none", source: "url", url: "", alt: "", fit: "cover" });
    setShowProductDialog(true);
  };

  const openEditProduct = (i: number) => {
    const p = products[i];
    setEditProductIndex(i);
    setPName(p.name); setPBrand(p.brand); setPCategory(p.category);
    setPDesc(p.description); setPImages(p.images); setPMedia(p.media); setPPrice(p.price); setPCompareAtPrice(p.compare_at_price); setPSupplierCost(p.supplier_cost);
    setPStock(p.stock_quantity); setPDiscountPct(p.discount_percent);
    setPDiscountLabel(p.discount_label); setPSizes(p.sizes);
    setPColors(p.colors); setPMaterial(p.material); setPWeight(p.weight);
    setPDimensions(p.dimensions); setPSpecs(p.specifications);
    setPAvailable(p.is_available);
    setPListedOnEshop(p.listed_on_eshop_connect || false);
    setPCtaAction(p.cta_action || "add_to_cart");
    setPDraftMedia({ type: "none", source: "url", url: "", alt: "", fit: "cover" });
    setShowProductDialog(true);
  };

  const saveProduct = () => {
    const product: Product = {
      name: pName, brand: pBrand, category: pCategory,
      description: pDesc, images: pMedia.map(m => m.src).filter(Boolean), media: pMedia, price: pPrice,
      compare_at_price: pCompareAtPrice, supplier_cost: pSupplierCost,
      stock_quantity: pStock, discount_percent: pDiscountPct,
      discount_label: pDiscountLabel, sizes: pSizes,
      colors: pColors, material: pMaterial, weight: pWeight,
      dimensions: pDimensions, specifications: pSpecs,
      is_available: pAvailable,
      listed_on_eshop_connect: pListedOnEshop,
      cta_action: pCtaAction,
    };
    const updated = [...products];
    if (editProductIndex !== null) {
      updated[editProductIndex] = product;
    } else {
      updated.push(product);
    }
    update({ products: updated });
    setShowProductDialog(false);
  };

  const deleteProduct = (i: number) => {
    if (!confirm(`Delete "${products[i].name}"?`)) return;
    update({ products: products.filter((_, j) => j !== i) });
  };

  const addSize = () => {
    if (!pSizeInput.trim()) return;
    setPSizes([...pSizes, pSizeInput.trim()]);
    setPSizeInput("");
  };

  const toggleColor = (hex: string, name: string) => {
    const exists = pColors.find(c => c.hex === hex);
    if (exists) {
      setPColors(pColors.filter(c => c.hex !== hex));
    } else {
      setPColors([...pColors, { name, hex, image_url: "" }]);
    }
  };

  const addDraftMediaToImages = () => {
    const url = (pDraftMedia.url || "").trim();
    if (!url) {
      toast.info("Pick or upload an image first");
      return;
    }

    setPImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setPDraftMedia({ type: "none", source: "url", url: "", alt: "", fit: "cover" });
  };

  const generateDescription = async () => {
    setIsGeneratingDesc(true);
    try {
      const prompt = `Write a clear ecommerce product description (max 50 words) for:\nName: ${pName || "Product"}\nBrand: ${pBrand || "N/A"}\nCategory: ${pCategory || "General"}. Return only the description text.`;

      const { data, error } = await supabase.functions.invoke("ada-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash-lite",
          max_tokens: 140,
        },
      });

      if (error) throw error;

      const generatedText = [
        data?.reply,
        data?.content,
        data?.text,
        data?.choices?.[0]?.message?.content,
      ].find((v): v is string => typeof v === "string" && v.trim().length > 0)?.trim();

      if (!generatedText) throw new Error("No description generated");

      setPDesc(generatedText);
      toast.success("Description generated");
    } catch (err) {
      console.error("Generate description failed:", err);
      toast.error("AI description generation failed");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const generateProductImage = async () => {
    if (!pName.trim()) {
      toast.error("Enter a product name first");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const prompt = `Generate a professional ecommerce product photo for: ${pName}${pBrand ? ` by ${pBrand}` : ""}${pCategory ? ` in category ${pCategory}` : ""}. ${pDesc ? `Description: ${pDesc.slice(0, 100)}` : ""} Clean white background, studio lighting, high quality product photography.`;

      const { data, error } = await supabase.functions.invoke("ada-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash-image",
          modalities: ["image", "text"],
        },
      });

      if (error) throw error;

      const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) throw new Error("No image generated");

      const newAsset: MediaAsset = { type: "image", src: imageUrl, provider: "ai" as any };
      setPMedia((prev) => prev.length < 10 ? [...prev, newAsset] : prev);
      toast.success("Product image generated");
    } catch (err) {
      console.error("Generate product image failed:", err);
      toast.error("AI image generation failed");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateSpecifications = async () => {
    if (!pName.trim()) {
      toast.error("Enter a product name first");
      return;
    }
    setIsGeneratingSpecs(true);
    try {
      const prompt = `Generate realistic product specifications for:\nName: ${pName}\nBrand: ${pBrand || "N/A"}\nCategory: ${pCategory || "General"}\nDescription: ${pDesc || "N/A"}\n\nReturn only a concise list of specifications in "Key: Value" format, one per line. Include relevant specs like dimensions, weight, material, compatibility, etc. Max 8 specs.`;

      const { data, error } = await supabase.functions.invoke("ada-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash-lite",
          max_tokens: 200,
        },
      });

      if (error) throw error;

      const generatedText = [
        data?.reply,
        data?.content,
        data?.text,
        data?.choices?.[0]?.message?.content,
      ].find((v): v is string => typeof v === "string" && v.trim().length > 0)?.trim();

      if (!generatedText) throw new Error("No specifications generated");

      setPSpecs(generatedText);
      toast.success("Specifications generated");
    } catch (err) {
      console.error("Generate specifications failed:", err);
      toast.error("AI specifications generation failed");
    } finally {
      setIsGeneratingSpecs(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Currency selector */}
      <div className="space-y-1.5">
        <Label className="text-xs">Currency</Label>
        <Select value={currency} onValueChange={(v) => update({ currency: v })}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UGX">UGX — Ugandan Shilling</SelectItem>
            <SelectItem value="USD">USD — US Dollar</SelectItem>
            <SelectItem value="EUR">EUR — Euro</SelectItem>
            <SelectItem value="GBP">GBP — British Pound</SelectItem>
            <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
            <SelectItem value="NGN">NGN — Nigerian Naira</SelectItem>
            <SelectItem value="ZAR">ZAR — South African Rand</SelectItem>
            <SelectItem value="TZS">TZS — Tanzanian Shilling</SelectItem>
            <SelectItem value="GHS">GHS — Ghanaian Cedi</SelectItem>
            <SelectItem value="AED">AED — UAE Dirham</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Products</p>
          <p className="text-lg font-bold">{totalProducts}</p>
        </div>
        <div className="border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Value</p>
          <p className="text-lg font-bold">{currency} {totalValue.toLocaleString()}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Categories</p>
          <p className="text-lg font-bold">{categories.length}</p>
        </div>
        <div className="border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Pending Orders</p>
          <p className="text-lg font-bold">0</p>
        </div>
      </div>

      {/* ═══ Categories Section ═══ */}
      <div className="border border-border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Categories</h3>
          <Button variant="default" size="sm" className="gap-1 text-xs" onClick={openCreateCat}>
            <Plus className="h-3 w-3" /> Add Category
          </Button>
        </div>
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No categories yet. Add your first category.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, ci) => (
              <div key={ci} className="border border-border rounded-lg p-3 min-w-[120px] space-y-1">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEditCat(ci)}>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteCat(ci)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <p className="text-xs font-semibold uppercase">{cat.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {products.filter(p => p.category === cat.name).length} products
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Products Section ═══ */}
      <div className="border border-border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Products</h3>
          <Button variant="default" size="sm" className="gap-1 text-xs" onClick={openAddProduct}>
            <Plus className="h-3 w-3" /> Add Product
          </Button>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Package className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No products yet. Add your first product to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {products.map((product, pi) => (
              <div key={pi} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-accent/5 rounded px-1" onClick={() => openEditProduct(pi)}>
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="h-10 w-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name || "Untitled"}</p>
                  <p className="text-[10px] text-muted-foreground">{product.category || "No category"}</p>
                </div>
                <span className="text-xs font-semibold text-primary shrink-0">{currency} {product.price}</span>
                {!product.is_available && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Unavailable</span>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); deleteProduct(pi); }}>
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Add Method Dialog ═══ */}
      {showAddMethodDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddMethodDialog(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">How would you like to add products?</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAddMethodDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div
              className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-accent/5 space-y-1"
              onClick={openManualAdd}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Add Manually</p>
                  <p className="text-xs text-muted-foreground">Upload product photos from your computer or enter URLs manually</p>
                </div>
              </div>
            </div>
            <div
              className="border border-secondary bg-secondary/30 rounded-xl p-4 cursor-pointer hover:border-primary/50 space-y-1"
              onClick={() => {
                setShowAddMethodDialog(false);
                navigate(`/dashboard/seller/eshop-connect${surfaceId ? `?shop_surface_id=${surfaceId}` : ""}`);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Add from Eshop Connect</p>
                  <p className="text-xs text-muted-foreground">Browse & import products from CJ, ModernDropship, or YANGU Estores</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add Category Dialog ═══ */}
      {showCatDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCatDialog(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editCatIndex !== null ? "Edit Category" : "Add Category"}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCatDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Category Name</Label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g., Electronics, Women's Bags"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Subcategories</Label>
              <div className="flex gap-2">
                <Input
                  value={subInput}
                  onChange={(e) => setSubInput(e.target.value)}
                  placeholder="e.g., Phones, Backpacks"
                  onKeyDown={(e) => e.key === "Enter" && addSubcategory()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" className="shrink-0" onClick={addSubcategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-primary">
                Click on a subcategory to add sub-subcategories (e.g., Electronics → Phones → iPhone).
              </p>
              {catSubs.length > 0 && (
                <div className="space-y-1 mt-2">
                  {catSubs.map((sub, si) => (
                    <div key={si} className="flex items-center gap-2 text-sm bg-muted/30 rounded px-2 py-1">
                      <span className="flex-1">{sub.name}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setCatSubs(catSubs.filter((_, j) => j !== si))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={saveCat}
              disabled={!catName.trim()}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {editCatIndex !== null ? "Save Category" : "Create Category"}
            </Button>
          </div>
        </div>
      )}

      {/* ═══ Add/Edit Product Dialog ═══ */}
      {showProductDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowProductDialog(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editProductIndex !== null ? "Edit Product" : "Add Product Manually"}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowProductDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Product Name *</Label>
              <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g., iPhone 15 Pro" autoFocus />
            </div>

            {/* Brand + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Brand</Label>
                <Input value={pBrand} onChange={(e) => setPBrand(e.target.value)} placeholder="e.g., Apple" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Category *</Label>
                <Select value={pCategory} onValueChange={setPCategory}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c, i) => (
                      <SelectItem key={i} value={c.name}>{c.name.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Description</Label>
              <Textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Product description" rows={3} />
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={generateDescription} disabled={isGeneratingDesc}>
                {isGeneratingDesc ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Generate Description
              </Button>
            </div>

            {/* Product Cover Images — MediaPickerList */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Product Images (max 10)</Label>
              <p className="text-xs text-muted-foreground">First image is the primary cover photo</p>
              {pMedia.length > 0 && pMedia[0]?.src && (
                <div className="flex items-center gap-1.5 text-xs text-primary mb-1">
                  <Star className="h-3 w-3 fill-primary" /> Primary
                </div>
              )}
              <MediaPickerList
                items={pMedia}
                onChange={(next) => {
                  if (next.length > 10) return;
                  setPMedia(next);
                }}
                surfaceId={surfaceId || ""}
                label="Product Images"
                max={10}
              />
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={generateProductImage} disabled={isGeneratingImage || pMedia.length >= 10}>
                {isGeneratingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Generate Product Image
              </Button>
            </div>

            {/* Pricing Section */}
            <div className="border border-border rounded-lg p-3 space-y-3">
              <h4 className="text-sm font-bold">Pricing</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">Selling Price ({currency}) *</Label>
                  <Input type="number" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">Compare-at Price</Label>
                  <Input type="number" value={pCompareAtPrice} onChange={(e) => setPCompareAtPrice(e.target.value)} placeholder="Optional" />
                  <p className="text-xs text-muted-foreground">Show as original price (strikethrough)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">Supplier Cost</Label>
                  <Input type="number" value={pSupplierCost} onChange={(e) => setPSupplierCost(e.target.value)} placeholder="Auto-filled on import" disabled={!!pSupplierCost && pSupplierCost !== "0"} />
                  <p className="text-xs text-muted-foreground">Read-only after import</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">Margin</Label>
                  <div className="px-3 py-2 text-sm rounded-md border border-border bg-muted/40 text-foreground font-medium">
                    {pPrice && pSupplierCost ? `${currency} ${(parseFloat(pPrice) - parseFloat(pSupplierCost)).toFixed(2)}` : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">Selling price − supplier cost</p>
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Stock Quantity</Label>
              <Input type="number" value={pStock} onChange={(e) => setPStock(e.target.value)} placeholder="Optional" />
            </div>

            {/* Discount section (orange border like wireframe) */}
            <div className="border-2 border-accent rounded-lg p-3 bg-accent/10 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-accent-foreground">Discount Percentage (%)</Label>
                  <Input
                    type="number"
                    value={pDiscountPct}
                    onChange={(e) => setPDiscountPct(e.target.value)}
                    placeholder="e.g., 20"
                    min={0} max={100}
                  />
                  <p className="text-xs text-accent-foreground/70">Enter 0-100 for percentage off</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-accent-foreground">Discount Label</Label>
                  <Input
                    value={pDiscountLabel}
                    onChange={(e) => setPDiscountLabel(e.target.value)}
                    placeholder="e.g., Summer Sale, Black Friday"
                  />
                  <p className="text-xs text-accent-foreground/70">Custom label shown on banners</p>
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Available Sizes</Label>
              <div className="flex gap-2">
                <Input
                  value={pSizeInput}
                  onChange={(e) => setPSizeInput(e.target.value)}
                  placeholder="e.g., S, M, L, XL, 42, 44"
                  onKeyDown={(e) => e.key === "Enter" && addSize()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" className="shrink-0" onClick={addSize}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {pSizes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {pSizes.map((s, si) => (
                    <span key={si} className="text-xs bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                      {s}
                      <button onClick={() => setPSizes(pSizes.filter((_, j) => j !== si))}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Color Variations */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Color Variations</Label>
              <p className="text-xs text-muted-foreground">Add colors with visual swatches. You can upload specific images for each color.</p>
              <div className="border border-border rounded-lg p-3 flex flex-wrap items-center gap-2 justify-center">
                {PRESET_COLORS.map((c) => {
                  const isSelected = pColors.some(pc => pc.hex === c.hex);
                  return (
                    <button
                      key={c.hex}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${isSelected ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => toggleColor(c.hex, c.name)}
                      title={c.name}
                    />
                  );
                })}
                <span className="text-xs text-muted-foreground ml-1">Select from Color Palette</span>
              </div>
            </div>

            {/* Material, Weight, Dimensions */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Material</Label>
                <Input value={pMaterial} onChange={(e) => setPMaterial(e.target.value)} placeholder="e.g., Cotton, Leather" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Weight</Label>
                <Input value={pWeight} onChange={(e) => setPWeight(e.target.value)} placeholder="e.g., 500g" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Dimensions</Label>
                <Input value={pDimensions} onChange={(e) => setPDimensions(e.target.value)} placeholder="e.g., 30x20x10 cm" />
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">Specifications</Label>
              <Textarea value={pSpecs} onChange={(e) => setPSpecs(e.target.value)} placeholder="e.g., Storage: 256GB, Battery: 4000mAh" rows={3} />
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={generateSpecifications} disabled={isGeneratingSpecs}>
                {isGeneratingSpecs ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate Specifications
              </Button>
            </div>

            {/* Available */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="product-available"
                checked={pAvailable}
                onCheckedChange={(c) => setPAvailable(!!c)}
              />
              <label htmlFor="product-available" className="text-sm font-medium">Product is available</label>
            </div>

            {/* List on Eshop Connect — for estore suppliers */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="product-eshop-connect"
                checked={pListedOnEshop}
                onCheckedChange={(c) => setPListedOnEshop(!!c)}
              />
              <label htmlFor="product-eshop-connect" className="text-sm font-medium">List on Eshop Connect</label>
              <span className="text-xs text-muted-foreground ml-1">(visible to other sellers)</span>
            </div>

            <Button
              onClick={saveProduct}
              disabled={!pName.trim() || !pPrice.trim()}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {editProductIndex !== null ? "Save Product" : "Add Product"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
