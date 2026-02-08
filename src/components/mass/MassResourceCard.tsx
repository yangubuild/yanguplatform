import { Star } from "lucide-react";

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
          <span className="text-white font-medium">{title}</span>
          {featured && (
            <Star className="w-3.5 h-3.5 text-white/40 fill-white/40" />
          )}
        </div>
        <span className="text-white/40 text-sm">{category}</span>
      </div>
    </a>
  );
}
