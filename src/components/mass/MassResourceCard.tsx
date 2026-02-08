interface MassResourceCardProps {
  image: string;
  title: string;
  category: string;
  featured?: boolean;
  url?: string;
}

export function MassResourceCard({ image, title, category, featured = false, url }: MassResourceCardProps) {
  return (
    <a 
      href={url || "#"} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group cursor-pointer block"
    >
      <div className="relative overflow-hidden rounded-xl mb-3 bg-[#1a1a1a]">
        <img
          src={image}
          alt={title}
          className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">{title}</span>
          {featured && (
            <span 
              className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full"
              style={{
                background: 'linear-gradient(145deg, rgba(80,80,80,0.4) 0%, rgba(50,50,50,0.3) 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <svg 
                width="8" 
                height="8" 
                viewBox="0 0 10 10" 
                fill="none"
                className="text-white/50"
              >
                <path 
                  d="M5 1V9M1 5H9" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                />
              </svg>
            </span>
          )}
        </div>
        <span className="text-white/40 text-xs">{category}</span>
      </div>
    </a>
  );
}
