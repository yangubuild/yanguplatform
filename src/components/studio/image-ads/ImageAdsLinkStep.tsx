import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const PLATFORMS = [
  { label: "Amazon", initials: "A", bg: "bg-orange-600" },
  { label: "Shopify", initials: "S", bg: "bg-green-600" },
  { label: "Etsy", initials: "E", bg: "bg-orange-500" },
  { label: "eBay", initials: "eB", bg: "bg-blue-600" },
  { label: "Alibaba", initials: "Al", bg: "bg-orange-700" },
  { label: "Google Play", initials: "GP", bg: "bg-emerald-600" },
  { label: "WordPress", initials: "W", bg: "bg-sky-600" },
  { label: "Webflow", initials: "Wf", bg: "bg-indigo-600" },
];

interface Props {
  onSelectProduct: () => void;
  onManualSetup: () => void;
}

export function ImageAdsLinkStep({ onSelectProduct, onManualSetup }: Props) {
  const [url, setUrl] = useState("");

  return (
    <div className="flex flex-col items-center justify-center px-6 pt-12 pb-32 max-w-2xl mx-auto text-center gap-8">
      {/* Hero text */}
      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Share your <span className="text-accent">product link</span> to generate Image Ads
        </h1>
      </div>

      {/* Platform icons */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Creatify supports:</p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {PLATFORMS.map((p) => (
            <div
              key={p.label}
              className={`${p.bg} h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
              title={p.label}
            >
              {p.initials}
            </div>
          ))}
          <span className="text-muted-foreground text-lg font-bold">…</span>
        </div>
      </div>

      {/* URL input */}
      <div className="w-full space-y-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g. amazon product link, shopify product link, app store link, etc."
          className="h-14 rounded-xl bg-card border-border/60 text-base px-5"
        />
        <p className="text-xs text-right">
          <button className="text-accent hover:underline font-medium">Try some link?</button>
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 w-full">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl border-border/60 text-sm font-semibold"
          onClick={onSelectProduct}
        >
          Choose existing product
        </Button>
        <Button
          className="flex-1 h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold"
          disabled={!url.trim()}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Analyze URL
        </Button>
      </div>

      {/* Manual link */}
      <p className="text-sm text-muted-foreground">
        You can also{" "}
        <button onClick={onManualSetup} className="text-accent hover:underline font-semibold">
          add product manually
        </button>
      </p>
    </div>
  );
}
