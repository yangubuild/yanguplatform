import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Sparkles, Square, RectangleHorizontal, RectangleVertical, Lightbulb, ChevronDown, ImagePlus } from "lucide-react";

const MOCK_IMAGES = [
  "/studio/img-ad-1.webp",
  "/studio/img-ad-2.webp",
  "/studio/img-ad-3.webp",
  "/studio/img-ad-4.webp",
  "/studio/img-ad-5.webp",
  "/studio/img-ad-6.webp",
];

export function ImageAdsGeneratedPage() {
  const [brandName, setBrandName] = useState("Dokotoo Women's Pullover");
  const [description, setDescription] = useState(
    "Comfortable oversized pullover sweatshirt for women. Fashion blouse with a relaxed fit, perfect for casual everyday wear."
  );
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set([0, 1, 2]));
  const [sellingPoints, setSellingPoints] = useState(["Color block design", "Lightweight knit fabric", "Loose casual fit"]);
  const [brandColors] = useState(["hsl(40, 20%, 75%)", "hsl(35, 55%, 55%)", "hsl(350, 15%, 60%)"]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [model, setModel] = useState("design-master");
  const [orientation, setOrientation] = useState("portrait");
  const [count, setCount] = useState("4");

  const toggleImage = (idx: number) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedImages(new Set(MOCK_IMAGES.map((_, i) => i)));
  const unselectAll = () => setSelectedImages(new Set());

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 pt-4 space-y-6">
          {/* Card */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Set Up Your Image Ads</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We've pulled product info from your link. Review and adjust before generating.
              </p>
            </div>

            {/* Brand name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Brand / Product name</Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="rounded-lg bg-background border-border/60"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Brand / Product description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg bg-background border-border/60 min-h-[100px]"
              />
            </div>

            {/* Image grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select product images to start</Label>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  <Lightbulb className="h-3 w-3" />
                  Tips
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose the best 3-5 product images for the best results.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {MOCK_IMAGES.map((src, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleImage(idx)}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-square ${
                      selectedImages.has(idx)
                        ? "border-accent shadow-md shadow-accent/20"
                        : "border-border/40 hover:border-border"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Product ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedImages.has(idx)}
                        className="h-5 w-5 rounded border-2 bg-background/80 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                ))}

                {/* Add assets tile */}
                <div className="border-2 border-dashed border-destructive/50 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-destructive/70 transition-colors aspect-square">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">Add assets</span>
                </div>
              </div>

              {/* Action chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={selectAll}
                  className="rounded-full border border-border/40 bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Select all
                </button>
                <button
                  onClick={unselectAll}
                  className="rounded-full border border-border/40 bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Unselect all
                </button>
                <button className="rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                  Delete select
                </button>
              </div>
            </div>
          </div>

          {/* Advanced settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <div className="rounded-2xl border border-border/40 bg-card">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-6 text-left">
                <span className="text-base font-bold text-foreground">
                  Advanced settings <span className="text-muted-foreground font-normal">(Optional)</span>
                </span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-6">
                  {/* Selling points */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Selling points</Label>
                    {sellingPoints.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                          {idx + 1}
                        </span>
                        <Input
                          value={point}
                          onChange={(e) => {
                            const next = [...sellingPoints];
                            next[idx] = e.target.value;
                            setSellingPoints(next);
                          }}
                          className="rounded-lg bg-background border-border/60"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Brand logo & color */}
                  <div className="flex gap-8">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Brand logo</Label>
                      <button className="h-12 w-12 rounded-lg bg-muted border border-border/40 flex items-center justify-center hover:bg-muted/80 transition-colors">
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Brand color</Label>
                      <div className="flex items-center gap-2">
                        {brandColors.map((color, idx) => (
                          <div
                            key={idx}
                            className="h-10 w-10 rounded-lg border border-border/40 cursor-pointer hover:scale-105 transition-transform"
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Promotional info */}
          <div className="rounded-2xl border border-border/40 bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">Promotional info</span>
              <Switch checked={promoEnabled} onCheckedChange={setPromoEnabled} />
            </div>
          </div>

          {/* Bottom toolbar - inside scroll area */}
          <div className="flex items-center justify-end py-6 gap-4">
            <div className="flex items-center gap-4">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-[170px] h-10 rounded-lg bg-card border-border/60 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="design-pro">Design Pro</SelectItem>
                  <SelectItem value="design-master">
                    <span className="flex items-center gap-1.5">
                      Design Master
                      <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent leading-none">NEW</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="nano-banana">Nano Banana</SelectItem>
                </SelectContent>
              </Select>

              <Select value={orientation} onValueChange={setOrientation}>
                <SelectTrigger className="w-[140px] h-10 rounded-lg bg-card border-border/60 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="square">
                    <span className="flex items-center gap-1.5"><Square className="h-3 w-3" /> Square</span>
                  </SelectItem>
                  <SelectItem value="landscape">
                    <span className="flex items-center gap-1.5"><RectangleHorizontal className="h-3 w-3" /> Landscape</span>
                  </SelectItem>
                  <SelectItem value="portrait">
                    <span className="flex items-center gap-1.5"><RectangleVertical className="h-3 w-3" /> Portrait</span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="w-[120px] h-10 rounded-lg bg-card border-border/60 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="4">4 images</SelectItem>
                  <SelectItem value="10">10 images</SelectItem>
                  <SelectItem value="20">20 images</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="accent" className="h-10 rounded-lg text-sm font-semibold gap-1.5 px-6">
              <Sparkles className="h-4 w-4" />
              Generate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
