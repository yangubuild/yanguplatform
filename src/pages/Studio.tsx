import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ImageIcon,
  Copy,
  Users,
  Plus,
  Bookmark,
  ChevronRight,
  Coins,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/primitives";
import { useCredits } from "@/hooks/useCredits";
import { PromoPopup } from "@/components/promo/PromoPopup";
import { SocialUgcAdsSection } from "@/components/studio/SocialUgcAdsSection";
import { ImageAdsSection } from "@/components/studio/ImageAdsSection";
import { TopPerformingAdsSection } from "@/components/studio/TopPerformingAdsSection";
import { MetaTopAdsSection } from "@/components/studio/MetaTopAdsSection";

/* ─────────── data ─────────── */

const HERO_CARDS = [
  {
    id: "ai-video-ads",
    title: "AI VIDEO ADS",
    subtitle: "Turn product into video ads",
    badge: null,
    gradient: "from-amber-900/80 via-stone-900/60 to-stone-900/80",
  },
  {
    id: "avatar-video",
    title: "AVATAR VIDEO",
    subtitle: "Create talking videos with AI actors",
    badge: "AURORA MODEL",
    gradient: "from-indigo-900/80 via-purple-900/60 to-violet-900/80",
  },
  {
    id: "asset-generator",
    title: "ASSET GENERATOR",
    subtitle: "Generate high-quality ad assets instantly",
    badge: null,
    gradient: "from-emerald-900/80 via-teal-900/60 to-cyan-900/80",
  },
] as const;

const TOOL_CHIPS = [
  { id: "image-ads", label: "Image Ads", icon: ImageIcon, beta: false },
  { id: "ad-clone", label: "Ad Clone", icon: Copy, beta: true },
  { id: "create-avatar", label: "Create Your Own Avatar", icon: Users, beta: false },
  { id: "video-editor", label: "Video Editor", icon: Plus, beta: false },
] as const;

const TOP_ADS = [
  {
    id: "1",
    title: "Best for Services",
    description: "Hook your audience instantly. This collection uses ...",
    video: "/studio/topw-1.mp4",
  },
  {
    id: "2",
    title: "Show Your App",
    description: "A collection of recipes that showcases your apps, ...",
    video: "/studio/topw-5.mp4",
  },
  {
    id: "3",
    title: "Show Your Product",
    description: "A collection of recipes featuring your physical prod...",
    video: "/studio/topw-2.mp4",
  },
  {
    id: "4",
    title: "Billboards",
    description: "A collection of billboard scenes where you can put ...",
    video: "/studio/topw-3.mp4",
  },
  {
    id: "5",
    title: "Angry People",
    description: "A collection of ...",
    video: "/studio/topw-4.mp4",
  },
  {
    id: "6",
    title: "Creative Styles",
    description: "A collection of creative ad styles for your brand ...",
    video: "/studio/topw-6.mp4",
  },
] as const;

/* ─────────── page ─────────── */

export default function Studio() {
  const navigate = useNavigate();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <AppShell>
      <PromoPopup />
      <div className="min-h-screen bg-background">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-end px-6 pt-4 pb-2">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors"
            onClick={() => navigate("/billing")}
          >
            Upgrade
            <span className="inline-flex items-center gap-1 text-accent">
              {creditsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Coins className="h-3.5 w-3.5" />
                  {credits?.balance ?? 0}
                </>
              )}
            </span>
          </button>
        </div>

        {/* ── Content ── */}
        <div className="px-6 lg:px-10 pb-16 space-y-8">
          {/* ── Hero cards row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HERO_CARDS.map((card) => (
              <button
                key={card.id}
                className={`
                  relative overflow-hidden rounded-2xl aspect-[4/3] md:aspect-[16/10]
                  bg-gradient-to-br ${card.gradient}
                  flex flex-col justify-end p-6 text-left
                  group cursor-pointer transition-transform hover:scale-[1.01]
                `}
              >
                {/* badge */}
                {card.badge && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
                      <Sparkles className="h-3 w-3" />
                      {card.badge}
                    </span>
                  </div>
                )}

                {/* placeholder for video – user will add later */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  <h2
                    className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2"
                    style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
                  >
                    {card.title}
                    <ArrowRight className="h-5 w-5 opacity-80 group-hover:translate-x-1 transition-transform" />
                  </h2>
                  <p className="text-sm text-white/70 mt-1">{card.subtitle}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Tool chips row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TOOL_CHIPS.map((chip) => (
              <button
                key={chip.id}
                className="flex items-center gap-3 rounded-xl border border-border/40 bg-card px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
              >
                <chip.icon className="h-5 w-5 text-accent shrink-0" />
                <span>{chip.label}</span>
                {chip.beta && (
                  <span className="ml-auto rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                    Beta
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Top Ads of the Week ── */}
          <div className="space-y-4">
            {/* header */}
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-2"
                  style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
                >
                  TOP ADS OF THE WEEK
                  <span className="inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-bold text-accent">
                    AI
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Explore this week's top-performing ads — pick a favorite and recreate it instantly.
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <Bookmark className="h-4 w-4" />
                Saved
              </button>
            </div>

            {/* carousel */}
            <div className="relative">
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x"
              >
                {TOP_ADS.map((ad) => (
                  <div
                    key={ad.id}
                    className="shrink-0 w-[260px] md:w-[280px] snap-start cursor-pointer group"
                  >
                    <div className="rounded-2xl aspect-[4/3] bg-black mb-3 overflow-hidden">
                      <video
                        src={ad.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                      {ad.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {ad.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* scroll arrow */}
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/3 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card/90 border border-border/40 flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
          </div>

          {/* ── Social & UGC Ads ── */}
          <SocialUgcAdsSection />

          {/* ── Image Ads ── */}
          <ImageAdsSection />

          {/* ── Product Visual Effects ── */}
          <TopPerformingAdsSection />

          {/* ── Meta Top Ads ── */}
          <MetaTopAdsSection />
        </div>
        </div>
      </div>
    </AppShell>
  );
}
