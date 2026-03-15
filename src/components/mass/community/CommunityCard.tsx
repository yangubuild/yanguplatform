import type { CommunityItem } from "./communityData";
import { useCommunityTheme, getThemeColors } from "./CommunityThemeContext";
import { T } from "@/lib/typography";

interface CommunityCardProps {
  item: CommunityItem;
  href?: string;
}

export function CommunityCard({ item, href }: CommunityCardProps) {
  const { theme } = useCommunityTheme();
  const c = getThemeColors(theme);

  return (
    <a href={href || "#"} className="group block" target={href ? "_blank" : undefined} rel={href ? "noopener noreferrer" : undefined}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      {item.price && (
        <p className="mt-2.5 text-[12px] font-semibold" style={{ color: c.priceText }}>{item.price}</p>
      )}
      <p
        className={`${item.price ? "mt-1" : "mt-2.5"} text-[12px] leading-[1.5] line-clamp-2`}
        style={{ color: c.descText }}
      >
        {item.description}
      </p>
      <p className="mt-0.5 text-[11px] font-medium" style={{ color: c.nameText }}>{item.title}</p>
    </a>
  );
}
