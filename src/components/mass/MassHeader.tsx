import { TrendingUp } from "lucide-react";

const trendItems = [
  "run your agency on autopilot",
  "learn, build, scale",
  "make money while you sleep",
  "from idea to profit in 30 days",
  "join 10,000+ successful entrepreneurs",
  "unlimited access - platform owner",
  "your apps for the",
];

export function MassHeader() {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      {/* Left side - View Trends and ticker */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* View Trends button */}
        <button 
          className="flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          style={{ color: '#F16612' }}
        >
          <TrendingUp className="w-4 h-4" />
          <span>View Trends</span>
        </button>
        
        {/* Divider */}
        <div className="w-px h-4 bg-white/10 hidden md:block" />
        
        {/* Scrolling trend ticker */}
        <div className="flex-1 overflow-hidden min-w-0 hidden md:block">
          <div className="relative">
            <div className="flex animate-scroll-x gap-2">
              {[...trendItems, ...trendItems].map((item, index) => (
                <span 
                  key={index} 
                  className="text-sm whitespace-nowrap px-3 py-1.5 rounded-full"
                  style={{
                    color: 'rgba(255, 255, 255, 0.55)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
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
        <button 
          className="px-5 py-2 rounded-full text-sm transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.75)'
          }}
        >
          Sign in
        </button>
        <button 
          className="px-5 py-2 rounded-full text-sm font-medium transition-colors hover:brightness-110"
          style={{ 
            background: '#F16612',
            color: 'rgba(0, 0, 0, 0.85)'
          }}
        >
          Start selling
        </button>
      </div>
    </header>
  );
}
