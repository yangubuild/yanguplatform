import { TrendingUp } from "lucide-react";
import { useRef } from "react";

const trendItems = [
  "restaurants",
  "automate your sales with ai crm",
  "subscription success guaranteed",
  "triple your sales this month",
  "automated invoicing - get paid fast",
  "sign documents digitally",
  "manage all documents in one place",
  "from idea to profit in 30 days",
  "join 10,000+ successful entrepreneurs",
  "unlimited access - platform owner",
  "your apps for the build phase",
  "click any app to get started",
  "enjoy digital books & courses",
];

export function MassTrendsBar() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center gap-4 mt-4">
      {/* View Trends label */}
      <button 
        className="flex items-center gap-2 shrink-0 group"
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

      {/* Scrollable pills container */}
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {trendItems.map((item, index) => (
          <button
            key={index}
            className="shrink-0 px-2 py-1 text-sm transition-colors duration-200 hover:text-white/75"
            style={{
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
