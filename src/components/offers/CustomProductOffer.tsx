import * as React from "react";
import { ArrowRight, Star, Clock, Shield, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ── Cover image rows ────────────────────────────────────── */
const ROW1 = [
  "/images/covers/cover-1.jpg",
  "/images/covers/cover-2.jpg",
  "/images/covers/cover-3.jpg",
  "/images/covers/cover-4.jpg",
];
const ROW2 = [
  "/images/covers/cover-5.jpg",
  "/images/covers/cover-6.jpg",
  "/images/covers/cover-7.jpg",
  "/images/covers/cover-8.jpg",
];
const ROW3 = [
  "/images/covers/cover-9.jpg",
  "/images/covers/cover-10.jpg",
  "/images/covers/cover-11.jpg",
  "/images/covers/cover-12.jpg",
];

/* ── Scrolling row component ─────────────────────────────── */
function ScrollingRow({
  images,
  direction = "left",
  speed = 25,
}: {
  images: string[];
  direction?: "left" | "right";
  speed?: number;
}) {
  // duplicate for seamless loop
  const doubled = [...images, ...images];
  const animClass = direction === "left" ? "animate-scroll-left" : "animate-scroll-right";

  return (
    <div className="overflow-hidden w-full">
      <div
        className={`flex gap-2.5 ${animClass}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="w-[68px] h-[96px] object-cover rounded-md flex-shrink-0"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

/* ── Process step icons (SVG-like) ───────────────────────── */
const PROCESS_STEPS = [
  {
    label: "WRITING",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-[#b5622a]">
        <path d="M8 32C8 32 10 28 12 26L28 10C29.1 8.9 30.9 8.9 32 10C33.1 11.1 33.1 12.9 32 14L16 30C14 32 10 34 10 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 32L10 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "EDITING",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-[#b5622a]">
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
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-[#b5622a]">
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
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-[#b5622a]">
        <path d="M20 6L20 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 12L20 6L26 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 34L20 28L28 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

/* ── Stats row ───────────────────────────────────────────── */
const STATS = [
  { value: "150+", label: "HAPPY CREATORS", icon: <Star className="w-5 h-5 text-muted-foreground" />, highlight: false },
  { value: "7 Days", label: "TURNAROUND", icon: <Clock className="w-5 h-5 text-[#b5622a]" />, highlight: true },
  { value: "100% Rights", label: "FULL OWNERSHIP", icon: <Shield className="w-5 h-5 text-muted-foreground" />, highlight: false },
  { value: "Expert Team", label: "REAL HUMANS", icon: <Users className="w-5 h-5 text-muted-foreground" />, highlight: false },
];

/* ── Main component ──────────────────────────────────────── */
export function CustomProductOffer() {
  const navigate = useNavigate();
  return (
    <div className="space-y-2.5 mt-2">
      {/* ─── Signature Product + Books mosaic (paired square cards) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 min-w-0">
        {/* Left: Text card — compact near-square */}
        <div className="rounded-2xl border border-border bg-card px-6 py-6 flex flex-col justify-end min-w-0 aspect-[4/3] lg:aspect-auto lg:min-h-[260px] lg:max-h-[300px]">
          <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
            Have your own{" "}
            <span className="text-[#b5622a]">Signature Product</span>{" "}
            created in 7 days.
          </h2>
          <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed max-w-[280px]">
            We transform your idea into a world-class digital asset without you writing a single word.
          </p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate("/dashboard/offers/custom-product")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#b5622a] to-[#5c2a12] text-white font-semibold text-[11px] hover:opacity-90 transition-opacity"
            >
              Get Your Own Product
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
              150+ Happy Customers
            </span>
          </div>
        </div>

        {/* Right: Scrolling book covers — matched height card */}
        <div className="rounded-2xl border border-border bg-card px-2.5 py-3 overflow-hidden flex flex-col justify-center gap-2 min-w-0 lg:min-h-[260px] lg:max-h-[300px]">
          <ScrollingRow images={ROW1} direction="left" speed={30} />
          <ScrollingRow images={ROW2} direction="right" speed={35} />
          <ScrollingRow images={ROW3} direction="left" speed={28} />
        </div>
      </div>

      {/* ─── "We handle it all" process section ──────── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#b5622a]/30 text-[#b5622a] text-[9px] font-semibold">
              <Zap className="w-2.5 h-2.5" />
              ZERO WORK
            </span>
            <h3 className="text-sm font-bold text-foreground mt-1">We handle it all.</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">You just approve the results.</p>
          </div>

          <div className="flex items-center gap-5 sm:gap-8 flex-wrap flex-1 justify-center sm:justify-end">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.label}
                className="flex flex-col items-center gap-1.5 group cursor-default"
              >
                <div className="w-11 h-11 rounded-full border border-border bg-card flex items-center justify-center transition-all duration-300 group-hover:border-[#b5622a]/40">
                  <div className="scale-[0.6]">{step.icon}</div>
                </div>
                <span className="text-[8px] font-semibold tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stats row (compact dashboard cards) ─────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border px-4 py-4 flex items-center justify-between ${
              stat.highlight
                ? "border-[#b5622a]/40 bg-card"
                : "border-border bg-card"
            }`}
          >
            <div>
              <p
                className={`text-lg font-bold ${
                  stat.highlight ? "text-[#b5622a]" : "text-foreground"
                }`}
              >
                {stat.value}
              </p>
              <p className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase mt-0.5">
                {stat.label}
              </p>
            </div>
            {React.cloneElement(stat.icon, { className: "w-5 h-5" })}
          </div>
        ))}
      </div>

      {/* ─── Testimonial + CTA (paired square cards) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Left: Testimonial card */}
        <div className="rounded-2xl border border-border bg-card px-6 py-5 flex flex-col justify-between min-h-[200px]">
          {/* Stars */}
          <div className="flex gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-[#b5622a] text-[#b5622a]" />
            ))}
          </div>
          {/* Quote */}
          <blockquote className="text-foreground text-sm sm:text-base leading-relaxed flex-1">
            "You have saved us <span className="text-[#b5622a] font-semibold">bunch</span> of work. The effort and attention to detail truly shine through."
          </blockquote>
          {/* Avatar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
              FP
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Filip Pesek</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">CEO, DonnaPro</p>
            </div>
          </div>
        </div>

        {/* Right: CTA offer card — dark bg */}
        <div className="rounded-2xl border border-border bg-[#0c1a12] px-6 py-5 flex flex-col justify-between relative min-h-[200px]">
          {/* Limited Offer badge top-right */}
          <span className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-gradient-to-r from-[#b5622a] to-[#5c2a12] text-white text-[9px] font-bold uppercase tracking-wider">
            Limited Offer
          </span>
          {/* Title + subtitle */}
          <div>
            <h3 className="text-lg font-bold text-foreground mt-1">Claim your authority.</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Get a fully produced, world-class digital asset in 7 days.
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["Strategy", "Copywriting", "Design", "Launch"].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full border border-border text-[10px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {/* Pricing + CTA bottom row */}
          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Starting at</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">$299</span>
                <span className="text-sm text-muted-foreground line-through">$399</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/offers/custom-product")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#b5622a] to-[#5c2a12] text-white font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
