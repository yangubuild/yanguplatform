import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, Plus, Minus, Upload } from "lucide-react";
import { CategoryDropdown } from "./CategoryDropdown";

interface Props {
  onBack: () => void;
}

export function ImageAdsManualSetup({ onBack }: Props) {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [usps, setUsps] = useState(["", "", ""]);

  const updateUsp = (idx: number, val: string) => {
    const next = [...usps];
    next[idx] = val;
    setUsps(next);
  };

  const addUsp = () => {
    if (usps.length < 6) setUsps([...usps, ""]);
  };

  const removeUsp = (idx: number) => {
    if (usps.length > 1) setUsps(usps.filter((_, i) => i !== idx));
  };

  return (
    <div className="absolute inset-0 z-30 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">Setup your product</h2>
        </div>
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Basic Info</h3>
            <p className="text-sm text-muted-foreground">
              Core details that help us describe and highlight your product.
            </p>
          </div>

          {/* Product name + Category row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Product name</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
                className="rounded-lg bg-background border-border/60 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <CategoryDropdown value={category} onChange={setCategory} />
            </div>
          </div>

          {/* Product description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Product description</Label>
            <div className="relative">
              <Textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 5000) setDescription(e.target.value);
                }}
                placeholder="Describe your product…"
                className="rounded-lg bg-background border-border/60 min-h-[120px] outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                {description.length}/5000
              </span>
            </div>
          </div>

          {/* Selling Points / USPs */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Selling Points (USPs)</h3>
              <p className="text-sm text-muted-foreground">
                Highlight what makes your product unique.
              </p>
            </div>
            {usps.map((usp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium w-5 shrink-0">
                  {idx + 1}.
                </span>
                <Input
                  value={usp}
                  onChange={(e) => updateUsp(idx, e.target.value)}
                  placeholder={`Selling point ${idx + 1}`}
                  className="flex-1 rounded-lg bg-background border-border/60 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  onClick={() => removeUsp(idx)}
                  disabled={usps.length <= 1}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            ))}
            {usps.length < 6 && (
              <button
                onClick={addUsp}
                className="inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add selling point
              </button>
            )}
          </div>

          {/* Assets */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Assets</h3>
              <p className="text-sm text-muted-foreground">
                Upload product images for best results (3-5 recommended).
              </p>
            </div>
            <div className="border-2 border-dashed border-border/60 rounded-xl p-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-border transition-colors">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Click to upload or drag & drop
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-border/40 bg-background">
        <Button variant="outline" onClick={onBack} className="rounded-lg">
          Discard
        </Button>
        <Button variant="accent" className="rounded-lg">
          Create product
        </Button>
      </div>
    </div>
  );
}
