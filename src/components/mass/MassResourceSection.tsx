import { MassResourceCard } from "./MassResourceCard";
import type { Resource } from "./resourceData";

interface MassResourceSectionProps {
  title: string;
  resources: Resource[];
}

export function MassResourceSection({ title, resources }: MassResourceSectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-white/40 text-sm font-medium mb-5 tracking-wide">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((resource, index) => (
          <MassResourceCard
            key={`${resource.title}-${index}`}
            image={resource.image}
            title={resource.title}
            category={resource.category}
            featured={resource.featured}
            url={resource.url}
          />
        ))}
      </div>
    </section>
  );
}
