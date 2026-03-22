import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Search, Loader2, MessageCircle, Store, Sparkles, Package, Wrench, ExternalLink, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CommerceItem } from "@/types/commerce";
import { truncateText } from "@/types/commerce";

const SUGGESTED_CATEGORIES = [
  "Fashion", "Beauty", "Fitness", "Food", "Tech",
  "Real Estate", "Gadgets", "Skincare", "Furniture", "Music",
];

interface Props {
  onSelectCreator?: (userId: string) => void;
}

export function MessagesInfluencersTab({ onSelectCreator }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Search creators (profiles)
  const { data: creatorResults = [], isLoading: creatorsLoading } = useQuery({
    queryKey: ["influencer-search", activeQuery],
    enabled: activeQuery.trim().length>= 2,
    queryFn: async () => {
      const q = activeQuery.trim().toLowerCase();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key, business_name, creator_type, country")
        .eq("account_status", "active")
        .or(`business_name.ilike.%${q}%,display_name.ilike.%${q}%,username.ilike.%${q}%,creator_type.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Search commerce objects (products/services/businesses)
  const { data: commerceResults = [], isLoading: commerceLoading } = useQuery({
    queryKey: ["commerce-search", activeQuery],
    enabled: activeQuery.trim().length>= 2,
    queryFn: async () => {
      const q = activeQuery.trim().toLowerCase();
      const { data, error } = await supabase
        .from("searchable_entities")
        .select("id, title, short_description, entity_type, primary_category, cover_image_url, slug, is_verified, domain_host, owner_user_id, tags")
        .eq("is_published", true)
        .eq("is_searchable", true)
        .or(`title.ilike.%${q}%,short_description.ilike.%${q}%,primary_category.ilike.%${q}%`)
        .order("trust_score", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []).map((e): CommerceItem => ({
        kind: e.entity_type === "service" ? "service" : "product",
        id: e.id,
        title: e.title,
        description: e.short_description,
        price_label: null,
        image_url: e.cover_image_url,
        owner_name: null,
        owner_avatar: null,
        category: e.primary_category,
        link: e.domain_host ? `https://${e.domain_host}` : (e.slug ? `/${e.entity_type}/${e.slug}` : null),
        slug: e.slug,
        is_verified: e.is_verified,
      }));
    },
  });

  const isLoading = creatorsLoading || commerceLoading;
  const hasResults = creatorResults.length> 0 || commerceResults.length> 0;

  const handleSearch = () => {
    if (searchQuery.trim().length>= 2) {
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
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by product, niche, or category..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold text-foreground shrink-0"
            style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}>
            Search
          </button>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
              style={{
                background: activeQuery.toLowerCase() === cat.toLowerCase()
                  ? "rgba(181,98,42,0.3)"
                  : "rgba(255,255,255,0.06)",
                color: activeQuery.toLowerCase() === cat.toLowerCase()
                  ? "#f59e0b"
                  : "rgba(255,255,255,0.5)",
                border: `1px solid ${activeQuery.toLowerCase() === cat.toLowerCase() ? "rgba(181,98,42,0.4)" : "rgba(255,255,255,0.06)"}` }}>
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
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Discover Creators & Products</p>
            <p className="text-xs max-w-xs text-muted-foreground">
              Search by product, niche, or category to find creators, products, and services for collaboration and commerce.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
            <Store className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No results for "{activeQuery}"</p>
            <p className="text-xs text-muted-foreground">
              Try a different product, category, or niche keyword.
            </p>
          </div>
        ) : (
          <>
            {/* Commerce results (products/services) */}
            {commerceResults.length> 0 && (
              <>
                <p className="text-[10px] font-medium px-1 pt-1 pb-0.5 text-muted-foreground">
                  {commerceResults.length} product{commerceResults.length !== 1 ? "s" : ""} & service{commerceResults.length !== 1 ? "s" : ""}
                </p>
                {commerceResults.map((item) => {
                  const isService = item.kind === "service";
                  const Icon = isService ? Wrench : Package;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                      onClick={() => {
                        if (item.link?.startsWith("http")) window.open(item.link, "_blank");
                        else if (item.link) navigate(item.link);
                      }}>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
                        ) : (
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          {item.is_verified && <ShieldCheck className="w-3 h-3 text-accent shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.category && (
                            <span className="text-[10px] truncate text-muted-foreground">
                              {item.category}
                            </span>
                          )}
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
                            style={{
                              background: isService ? "rgba(168,85,247,0.15)" : "rgba(96,165,250,0.15)",
                              color: isService ? "rgba(168,85,247,0.8)" : "rgba(96,165,250,0.8)" }}>
                            {isService ? "Service" : "Product"}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    </div>
                  );
                })}
              </>
            )}

            {/* Creator results */}
            {creatorResults.length> 0 && (
              <>
                <p className="text-[10px] font-medium px-1 pt-2 pb-0.5 text-muted-foreground">
                  {creatorResults.length} creator{creatorResults.length !== 1 ? "s" : ""} found
                </p>
                {creatorResults.map((profile: any) => {
                  const resolved = resolveAvatarUrl(profile);
                  const name = profile.display_name || profile.username || "Creator";
                  const initials = name.slice(0, 2).toUpperCase();
                  return (
                    <div
                      key={profile.id}
                      className="rounded-xl p-3 flex items-center gap-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.08)" }}>
                        {resolved ? (
                          <img src={resolved} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {profile.business_name && (
                            <span className="text-[10px] truncate text-muted-foreground">
                              {profile.business_name}
                            </span>
                          )}
                          {profile.creator_type && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: "rgba(181,98,42,0.2)", color: "rgba(245,158,11,0.8)" }}>
                              {profile.creator_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onSelectCreator?.(profile.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-foreground shrink-0 transition-opacity hover:opacity-80"
                        style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}>
                        <MessageCircle className="w-3 h-3" />
                        Message
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
