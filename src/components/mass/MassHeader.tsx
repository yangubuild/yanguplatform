import { TrendingUp } from "lucide-react";

const trendItems = [
  "build your brand kit today",
  "define your mission & vision",
  "launch your website in 60 seconds",
  "start earning with digital eshops",
  "real estate listings - go digital",
  "connect all your eshops",
  "build a thriving online",
];

export function MassHeader() {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      {/* Left side - View Trends and ticker */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* View Trends button */}
        <button className="flex items-center gap-2 text-[#f97316] text-sm font-medium whitespace-nowrap">
          <TrendingUp className="w-4 h-4" />
          <span>View Trends</span>
        </button>
        
        {/* Scrolling trend ticker */}
        <div className="flex-1 overflow-hidden min-w-0 hidden md:block">
          <div className="relative">
            <div className="flex animate-scroll-x gap-3">
              {[...trendItems, ...trendItems].map((item, index) => (
                <span 
                  key={index} 
                  className="text-[#888888] text-sm whitespace-nowrap px-3 py-1 border border-[#333333] rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth buttons */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="px-5 py-2 rounded-full border border-[#333333] text-white text-sm hover:bg-[#1a1a1a] transition-colors">
          Sign in
        </button>
        <button className="px-5 py-2 rounded-full bg-[#f97316] text-white text-sm font-medium hover:bg-[#ea580c] transition-colors">
          Start selling
        </button>
      </div>
    </header>
  );
}
