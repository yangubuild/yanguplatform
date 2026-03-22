import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PLATFORM_REGISTRY } from "@/lib/socialPlatformRegistry";
import { ICON_MAP } from "@/lib/app-store/icon-map";

/**
 * Resolve icon for a slug by checking socialPlatformRegistry first, then icon-map.
 * Returns the imported asset path or null.
 */
function resolveIcon(slug: string): string | null {
  // Normalize slug variants
  const normalizedSlug = slug === "twitter" ? "x" : slug;

  // 1. Check socialPlatformRegistry (source of truth for social icons)
  const platform = PLATFORM_REGISTRY.find(
    (p) => p.id === normalizedSlug || p.id === slug || p.aliases.includes(slug)
  );
  if (platform?.icon) return platform.icon;

  // 2. Check app-store icon-map
  if (ICON_MAP[slug]) return ICON_MAP[slug];
  if (ICON_MAP[normalizedSlug]) return ICON_MAP[normalizedSlug];

  return null;
}
const ALLOWED_SOCIAL_SLUGS = new Set([
  "zoom", "google-meet", "discord", "telegram", "whatsapp",
  "slack", "signal", "skype", "viber", "line",
  "twitter", "x", "facebook", "instagram", "linkedin",
  "tiktok", "youtube", "snapchat", "reddit", "twitch",
]);

const SOCIAL_CATEGORY = "communication";

interface AppRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  short_description: string | null;
  category: string;
}

// Fallback static list when no matching apps exist in app_registry
const FALLBACK_APPS: AppRow[] = [
  { id: "whatsapp", name: "WhatsApp", slug: "whatsapp", icon: null, short_description: "End-to-end encrypted messaging", category: "communication" },
  { id: "twitter", name: "Twitter / X", slug: "twitter", icon: null, short_description: "Social media & broadcasting", category: "communication" },
  { id: "telegram", name: "Telegram", slug: "telegram", icon: null, short_description: "Cloud-based messaging", category: "communication" },
  { id: "discord", name: "Discord", slug: "discord", icon: null, short_description: "Community voice & text chat", category: "communication" },
  { id: "zoom", name: "Zoom", slug: "zoom", icon: null, short_description: "Video meetings & calls", category: "communication" },
  { id: "google-meet", name: "Google Meet", slug: "google-meet", icon: null, short_description: "Video conferencing by Google", category: "communication" },
  { id: "instagram", name: "Instagram", slug: "instagram", icon: null, short_description: "Photo & video sharing", category: "communication" },
  { id: "tiktok", name: "TikTok", slug: "tiktok", icon: null, short_description: "Short-form video platform", category: "communication" },
  { id: "youtube", name: "YouTube", slug: "youtube", icon: null, short_description: "Video hosting & streaming", category: "communication" },
  { id: "linkedin", name: "LinkedIn", slug: "linkedin", icon: null, short_description: "Professional networking", category: "communication" },
];

export function AddAppPanel() {
  const [search, setSearch] = useState("");

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["profile-social-apps"],
    queryFn: async (): Promise<AppRow[]> => {
      const { data, error } = await supabase
        .from("app_registry")
        .select("id, name, slug, icon, short_description, category")
        .eq("status", "active");
      if (error) throw error;

      const socialApps = (data ?? []).filter(
        (app) =>
          ALLOWED_SOCIAL_SLUGS.has(app.slug) ||
          app.category === SOCIAL_CATEGORY
      );

      // Always include fallback social apps, merging with any DB matches
      const slugsFromDb = new Set(socialApps.map((a) => a.slug));
      const merged = [
        ...socialApps,
        ...FALLBACK_APPS.filter((f) => !slugsFromDb.has(f.slug)),
      ];

      return merged as AppRow[];
    },
  });

  const filtered = search.trim()
    ? apps.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : apps;

  const handleAddApp = (app: AppRow) => {
    if (
      !ALLOWED_SOCIAL_SLUGS.has(app.slug) &&
      app.category !== SOCIAL_CATEGORY
    ) {
      toast.error(
        "This app cannot be added to profile page. Only networking/social apps are allowed here."
      );
      return;
    }
    toast.success(`${app.name} added to your profile`);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-foreground">Add App</span>
      </div>

      <div className="px-3 py-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Search className="w-4 h-4" className="text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search networking apps..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="px-4 py-2">
        <p className="text-[11px]" className="text-muted-foreground">
          Only networking & social apps can be added to your profile page.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" className="text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs py-8" className="text-muted-foreground">
            No apps found
          </p>
        ) : (
          filtered.map((app) => {
            const icon = resolveIcon(app.slug) || (app.icon ?? null);
            return (
              <div
                key={app.id}
                className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.1)", }}
                >
                  {icon ? (
                    <img src={icon} alt={app.name} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    app.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
                  {app.short_description && (
                    <p className="text-xs truncate" className="text-muted-foreground">
                      {app.short_description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAddApp(app)}
                  className="px-3 py-1 rounded-md text-xs font-semibold shrink-0"
                  style={{ background: "#22c55e", }}
                >
                  Add
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
