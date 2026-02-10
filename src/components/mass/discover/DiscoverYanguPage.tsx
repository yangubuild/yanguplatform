import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import yanguLogoFull from "@/assets/yangu-logo-full.png";
import yanguYIcon from "@/assets/yangu-y-icon.png";

/* ═══════════════════════════════════════════
   Animated Counter
   ═══════════════════════════════════════════ */
function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 2000;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-5xl font-bold text-white tabular-nums">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FAQ Item
   ═══════════════════════════════════════════ */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      className="w-full text-left border-b border-white/[0.08] py-6 group"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-[17px] font-medium text-white group-hover:text-white/90">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-white/40 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/40 flex-shrink-0" />
        )}
      </div>
      {open && (
        <p className="text-white/50 text-[15px] mt-4 leading-[1.6] pr-8">{answer}</p>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════
   App data
   ═══════════════════════════════════════════ */
const apps = [
  {
    icon: "/discover/icon-chat.webp",
    iconLg: "/discover/icon-chat-lg.webp",
    label: "Chat",
    title: "Chat",
    desc: "Talk to all of your community members in a live group chat.",
    features: ["Group messaging", "Private tiers", "Free or paid"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-livestreams.webp",
    label: "Livestreams",
    title: "Livestreams",
    desc: "Go live with your audience in HD. Engage with real-time chat, replays and recordings.",
    features: ["HD streaming", "Live chat overlay", "Automatic recordings"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-forums.webp",
    label: "Forums",
    title: "Forums",
    desc: "Build threaded discussions for deeper community engagement and knowledge sharing.",
    features: ["Topic threads", "Moderation tools", "Pinned posts"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-courses.webp",
    label: "Courses",
    title: "Courses",
    desc: "Create and sell structured educational content with video lessons and quizzes.",
    features: ["Video lessons", "Progress tracking", "Certificates"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-content-rewards.webp",
    label: "Content rewards",
    title: "Content Rewards",
    desc: "Reward your most engaged community members with points, badges and perks.",
    features: ["Points system", "Custom badges", "Leaderboards"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-files.webp",
    label: "Files",
    title: "Files",
    desc: "Share downloadable resources securely with your audience.",
    features: ["Secure hosting", "Download tracking", "Version control"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-calendar.webp",
    label: "Calendar bookings",
    title: "Calendar Bookings",
    desc: "Let customers book 1:1 or group sessions with you directly.",
    features: ["Auto scheduling", "Reminders", "Timezone support"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-content.webp",
    label: "Content",
    title: "Content",
    desc: "Publish gated content for your subscribers with a rich editor.",
    features: ["Rich editor", "Media embeds", "Access tiers"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-discord.webp",
    label: "Discord",
    title: "Discord",
    desc: "Gate access to your Discord server and manage roles automatically.",
    features: ["Role syncing", "Auto-invite", "Access revocation"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-telegram.webp",
    label: "Telegram",
    title: "Telegram",
    desc: "Monetize your Telegram groups and channels with gated access.",
    features: ["Auto-invite links", "Member management", "Payment gating"],
    preview: "/discover/preview-chat.webp",
  },
  {
    icon: "/discover/icon-events.webp",
    label: "Events",
    title: "Events",
    desc: "Host virtual or in-person events and sell tickets to your audience.",
    features: ["Ticketing", "Reminders", "Check-in system"],
    preview: "/discover/preview-chat.webp",
  },
];

/* Business models */
const businessModels = [
  { title: "Coaching and courses", href: "#" },
  { title: "Paid group", href: "#" },
  { title: "Agency", href: "#" },
  { title: "Software", href: "#" },
  { title: "Platforms", href: "#" },
];

/* Tools data */
const tools = [
  {
    title: "My store",
    desc: "Launch a high-converting store page in seconds.",
    mockup: (
      <div className="rounded-xl overflow-hidden bg-[#1a1a1a] p-4 h-[200px] flex flex-col gap-3">
        <div className="h-3 w-20 rounded bg-white/10" />
        <div className="flex-1 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 rounded-full bg-orange-500/30 mx-auto mb-2" />
            <div className="h-2 w-16 rounded bg-white/10 mx-auto" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Payments",
    desc: "Accept payments in hundreds of countries.",
    mockup: (
      <div className="rounded-xl overflow-hidden bg-[#1a1a1a] p-4 h-[200px] flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">New payment</span>
            <span className="text-white text-sm font-semibold">$760.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">New payment</span>
            <span className="text-white text-sm font-semibold">$341.50</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-16">
          {[40, 60, 35, 80, 55, 70, 90, 45, 65, 75, 50, 85].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-green-500/40" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Affiliates",
    desc: "Track your sales in real time and access user data.",
    mockup: (
      <div className="rounded-xl overflow-hidden bg-[#1a1a1a] p-4 h-[200px] flex flex-col justify-between">
        <div className="space-y-1">
          {["$10k", "$5k", "$2.5k", "$1k"].map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span className="text-white/30 text-[10px] w-8">{v}</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          ))}
        </div>
        <div className="h-16 relative">
          <svg viewBox="0 0 200 60" className="w-full h-full">
            <path d="M0,50 C30,45 50,30 80,25 C110,20 140,35 170,15 L200,10" fill="none" stroke="rgba(74,222,128,0.6)" strokeWidth="2" />
            <path d="M0,50 C30,45 50,30 80,25 C110,20 140,35 170,15 L200,10 L200,60 L0,60 Z" fill="url(#grad)" />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(74,222,128,0.2)" />
                <stop offset="100%" stopColor="rgba(74,222,128,0)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    ),
  },
  {
    title: "Mobile app",
    desc: "Do it all right from your pocket with the full-featured Yangu mobile app.",
    mockup: (
      <div className="rounded-xl overflow-hidden bg-[#1a1a1a] p-4 h-[200px] flex items-center justify-center">
        <div className="w-20 h-36 rounded-xl border border-white/10 bg-[#111] flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/30" />
          <div className="h-1.5 w-10 rounded bg-white/10" />
          <div className="h-1.5 w-8 rounded bg-white/5" />
        </div>
      </div>
    ),
  },
  {
    title: "Buy now, pay later",
    desc: "Collect cash up front and enable your customers to pay over time.",
    mockup: (
      <div className="rounded-xl overflow-hidden bg-[#1a1a1a] p-4 h-[200px] flex flex-col items-center justify-center gap-3">
        <div className="text-white/60 text-xs">Monetise</div>
        <div className="w-full max-w-[140px] rounded-lg bg-blue-500/20 py-3 text-center">
          <span className="text-white text-sm font-medium">Buy now</span>
        </div>
        <div className="w-full max-w-[140px] rounded-lg bg-white/5 py-3 text-center">
          <span className="text-white/60 text-sm">Buy now</span>
        </div>
      </div>
    ),
  },
  {
    title: "Dispute fighter",
    desc: "Yangu automatically handles and fights disputes on your behalf.",
    mockup: (
      <div className="rounded-xl overflow-hidden bg-[#1a1a1a] p-4 h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="h-2 w-20 rounded bg-white/10 mx-auto" />
        </div>
      </div>
    ),
  },
];

/* FAQ data */
const faqs = [
  { q: "What can I sell on Whop?", a: "You can sell almost anything digital — courses, coaching, community access, software, templates, services, and more. Yangu supports a wide range of business models from solo creators to full agencies." },
  { q: "Why should I use Whop?", a: "Yangu provides an all-in-one platform to build, market, and scale your online business. With built-in AI tools, live video, payments, and community features, you don't need to piece together multiple services." },
  { q: "How is Whop different than other payment platforms?", a: "Yangu isn't just a payment processor — it's a complete business platform. We handle payments, community, content delivery, marketing, and AI-powered growth tools all in one place." },
  { q: "How is Whop different than other social networks?", a: "Unlike social networks that monetize your attention, Yangu is designed to monetize your expertise. Every feature is built to help creators earn sustainable income from their knowledge and skills." },
  { q: "Can software developers use Whop?", a: "Absolutely. Yangu offers APIs, webhooks, CLI tools, and SDK access so developers can build custom integrations, distribute software, and create unique experiences on the platform." },
  { q: "Does Whop charge a subscription fee?", a: "No. Yangu is free to start with no monthly subscription. We only take a small percentage per transaction, so you only pay when you earn." },
  { q: "How does Whop help with distribution?", a: "Yangu's marketplace and discovery features help new customers find your products. Combined with built-in affiliate tools and SEO optimization, your reach grows organically." },
];

/* ═══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════ */
export function DiscoverYanguPage() {
  const [activeApp, setActiveApp] = useState(0);
  const [activeModel, setActiveModel] = useState(0);

  return (
    <div className="min-h-screen overflow-clip" style={{ background: "#08120D" }}>
      {/* ──────── NAV ──────── */}
      <nav className="relative z-20 flex items-center justify-between px-4 md:px-10 py-4 max-w-[1312px] mx-auto">
        <img src={yanguLogoFull} alt="Yangu" className="h-6" />
        <div className="hidden md:flex items-center gap-6 text-[14px] text-white/60">
          <a href="/community" className="hover:text-white transition-colors">Community</a>
          <a href="/why-yangu" className="hover:text-white transition-colors">Why Yangu</a>
          <a href="/ada-ai" className="hover:text-white transition-colors">Ada AI</a>
        </div>
        <div className="flex items-center gap-2">
          <a href="/auth/login" className="px-4 py-2 rounded-lg text-[14px] font-medium text-white border border-white/10 hover:bg-white/5 transition-colors">
            Sign in
          </a>
          <a href="/auth/signup" className="px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-[#F46D2A] hover:opacity-90 transition-opacity hidden sm:inline-block">
            Start selling
          </a>
        </div>
      </nav>

      <div className="flex flex-col gap-[160px] md:gap-[200px]">

        {/* ══════════════════════════════════════
           SECTION 1 — HERO
           ══════════════════════════════════════ */}
        <section className="max-w-[1312px] mx-auto px-4 md:px-10 mt-20 flex flex-col items-center text-center">
          <div className="max-w-[1250px] mx-auto">
            <h1 className="text-[40px] md:text-[80px] font-bold leading-[110%] text-balance text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
              Our mission is to deliver{" "}
              <span className="text-[#F46D2A]">everyone</span>{" "}
              a sustainable{" "}
              <span className="text-[#F46D2A]">income.</span>
            </h1>
          </div>
          <p className="text-white/50 mt-4 text-[18px] md:text-[24px] leading-[125%] text-balance max-w-[600px]">
            Paid groups, software, coaching, courses, services — whatever you sell, Yangu is where the internet does business.
          </p>
          <a
            href="/auth/signup"
            className="mt-8 inline-flex items-center justify-center rounded-xl px-8 py-4 text-[16px] font-semibold text-white bg-[#3578F7] hover:bg-[#2b6ae0] transition-colors"
          >
            Start selling
          </a>
          <p className="text-white/30 text-[14px] mt-3">No subscription required</p>

          {/* Hero image area — large rounded card */}
          <div className="mt-16 w-full max-w-[1100px] aspect-[16/9] rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #111 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/20 mx-auto mb-4 flex items-center justify-center">
                  <img src={yanguYIcon} alt="" className="w-12 h-12 opacity-60" />
                </div>
                <div className="text-white/80 text-xl font-semibold mb-1">YANGU</div>
                <div className="flex items-center justify-center gap-8 mt-4 text-white/40 text-sm">
                  <span>458 products</span>
                  <span>19.5M members</span>
                  <span>287 reviews</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
           SECTION 2 — STATS
           ══════════════════════════════════════ */}
        <section className="max-w-[1312px] mx-auto px-4 md:px-10 w-full">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <AnimatedCounter target={2600931795} prefix="$" />
              <p className="text-white/40 text-[13px] mt-2">Made by sellers on Yangu</p>
            </div>
            <div className="text-center">
              <AnimatedCounter target={181449} />
              <p className="text-white/40 text-[13px] mt-2">Sellers on Yangu</p>
            </div>
            <div className="text-center">
              <AnimatedCounter target={14044120} />
              <p className="text-white/40 text-[13px] mt-2">Users on Yangu</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
           SECTION 3 — SUPPORTED BUSINESS MODELS
           ══════════════════════════════════════ */}
        <section className="max-w-[1312px] mx-auto px-4 md:px-10 w-full">
          <h2 className="text-[32px] md:text-[48px] font-bold text-white text-center leading-[110%]">
            Supported business models
          </h2>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {businessModels.map((model, i) => (
              <button
                key={model.title}
                onClick={() => setActiveModel(i)}
                className={`px-6 py-3 rounded-xl text-[15px] font-medium transition-all ${
                  i === activeModel
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
                }`}
              >
                {model.title}
              </button>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
           SECTION 4 — BUILD WITH APPS
           ══════════════════════════════════════ */}
        <section className="max-w-[1312px] mx-auto px-4 md:px-10 w-full">
          <h2 className="text-[32px] md:text-[48px] font-bold text-white text-center leading-[110%]">
            Build your product with Yangu apps
          </h2>
          <p className="text-white/50 text-[18px] md:text-[20px] text-center mt-4 max-w-[600px] mx-auto leading-[140%]">
            Pick from thousands of apps, like chat, courses, livestreams and games — and instantly give your customers a home base.
          </p>

          {/* App chips row */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {apps.map((app, i) => (
              <button
                key={app.label}
                onClick={() => setActiveApp(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-medium transition-all ${
                  i === activeApp
                    ? "bg-white/[0.12] text-white ring-1 ring-white/20"
                    : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
                }`}
              >
                <img src={app.icon} alt="" className="w-5 h-5" />
                {app.label}
              </button>
            ))}
            <span className="flex items-center px-3 text-white/30 text-[14px]">+ More</span>
          </div>

          {/* Active app detail card */}
          <div className="mt-10 max-w-[960px] mx-auto grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Left — info */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <img src={apps[activeApp].icon} alt="" className="w-10 h-10" />
                <h3 className="text-white text-[22px] font-bold">{apps[activeApp].title}</h3>
              </div>
              <p className="text-white/50 text-[15px] leading-[1.6] mb-6">{apps[activeApp].desc}</p>
              <ul className="space-y-2 mb-8">
                {apps[activeApp].features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-white/60 text-[14px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-[14px] font-semibold text-white bg-[#3578F7] hover:bg-[#2b6ae0] transition-colors w-fit"
              >
                Get started
              </a>
            </div>
            {/* Right — preview */}
            <div className="relative hidden md:block">
              <img
                src={apps[activeApp].preview}
                alt={apps[activeApp].title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
           SECTION 5 — ALL TOOLS
           ══════════════════════════════════════ */}
        <section className="max-w-[1312px] mx-auto px-4 md:px-10 w-full">
          <h2 className="text-[32px] md:text-[48px] font-bold text-white text-center leading-[110%]">
            All the tools you need to grow, all in one app
          </h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <div
                key={tool.title}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {tool.mockup}
                <div className="p-5 pt-4">
                  <h3 className="text-white font-semibold text-[16px] mb-1">{tool.title}</h3>
                  <p className="text-white/40 text-[14px] leading-[1.5]">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
           SECTION 6 — PRICING
           ══════════════════════════════════════ */}
        <section className="max-w-[1312px] mx-auto px-4 md:px-10 w-full">
          <h2 className="text-[32px] md:text-[48px] font-bold text-white text-center leading-[110%]">
            Whop pricing
          </h2>
          <div className="mt-12 max-w-[480px] mx-auto rounded-2xl p-8 md:p-10 text-center" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}>
            <img src="/discover/liberty.svg" alt="" className="w-16 h-16 mx-auto mb-6 opacity-80" />
            <div className="text-white/50 text-[14px] font-medium mb-1">Free to start</div>
            <div className="text-white text-[48px] font-bold leading-none">
              $0<span className="text-[20px] font-normal text-white/40">/ Month</span>
            </div>
            <p className="text-white/40 text-[14px] mt-2 mb-8">Just 2.7% + $0.30 per transaction</p>
            <a
              href="/auth/signup"
              className="block w-full rounded-xl py-3.5 text-[15px] font-semibold text-white bg-[#3578F7] hover:bg-[#2b6ae0] transition-colors mb-8"
            >
              Start selling for free
            </a>
            <ul className="text-left space-y-3">
              {[
                "Accept payments and offer BNPL",
                "Host courses, chats, livestreams, and more",
                "Design store pages",
                "Get listed on the Yangu Marketplace",
                "Manage affiliates",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/60 text-[14px]">
                  <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ══════════════════════════════════════
           SECTION 7 — FAQ
           ══════════════════════════════════════ */}
        <section className="max-w-[1312px] mx-auto px-4 md:px-10 w-full">
          <h2 className="text-[32px] md:text-[48px] font-bold text-white text-center leading-[110%]">
            Frequently asked questions
          </h2>
          <div className="mt-12 max-w-[720px] mx-auto">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
           SECTION 8 — BOTTOM CTA
           ══════════════════════════════════════ */}
        <section className="max-w-[1312px] mx-auto px-4 md:px-10 w-full pb-20">
          <div className="rounded-2xl py-20 px-8 text-center relative overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}>
            <img src="/discover/car.svg" alt="" className="w-32 h-32 mx-auto mb-6 opacity-60" />
            <h2 className="text-[40px] md:text-[56px] font-bold text-white leading-[110%]">
              Start selling with Yangu.
            </h2>
            <a
              href="/auth/signup"
              className="mt-8 inline-flex items-center justify-center rounded-xl px-8 py-4 text-[16px] font-semibold text-white bg-[#3578F7] hover:bg-[#2b6ae0] transition-colors"
            >
              Get started
            </a>
          </div>
        </section>
      </div>

      {/* ──────── FOOTER ──────── */}
      <footer className="py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
          <span>©</span>
          <img src={yanguYIcon} alt="Yangu" className="w-4 h-4 opacity-50" />
          <span>yangu 2026</span>
        </div>
      </footer>
    </div>
  );
}
