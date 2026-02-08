import yanguYIcon from "@/assets/yangu-y-icon.png";

export function MassHero() {
  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-10 md:p-14 mb-8 min-h-[380px]"
      style={{
        background: 'linear-gradient(135deg, #245C44 0%, #1D4433 35%, #142B22 70%, #0B1511 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Glass overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(14px)',
        }}
      />
      
      {/* Border overlay */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      />
      
      <div className="relative z-10 max-w-lg">
        <h1 className="text-5xl md:text-6xl font-semibold leading-[1.1] mb-6">
          <span className="text-white block">Build and.</span>
          <span className="text-white block">Sell Online.</span>
        </h1>
        <p 
          className="text-base md:text-lg max-w-md leading-relaxed"
          style={{ color: 'rgba(255, 255, 255, 0.60)' }}
        >
          An Internet Business hub that exists to deliver sustainable income for everyone.
        </p>
      </div>
      
      {/* 3D Metallic Y element - frosted glass look */}
      <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 hidden md:block">
        <img 
          src={yanguYIcon} 
          alt="Yangu Y" 
          className="w-56 h-56 md:w-72 md:h-72 object-contain"
          style={{ 
            opacity: 0.4,
            filter: 'brightness(1.1) contrast(0.9)'
          }}
        />
      </div>
    </div>
  );
}
