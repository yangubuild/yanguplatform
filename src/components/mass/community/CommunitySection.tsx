import { CommunityCard } from "./CommunityCard";
import type { CommunityItem } from "./communityData";

interface CommunitySectionProps {
  title: string;
  items: CommunityItem[];
}

export function CommunitySection({ title, items }: CommunitySectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>
          {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <CommunityCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
