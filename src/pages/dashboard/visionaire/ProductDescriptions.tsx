import { useState, useRef, useMemo } from "react";
import { ChevronDown, ChevronUp, Search, Terminal, FileText, History, Loader2 } from "lucide-react";
import designLoveImg from "@/assets/products/design-your-love-life.webp";
import subtleWaysImg from "@/assets/products/13-subtle-ways.webp";
import stopWaitingImg from "@/assets/products/stop-waiting-for-love.webp";
import datingResetImg from "@/assets/products/30-day-dating-reset.webp";

const FEATURED_PRODUCTS = [
  { id: "fp-1", title: "Design Your Love Life", image: designLoveImg },
  { id: "fp-2", title: "13 Subtle Ways You're Sabotaging Your Own Love Life", image: subtleWaysImg },
  { id: "fp-3", title: "Stop Waiting for Love to Find You", image: stopWaitingImg },
  { id: "fp-4", title: "The 30-Day Dating Reset", image: datingResetImg },
];
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useToolRuns, useSaveToolRun, useVisionaireItems } from "@/hooks/useVisionaireItems";
import { toast } from "sonner";

export default function ProductDescriptions() {
  // Mode: library or custom
  const [mode, setMode] = useState<"library" | "custom">("library");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Custom fields
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");

  // Customization
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("");
  const [emphasis, setEmphasis] = useState("");
  const [ctaStyle, setCtaStyle] = useState("");

  // Sections
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [customizationOpen, setCustomizationOpen] = useState(true);

  // Output
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs" | "output" | "history">("logs");
  const [logs, setLogs] = useState<{ time: string; level: "info" | "warn" | "error"; msg: string }[]>([
    { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }), level: "info", msg: "Configure your product details and click Generate to start." },
  ]);

  const { data: history } = useToolRuns("product_descriptions");
  const saveRun = useSaveToolRun();
  const { data: items } = useVisionaireItems();

  const libraryProducts = useMemo(() => {
    if (!items) return [];
    let filtered = items.filter((i) => i.is_active !== false);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((i) => i.title?.toLowerCase().includes(q));
    }
    return filtered.slice(0, 40);
  }, [items, searchQuery]);

  const addLog = (level: "info" | "warn" | "error", msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    setLogs((prev) => [...prev, { time, level, msg }]);
  };

  const handleGenerate = async () => {
    const name = mode === "library" ? selectedProduct?.title : productName;
    if (!name?.trim()) {
      addLog("error", "Please select or enter a product first.");
      return toast.error("Please select or enter a product");
    }
    setLoading(true);
    setActiveTab("output");
    addLog("info", `Generating description for "${name}"...`);

    try {
      const prompt = `Product: ${name}\nDescription: ${mode === "library" ? selectedProduct?.description || "" : productDescription}\nTarget Audience: ${targetAudience}\nTone: ${tone}\nEmphasis: ${emphasis}\nCTA Style: ${ctaStyle}\n\nGenerate a compelling, conversion-focused product description.`;
      const { data, error } = await supabase.functions.invoke("visionaire-llm", {
        body: { toolKey: "product_descriptions", prompt },
      });
      if (error) throw error;
      const text = data?.text || "No output generated.";
      setOutput(text);
      addLog("info", "Description generated successfully.");
      saveRun.mutate({
        toolKey: "product_descriptions",
        input: { productName: name, targetAudience, tone, emphasis, ctaStyle },
        output: text,
      });
    } catch (e: any) {
      addLog("error", e.message || "Generation failed.");
      toast.error(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisionairePageContainer className="!px-0 !pt-0 !pb-0 !max-w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h1 className="text-base font-semibold text-foreground">Product Description Generator</h1>
      </div>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-120px)]">
        {/* Left sidebar */}
        <div className="w-full md:w-[280px] md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-background overflow-y-auto">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-sm font-medium text-foreground">Product Settings</span>
          </div>

          {/* Product Details */}
          <div className="border-b border-border">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Product Details
              {detailsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {detailsOpen && (
              <div className="px-4 pb-4 space-y-3">
                {/* Library / Custom toggle */}
                <div className="flex rounded-md border border-border overflow-hidden">
                  <button
                    onClick={() => setMode("library")}
                    className={`flex-1 text-xs py-1.5 font-medium transition-colors ${mode === "library" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    Library
                  </button>
                  <button
                    onClick={() => setMode("custom")}
                    className={`flex-1 text-xs py-1.5 font-medium transition-colors ${mode === "custom" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    Custom
                  </button>
                </div>

                {mode === "library" ? (
                  <>
                    <div>
                      <Label className="text-xs font-medium">Select Product</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          className="pl-8 h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-2 max-h-[360px] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Featured products first */}
                        {(!searchQuery.trim() ? FEATURED_PRODUCTS : FEATURED_PRODUCTS.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))).map((fp) => (
                          <button
                            key={fp.id}
                            onClick={() => setSelectedProduct({ id: fp.id, title: fp.title, description: "" })}
                            className={`flex flex-col items-center gap-1 rounded-md p-1 transition-colors text-center ${
                              selectedProduct?.id === fp.id
                                ? "ring-2 ring-primary bg-muted/60"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <img
                              src={fp.image}
                              alt={fp.title}
                              className="w-full aspect-[3/4] object-cover rounded"
                            />
                            <span className="text-[10px] text-foreground leading-tight line-clamp-2 font-medium">
                              {fp.title}
                            </span>
                          </button>
                        ))}
                        {/* DB products after */}
                        {libraryProducts.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedProduct(item)}
                            className={`flex flex-col items-center gap-1 rounded-md p-1 transition-colors text-center ${
                              selectedProduct?.id === item.id
                                ? "ring-2 ring-primary bg-muted/60"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            {item.preview_image_url ? (
                              <img
                                src={item.preview_image_url}
                                alt={item.title}
                                className="w-full aspect-[3/4] object-cover rounded"
                              />
                            ) : (
                              <div className="w-full aspect-[3/4] rounded bg-muted flex items-center justify-center">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-[10px] text-foreground leading-tight line-clamp-2 font-medium">
                              {item.title}
                            </span>
                          </button>
                        ))}
                      </div>
                      {libraryProducts.length === 0 && !FEATURED_PRODUCTS.length && (
                        <p className="text-[10px] text-muted-foreground text-center py-4">No products found.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs font-medium">Product Name</Label>
                      <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g. Social Media Mastery Course"
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Description</Label>
                      <Textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Brief description of your product..."
                        className="mt-1 text-xs min-h-[60px]"
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Customization */}
          <div className="border-b border-border">
            <button
              onClick={() => setCustomizationOpen(!customizationOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Customization
              {customizationOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {customizationOpen && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <Label className="text-xs font-medium">Target Audience</Label>
                  <Textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Describe your target audience (e.g., tech-savvy professionals, young parents, fitness enthusiasts)"
                    className="mt-1 text-xs min-h-[60px]"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Tone</Label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="mt-1 w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  >
                    <option value="">Select tone</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="luxury">Luxury</option>
                    <option value="friendly">Friendly</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium">What to Emphasize</Label>
                  <Input
                    value={emphasis}
                    onChange={(e) => setEmphasis(e.target.value)}
                    placeholder="e.g. value, results, ease of use"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">CTA Style</Label>
                  <select
                    value={ctaStyle}
                    onChange={(e) => setCtaStyle(e.target.value)}
                    className="mt-1 w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  >
                    <option value="">Select CTA style</option>
                    <option value="direct">Direct</option>
                    <option value="soft">Soft</option>
                    <option value="urgent">Urgent</option>
                    <option value="benefit-driven">Benefit-Driven</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="p-4">
            <Button
              className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white text-xs font-medium"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Generate Description
            </Button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-border px-4">
            {[
              { key: "logs" as const, icon: Terminal, label: "Logs" },
              { key: "output" as const, icon: FileText, label: "Output" },
              { key: "history" as const, icon: History, label: "History" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Content area with dotted background */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {activeTab === "logs" && (
              <div className="p-5 space-y-1 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span
                      className={
                        log.level === "info"
                          ? "text-blue-500"
                          : log.level === "warn"
                          ? "text-amber-500"
                          : "text-red-500"
                      }
                    >
                      {log.level === "info" ? "ℹ" : log.level === "warn" ? "⚠" : "✕"}
                    </span>
                    <span className="text-muted-foreground">[{log.time}]</span>
                    <span className={log.level === "info" ? "text-blue-500" : log.level === "warn" ? "text-amber-500" : "text-red-500"}>
                      {log.msg}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "output" && (
              <div className="p-5">
                {output ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground">
                    {output}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">
                    Output will appear here after generation.
                  </p>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="p-5 space-y-2">
                {history?.length ? (
                  history.map((run) => (
                    <div
                      key={run.id}
                      className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setOutput(run.output || "");
                        setActiveTab("output");
                      }}
                    >
                      <p className="text-xs font-medium text-foreground truncate">
                        {(run.input as any)?.productName || "Untitled"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(run.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">No history yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </VisionairePageContainer>
  );
}
