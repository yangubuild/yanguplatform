import * as React from "react";
import { ArrowRight, Star, Clock, Shield, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const YANGU_ORANGE = "#b5622a";
const YANGU_ORANGE_LIGHT = "rgba(181, 98, 42, 0.1)";
const YANGU_ORANGE_BORDER = "rgba(181, 98, 42, 0.25)";
const YANGU_ORANGE_BORDER_35 = "rgba(181, 98, 42, 0.35)";
const YANGU_GRADIENT = "linear-gradient(135deg, #b5622a, #5c2a12)";

const BOOK_ROWS = [
  [
    "/images/custom-product-source/cover-1.jpg",
    "/images/custom-product-source/cover-2.jpg",
    "/images/custom-product-source/cover-3.jpg",
    "/images/custom-product-source/cover-4.jpg",
    "/images/custom-product-source/cover-1.jpg",
    "/images/custom-product-source/cover-2.jpg",
    "/images/custom-product-source/cover-3.jpg",
    "/images/custom-product-source/cover-4.jpg",
  ],
  [
    "/images/custom-product-source/cover-5.jpg",
    "/images/custom-product-source/cover-6.jpg",
    "/images/custom-product-source/cover-7.jpg",
    "/images/custom-product-source/cover-8.jpg",
    "/images/custom-product-source/cover-5.jpg",
    "/images/custom-product-source/cover-6.jpg",
    "/images/custom-product-source/cover-7.jpg",
    "/images/custom-product-source/cover-8.jpg",
  ],
  [
    "/images/custom-product-source/cover-9.jpg",
    "/images/custom-product-source/cover-10.jpg",
    "/images/custom-product-source/cover-11.jpg",
    "/images/custom-product-source/cover-12.jpg",
    "/images/custom-product-source/cover-9.jpg",
    "/images/custom-product-source/cover-10.jpg",
    "/images/custom-product-source/cover-11.jpg",
    "/images/custom-product-source/cover-12.jpg",
  ],
] as const;

const PROCESS_STEPS = [
  {
    label: "WRITING",
    icon: (
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" style={{ color: YANGU_ORANGE }}>
        <path d="M8 32C8 32 10 28 12 26L28 10C29.1 8.9 30.9 8.9 32 10C33.1 11.1 33.1 12.9 32 14L16 30C14 32 10 34 10 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 32L10 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "EDITING",
    icon: (
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" style={{ color: YANGU_ORANGE }}>
        <rect x="10" y="8" width="4" height="24" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="18" y="8" width="4" height="24" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="26" y="8" width="4" height="24" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "DESIGN",
    icon: (
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" style={{ color: YANGU_ORANGE }}>
        <rect x="8" y="8" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="20" y1="8" x2="20" y2="32" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="1.5" />
        <line x1="11" y1="11" x2="29" y2="29" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="29" y1="11" x2="11" y2="29" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    label: "LAUNCH READY",
    icon: (
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" style={{ color: YANGU_ORANGE }}>
        <path d="M20 6L20 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 12L20 6L26 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 34L20 28L28 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
] as const;

const STATS = [
  {
    value: "150+",
    label: "HAPPY CREATORS",
    icon: <Star className="h-5 w-5 text-muted-foreground" />,
    highlight: false,
  },
  {
    value: "7 Days",
    label: "TURNAROUND",
    icon: <Clock className="h-5 w-5" style={{ color: YANGU_ORANGE }} />,
    highlight: true,
  },
  {
    value: "100% Rights",
    label: "FULL OWNERSHIP",
    icon: <Shield className="h-5 w-5 text-muted-foreground" />,
    highlight: false,
  },
  {
    value: "Expert Team",
    label: "REAL HUMANS",
    icon: <Users className="h-5 w-5 text-muted-foreground" />,
    highlight: false,
  },
] as const;

function CoverRow({ images, rowIndex }: { images: readonly string[]; rowIndex: number }) {
  const reverse = rowIndex % 2 === 1;
  return (
    <div className="relative overflow-hidden">
      <div
        className="flex gap-2 w-max"
        style={{ animation: `${reverse ? "scroll-right" : "scroll-left"} 25s linear infinite` }}
      >
        {[...images, ...images].map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt={`Book cover ${rowIndex + 1}-${index + 1}`}
            className="h-full min-h-[118px] w-[120px] shrink-0 rounded-md object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

export function CustomProductOffer() {
  const navigate = useNavigate();

  return (
    <section className="mt-2 space-y-2.5">
      <div className="grid min-w-0 grid-cols-1 gap-2.5 lg:grid-cols-2">
        <div className="relative h-[280px] overflow-hidden rounded-2xl border border-border bg-card px-6 py-6 sm:h-[300px] sm:px-7 lg:h-[310px]">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border)/0.55)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.55)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="relative z-10 flex h-full flex-col items-start justify-center">
            <h2 className="max-w-[400px] text-2xl font-black leading-[1.12] text-foreground sm:text-[1.7rem]">
              Have your own <span style={{ color: YANGU_ORANGE }}>Signature Product</span> created in 7 days.
            </h2>
            <p className="mt-2.5 max-w-[380px] text-sm leading-relaxed text-muted-foreground">
              We transform your idea into a world-class digital asset without you writing a single word.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/dashboard/offers/custom-product")}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-foreground transition-opacity hover:opacity-90"
                style={{ background: YANGU_GRADIENT }}
              >
                Get Your Own Product
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[
                    "/images/custom-product-source/happy-1.avif",
                    "/images/custom-product-source/happy-2.avif",
                    "/images/custom-product-source/happy-3.avif",
                  ].map((avatarSrc, index) => (
                    <img
                      key={index}
                      src={avatarSrc}
                      alt={`Happy customer ${index + 1}`}
                      className="h-6 w-6 rounded-full border-2 border-card object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  150+ Happy Customers
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[280px] overflow-hidden rounded-2xl border border-border bg-card p-2.5 sm:h-[300px] sm:p-3 lg:h-[310px]">
          <div className="grid h-full grid-rows-3 gap-2">
            {BOOK_ROWS.map((row, rowIndex) => (
              <CoverRow key={rowIndex} images={row} rowIndex={rowIndex} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative h-[120px] overflow-hidden rounded-2xl border border-border bg-card px-4 py-2.5 sm:h-[125px]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border)/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.5)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative z-10 flex h-full items-center gap-5">
          <div className="shrink-0">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
              style={{ color: YANGU_ORANGE, backgroundColor: YANGU_ORANGE_LIGHT, borderWidth: 1, borderColor: YANGU_ORANGE_BORDER }}
            >
              <Zap className="h-2.5 w-2.5" />
              ZERO WORK
            </span>
            <h3 className="mt-1.5 text-2xl font-bold leading-none text-foreground">We handle it all.</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">You just approve the results.</p>
          </div>

          <div className="relative hidden h-full flex-1 items-center justify-between sm:flex">
            <div className="pointer-events-none absolute left-[10%] right-[8%] top-[46%] h-px bg-border" />
            {PROCESS_STEPS.map((step) => (
              <div key={step.label} className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
                  {React.cloneElement(step.icon, { width: 24, height: 24 })}
                </div>
                <span className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {STATS.map((stat) => {
          const isLongValue = stat.value.length > 7;

          return (
            <div
              key={stat.label}
              className={`h-[82px] rounded-2xl border px-4 py-3 sm:h-[88px]`}
              style={{
                background: "#ffffff",
                borderColor: stat.highlight ? YANGU_ORANGE_BORDER_35 : "rgba(0,0,0,0.08)" }}
            >
              <div className="flex h-full items-center justify-between gap-2">
                <div>
                  <p
                    className={`font-bold leading-none ${isLongValue ? "text-2xl" : "text-3xl"}`}
                    style={{ color: stat.highlight ? YANGU_ORANGE : "#1a1a1a" }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#888" }}>
                    {stat.label}
                  </p>
                </div>
                {React.cloneElement(stat.icon, { className: "h-5 w-5", style: { color: stat.highlight ? YANGU_ORANGE : "#999" } })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <div className="h-[200px] rounded-2xl border border-border bg-card px-6 py-5 sm:h-[210px] lg:h-[220px]">
          <div className="flex h-full flex-col justify-between">
            <div className="flex gap-1">
              {[...Array(5)].map((_, index) => (
                <Star key={index} className="h-4 w-4" style={{ color: YANGU_ORANGE, fill: YANGU_ORANGE }} />
              ))}
            </div>

            <blockquote className="text-lg leading-relaxed text-foreground">
              "You have saved us <span className="font-semibold" style={{ color: YANGU_ORANGE }}>bunch</span> of work. The effort and attention to detail truly shine through."
            </blockquote>

            <div className="flex items-center gap-3">
              <img
                src="/images/custom-product-source/testimonial.avif"
                alt="Filip Pesek"
                className="h-10 w-10 rounded-full object-cover"
                loading="lazy"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">Filip Pesek</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">CEO, DonnaPro</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[200px] rounded-2xl border border-border bg-foreground px-6 py-5 text-background sm:h-[210px] lg:h-[220px]">
          <span
            className="absolute right-4 top-4 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground"
            style={{ background: YANGU_GRADIENT }}
          >
            Limited Offer
          </span>

          <div className="flex h-full flex-col justify-between">
            <div>
              <h3 className="mt-1 text-3xl font-bold leading-none">Claim your authority.</h3>
              <p className="mt-2 text-sm text-background/75">
                Get a fully produced, world-class digital asset in 7 days.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Strategy", "Copywriting", "Design", "Launch"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-background/20 px-2.5 py-0.5 text-[10px] font-medium text-background/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-background/70">Starting at</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold leading-none">$299</span>
                  <span className="text-base text-background/60 line-through">$399</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/dashboard/offers/custom-product")}
                className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
                style={{ background: YANGU_GRADIENT }}
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
