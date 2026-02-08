import { TrendingUp } from "lucide-react";
import { useRef, useState } from "react";

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm transition-all duration-200"
            style={{
              background: activeIndex === index 
                ? 'rgba(255,255,255,0.08)' 
                : 'rgba(255,255,255,0.05)',
              color: activeIndex === index 
                ? 'rgba(255,255,255,0.78)' 
                : 'rgba(255,255,255,0.55)',
            }}
            onMouseEnter={(e) => {
              if (activeIndex !== index) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(41,96,72,0.12)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeIndex !== index) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
