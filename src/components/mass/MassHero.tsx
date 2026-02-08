export function MassHero() {
  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-10 md:p-14 mb-8 min-h-[260px]"
      style={{
        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)',
      }}
    >
      <div className="relative z-10 max-w-lg">
        <h1 className="text-4xl md:text-5xl font-semibold leading-[1.15] mb-4">
          <span className="text-white block">Get Inspired.</span>
          <span className="text-white block">Stay Creative.</span>
        </h1>
        <p className="text-base text-white/50 max-w-sm leading-relaxed">
          Exclusive resource for inspiration to create your next fire project.
        </p>
      </div>
      
      {/* 3D metallic shape on right */}
      <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 hidden md:block">
        <div 
          className="w-40 h-48 md:w-48 md:h-56"
          style={{
            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            opacity: 0.15,
            filter: 'blur(1px)',
          }}
        />
      </div>
    </div>
  );
}
