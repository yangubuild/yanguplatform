import { Plus } from "lucide-react";

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
      <div className="relative overflow-hidden rounded-xl mb-3 bg-[#1c1c1c]">
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
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10">
              <Plus className="w-2.5 h-2.5 text-white/50" strokeWidth={2.5} />
            </span>
          )}
        </div>
        <span className="text-white/40 text-xs">{category}</span>
      </div>
    </a>
  );
}
