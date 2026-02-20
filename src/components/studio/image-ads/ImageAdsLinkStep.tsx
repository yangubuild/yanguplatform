import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

import amazonIcon from "@/assets/platforms/amazon.jpg";
import ebayIcon from "@/assets/platforms/ebay.webp";
import appstoreIcon from "@/assets/platforms/appstore.png";
import googlePlayIcon from "@/assets/platforms/google-play.webp";
import yanguYIcon from "@/assets/platforms/yangu-y.png";

const PLATFORMS = [
  { label: "Amazon", icon: amazonIcon },
  { label: "eBay", icon: ebayIcon },
  { label: "App Store", icon: appstoreIcon },
  { label: "Google Play", icon: googlePlayIcon },
  { label: "Yangu", icon: yanguYIcon },
];

interface Props {
  onSelectProduct: () => void;
  onManualSetup: () => void;
}

export function ImageAdsLinkStep({ onSelectProduct, onManualSetup }: Props) {
  const [url, setUrl] = useState("");

  return (
    <div className="flex flex-col items-center justify-center px-6 pt-24 pb-32 max-w-2xl mx-auto text-center gap-8">
      {/* Hero text */}
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
        Share your <span className="text-accent">product link</span> to generate Image Ads
      </h1>

      {/* Platform icons */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Creatify supports:</p>
        <div className="flex items-center gap-2.5 justify-center">
          {PLATFORMS.map((p) => (
            <div
              key={p.label}
              className="h-9 w-9 rounded-full overflow-hidden bg-muted/40 flex items-center justify-center shrink-0"
              title={p.label}
            >
              <img src={p.icon} alt={p.label} className="h-full w-full object-cover" />
            </div>
          ))}
          <span className="text-muted-foreground text-lg font-bold tracking-wider">···</span>
        </div>
      </div>

      {/* URL input — "Try some link?" inside */}
      <div className="w-full space-y-2">
        <div className="relative">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. amazon product link, shopify product link, app store link, etc."
            className="h-14 rounded-xl bg-card border-border/60 text-base px-5 pr-32 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-accent text-sm font-medium hover:underline">
            Try some link?
          </button>
        </div>
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
          variant="accent"
          className="flex-1 h-12 rounded-xl text-sm font-semibold"
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
