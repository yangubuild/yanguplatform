import { ArrowRight, TrendingUp } from "lucide-react";

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
    <header className="flex flex-col gap-3 mb-6">
      {/* Top row - Auth buttons */}
      <div className="flex items-center justify-end gap-3">
        <button className="px-5 py-2.5 rounded-full border border-[#333333] text-white text-sm hover:bg-[#1a1a1a] transition-colors">
          Sign in
        </button>
        <button className="px-5 py-2.5 rounded-full bg-[#f97316] text-white text-sm font-medium hover:bg-[#ea580c] transition-colors">
          Start selling
        </button>
      </div>
      
      {/* Bottom row - Trends ticker */}
      <div className="flex items-center gap-4">
        {/* View Trends button */}
        <button className="flex items-center gap-2 text-[#f97316] text-sm font-medium whitespace-nowrap">
          <TrendingUp className="w-4 h-4" />
          <span>View Trends</span>
        </button>
        
        {/* Scrolling trend ticker */}
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="relative">
            <div className="flex animate-scroll-x gap-6">
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
    </header>
  );
}
