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
        {item.price && (
          <span
            className="absolute bottom-3 left-3 rounded-lg px-3 py-[5px] text-[12px] font-medium text-white"
            style={{
              backgroundColor: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(6px)",
            }}
          >
            {item.price}
          </span>
        )}
      </div>
      {/* Title */}
      <h3
        className="mt-3 text-[14px] font-semibold leading-snug"
        style={{ color: "#111827" }}
      >
        {item.title}
      </h3>
    </a>
  );
}
