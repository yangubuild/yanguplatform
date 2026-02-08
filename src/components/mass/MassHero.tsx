export function MassHero() {
  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-10 md:p-12 mb-0 min-h-[200px]"
      style={{
        backgroundColor: '#0A1710',
        backgroundImage: `
          radial-gradient(circle at 22% 38%, rgba(41, 96, 72, 0.28) 0%, rgba(21, 38, 31, 0.18) 32%, rgba(10, 23, 16, 0) 62%),
          linear-gradient(90deg, #174638 0%, #15261F 42%, #0A1710 78%)
        `,
        boxShadow: 'inset 0 0 120px rgba(0,0,0,0.45)',
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
      
      {/* Y Hero Mark */}
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 hidden md:block">
        <img 
          src="/yangu-y-hero.png" 
          alt=""
          className="w-64 h-auto opacity-30"
        />
      </div>
    </div>
  );
}
