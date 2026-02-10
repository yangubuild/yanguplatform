import { CommunityCard } from "./CommunityCard";
import type { CommunityItem } from "./communityData";

interface CommunitySectionProps {
  title: string;
  items: CommunityItem[];
  showSeeAll?: boolean;
}

export function CommunitySection({ title, items, showSeeAll = true }: CommunitySectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="w-full px-6" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-[1200px] pb-4 pt-10">
        {/* Section header */}
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-[16px] font-bold"
            style={{ color: "#111827" }}
          >
            {title}
          </h2>
          {showSeeAll && (
            <a
              href="#"
              className="text-[13px] font-medium transition-colors hover:underline"
              style={{ color: "#6B7280" }}
            >
              See all
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <CommunityCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
