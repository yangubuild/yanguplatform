import * as React from "react";
import { X, Columns2, Columns3, Columns4, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface BlogSectionLayoutEditorProps {
  sectionId: string;
  sectionTitle: string;
  onClose: () => void;
}

const containerOptions = [
  { count: 1, icon: LayoutList, label: "1 Column" },
  { count: 2, icon: Columns2, label: "2 Column" },
  { count: 3, icon: Columns3, label: "3 Grid" },
  { count: 4, icon: Columns4, label: "4 Grid" },
];

const cardSizes = ["Small", "Medium", "Hero"] as const;

const ctaOptions = [
  { id: "try-it", label: "Try it" },
  { id: "watch", label: "Watch" },
  { id: "read", label: "Read" },
  { id: "register", label: "Register" },
] as const;

const contentSources = ["Articles", "Podcast", "Events", "Tools", "Mixed"] as const;

const categoryMappings = [
  "Dispatches",
  "yangu Studio",
  "Putting AI At Work",
  "Future Programming",
  "Podcast",
  "Events",
  "Built By Yangu",
] as const;

export function BlogSectionLayoutEditor({ sectionId, sectionTitle, onClose }: BlogSectionLayoutEditorProps) {
  const [containerCount, setContainerCount] = React.useState(3);
  const [cardSize, setCardSize] = React.useState<string>("Medium");
  const [enabledCtas, setEnabledCtas] = React.useState<string[]>(["try-it"]);
  const [contentSource, setContentSource] = React.useState<string>("Articles");
  const [category, setCategory] = React.useState<string>("");
  const [adaReview, setAdaReview] = React.useState(false);

  const toggleCta = (id: string) => {
    setEnabledCtas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Edit Layout — {sectionTitle}</h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Container Layout */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Container Layout</Label>
        <div className="flex gap-2 flex-wrap">
          {containerOptions.map((opt) => (
            <Button
              key={opt.count}
              variant={containerCount === opt.count ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setContainerCount(opt.count)}
            >
              <opt.icon className="h-3.5 w-3.5" />
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Card Size */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Card Size</Label>
        <div className="flex gap-2">
          {cardSizes.map((size) => (
            <Button
              key={size}
              variant={cardSize === size ? "default" : "outline"}
              size="sm"
              onClick={() => setCardSize(size)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">CTA Buttons</Label>
        <div className="flex flex-wrap gap-3">
          {ctaOptions.map((cta) => (
            <label key={cta.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <Checkbox
                checked={enabledCtas.includes(cta.id)}
                onCheckedChange={() => toggleCta(cta.id)}
              />
              {cta.label}
            </label>
          ))}
        </div>
      </div>

      {/* Content Source */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Content Source</Label>
        <Select value={contentSource} onValueChange={setContentSource}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contentSources.map((src) => (
              <SelectItem key={src} value={src}>{src}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Mapping */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Category Mapping</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select category…" />
          </SelectTrigger>
          <SelectContent>
            {categoryMappings.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ADA AI Review */}
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2">
        <div>
          <Label className="text-xs font-medium">Enable ADA Review</Label>
          <p className="text-[10px] text-muted-foreground">AI content moderation for this section</p>
        </div>
        <Switch checked={adaReview} onCheckedChange={setAdaReview} className="scale-75" />
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Preview</Label>
        <div className={cn(
          "grid gap-2",
          containerCount === 1 && "grid-cols-1",
          containerCount === 2 && "grid-cols-2",
          containerCount === 3 && "grid-cols-3",
          containerCount === 4 && "grid-cols-4",
        )}>
          {Array.from({ length: containerCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-md border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-xs text-muted-foreground gap-1",
                cardSize === "Hero" && "h-28",
                cardSize === "Medium" && "h-20",
                cardSize === "Small" && "h-14",
              )}
            >
              <span>Card {i + 1}</span>
              {enabledCtas.length > 0 && (
                <span className="text-[9px] text-primary/60">{enabledCtas.map((c) => ctaOptions.find((o) => o.id === c)?.label).join(" · ")}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="flex-1" disabled>Apply Layout</Button>
      </div>
    </div>
  );
}
