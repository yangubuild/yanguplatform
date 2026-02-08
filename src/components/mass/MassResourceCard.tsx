import { StarGlassChip } from "./StarGlassChip";

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
      <div 
        className="relative overflow-hidden rounded-xl mb-3 transition-shadow duration-300"
        style={{
          background: 'linear-gradient(135deg, #174638 0%, #15261F 100%)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
          style={{
            boxShadow: '0 0 20px rgba(41,96,72,0.4), inset 0 0 1px rgba(255,255,255,0.1)',
          }}
        />
        <img
          src={image}
          alt={title}
          className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">{title}</span>
          {featured && <StarGlassChip />}
        </div>
        <span className="text-white/45 text-xs">{category}</span>
      </div>
    </a>
  );
}
