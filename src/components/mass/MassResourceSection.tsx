import { MassResourceCard } from "./MassResourceCard";
import type { Resource } from "./resourceData";

interface MassResourceSectionProps {
  title: string;
  resources: Resource[];
}

export function MassResourceSection({ title, resources }: MassResourceSectionProps) {
  return (
    <section className="mb-12">
      <h6 className="text-[#666666] text-xs uppercase tracking-wider mb-6">{title}</h6>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <MassResourceCard
            key={index}
            image={resource.image}
            title={resource.title}
            subtitle={resource.subtitle}
            category={resource.category}
            featured={resource.featured}
          />
        ))}
      </div>
    </section>
  );
}
