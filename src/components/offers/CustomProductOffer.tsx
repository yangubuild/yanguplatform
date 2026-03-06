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
    <div className="space-y-2 mt-2">
      {/* ─── Signature Product section (compact promo card) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 min-w-0">
        {/* Left: Text */}
        <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col justify-center min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-foreground leading-snug">
            Have your own{" "}
            <span className="text-[#b5622a]">Signature Product</span>{" "}
            created in 7 days.
          </h2>
          <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed max-w-xs">
            We transform your idea into a world-class digital asset without you writing a single word.
          </p>
          <div className="mt-2.5 flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => navigate("/dashboard/offers/custom-product")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#b5622a] to-[#5c2a12] text-white font-semibold text-[10px] hover:opacity-90 transition-opacity"
            >
              Get Your Own Product
              <ArrowRight className="w-3 h-3" />
            </button>
            <span className="text-[9px] text-muted-foreground font-medium tracking-wide uppercase">
              150+ Happy Customers
            </span>
          </div>
        </div>

        {/* Right: Scrolling book covers */}
        <div className="rounded-xl border border-border bg-card px-2 py-2 overflow-hidden flex flex-col justify-center gap-1.5 min-w-0">
          <ScrollingRow images={ROW1} direction="left" speed={30} />
          <ScrollingRow images={ROW2} direction="right" speed={35} />
          <ScrollingRow images={ROW3} direction="left" speed={28} />
        </div>
      </div>

      {/* ─── "We handle it all" process section ──────── */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#b5622a]/30 text-[#b5622a] text-[9px] font-semibold">
              <Zap className="w-2 h-2" />
              ZERO WORK
            </span>
            <h3 className="text-xs font-bold text-foreground mt-1">We handle it all.</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">You just approve the results.</p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap flex-1 justify-center sm:justify-end">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.label}
                className="flex flex-col items-center gap-1 group cursor-default"
              >
                <div className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center transition-all duration-300 group-hover:border-[#b5622a]/40">
                  <div className="scale-[0.55]">{step.icon}</div>
                </div>
                <span className="text-[8px] font-semibold tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stats row ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border px-3 py-2 flex items-center justify-between ${
              stat.highlight
                ? "border-[#b5622a]/40 bg-card"
                : "border-border bg-card"
            }`}
          >
            <div>
              <p
                className={`text-xs font-bold ${
                  stat.highlight ? "text-[#b5622a]" : "text-foreground"
                }`}
              >
                {stat.value}
              </p>
              <p className="text-[8px] font-semibold tracking-widest text-muted-foreground uppercase">
                {stat.label}
              </p>
            </div>
            {React.cloneElement(stat.icon, { className: "w-3.5 h-3.5" })}
          </div>
        ))}
      </div>

      {/* ─── Testimonial ─────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="max-w-md mx-auto text-center">
          <span className="text-lg text-muted-foreground/40 font-serif">"</span>
          <blockquote className="text-foreground text-[11px] leading-relaxed italic">
            You have saved us bunch of work. The effort and attention to detail truly shine through.
          </blockquote>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-foreground">
              FP
            </div>
            <div className="text-left">
              <p className="text-[10px] font-semibold text-foreground">Filip Pesek</p>
              <p className="text-[9px] text-muted-foreground">CEO, DonnaPro</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CTA ─────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-semibold text-[#b5622a] tracking-wide">Limited Offer</span>
            <h3 className="text-xs font-bold text-foreground mt-0.5">Claim your authority.</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Get a fully produced, world-class digital asset in 7 days.
            </p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {["Strategy", "Copywriting", "Design", "Launch"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full border border-border text-[9px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-[9px] text-muted-foreground mb-0.5">Starting at</p>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-foreground">$299</span>
              <span className="text-[10px] text-muted-foreground line-through">$399</span>
            </div>
            <button
              onClick={() => navigate("/dashboard/offers/custom-product")}
              className="mt-1.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#b5622a] to-[#5c2a12] text-white font-semibold text-[10px] hover:opacity-90 transition-opacity"
            >
              Get Started
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
