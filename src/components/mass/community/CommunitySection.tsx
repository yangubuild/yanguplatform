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
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-[20px] font-bold"
            style={{ color: "#111827" }}
          >
            {title}
          </h2>
          {showSeeAll && (
            <a
              href="#"
              className="flex items-center gap-1 text-[14px] font-medium transition-colors hover:opacity-70"
              style={{ color: "#7C3AED" }}
            >
              See all
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CommunityCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
