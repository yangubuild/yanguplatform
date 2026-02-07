import yanguYIcon from "@/assets/yangu-y-icon.png";

export function MassHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2a2a] via-[#1f1f1f] to-[#1a1a1a] p-8 md:p-12 mb-10">
      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl md:text-5xl font-medium leading-tight mb-4">
          <span className="text-white">Build and.</span>
          <br />
          <span className="text-[#999999]">Sell Online.</span>
        </h1>
        <p className="text-[#888888] text-base md:text-lg">
          An Internet Business hub that exists to deliver sustainable income for everyone.
        </p>
      </div>
      
      {/* 3D Metallic Y element */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden md:block">
        <img 
          src={yanguYIcon} 
          alt="Yangu Y" 
          className="w-40 h-40 md:w-48 md:h-48 object-contain opacity-90"
        />
      </div>
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1a1a1a]/50 pointer-events-none" />
    </div>
  );
}
