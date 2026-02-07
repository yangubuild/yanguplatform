import { Star } from "lucide-react";

interface MassResourceCardProps {
  image: string;
  title: string;
  category: string;
  featured?: boolean;
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
          {featured && (
            <Star className="w-3 h-3 fill-[#4ade80] text-[#4ade80]" />
          )}
        </div>
        <span className="text-[#666666] text-sm">{category}</span>
      </div>
    </div>
  );
}
