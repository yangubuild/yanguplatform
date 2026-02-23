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
      <div className="relative overflow-hidden rounded-2xl mb-3">
        <img
          src={image}
          alt={title}
          className="w-full block transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">{title}</span>
          {featured && <StarGlassChip />}
        </div>
        <span className="text-white/40 text-xs">{category}</span>
      </div>
    </a>
  );
}
