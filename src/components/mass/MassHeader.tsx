import { ArrowRight } from "lucide-react";
import yanguLogo from "@/assets/yangu-logo.png";

const trendItems = [
  "triple your sales this month",
  "automated invoicing - get paid fast",
  "sign documents digitally",
  "manage all documents in one place",
  "build your company knowledge base",
  "email marketing that converts",
];

export function MassHeader() {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      {/* Left side - Logo and Trends */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Logo - hidden on mobile since sidebar shows on desktop */}
        <img 
          src={yanguLogo} 
          alt="Yangu" 
          className="h-8 w-auto hidden lg:block"
        />
        
        {/* View Trends button */}
        <button className="flex items-center gap-2 text-[#f97316] text-sm font-medium whitespace-nowrap">
          <span>View Trends</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        
        {/* Scrolling trend ticker */}
        <div className="flex-1 overflow-hidden min-w-0 hidden sm:block">
          <div className="relative">
            <div className="flex animate-scroll-x gap-8">
              {[...trendItems, ...trendItems].map((item, index) => (
                <span 
                  key={index} 
                  className="text-[#666666] text-sm whitespace-nowrap"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth buttons */}
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 rounded-lg border border-[#333333] text-white text-sm hover:bg-[#1a1a1a] transition-colors">
          Sign in
        </button>
        <button className="px-4 py-2 rounded-lg bg-[#f97316] text-white text-sm font-medium hover:bg-[#ea580c] transition-colors">
          Start selling
        </button>
      </div>
    </header>
  );
}
