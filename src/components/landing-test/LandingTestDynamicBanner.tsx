import { useEffect, useRef } from "react";
import { T } from "@/lib/typography";
import { Button } from "@/components/ui/button";
import { BANNER_CONTRACT, BANNER_DEFAULTS, type BannerSlot } from "@/lib/bannerContracts";
import type { BannerData } from "@/lib/bannerContracts";
import { trackBannerEvent } from "@/lib/discoveryAnalytics";

interface Props {
  slot: "middle" | "lower";
  bannerData?: BannerData | null;
}

/**
 * Landing dynamic banner — locked to BANNER_CONTRACT dimensions.
 * Supports custom image or default content.
 * If bannerData.is_active === false, renders nothing (clean collapse).
 */
export function LandingTestDynamicBanner({ slot, bannerData }: Props) {
  const data = bannerData ?? BANNER_DEFAULTS[slot];
  const tracked = useRef(false);

  // Track banner impression once (hook must be before early return)
  useEffect(() => {
    if (!data.is_active) return;
    if (!tracked.current) {
      tracked.current = true;
      trackBannerEvent("impression", slot);
    }
  }, [slot, data.is_active]);

  const handleBannerClick = () => {
    trackBannerEvent("click", slot);
  };

  // Clean collapse: if banner is explicitly deactivated, render nothing
  if (!data.is_active) return null;

  const isMiddle = slot === "middle";

  // If a custom image is provided, render full-bleed image banner
  if (data.image_url) {
    return (
      <section className={BANNER_CONTRACT.marginClass}>
        <div
          className={`${BANNER_CONTRACT.radiusClass} overflow-hidden relative cursor-pointer`}
          style={{
            minHeight: BANNER_CONTRACT.minHeight,
            border: BANNER_CONTRACT.borderStyle,
          }}
          onClick={handleBannerClick}
        >
          <img
            src={data.image_url}
            alt={data.headline ?? `yangu ${slot} banner`}
            className="w-full h-full object-cover absolute inset-0"
            style={{ minHeight: BANNER_CONTRACT.minHeight }}
          />
          {/* Overlay with text if headline exists */}
          {data.headline && (
            <div className="relative z-10 p-10 md:p-14 flex items-center" style={{ minHeight: BANNER_CONTRACT.minHeight }}>
              <div className="max-w-md">
                <h2 className={`${T.header} text-white mb-3`}>{data.headline}</h2>
                {data.subheadline && (
                  <p className={`${T.subheader} mb-6`} style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {data.subheadline}
                  </p>
                )}
                {data.cta_text && (
                  <Button variant={isMiddle ? "dark-green" : "accent"} size="default">
                    {data.cta_text}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Default content banner (original design)
  return (
    <section className={BANNER_CONTRACT.marginClass}>
      <div
        className={`${BANNER_CONTRACT.radiusClass} overflow-hidden ${BANNER_CONTRACT.paddingClass} flex flex-col md:flex-row items-center gap-8`}
        style={{
          background: BANNER_CONTRACT.defaultBg,
          border: BANNER_CONTRACT.borderStyle,
          minHeight: BANNER_CONTRACT.minHeight,
        }}
      >
        <div className="flex-1">
          <h2 className={`${T.header} text-white mb-3`}>
            {data.headline ?? (isMiddle ? "yangu for enterprise" : "Meet yangu Treasury")}
          </h2>
          <p className={`${T.subheader} mb-6`} style={{ color: 'rgba(255,255,255,0.45)' }}>
            {data.subheadline ?? (isMiddle
              ? "yangu isn't just for the best solo entrepreneurs, it's also effective for enterprises."
              : "Earn up to 6% yield on your cash."
            )}
          </p>
          <Button variant={isMiddle ? "dark-green" : "accent"} size="default">
            {data.cta_text ?? (isMiddle ? "Learn more" : "Get started")}
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px] h-[200px] rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Dashboard preview
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
