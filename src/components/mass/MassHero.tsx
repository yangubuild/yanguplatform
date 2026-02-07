export function MassHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2a2a] via-[#1f1f1f] to-[#1a1a1a] p-8 md:p-12 mb-10">
      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl md:text-5xl font-medium text-white leading-tight mb-4">
          Get Inspired.
          <br />
          <span className="text-[#999999]">Stay Creative.</span>
        </h1>
        <p className="text-[#888888] text-base md:text-lg">
          Exclusive resource for inspiration to create your next fire project.
        </p>
      </div>
      
      {/* 3D Metallic "4" element */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="opacity-80"
        >
          <defs>
            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8e8e8" />
              <stop offset="25%" stopColor="#c0c0c0" />
              <stop offset="50%" stopColor="#a8a8a8" />
              <stop offset="75%" stopColor="#909090" />
              <stop offset="100%" stopColor="#787878" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="4" dy="4" stdDeviation="8" floodOpacity="0.4" />
            </filter>
          </defs>
          <text
            x="50%"
            y="55%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="url(#metalGradient)"
            filter="url(#shadow)"
            fontSize="180"
            fontWeight="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            4
          </text>
        </svg>
      </div>
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1a1a1a]/50 pointer-events-none" />
    </div>
  );
}
