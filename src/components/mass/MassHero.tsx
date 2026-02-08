export function MassHero() {
  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-10 md:p-12 mb-0 min-h-[200px]"
      style={{
        background: 'linear-gradient(135deg, #252525 0%, #1c1c1c 50%, #181818 100%)',
      }}
    >
      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl md:text-[42px] font-semibold leading-[1.1] mb-4 tracking-tight">
          <span className="text-white block">Get Inspired.</span>
          <span className="text-white/60 block">Stay Creative.</span>
        </h1>
        <p className="text-sm text-white/40 max-w-xs leading-relaxed">
          Exclusive resource for inspiration to create your next fire project.
        </p>
      </div>
      
      {/* 3D metallic arrow shape on right - matching reference */}
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 hidden md:block">
        <svg 
          width="160" 
          height="140" 
          viewBox="0 0 160 140" 
          fill="none" 
          className="opacity-30"
        >
          {/* 3D Arrow pointing down-left, metallic grey */}
          <defs>
            <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6b6b6b" />
              <stop offset="50%" stopColor="#4a4a4a" />
              <stop offset="100%" stopColor="#2a2a2a" />
            </linearGradient>
            <linearGradient id="arrowHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8a8a8a" />
              <stop offset="100%" stopColor="#3a3a3a" />
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
            fill="#4a4a4a"
          />
          <path 
            d="M20 90 L80 130 L40 100 L20 90Z" 
            fill="#3a3a3a"
          />
        </svg>
      </div>
    </div>
  );
}
