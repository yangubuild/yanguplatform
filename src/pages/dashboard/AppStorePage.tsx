import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUp, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchApps, fetchCategories, installApp, getUserAppState } from "@/lib/app-store/queries";
import { ACTION_LABELS } from "@/lib/app-store/types";
import type { AppRegistryEntry } from "@/lib/app-store/types";
import { ICON_MAP, yanguBadge } from "@/lib/app-store/icon-map";
import { connectApp } from "@/lib/app-store/connect";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
            {filtered.map((app, idx) => (
              <AppCard key={app.id} app={app} index={idx} userId={user?.id ?? null} queryClient={queryClient} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Deterministic pseudo-random install stats per app */
const INSTALL_STATS: { amount: string; period: string }[] = [
  { amount: "₺ 1,898", period: "7 days" },
  { amount: "₺ 3,241", period: "30 days" },
  { amount: "₺ 812", period: "2 days" },
  { amount: "₺ 5,102", period: "30 days" },
  { amount: "₺ 1,456", period: "7 days" },
  { amount: "₺ 2,780", period: "14 days" },
  { amount: "₺ 634", period: "2 days" },
  { amount: "₺ 4,312", period: "30 days" },
  { amount: "₺ 1,120", period: "7 days" },
  { amount: "₺ 2,005", period: "14 days" },
  { amount: "₺ 920", period: "2 days" },
  { amount: "₺ 3,670", period: "30 days" },
  { amount: "₺ 1,540", period: "7 days" },
  { amount: "₺ 760", period: "2 days" },
  { amount: "₺ 2,340", period: "14 days" },
  { amount: "₺ 4,890", period: "30 days" },
  { amount: "₺ 1,230", period: "7 days" },
  { amount: "₺ 3,100", period: "14 days" },
  { amount: "₺ 560", period: "2 days" },
  { amount: "₺ 2,678", period: "30 days" },
];

function AppCard({ app, index, userId, queryClient }: { app: AppRegistryEntry; index: number; userId: string | null; queryClient: any }) {
  const icon = ICON_MAP[app.slug] || app.icon;
  const providerLine = app.is_native_yangu
    ? "yangu • Free to install"
    : `${app.provider_name} • Free to install`;
  const stats = INSTALL_STATS[index % INSTALL_STATS.length];

  const { data: installState } = useQuery({
    queryKey: ["app-install-state", userId, app.id],
    enabled: !!userId,
    queryFn: () => getUserAppState(userId!, app.id),
  });

  const [installing, setInstalling] = useState(false);
  const isInstalled = installState === "installed" || installState === "connected";

  const handleAdd = async () => {
    if (!userId) {
      toast.error("Please sign in to add apps");
      return;
    }
    if (isInstalled) return;
    setInstalling(true);
    try {
      await installApp(userId, app.id);
      queryClient.invalidateQueries({ queryKey: ["app-install-state", userId, app.id] });
      queryClient.invalidateQueries({ queryKey: ["my-apps"] });
      toast.success(`${app.name} added to My Apps`);

      // If app supports OAuth, trigger connect flow immediately
      if (app.supports_oauth) {
        const result = await connectApp(app.slug, "/dashboard/my-apps");
        if (!result.ok) {
          toast.error(result.error || "Connection not available yet");
        } else if (result.redirect) {
          // Direct connection (e.g. Stripe) — navigate
          queryClient.invalidateQueries({ queryKey: ["app-install-state"] });
          queryClient.invalidateQueries({ queryKey: ["my-apps"] });
          window.location.href = result.redirect;
        }
      }
    } catch {
      toast.error("Failed to add app");
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <img
          src={icon}
          alt={app.name}
          className="w-11 h-11 rounded-xl object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm leading-tight">{app.name}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            {app.is_native_yangu && (
              <img src={yanguBadge} alt="YANGU" className="w-3.5 h-3.5 object-contain" />
            )}
            <span className="text-[11px] text-white/35">{providerLine}</span>
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={isInstalled || installing}
          className="shrink-0 px-5 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-60 flex items-center gap-1.5"
          style={{
            background: isInstalled
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)",
          }}
        >
          {installing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isInstalled ? (
            <>
              <Check className="w-3 h-3" /> Added
            </>
          ) : (
            "Add"
          )}
        </button>
      </div>
      <p className="text-xs text-white/40 leading-relaxed line-clamp-1">
        {app.short_description || "No description yet."}
      </p>
      <span className="text-[10px] text-white/25">
        {stats.amount} installs in last {stats.period}
      </span>
    </div>
  );
}
