import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Loader2, Utensils, Upload, Sparkles, ImageIcon, Search, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// ─── Currency list ───
const CURRENCIES = [
  { code: "UGX", symbol: "UGX", label: "UGX — Ugandan Shilling" },
  { code: "USD", symbol: "$", label: "USD — US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR — Euro" },
  { code: "GBP", symbol: "£", label: "GBP — British Pound" },
  { code: "KES", symbol: "KES", label: "KES — Kenyan Shilling" },
  { code: "TZS", symbol: "TZS", label: "TZS — Tanzanian Shilling" },
  { code: "RWF", symbol: "RWF", label: "RWF — Rwandan Franc" },
  { code: "NGN", symbol: "₦", label: "NGN — Nigerian Naira" },
  { code: "GHS", symbol: "GH₵", label: "GHS — Ghanaian Cedi" },
  { code: "ZAR", symbol: "R", label: "ZAR — South African Rand" },
  { code: "AED", symbol: "AED", label: "AED — UAE Dirham" },
  { code: "INR", symbol: "₹", label: "INR — Indian Rupee" },
  { code: "CNY", symbol: "¥", label: "CNY — Chinese Yuan" },
  { code: "JPY", symbol: "¥", label: "JPY — Japanese Yen" },
  { code: "CAD", symbol: "CA$", label: "CAD — Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "AUD — Australian Dollar" },
  { code: "BRL", symbol: "R$", label: "BRL — Brazilian Real" },
  { code: "MXN", symbol: "MX$", label: "MXN — Mexican Peso" },
  { code: "ETB", symbol: "ETB", label: "ETB — Ethiopian Birr" },
  { code: "XOF", symbol: "CFA", label: "XOF — West African CFA" },
  { code: "XAF", symbol: "FCFA", label: "XAF — Central African CFA" },
];

// ─── Types ───
export interface WizardData {
  // Step 1
  business_name: string;
  slug: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  currency: string;
  currency_symbol: string;
  // Step 2
  logo_url: string;
  hero_banner_url: string;
  primary_color: string;
  layout_style: "grid" | "list";
  logo_position: "left" | "center";
  logo_size: "small" | "medium" | "large";
  show_business_name: boolean;
  social_website: string;
  social_instagram: string;
  social_facebook: string;
  social_twitter: string;
  social_tiktok: string;
  // Step 3
  order_dine_in: boolean;
  order_takeaway: boolean;
  order_delivery: boolean;
  pay_cash: boolean;
  pay_mobile_money: boolean;
  mobile_money_number: string;
  mobile_money_name: string;
  pay_card: boolean;
  pay_paypal: boolean;
}

const INITIAL_DATA: WizardData = {
  business_name: "",
  slug: "",
  contact_email: "",
  contact_phone: "",
  location: "",
  currency: "UGX",
  currency_symbol: "UGX",
  logo_url: "",
  hero_banner_url: "",
  primary_color: "#b5622a",
  layout_style: "grid",
  logo_position: "left",
  logo_size: "medium",
  show_business_name: true,
  social_website: "",
  social_instagram: "",
  social_facebook: "",
  social_twitter: "",
  social_tiktok: "",
  order_dine_in: true,
  order_takeaway: false,
  order_delivery: false,
  pay_cash: true,
  pay_mobile_money: false,
  mobile_money_number: "",
  mobile_money_name: "",
  pay_card: false,
  pay_paypal: false,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: WizardData) => Promise<void>;
}

interface StockResult {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  author: string;
}

export function EmenuWizard({ open, onOpenChange, onComplete }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({ ...INITIAL_DATA });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [aiLogoLoading, setAiLogoLoading] = useState(false);
  // Hero banner state
  const [heroBannerUploading, setHeroBannerUploading] = useState(false);
  const [heroAiLoading, setHeroAiLoading] = useState(false);
  const [heroStockQuery, setHeroStockQuery] = useState("");
  const [heroStockResults, setHeroStockResults] = useState<StockResult[]>([]);
  const [heroStockSearching, setHeroStockSearching] = useState(false);
  const [heroTab, setHeroTab] = useState<"upload" | "ai" | "stock">("upload");

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));

  const handleNameChange = (name: string) => {
    update({
      business_name: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40),
    });
  };

  const handleCurrencyChange = (code: string) => {
    const found = CURRENCIES.find((c) => c.code === code);
    update({ currency: code, currency_symbol: found?.symbol || code });
  };

  // ─── Logo Upload ───
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    if (!user?.id) { toast.error("Not logged in"); return; }

    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const ts = Date.now();
      const path = `${user.id}/logos/${ts}-logo.${ext}`;
      const { error } = await supabase.storage.from("builder-media").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("builder-media").getPublicUrl(path);
      update({ logo_url: urlData.publicUrl });
      toast.success("Logo uploaded");
    } catch (err) {
      console.error("Logo upload error:", err);
      toast.error("Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  // ─── AI Logo ───
  const handleAiLogo = async () => {
    if (!data.business_name.trim()) { toast.error("Enter a business name first"); return; }
    setAiLogoLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-logo", {
        body: {
          prompt: `Minimal restaurant logo for "${data.business_name}", modern, flat icon style, clean background, professional food business branding`,
        },
      });
      if (error) throw error;
      if (result?.ok && result?.image_url) {
        update({ logo_url: result.image_url });
        toast.success("AI logo generated!");
      } else {
        throw new Error(result?.error || "No image returned");
      }
    } catch (err) {
      console.error("AI logo error:", err);
      toast.error(err instanceof Error ? err.message : "AI logo generation failed");
    } finally {
      setAiLogoLoading(false);
    }
  };

  // ─── Hero Banner Upload ───
  const handleHeroBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    if (!user?.id) { toast.error("Not logged in"); return; }

    setHeroBannerUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/banners/${Date.now()}-banner.${ext}`;
      const { error } = await supabase.storage.from("builder-media").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("builder-media").getPublicUrl(path);
      update({ hero_banner_url: urlData.publicUrl });
      toast.success("Banner uploaded");
    } catch (err) {
      console.error("Banner upload error:", err);
      toast.error("Upload failed");
    } finally {
      setHeroBannerUploading(false);
    }
  };

  // ─── Hero Banner AI ───
  const handleHeroAi = async () => {
    if (!data.business_name.trim()) { toast.error("Enter business name first"); return; }
    setHeroAiLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-logo", {
        body: {
          prompt: `Professional hero banner for restaurant "${data.business_name}", beautiful food photography, warm lighting, appetizing, 16:9 wide aspect ratio`,
        },
      });
      if (error) throw error;
      if (result?.ok && result?.image_url) {
        update({ hero_banner_url: result.image_url });
        toast.success("Banner generated!");
      } else {
        throw new Error(result?.error || "No image returned");
      }
    } catch (err) {
      console.error("Hero AI error:", err);
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setHeroAiLoading(false);
    }
  };

  // ─── Hero Banner Stock Search ───
  const handleHeroStockSearch = async () => {
    if (!heroStockQuery.trim()) return;
    setHeroStockSearching(true);
    try {
      const res = await supabase.functions.invoke("builder-stock-search", {
        body: { query: heroStockQuery.trim(), mediaType: "image" },
      });
      if (res.error) throw new Error(res.error.message);
      const d = res.data as { ok: boolean; results?: StockResult[]; error?: string };
      if (!d.ok) throw new Error(d.error || "Search failed");
      setHeroStockResults(d.results || []);
      if ((d.results || []).length === 0) toast.info("No results found");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setHeroStockSearching(false);
    }
  };

  const canContinue1 = data.business_name.trim() && data.slug.trim() && data.contact_email.trim() && data.contact_phone.trim();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setData({ ...INITIAL_DATA });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            E-Menu Setup — Step {step} of 3
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* STEP 1 — Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>

            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input value={data.business_name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Mama's Kitchen" />
            </div>

            <div className="space-y-2">
              <Label>Menu URL Slug *</Label>
              <Input value={data.slug} onChange={(e) => update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) })} placeholder="mamas-kitchen" />
              <p className="text-xs text-muted-foreground">Public link: yangu.shop/{data.slug || "…"}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contact Email *</Label>
                <Input type="email" value={data.contact_email} onChange={(e) => update({ contact_email: e.target.value })} placeholder="hello@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone *</Label>
                <Input value={data.contact_phone} onChange={(e) => update({ contact_phone: e.target.value })} placeholder="+255..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location Address</Label>
              <Input value={data.location} onChange={(e) => update({ location: e.target.value })} placeholder="123 Main St, Dar es Salaam" />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={data.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!canContinue1} className="gap-2">
                Continue to Branding <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — Branding & Social */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Logo</h3>

            {/* Logo section */}
            <div className="space-y-2">
              <Label>Restaurant Logo</Label>
              <div className="flex items-center gap-3">
                {data.logo_url ? (
                  <div className="h-20 w-20 rounded-xl border border-border overflow-hidden bg-muted flex-shrink-0">
                    <img src={data.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground flex-shrink-0 bg-muted/50">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild disabled={logoUploading}>
                      <span>{logoUploading ? "Uploading…" : data.logo_url ? "Change Logo" : "Upload Logo"}</span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleAiLogo}
                    disabled={aiLogoLoading || !data.business_name.trim()}
                  >
                    {aiLogoLoading ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" /> Generate Logo with AI</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Hero Banner section (optional) */}
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">Hero Banner (Optional)</h3>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Add a banner image for the top of your menu page. This is separate from your logo.</p>

              {data.hero_banner_url && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={data.hero_banner_url} alt="Hero banner" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 text-xs"
                    onClick={() => update({ hero_banner_url: "" })}
                  >
                    Remove
                  </Button>
                </div>
              )}

              {/* Tabs for upload/ai/stock */}
              <div className="flex gap-1 border-b border-border">
                {(["upload", "ai", "stock"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setHeroTab(tab)}
                    className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                      heroTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "upload" ? "Upload" : tab === "ai" ? "AI Generate" : "Stock Images"}
                  </button>
                ))}
              </div>

              {heroTab === "upload" && (
                <div className="border border-dashed border-border rounded-lg p-4 text-center">
                  {heroBannerUploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs text-muted-foreground">Uploading…</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <span className="text-xs text-primary hover:underline">Choose banner image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleHeroBannerUpload} />
                      <p className="text-[10px] text-muted-foreground mt-1">Max 10MB</p>
                    </label>
                  )}
                </div>
              )}

              {heroTab === "ai" && (
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 text-xs"
                    onClick={handleHeroAi}
                    disabled={heroAiLoading || !data.business_name.trim()}
                  >
                    {heroAiLoading ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" /> Generate Hero Banner</>
                    )}
                  </Button>
                </div>
              )}

              {heroTab === "stock" && (
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    <Input
                      value={heroStockQuery}
                      onChange={(e) => setHeroStockQuery(e.target.value)}
                      placeholder="Search food images…"
                      className="text-sm flex-1"
                      onKeyDown={(e) => e.key === "Enter" && handleHeroStockSearch()}
                    />
                    <Button size="sm" variant="outline" onClick={handleHeroStockSearch} disabled={heroStockSearching}>
                      {heroStockSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  {heroStockResults.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
                      {heroStockResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            update({ hero_banner_url: r.fullUrl });
                            toast.success(`Photo by ${r.author}`);
                          }}
                          className="relative rounded overflow-hidden border border-border hover:ring-2 hover:ring-primary"
                        >
                          <img src={r.thumbUrl} alt={r.author} className="w-full h-14 object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white truncate px-1">{r.author}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Photos from <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline">Pexels</a>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Primary Brand Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={data.primary_color} onChange={(e) => update({ primary_color: e.target.value })} className="h-9 w-12 rounded border border-input cursor-pointer" />
                <Input value={data.primary_color} onChange={(e) => update({ primary_color: e.target.value })} className="w-28 font-mono text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Menu Layout Style</Label>
                <Select value={data.layout_style} onValueChange={(v) => update({ layout_style: v as "grid" | "list" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Logo Position</Label>
                <Select value={data.logo_position} onValueChange={(v) => update({ logo_position: v as "left" | "center" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Logo Size</Label>
                <Select value={data.logo_size} onValueChange={(v) => update({ logo_size: v as "small" | "medium" | "large" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                  <Switch checked={data.show_business_name} onCheckedChange={(v) => update({ show_business_name: v })} />
                  <Label className="text-sm">Show Name</Label>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">Social Links</h3>
            {([
              ["Website", "social_website", "https://…"],
              ["Instagram", "social_instagram", "@handle"],
              ["Facebook", "social_facebook", "facebook.com/…"],
              ["Twitter / X", "social_twitter", "@handle"],
              ["TikTok", "social_tiktok", "@handle"],
            ] as const).map(([label, key, ph]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={data[key]} onChange={(e) => update({ [key]: e.target.value })} placeholder={ph} className="h-8 text-sm" />
              </div>
            ))}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Continue to Settings <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Order & Payment Settings */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Order Types</h3>
            <div className="space-y-2">
              {([
                ["Dine In", "order_dine_in"],
                ["Takeaway", "order_takeaway"],
                ["Delivery", "order_delivery"],
              ] as const).map(([label, key]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox checked={data[key]} onCheckedChange={(v) => update({ [key]: !!v })} />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">Payment Methods</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={data.pay_cash} onCheckedChange={(v) => update({ pay_cash: !!v })} />
                <span className="text-sm">Cash</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={data.pay_mobile_money} onCheckedChange={(v) => update({ pay_mobile_money: !!v })} />
                <span className="text-sm">Mobile Money</span>
              </label>

              {data.pay_mobile_money && (
                <div className="ml-7 space-y-2 border-l-2 border-primary/20 pl-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Mobile Money Number</Label>
                    <Input value={data.mobile_money_number} onChange={(e) => update({ mobile_money_number: e.target.value })} placeholder="+255..." className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Registered Name</Label>
                    <Input value={data.mobile_money_name} onChange={(e) => update({ mobile_money_name: e.target.value })} placeholder="Name on account" className="h-8 text-sm" />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={data.pay_card} onCheckedChange={(v) => update({ pay_card: !!v })} />
                <span className="text-sm">Card / Stripe</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={data.pay_paypal} onCheckedChange={(v) => update({ pay_paypal: !!v })} />
                <span className="text-sm">PayPal</span>
              </label>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Complete Setup & Create Menu</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
