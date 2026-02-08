export function MassHero() {
  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-10 md:p-12 mb-0 min-h-[200px]"
      style={{
        background: '#1B4D3E',
      }}
    >
      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl md:text-[42px] font-semibold leading-[1.1] mb-4 tracking-tight">
          <span className="text-white block">Build and.</span>
          <span className="text-white/50 block">Sell Online.</span>
        </h1>
        <p className="text-sm text-white/40 max-w-xs leading-relaxed">
          Your all-in-one platform to build, market, and scale a business with live video and AI.
        </p>
      </div>
      
      {/* 3D arrow shape on right */}
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 hidden md:block">
        <svg 
          width="160" 
          height="140" 
          viewBox="0 0 160 140" 
          fill="none" 
          className="opacity-30"
        >
          <defs>
            <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3a6a55" />
              <stop offset="50%" stopColor="#254a3d" />
              <stop offset="100%" stopColor="#1a3a2d" />
            </linearGradient>
            <linearGradient id="arrowHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a7a65" />
              <stop offset="100%" stopColor="#2a5a45" />
            </linearGradient>
          </defs>
          <path 
            d="M80 10 L140 40 L140 80 L80 130 L40 100 L40 60 L80 10Z" 
            fill="url(#arrowGradient)"
          />
          <path 
            d="M80 10 L140 40 L100 55 L40 25 L80 10Z" 
            fill="url(#arrowHighlight)"
            opacity="0.5"
          />
          <path 
            d="M20 90 L40 100 L40 60 L20 50 L20 90Z" 
            fill="#254a3d"
          />
          <path 
            d="M20 90 L80 130 L40 100 L20 90Z" 
            fill="#1a3a2d"
          />
        </svg>
      </div>
    </div>
  );
}
