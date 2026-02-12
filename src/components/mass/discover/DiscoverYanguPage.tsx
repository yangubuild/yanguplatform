import { useState } from "react";
import { 
  MessageSquare, Video, Users, BookOpen, Gift, FileText, 
  Calendar, Layout, Send, Radio, ChevronDown, ChevronUp,
  Store, CreditCard, BarChart3, Smartphone, Clock, Shield,
  Sparkles, Zap, Globe, TrendingUp, Heart, Star
} from "lucide-react";
import yanguYIcon from "@/assets/yangu-y-icon.png";
import yanguLogoFull from "@/assets/yangu-logo-full.png";

/* ── Stats Counter ── */
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-6">
      <div className="text-2xl md:text-3xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/50 mt-1">{label}</div>
    </div>
  );
}

/* ── App Icon Chip ── */
function AppChip({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active 
          ? "bg-[#F46D2A] text-white" 
          : "bg-[#152A20] text-white/70 hover:bg-[#1a3528] hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/* ── Business Model Card ── */
function BusinessModelCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div 
      className="rounded-2xl p-6 transition-all hover:scale-[1.02] cursor-pointer"
      style={{
        background: "linear-gradient(135deg, #152A20 0%, #0f1f17 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(244, 109, 42, 0.15)" }}>
        <Icon className="w-5 h-5 text-[#F46D2A]" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

/* ── Tool Feature Card ── */
function ToolCard({ icon: Icon, title, description, highlight }: { icon: any; title: string; description: string; highlight?: boolean }) {
  return (
    <div 
      className="rounded-2xl p-6 flex flex-col gap-3"
      style={{
        background: highlight 
          ? "linear-gradient(135deg, rgba(244,109,42,0.12) 0%, rgba(15,31,23,1) 100%)" 
          : "linear-gradient(135deg, #152A20 0%, #0f1f17 100%)",
        border: highlight ? "1px solid rgba(244,109,42,0.2)" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: highlight ? "rgba(244,109,42,0.2)" : "rgba(255,255,255,0.06)" }}>
        <Icon className={`w-5 h-5 ${highlight ? "text-[#F46D2A]" : "text-white/60"}`} />
      </div>
      <h3 className="text-white font-semibold">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

/* ── FAQ Item ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div 
      className="border-b border-white/8 py-5 cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium text-[15px]">{question}</h3>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </div>
      {open && (
        <p className="text-white/50 text-sm mt-3 leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

/* ── App Details Data ── */
const apps = [
  { icon: MessageSquare, label: "Chat", title: "Chat", description: "Talk to all of your community members in a live group chat.", features: ["Group messaging", "Private tiers", "Free or paid"] },
  { icon: Video, label: "Livestreams", title: "Livestreams", description: "Go live with your audience and engage in real-time.", features: ["HD streaming", "Chat overlay", "Recordings"] },
  { icon: Users, label: "Forums", title: "Forums", description: "Build threaded discussions for deeper community engagement.", features: ["Topic threads", "Moderation", "Pinned posts"] },
  { icon: BookOpen, label: "Courses", title: "Courses", description: "Create and sell structured educational content.", features: ["Video lessons", "Quizzes", "Certificates"] },
  { icon: Gift, label: "Content rewards", title: "Content Rewards", description: "Reward your most engaged community members.", features: ["Points system", "Badges", "Leaderboards"] },
  { icon: FileText, label: "Files", title: "Files", description: "Share downloadable resources with your audience.", features: ["Secure hosting", "Download tracking", "Version control"] },
  { icon: Calendar, label: "Calendar bookings", title: "Calendar Bookings", description: "Let customers book time with you directly.", features: ["Auto scheduling", "Reminders", "Timezone support"] },
  { icon: Layout, label: "Content", title: "Content", description: "Publish gated content for your subscribers.", features: ["Rich editor", "Media embeds", "Access tiers"] },
];

/* ── Business Models Data ── */
const businessModels = [
  { icon: BookOpen, title: "Coaching & Courses", description: "Sell knowledge through structured courses, 1:1 coaching, and group mentorship programs." },
  { icon: Users, title: "Paid Communities", description: "Build exclusive communities with gated access, premium content, and member-only perks." },
  { icon: Zap, title: "Agencies", description: "Manage clients, deliver services, and scale your agency with built-in tools." },
  { icon: Globe, title: "Software", description: "Distribute and monetize your software products with licensing and access management." },
  { icon: TrendingUp, title: "Platforms", description: "Launch your own marketplace or platform and earn from every transaction." },
];

/* ── FAQ Data ── */
const faqs = [
  { question: "What can I sell on Yangu?", answer: "You can sell almost anything digital — courses, coaching, community access, software, templates, services, and more. Yangu supports a wide range of business models from solo creators to full agencies." },
  { question: "Why should I use Yangu?", answer: "Yangu provides an all-in-one platform to build, market, and scale your online business. With built-in AI tools, live video, payments, and community features, you don't need to piece together multiple services." },
  { question: "How is Yangu different from other payment platforms?", answer: "Yangu isn't just a payment processor — it's a complete business platform. We handle payments, community, content delivery, marketing, and AI-powered growth tools all in one place." },
  { question: "How is Yangu different from other social networks?", answer: "Unlike social networks that monetize your attention, Yangu is designed to monetize your expertise. Every feature is built to help creators earn sustainable income from their knowledge and skills." },
  { question: "Can software developers use Yangu?", answer: "Absolutely. Yangu offers APIs, webhooks, CLI tools, and SDK access so developers can build custom integrations, distribute software, and create unique experiences on the platform." },
  { question: "Does Yangu charge a subscription fee?", answer: "No. Yangu is free to start with no monthly subscription. We only take a small percentage per transaction, so you only pay when you earn." },
  { question: "How does Yangu help with distribution?", answer: "Yangu's marketplace and discovery features help new customers find your products. Combined with built-in affiliate tools and SEO optimization, your reach grows organically." },
];

/* ── MAIN PAGE ── */
export function DiscoverYanguPage() {
  const [activeApp, setActiveApp] = useState(0);

  return (
    <div className="min-h-screen" style={{ background: "#08120D", fontFamily: "'Lufga', sans-serif" }}>
      {/* ─── Top Nav ─── */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-[1200px] mx-auto">
        <a href="/"><img src={yanguLogoFull} alt="Yangu" className="h-10" /></a>
        <div className="flex items-center gap-3">
          <a href="/auth/login" className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors">
            Sign in
          </a>
          <a 
            href="/auth/signup" 
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(90deg, #b5622a, #5c2a12)" }}
          >
            Start selling
          </a>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="text-center px-6 pt-16 pb-20 max-w-[900px] mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
          <span className="text-white">Our mission is to deliver </span>
          <span className="text-[#F46D2A]">everyone</span>
          <span className="text-white"> a sustainable </span>
          <span className="text-[#F46D2A]">income.</span>
        </h1>
        <p className="text-white/50 text-lg md:text-xl max-w-[600px] mx-auto mb-10 leading-relaxed">
          Paid groups, software, coaching, courses, services — whatever you sell, Yangu is where the internet does business.
        </p>
        <a 
          href="/auth/signup"
          className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
          style={{ background: "linear-gradient(90deg, #b5622a, #5c2a12)" }}
        >
          Start selling
        </a>
        <p className="text-white/30 text-sm mt-4">No subscription required</p>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="flex items-center justify-center gap-8 md:gap-16 py-10 border-y border-white/6 max-w-[800px] mx-auto mb-20">
        <StatItem value="$2.1B+" label="Made by sellers on Yangu" />
        <StatItem value="82K+" label="Sellers on Yangu" />
        <StatItem value="15M+" label="Users on Yangu" />
      </section>

      {/* ─── Supported Business Models ─── */}
      <section className="px-6 max-w-[1100px] mx-auto mb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Supported business models
        </h2>
        <p className="text-white/40 text-center mb-12 max-w-[500px] mx-auto">
          Whatever your business looks like, Yangu has the tools to help you grow.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessModels.map((model) => (
            <BusinessModelCard key={model.title} {...model} />
          ))}
        </div>
      </section>

      {/* ─── Build with Apps ─── */}
      <section className="px-6 max-w-[1100px] mx-auto mb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Build your product with Yangu apps
        </h2>
        <p className="text-white/40 text-center mb-10 max-w-[550px] mx-auto">
          Pick from powerful apps like chat, courses, livestreams and more — and instantly give your customers a home base.
        </p>

        {/* App chips row */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {apps.map((app, i) => (
            <AppChip key={app.label} icon={app.icon} label={app.label} active={i === activeApp} onClick={() => setActiveApp(i)} />
          ))}
        </div>

        {/* Active App Detail */}
        <div 
          className="rounded-2xl p-8 md:p-12 max-w-[800px] mx-auto"
          style={{
            background: "linear-gradient(135deg, #152A20 0%, #0f1f17 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,109,42,0.15)" }}>
              {(() => { const Icon = apps[activeApp].icon; return <Icon className="w-6 h-6 text-[#F46D2A]" />; })()}
            </div>
            <div>
              <h3 className="text-white text-xl font-bold">{apps[activeApp].title}</h3>
              <p className="text-white/50 text-sm mt-1">{apps[activeApp].description}</p>
            </div>
          </div>
          <ul className="space-y-2 mb-8">
            {apps[activeApp].features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-white/60 text-sm">
                <Star className="w-3.5 h-3.5 text-[#F46D2A]" />
                {f}
              </li>
            ))}
          </ul>
          <a 
            href="/auth/signup"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(90deg, #b5622a, #5c2a12)" }}
          >
            Get started
          </a>
        </div>
      </section>

      {/* ─── All Tools Section ─── */}
      <section className="px-6 max-w-[1100px] mx-auto mb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          All the tools you need to grow, all in one app
        </h2>
        <p className="text-white/40 text-center mb-12 max-w-[500px] mx-auto">
          From storefront to payments, everything you need is built in.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolCard icon={Store} title="My Store" description="Launch a high-converting store page in seconds. Showcase your products beautifully." highlight />
          <ToolCard icon={CreditCard} title="Payments" description="Accept payments in hundreds of countries with instant payouts and low fees." />
          <ToolCard icon={BarChart3} title="Affiliates" description="Track your sales in real time and access detailed user data and analytics." />
          <ToolCard icon={Smartphone} title="Mobile App" description="Do it all right from your pocket with the full-featured Yangu mobile app." />
          <ToolCard icon={Clock} title="Buy Now, Pay Later" description="Collect cash up front and enable your customers to pay over time." />
          <ToolCard icon={Shield} title="Dispute Fighter" description="Yangu automatically handles and fights disputes on your behalf." />
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section className="px-6 max-w-[600px] mx-auto mb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Yangu pricing
        </h2>
        <div 
          className="rounded-2xl p-10 text-center"
          style={{
            background: "linear-gradient(135deg, #152A20 0%, #0f1f17 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(244,109,42,0.12)" }}>
            <Sparkles className="w-8 h-8 text-[#F46D2A]" />
          </div>
          <div className="text-white/50 text-sm font-medium mb-2">Free to start</div>
          <div className="text-white text-4xl font-bold mb-1">$0<span className="text-lg font-normal text-white/40">/ Month</span></div>
          <p className="text-white/40 text-sm mb-8">Just 2.9% + $0.30 per transaction</p>
          
          <a 
            href="/auth/signup"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white w-full transition-all hover:brightness-110"
            style={{ background: "linear-gradient(90deg, #b5622a, #5c2a12)" }}
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
              <li key={item} className="flex items-center gap-3 text-white/60 text-sm">
                <Heart className="w-3.5 h-3.5 text-[#F46D2A] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="px-6 max-w-[700px] mx-auto mb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Frequently asked questions
        </h2>
        <div>
          {faqs.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="px-6 pb-20">
        <div 
          className="max-w-[900px] mx-auto rounded-2xl py-20 px-8 text-center"
          style={{
            background: "radial-gradient(ellipse at 40% 60%, #1a5c3a 0%, #0f3d2a 30%, #0a2e1e 50%, #0d1f15 70%, #0a1710 100%)",
          }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Start selling with Yangu.
          </h2>
          <a 
            href="/auth/signup"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(90deg, #b5622a, #5c2a12)" }}
          >
            Get started
          </a>
        </div>
      </section>

      {/* ─── Footer ─── */}
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
