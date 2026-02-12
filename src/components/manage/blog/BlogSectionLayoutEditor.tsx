import * as React from "react";
import { X, Columns2, Columns3, Columns4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BlogSectionLayoutEditorProps {
  sectionId: string;
  sectionTitle: string;
  onClose: () => void;
}

const containerOptions = [
  { count: 2, icon: Columns2, label: "2 Columns" },
  { count: 3, icon: Columns3, label: "3 Columns" },
  { count: 4, icon: Columns4, label: "4 Columns" },
];

const cardStyles = ["Large", "Medium", "Small"] as const;

export function BlogSectionLayoutEditor({ sectionTitle, onClose }: BlogSectionLayoutEditorProps) {
  const [containerCount, setContainerCount] = React.useState(3);
  const [cardStyle, setCardStyle] = React.useState<string>("Medium");
  const [showWriter, setShowWriter] = React.useState(true);
  const [showCta, setShowCta] = React.useState(true);

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Edit Layout — {sectionTitle}</h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Container Count */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Container Count</Label>
        <div className="flex gap-2">
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

      {/* Card Style */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Card Style</Label>
        <div className="flex gap-2">
          {cardStyles.map((style) => (
            <Button
              key={style}
              variant={cardStyle === style ? "default" : "outline"}
              size="sm"
              onClick={() => setCardStyle(style)}
            >
              {style}
            </Button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Writer Info</Label>
          <Switch checked={showWriter} onCheckedChange={setShowWriter} className="scale-75" />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show CTA Button</Label>
          <Switch checked={showCta} onCheckedChange={setShowCta} className="scale-75" />
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Preview</Label>
        <div className={cn("grid gap-2", containerCount === 2 && "grid-cols-2", containerCount === 3 && "grid-cols-3", containerCount === 4 && "grid-cols-4")}>
          {Array.from({ length: containerCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-md border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground",
                cardStyle === "Large" && "h-28",
                cardStyle === "Medium" && "h-20",
                cardStyle === "Small" && "h-14"
              )}
            >
              Card {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" className="flex-1" disabled>
          Apply Layout
        </Button>
      </div>
    </div>
  );
}
