import { useEffect, useState } from "react";
import { Store, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SPONSORED_TRUST_FLOOR } from "@/lib/monetizationRules";

interface SponsoredBusiness {
  id: string;
  title: string;
  slug: string;
  coverImage?: string;
  description?: string;
  category?: string;
  trustScore?: number;
}

/**
 * Sponsored section on the Explore page — shows businesses promoted via Search Ads.
 * Pulls from ad_placements with placement_type = 'search_ad' joined with ads table,
 * or falls back to demo data for now.
 */
export function ExploreSponsoredSection() {
  const [businesses, setBusinesses] = useState<SponsoredBusiness[]>([]);

  useEffect(() => {
    // Fetch promoted businesses from ads table where they have search ad targeting
    const fetchSponsored = async () => {
      try {
        const { data } = await supabase
          .from("ads")
          .select("id, title, content, image_url, target_url, targeting")
          .eq("status", "active")
          .not("targeting", "is", null)
          .limit(6);

        if (data && data.length > 0) {
          setBusinesses(
            data
              .filter((ad) => {
                const t = ad.targeting as any;
                return t?.type === "search_ad";
              })
              .map((ad) => {
                const t = ad.targeting as any;
                return {
                  id: ad.id,
                  title: ad.title,
                  slug: ad.target_url,
                  coverImage: ad.image_url || undefined,
                  description: ad.content || t?.description,
                  category: t?.category,
                };
              })
          );
        }
      } catch {
        // silent fail — sponsored section just won't show
      }
    };
    fetchSponsored();
  }, []);

  if (businesses.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-4 h-4" style={{ color: "#b5622a" }} />
        <h2 className="text-white/40 text-sm font-medium tracking-wide">Sponsored</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {businesses.map((biz) => (
          <a
            key={biz.id}
            href={biz.slug}
            target="_blank"
            rel="noopener noreferrer"
            className="group cursor-pointer block"
          >
            <div className="relative overflow-hidden rounded-xl mb-3" style={{ background: "#0A1710" }}>
              {biz.coverImage ? (
                <img
                  src={biz.coverImage}
                  alt={biz.title}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full aspect-[4/3] flex items-center justify-center">
                  <Store className="w-12 h-12 text-white/15" />
                </div>
              )}
              <div
                className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                style={{ background: "rgba(181, 98, 42, 0.8)", color: "#fff" }}
              >
                Sponsored
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm truncate">{biz.title}</span>
              {biz.category && (
                <span className="text-white/40 text-xs shrink-0">{biz.category}</span>
              )}
            </div>
            {biz.description && (
              <p className="text-xs text-white/30 mt-1 line-clamp-2">{biz.description}</p>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
