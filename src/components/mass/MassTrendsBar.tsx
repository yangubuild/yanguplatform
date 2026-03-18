import { useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";
import { useTrendEntities } from "@/hooks/landing/useSearchEntities";
import { trackImpressions, trackClick } from "@/lib/discoveryAnalytics";

const FALLBACK_ITEMS = [
  "restaurants",
  "automate your sales with ai crm",
  "subscription success guaranteed",
  "triple your sales this month",
  "automated invoicing - get paid fast",
  "sign documents digitally",
];

export function MassTrendsBar() {
  const tracked = useRef(false);

  // Track trend bar impressions once
  useEffect(() => {
    if (!tracked.current && trendEntities && trendEntities.length > 0) {
      tracked.current = true;
      trackImpressions(trendEntities, "trend_bar");
    }
  }, [trendEntities]);

  // Build trend text from paid entities; fall back to static if none yet
  const liveItems =
    trendEntities && trendEntities.length > 0
      ? trendEntities.map(
          (e) => e.short_description || e.title || e.primary_category || "yangu"
        )
      : FALLBACK_ITEMS;

  // Duplicate items for seamless loop
  const duplicatedItems = [...liveItems, ...liveItems];

  return (
    <div className="flex items-center gap-4 mt-6 overflow-hidden lg:-ml-[60px] lg:w-[calc(100%+120px)] xl:-ml-[200px] xl:w-[calc(100%+260px)]">
      {/* View Trends label */}
      <button 
        className="flex items-center gap-2 shrink-0 group z-10"
      >
        <TrendingUp 
          className="w-4 h-4" 
          style={{ color: '#F46D2A' }}
        />
        <span 
          className="text-sm font-medium transition-all group-hover:underline"
          style={{ color: '#F46D2A' }}
        >
          View Trends
        </span>
      </button>

      {/* Animated scrolling container */}
      <div className="overflow-hidden flex-1">
        <div 
          className="flex items-center gap-6 animate-scroll-left"
          style={{
            width: 'max-content',
          }}
        >
          {duplicatedItems.map((item, index) => (
            <span
              key={index}
              className="shrink-0 text-sm cursor-pointer transition-colors duration-200"
              style={{
                color: 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
