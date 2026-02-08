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
        <div className="flex items-center gap-1.5">
          <span className="text-white font-medium text-sm">{title}</span>
          {featured && (
            <span 
              className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full transition-all duration-200 group-hover:scale-110"
              style={{
                background: 'linear-gradient(145deg, rgba(70,70,70,0.6) 0%, rgba(45,45,45,0.5) 100%)',
                boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <svg 
                width="7" 
                height="7" 
                viewBox="0 0 10 10" 
                fill="none"
              >
                <path 
                  d="M5 2V8M2 5H8" 
                  stroke="rgba(255,255,255,0.45)" 
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
