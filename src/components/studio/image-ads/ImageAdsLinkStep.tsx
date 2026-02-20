import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

import amazonIcon from "@/assets/platforms/amazon.jpg";
import ebayIcon from "@/assets/platforms/ebay.webp";
import appstoreIcon from "@/assets/platforms/appstore.png";
import googlePlayIcon from "@/assets/platforms/google-play.webp";
import yanguYIcon from "@/assets/platforms/yangu-y-orange.png";

const PLATFORMS = [
  { label: "Amazon", icon: amazonIcon },
  { label: "eBay", icon: ebayIcon },
  { label: "App Store", icon: appstoreIcon },
  { label: "Google Play", icon: googlePlayIcon },
  { label: "Yangu", icon: yanguYIcon },
];

const SAMPLE_URL =
  "https://www.amazon.com/Dokotoo-Pullover-Blouses-Sweatshirt-Fashion/dp/B0CFLQX8SW/ref=sr_1_39?crid=3V73CQLP8UMMM&dib=eyJ2IjoiMSJ9.ra-tvOpzZeHDU4sH-Rjeats60Q9mK0olJdK_Z9D9VoBtoi_7ppZ79pZX8_O3NdsRyDPaSRTHDUWFfy__Ln4SRj0C0O-MGHUhkrSeDzzdmMMj7fp81W6gXDioecupfGdD9QZY42ZnuUMSOv4vgiUz6hznx5HZ_LHI8v4GVwOtBUHNna8KnPu85X1nH7UOeWgCEDstFcuctc2Ply00esiRdS2TFTTmkSS4WdVaHgTcrPCste1wb3t228wHPIJDa_20uhfYHninSv_zyFEZRZ_yOIdkRQSYfxE9FcuNV5BtGixm65cwpBWLtPQ1DML-IWBd1JjgpaAv2tUHVrzCM2lMZaZRynF79c5mwj0wa9B34j3S_Qc6G02JMyS4t82rUBkwFwXctFcbsBxM-WzG5aIPcGXHWrRX84DzS5LNPsZxt4ciqiWWS_NENQEu-t7ApSDS._h_VP3a5Dndz95PzEP8YgRflswwEeMmBvjA5Xk5I6d8&dib_tag=se&keywords=Women%E2%80%99s+Fashion&qid=1734333214&sprefix=women+s+fashion%2Caps%2C575&sr=8-39";

interface Props {
  onSelectProduct: () => void;
  onManualSetup: () => void;
  onAnalyze: () => void;
}

export function ImageAdsLinkStep({ onSelectProduct, onManualSetup, onAnalyze }: Props) {
  const [url, setUrl] = useState("");

  const handleTryLink = () => {
    setUrl(SAMPLE_URL);
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 pt-24 pb-32 max-w-2xl mx-auto text-center gap-8">
      {/* Hero text */}
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
        Share your <span className="text-accent">product link</span> to generate Image Ads
      </h1>

      {/* Platform icons */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">yangu supports:</p>
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

      {/* URL input */}
      <div className="w-full space-y-2">
        <div className="relative">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. amazon product link, shopify product link, app store link, etc."
            className="h-14 rounded-xl bg-card border-border/60 text-base px-5 pr-32 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            onClick={handleTryLink}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-accent text-sm font-medium hover:underline"
          >
            Try some link?
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 w-full">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl border-border/60 text-sm font-semibold transition-all hover:border-transparent hover:text-white"
          style={{ '--hover-bg': 'linear-gradient(135deg, #b5651d 0%, #8b4513 100%)' } as React.CSSProperties}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #b5651d 0%, #8b4513 100%)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
          onClick={onSelectProduct}
        >
          Choose existing product
        </Button>
        <Button
          className="flex-1 h-12 rounded-xl text-sm font-semibold text-white border-0 hover:brightness-110 hover:shadow-lg transition-all"
          style={{ background: "linear-gradient(135deg, #b5651d 0%, #8b4513 100%)" }}
          disabled={!url.trim()}
          onClick={() => url.trim() && onAnalyze()}
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
