import type { CommunityItem } from "./communityData";

interface CommunityCardProps {
  item: CommunityItem;
}

export function CommunityCard({ item }: CommunityCardProps) {
  return (
    <a href="#" className="group block">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      {/* Price */}
      {item.price && (
        <p className="mt-2.5 text-[12px] font-semibold" style={{ color: "#111827" }}>
          {item.price}
        </p>
      )}
      {/* Description */}
      <p
        className={`${item.price ? "mt-1" : "mt-2.5"} text-[12px] leading-[1.5] line-clamp-2`}
        style={{ color: "#6B7280" }}
      >
        {item.description}
      </p>
      {/* Community name */}
      <p
        className="mt-0.5 text-[11px] font-medium"
        style={{ color: "#9CA3AF" }}
      >
        {item.title}
      </p>
    </a>
  );
}
