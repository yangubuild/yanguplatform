interface MassResourceCardProps {
  image: string;
  title: string;
  category: string;
  featured?: boolean;
}

function GlassStar() {
  return (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      className="relative"
    >
      <defs>
        <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="30%" stopColor="rgba(200,200,200,0.7)" />
          <stop offset="70%" stopColor="rgba(150,150,150,0.5)" />
          <stop offset="100%" stopColor="rgba(100,100,100,0.4)" />
        </linearGradient>
        <linearGradient id="glassHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="url(#glassGradient)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
      />
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="url(#glassHighlight)"
        opacity="0.5"
      />
    </svg>
  );
}

export function MassResourceCard({ image, title, category, featured = false }: MassResourceCardProps) {
  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-xl mb-3">
        <img
          src={image}
          alt={title}
          className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-white ${featured ? 'font-semibold' : 'font-normal'}`}>
            {title}
          </span>
          {featured && <GlassStar />}
        </div>
        <span className="text-[#666666] text-sm">{category}</span>
      </div>
    </div>
  );
}
