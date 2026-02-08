import { TrendingUp } from "lucide-react";

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
  // Duplicate items for seamless loop
  const duplicatedItems = [...trendItems, ...trendItems];

  return (
    <div className="flex items-center gap-4 mt-4 overflow-hidden">
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
