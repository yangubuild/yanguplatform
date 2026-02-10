import { CommunityCard } from "./CommunityCard";
import type { CommunityItem } from "./communityData";

interface CommunitySectionProps {
  title: string;
  items: CommunityItem[];
}

export function CommunitySection({ title, items }: CommunitySectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="w-full px-6" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-[1200px] pb-4 pt-8">
        <h2
          className="mb-5 text-[18px] font-bold"
          style={{ color: "#111827" }}
        >
          {title}
        </h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CommunityCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
