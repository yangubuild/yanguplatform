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
        className="relative overflow-hidden rounded-xl mb-3"
        style={{
          background: '#0A1710',
        }}
      >
        <img
          src={image}
          alt={title}
          className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium text-sm">{title}</span>
          {featured && <StarGlassChip />}
        </div>
        <span className="text-muted-foreground text-xs">{category}</span>
      </div>
    </a>
  );
}
