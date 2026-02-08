export function MassHero() {
  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-10 md:p-12 mb-0 min-h-[200px]"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 30% 50%, #296048 0%, transparent 50%),
          linear-gradient(135deg, #296048 0%, #174638 40%, #15261F 100%)
        `,
      }}
    >
      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl md:text-[42px] font-semibold leading-[1.1] mb-4 tracking-tight">
          <span className="text-white block">Build and.</span>
          <span className="text-white/60 block">Sell Online.</span>
        </h1>
        <p className="text-sm text-white/45 max-w-xs leading-relaxed">
          Exclusive resource for inspiration to create your next fire project.
        </p>
      </div>
      
      {/* 3D metallic arrow shape on right - Yangu green tinted */}
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 hidden md:block">
        <svg 
          width="160" 
          height="140" 
          viewBox="0 0 160 140" 
          fill="none" 
          className="opacity-40"
        >
          {/* 3D Arrow pointing down-left, green-tinted metallic */}
          <defs>
            <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a7a60" />
              <stop offset="50%" stopColor="#2d5a48" />
              <stop offset="100%" stopColor="#174638" />
            </linearGradient>
            <linearGradient id="arrowHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5a8a70" />
              <stop offset="100%" stopColor="#296048" />
            </linearGradient>
          </defs>
          {/* Main arrow body */}
          <path 
            d="M80 10 L140 40 L140 80 L80 130 L40 100 L40 60 L80 10Z" 
            fill="url(#arrowGradient)"
          />
          {/* Top face highlight */}
          <path 
            d="M80 10 L140 40 L100 55 L40 25 L80 10Z" 
            fill="url(#arrowHighlight)"
            opacity="0.6"
          />
          {/* Arrow head extension */}
          <path 
            d="M20 90 L40 100 L40 60 L20 50 L20 90Z" 
            fill="#2d5a48"
          />
          <path 
            d="M20 90 L80 130 L40 100 L20 90Z" 
            fill="#1d4a38"
          />
        </svg>
      </div>
    </div>
  );
}
