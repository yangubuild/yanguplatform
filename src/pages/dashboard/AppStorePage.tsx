import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchApps, fetchCategories } from "@/lib/app-store/queries";
import { ACTION_LABELS } from "@/lib/app-store/types";
import type { AppRegistryEntry } from "@/lib/app-store/types";

// --- App icon imports (uploaded brand logos) ---
import vlsIcon from "@/assets/app-icons/vls.jpg";
import visionboardIcon from "@/assets/app-icons/visionboard.jpg";
import visionaireIcon from "@/assets/app-icons/visionaire.jpg";
import foundawebIcon from "@/assets/app-icons/foundaweb.jpg";
import adaAiIcon from "@/assets/app-icons/ada-ai.jpg";
import yanguBadge from "@/assets/app-icons/yangu-badge.png";
// Generated icons
import livestreamIcon from "@/assets/app-icons/yangu-livestream.png";
import studioIcon from "@/assets/app-icons/yangu-studio.png";
import youtubeIcon from "@/assets/app-icons/youtube.png";
import telegramIcon from "@/assets/app-icons/telegram.png";
import zoomIcon from "@/assets/app-icons/zoom.png";
import googleMeetIcon from "@/assets/app-icons/google-meet.png";
import gmailIcon from "@/assets/app-icons/gmail.png";
import googleDriveIcon from "@/assets/app-icons/google-drive.png";
import notionIcon from "@/assets/app-icons/notion.png";
import discordIcon from "@/assets/app-icons/discord.png";
import tasksIcon from "@/assets/app-icons/tasks.png";
import hrAppIcon from "@/assets/app-icons/hr-app.png";
import personalBudgetingIcon from "@/assets/app-icons/personal-budgeting.png";
import salesMarketingIcon from "@/assets/app-icons/sales-marketing.png";
import logoCreatorIcon from "@/assets/app-icons/logo-creator.png";

/** Maps slug → local icon asset */
const ICON_MAP: Record<string, string> = {
  vls: vlsIcon,
  visionboard: visionboardIcon,
  visionaire: visionaireIcon,
  foundaweb: foundawebIcon,
  "ada-ai": adaAiIcon,
  "yangu-livestream": livestreamIcon,
  "yangu-studio": studioIcon,
  youtube: youtubeIcon,
  telegram: telegramIcon,
  zoom: zoomIcon,
  "google-meet": googleMeetIcon,
  gmail: gmailIcon,
  "google-drive": googleDriveIcon,
  notion: notionIcon,
  discord: discordIcon,
  tasks: tasksIcon,
  "hr-app": hrAppIcon,
  "personal-budgeting": personalBudgetingIcon,
  "sales-marketing": salesMarketingIcon,
  "logo-creator": logoCreatorIcon,
};

const SUGGESTION_CHIPS = [
  "Build a sales app",
  "Create HR app",
  "Add livestream app",
  "Build budgeting tool",
];

const CATEGORY_TABS = [
  { slug: "all", name: "All" },
  { slug: "yangu-native", name: "YANGU Native" },
  { slug: "business", name: "Business" },
  { slug: "finance", name: "Finance" },
  { slug: "productivity", name: "Productivity" },
  { slug: "communication", name: "Communication" },
  { slug: "ai-tools", name: "AI Tools" },
  { slug: "connectors", name: "Connectors" },
];

export default function AppStorePage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [prompt, setPrompt] = useState("");

  const { data: apps, isLoading } = useQuery({
    queryKey: ["app-registry-all"],
    queryFn: fetchApps,
  });

  const filtered = useMemo(() => {
    if (!apps) return [];
    if (activeCategory === "all") return apps;
    return apps.filter((a) => a.category === activeCategory);
  }, [apps, activeCategory]);

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#0F141A" }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-6 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <h1 className="text-white text-lg font-semibold">Add app</h1>
        </div>

        {/* AI Prompt Section */}
        <div className="text-center mb-4">
          <h2 className="text-white text-2xl font-bold mb-5">Create your own</h2>
          <div
            className="mx-auto max-w-[640px] rounded-2xl p-4 relative"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell YANGU to build an app for your work"
              rows={4}
              className="w-full bg-transparent text-white/80 text-sm placeholder:text-white/30 resize-none focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: prompt.trim()
                    ? "linear-gradient(135deg, #b5622a, #5c2a12)"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                <ArrowUp className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setPrompt(chip)}
              className="px-4 py-1.5 rounded-full text-xs text-white/60 transition-colors hover:text-white/80 hover:border-white/20"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Divider + Title */}
        <div
          className="mb-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        />
        <h3 className="text-white/50 text-sm font-medium mb-5">
          Or choose from the app store
        </h3>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                background:
                  activeCategory === cat.slug
                    ? "rgba(255,255,255,0.10)"
                    : "transparent",
                color:
                  activeCategory === cat.slug
                    ? "rgba(255,255,255,0.90)"
                    : "rgba(255,255,255,0.40)",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* App Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppCard({ app }: { app: AppRegistryEntry }) {
  const icon = ICON_MAP[app.slug] || app.icon;
  const actionLabel = ACTION_LABELS[app.action_type] || "Add";
  const providerLine = app.is_native_yangu
    ? "YANGU • Free to install"
    : `${app.provider_name} • Free to install`;

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 min-h-[160px]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Top row: icon + meta + button */}
      <div className="flex items-start gap-3">
        <img
          src={icon}
          alt={app.name}
          className="w-11 h-11 rounded-xl object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm leading-tight">
            {app.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            {app.is_native_yangu && (
              <img
                src={yanguBadge}
                alt="YANGU"
                className="w-3.5 h-3.5 rounded-sm object-cover"
              />
            )}
            <span className="text-[11px] text-white/35">{providerLine}</span>
          </div>
        </div>
        <button
          className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}
        >
          {actionLabel}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-white/40 leading-relaxed line-clamp-3">
        {app.short_description || "No description yet."}
      </p>
    </div>
  );
}
