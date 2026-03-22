import { useEffect, useRef } from "react";
import { T } from "@/lib/typography";
import { Button } from "@/components/ui/button";
import { BANNER_CONTRACT, BANNER_DEFAULTS, type BannerSlot } from "@/lib/bannerContracts";
import type { BannerData } from "@/lib/bannerContracts";
import { trackBannerEvent } from "@/lib/exploreAnalytics";
import enterpriseMachine from "@/assets/enterprise-yangu-machine.png";
import enterpriseCoin from "@/assets/enterprise-yangu-coin.png";
import treasuryWallet from "@/assets/treasury-yangu-wallet.png";
import treasuryLight from "@/assets/treasury-yangu-light.png";

interface Props {
  slot: "middle" | "lower";
  bannerData?: BannerData | null;
}

/**
 * Landing dynamic banner — locked to BANNER_CONTRACT dimensions.
 * slot="middle" = Enterprise banner with 3D illustration + coins.
 * slot="lower"  = Treasury banner (default content or custom image).
 */
export function LandingTestDynamicBanner({ slot, bannerData }: Props) {
  const data = bannerData ?? BANNER_DEFAULTS[slot];
  const tracked = useRef(false);

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

  if (!data.is_active) return null;

  const isMiddle = slot === "middle";

  // ── Enterprise banner (slot=middle): exact blueprint replica ──
  if (isMiddle && !data.image_url) {
    return (
      <section className={BANNER_CONTRACT.marginClass}>
        <div
          className={`${BANNER_CONTRACT.radiusClass} relative`}
          style={{
            background: BANNER_CONTRACT.defaultBg,
            border: BANNER_CONTRACT.borderStyle,
            minHeight: BANNER_CONTRACT.minHeight,
            overflow: "visible" }}>
          {/* Clip inner content for left/right edges but allow vertical overflow */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" style={{ zIndex: 0 }} />

          {/* Left text block */}
          <div className="relative z-10 p-6 sm:p-10 md:p-14 flex items-center" style={{ minHeight: BANNER_CONTRACT.minHeight }}>
            <div className="max-w-md">
              <h2
                className="text-foreground mb-3"
                style={{ fontSize: "36px", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
                {data.headline ?? "yangu for enterprise"}
              </h2>
              <p className={`${T.subheader} mb-8`} style={{ maxWidth: "340px" }}>
                {data.subheadline ?? "yangu isn't just for the best solo entrepreneurs, it's also effective for enterprises."}
              </p>
              <button
                className="px-7 py-2.5 rounded-lg text-foreground text-sm font-medium transition-all hover:brightness-110"
                style={{
                   background: "linear-gradient(135deg, #c47a3a 0%, #a0622e 50%, #5c2a12 100%)",
                   border: "none" }}>
                {data.cta_text ?? "Learn more"}
              </button>
            </div>
          </div>

          {/* Main 3D illustration — overflows top & bottom exactly like blueprint */}
          <div
            className="absolute hidden md:block pointer-events-none"
            style={{
              right: "-20px",
              top: "50%",
              transform: "translateY(-48%)",
              width: "400px",
              height: "440px",
              zIndex: 20 }}>
            <img
              src={enterpriseMachine}
              alt=""
              className="w-full h-full object-contain"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }}
            />
          </div>


          {/* Coin 2 — small, mid-right near illustration */}
          <div
            className="absolute hidden md:block pointer-events-none"
            style={{
              right: "420px",
              top: "42%",
              width: "44px",
              height: "44px",
              zIndex: 25 }}>
            <img src={enterpriseCoin} alt="" className="w-full h-full object-contain" />
          </div>

          {/* Coin 3 — largest, lower center, overflows bottom edge */}
          <div
            className="absolute hidden md:block pointer-events-none"
            style={{
              left: "50%",
              bottom: "-40px",
              transform: "translateX(-50%)",
              width: "100px",
              height: "100px",
              zIndex: 25 }}>
            <img src={enterpriseCoin} alt="" className="w-full h-full object-contain" />
          </div>
        </div>
      </section>
    );
  }

  // ── Custom image banner ──
  if (data.image_url) {
    return (
      <section className={BANNER_CONTRACT.marginClass}>
        <div
          className={`${BANNER_CONTRACT.radiusClass} overflow-hidden relative cursor-pointer`}
          style={{
            minHeight: BANNER_CONTRACT.minHeight,
            border: BANNER_CONTRACT.borderStyle }}
          onClick={handleBannerClick}>
          <img
            src={data.image_url}
            alt={data.headline ?? `yangu ${slot} banner`}
            className="w-full h-full object-cover absolute inset-0"
            style={{ minHeight: BANNER_CONTRACT.minHeight }}
          />
          {data.headline && (
            <div className="relative z-10 p-6 sm:p-10 md:p-14 flex items-center" style={{ minHeight: BANNER_CONTRACT.minHeight }}>
              <div className="max-w-md">
                <h2 className={`${T.header} text-foreground mb-3`}>{data.headline}</h2>
                {data.subheadline && (
                  <p className={`${T.subheader} text-muted-foreground mb-6`}>
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

  // ── Default content banner (lower / treasury) ──
  return (
    <section className={BANNER_CONTRACT.marginClass}>
      <div
        className={`${BANNER_CONTRACT.radiusClass} relative`}
        style={{
          background: BANNER_CONTRACT.defaultBg,
          border: BANNER_CONTRACT.borderStyle,
          minHeight: BANNER_CONTRACT.minHeight,
          overflow: "visible" }}>
        {/* Left text block — unchanged */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-14 flex items-center" style={{ minHeight: BANNER_CONTRACT.minHeight }}>
          <div className="flex-1 max-w-md">
            <h2 className={`${T.header} text-foreground mb-3`}>
              {data.headline ?? "Meet yangu Treasury"}
            </h2>
            <p className={`${T.subheader} text-muted-foreground mb-6`}>
              {data.subheadline ?? "Earn up to 6% yield on your cash."}
            </p>
            <Button variant="accent" size="default">
              {data.cta_text ?? "Get started"}
            </Button>
          </div>
        </div>

        {/* Wallet illustration — right side, matching blueprint */}
        <div
          className="absolute hidden md:block pointer-events-none"
          style={{
            right: "-30px",
            top: "-60px",
            width: "480px",
            height: "380px",
            zIndex: 15 }}>
          <img
            src={treasuryWallet}
            alt=""
            className="w-full h-full object-contain object-right-top"
            style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))" }}
          />
        </div>

        {/* Lightning icon — lower center, overflows bottom */}
        <div
          className="absolute hidden md:block pointer-events-none"
          style={{
            left: "50%",
            bottom: "-70px",
            transform: "translateX(-50%)",
            width: "130px",
            height: "200px",
            zIndex: 25 }}>
          <img
            src={treasuryLight}
            alt=""
            className="w-full h-full object-contain"
            style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.3))" }}
          />
        </div>
      </div>
    </section>
  );
}
