import interstitialBg from "@/assets/blog/interstitial-bg.jpg";
import appMail from "@/assets/blog/app-mail.png";
import appPodcasts from "@/assets/blog/app-podcasts.png";
import appSparkle from "@/assets/blog/app-sparkle.png";
import appSpiral from "@/assets/blog/app-spiral.png";
import appCora from "@/assets/blog/app-cora.png";
import appMonologue from "@/assets/blog/app-monologue.png";

const APP_ICONS = [
  { src: appMail, alt: "Mail" },
  { src: appPodcasts, alt: "Podcasts" },
  { src: appSparkle, alt: "Sparkle" },
  { src: appSpiral, alt: "Spiral" },
  { src: appCora, alt: "Cora" },
  { src: appMonologue, alt: "Monologue" },
];

export function BlogInterstitialBanner() {
  return (
    <section className="px-6 py-4">
      <div
        className="mx-auto overflow-hidden relative"
        style={{
          maxWidth: 1100,
          borderRadius: 16,
          minHeight: 340,
        }}
      >
        {/* Background image */}
        <img
          src={interstitialBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.85)" }}
        />

        {/* Content overlay */}
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-16">
          {/* Main headline */}
          <h2
            className="text-center leading-tight"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 400,
            }}
          >
            Ideas and <span style={{ fontStyle: "italic" }}>A</span>pps to Thrive in the AI Age
          </h2>

          {/* App icons row — half-cut at bottom */}
          <div className="flex items-end justify-center gap-3 sm:gap-5 mt-10 mb-0" style={{ transform: "translateY(calc(50% + 30px))" }}>
            {APP_ICONS.map((icon) => (
              <div
                key={icon.alt}
                className="transition-transform duration-200 hover:scale-105 hover:-translate-y-1"
                style={{ width: "clamp(64px, 10vw, 110px)" }}
              >
                <img
                  src={icon.src}
                  alt={icon.alt}
                  className="w-full h-auto"
                  style={{ borderRadius: "22%", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
