import yanguYIcon from "@/assets/yangu-y-icon.png";

export function MassHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a3a2e] via-[#0f2922] to-[#0a1f1a] p-8 md:p-12 mb-10 min-h-[320px]">
      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl md:text-5xl font-medium leading-tight mb-4">
          <span className="text-white">Build and.</span>
          <br />
          <span className="text-[#666666]">Sell Online.</span>
        </h1>
        <p className="text-[#888888] text-base md:text-lg">
          Your all-in-one platform to build, market, and scale a business with live video and AI.
        </p>
      </div>
      
      {/* 3D Metallic Y element */}
      <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 hidden md:block">
        <img 
          src={yanguYIcon} 
          alt="Yangu Y" 
          className="w-48 h-48 md:w-64 md:h-64 object-contain opacity-80"
        />
      </div>
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a1f1a]/30 pointer-events-none" />
    </div>
  );
}
