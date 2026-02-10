import type { CommunityItem } from "./communityData";

interface CommunityCardProps {
  item: CommunityItem;
}

export function CommunityCard({ item }: CommunityCardProps) {
  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-xl aspect-[16/10]">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {item.price && (
          <span
            className="absolute bottom-3 left-3 px-3 py-1 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            {item.price}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold" style={{ color: "#111827" }}>
        {item.title}
      </h3>
    </div>
  );
}
