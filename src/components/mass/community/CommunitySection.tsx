import { CommunityCard } from "./CommunityCard";
import type { CommunityItem } from "./communityData";
import { useCommunityTheme, getThemeColors } from "./CommunityThemeContext";
import { T } from "@/lib/typography";

interface CommunitySectionProps {
  title: string;
  items: CommunityItem[];
  showSeeAll?: boolean;
  seeAllHref?: string;
  linkMap?: Map<string, string>;
}

export function CommunitySection({ title, items, showSeeAll = true, seeAllHref, linkMap }: CommunitySectionProps) {
  const { theme } = useCommunityTheme();
  const c = getThemeColors(theme);

  if (items.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 transition-colors duration-300" style={{ backgroundColor: c.bg }}>
      <div className="mx-auto max-w-[1100px] pb-4 pt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className={T.sectionH2} style={{ color: c.text }}>{title}</h2>
          {showSeeAll && (
            <a href={seeAllHref || "#"} className="text-sm font-medium transition-colors hover:underline" style={{ color: c.seeAllText }}>
              See all &gt;
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <CommunityCard key={item.id} item={item} href={linkMap?.get(item.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}
