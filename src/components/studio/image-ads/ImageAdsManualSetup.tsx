import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Plus, Lightbulb, ArrowLeft } from "lucide-react";

interface Props {
  onBack: () => void;
}

export function ImageAdsManualSetup({ onBack }: Props) {
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-6 pt-4 pb-40 space-y-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Card */}
      <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Set Up Your Image Ads</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in product info and we'll generate the copy and visuals.
          </p>
        </div>

        {/* Brand name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Brand / Product name</Label>
          <Input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Enter brand or product name"
            className="rounded-lg bg-background border-border/60"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Brand / Product description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your brand or product…"
            className="rounded-lg bg-background border-border/60 min-h-[100px]"
          />
        </div>

        {/* Image upload */}
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

          {/* Upload area */}
          <div className="border-2 border-dashed border-destructive/50 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-destructive/70 transition-colors">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Add assets</span>
          </div>

          {/* Action chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button className="rounded-full border border-border/40 bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              Select all
            </button>
            <button className="rounded-full border border-border/40 bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              Unselect all
            </button>
            <button className="rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
              Delete select
            </button>
          </div>

          {/* Validation */}
          {images.length === 0 && (
            <p className="text-xs text-destructive font-medium">
              Please choose at least one image to proceed.
            </p>
          )}
        </div>

        {/* Advanced settings */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
            />
            Advanced settings (Optional)
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            {/* Promotional info */}
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Promotional info</p>
                <p className="text-xs text-muted-foreground">
                  Add discount codes, offers, or special promotions.
                </p>
              </div>
              <Switch checked={promoEnabled} onCheckedChange={setPromoEnabled} />
            </div>

            {promoEnabled && (
              <Textarea
                placeholder="e.g. 20% OFF with code SUMMER2026"
                className="rounded-lg bg-background border-border/60"
              />
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
