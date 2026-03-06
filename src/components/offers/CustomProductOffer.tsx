import { ArrowRight, Star, Clock, Shield, Users, Zap } from "lucide-react";

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
            className="w-[120px] h-[170px] object-cover rounded-lg flex-shrink-0"
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
  return (
    <div className="space-y-5 mt-5">
      {/* ─── Hero section ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Text */}
        <div className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            Have your own{" "}
            <span className="text-[#b5622a]">Signature Product</span>{" "}
            created in 7 days.
          </h2>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed max-w-md">
            We transform your idea into a world-class digital asset without you writing a single word.
          </p>
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <a
              href="https://www.entrepedia.co/custom-product/wizard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#b5622a] to-[#5c2a12] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Get Your Own Product
              <ArrowRight className="w-4 h-4" />
            </a>
            <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              150+ Happy Customers
            </span>
          </div>
        </div>

        {/* Right: Scrolling book covers */}
        <div className="rounded-2xl border border-border bg-card p-4 overflow-hidden flex flex-col justify-center gap-2.5">
          <ScrollingRow images={ROW1} direction="left" speed={30} />
          <ScrollingRow images={ROW2} direction="right" speed={35} />
          <ScrollingRow images={ROW3} direction="left" speed={28} />
        </div>
      </div>

      {/* ─── "We handle it all" process section ──────── */}
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12">
          {/* Left label */}
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#b5622a]/30 text-[#b5622a] text-xs font-semibold mb-2">
              <Zap className="w-3 h-3" />
              ZERO WORK
            </span>
            <h3 className="text-xl font-bold text-foreground mt-2">We handle it all.</h3>
            <p className="text-sm text-muted-foreground mt-1">You just approve the results.</p>
          </div>

          {/* Process steps */}
          <div className="flex items-center gap-8 sm:gap-12 flex-wrap flex-1 justify-center sm:justify-end">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.label}
                className="flex flex-col items-center gap-3 group cursor-default"
              >
                <div className="w-16 h-16 rounded-full border border-border bg-card flex items-center justify-center transition-all duration-300 group-hover:border-[#b5622a]/40 group-hover:shadow-[0_0_20px_rgba(181,98,42,0.1)]">
                  {step.icon}
                </div>
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {step.label}
                </span>
                {/* Dot indicator */}
                <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-[#b5622a] transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stats row ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-5 flex items-center justify-between ${
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
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mt-0.5">
                {stat.label}
              </p>
            </div>
            {stat.icon}
          </div>
        ))}
      </div>

      {/* ─── Testimonial ─────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-3xl text-muted-foreground/40 font-serif">"</span>
          <blockquote className="text-foreground text-sm sm:text-base leading-relaxed italic mt-1">
            You have saved us bunch of work. The effort and attention to detail truly shine through.
          </blockquote>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
              FP
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Filip Pesek</p>
              <p className="text-xs text-muted-foreground">CEO, DonnaPro</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CTA ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-[#b5622a] tracking-wide">Limited Offer</span>
            <h3 className="text-xl font-bold text-foreground mt-1">Claim your authority.</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get a fully produced, world-class digital asset in 7 days.
            </p>
            <div className="flex gap-3 mt-3 flex-wrap">
              {["Strategy", "Copywriting", "Design", "Launch"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-xs text-muted-foreground mb-1">Starting at</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">$299</span>
              <span className="text-sm text-muted-foreground line-through">$399</span>
            </div>
            <a
              href="https://www.entrepedia.co/custom-product/wizard"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#b5622a] to-[#5c2a12] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
