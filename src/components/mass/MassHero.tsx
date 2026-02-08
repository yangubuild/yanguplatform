export function MassHero() {
  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-10 md:p-12 mb-0 min-h-[200px]"
      style={{
        background: 'linear-gradient(180deg, #174638 0%, #15261F 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 80px rgba(0,0,0,0.35)',
      }}
    >
      {/* Subtle inner glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: 'radial-gradient(circle at 30% 35%, rgba(41,96,72,0.22) 0%, rgba(0,0,0,0) 60%)',
        }}
      />
      
      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl md:text-[42px] font-semibold leading-[1.1] mb-4 tracking-tight">
          <span className="text-white block">Build and.</span>
          <span className="text-white/55 block">Sell Online.</span>
        </h1>
        <p className="text-sm text-white/40 max-w-xs leading-relaxed">
          Exclusive resource for inspiration to create your next fire project.
        </p>
      </div>
      
      {/* 3D metallic arrow shape on right */}
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 hidden md:block">
        <svg 
          width="160" 
          height="140" 
          viewBox="0 0 160 140" 
          fill="none" 
          className="opacity-25"
        >
          <defs>
            <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3a6a55" />
              <stop offset="50%" stopColor="#254a3d" />
              <stop offset="100%" stopColor="#15261F" />
            </linearGradient>
            <linearGradient id="arrowHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a7a65" />
              <stop offset="100%" stopColor="#254a3d" />
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
