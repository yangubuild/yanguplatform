import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Search, Loader2, MessageCircle, TrendingUp, Store, Sparkles } from "lucide-react";

const SUGGESTED_CATEGORIES = [
  "Fashion", "Beauty", "Fitness", "Food", "Tech",
  "Real Estate", "Gadgets", "Skincare", "Furniture", "Music",
];

interface Props {
  onSelectCreator?: (userId: string) => void;
}

export function MessagesInfluencersTab({ onSelectCreator }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["influencer-search", activeQuery],
    enabled: activeQuery.trim().length >= 2,
    queryFn: async () => {
      const q = activeQuery.trim().toLowerCase();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key, business_name, creator_type, country")
        .eq("account_status", "active")
        .or(`business_name.ilike.%${q}%,display_name.ilike.%${q}%,username.ilike.%${q}%,creator_type.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      setActiveQuery(searchQuery.trim());
    }
  };

  const handleCategoryClick = (cat: string) => {
    setSearchQuery(cat);
    setActiveQuery(cat);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 space-y-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by product, niche, or category..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}
          >
            Search
          </button>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors"
              style={{
                background: activeQuery.toLowerCase() === cat.toLowerCase()
                  ? "rgba(181,98,42,0.3)"
                  : "rgba(255,255,255,0.06)",
                color: activeQuery.toLowerCase() === cat.toLowerCase()
                  ? "#f59e0b"
                  : "rgba(255,255,255,0.5)",
                border: `1px solid ${activeQuery.toLowerCase() === cat.toLowerCase() ? "rgba(181,98,42,0.4)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {!activeQuery ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <Sparkles className="w-7 h-7" style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <p className="text-sm font-medium text-white">Discover Creators for Outreach</p>
            <p className="text-xs max-w-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Search by product, niche, or category to find creators and influencers you can message for marketing and collaboration.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
            <Store className="w-8 h-8" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm font-medium text-white/60">No creators found for "{activeQuery}"</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Try a different product, category, or niche keyword.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-medium px-1 pb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {results.length} creator{results.length !== 1 ? "s" : ""} found for "{activeQuery}"
            </p>
            {results.map((profile: any) => {
              const resolved = resolveAvatarUrl(profile);
              const name = profile.display_name || profile.username || "Creator";
              const initials = name.slice(0, 2).toUpperCase();

              return (
                <div
                  key={profile.id}
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                  >
                    {resolved ? (
                      <img src={resolved} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {profile.business_name && (
                        <span className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {profile.business_name}
                        </span>
                      )}
                      {profile.creator_type && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: "rgba(181,98,42,0.2)", color: "rgba(245,158,11,0.8)" }}
                        >
                          {profile.creator_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectCreator?.(profile.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}
                  >
                    <MessageCircle className="w-3 h-3" />
                    Message
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
