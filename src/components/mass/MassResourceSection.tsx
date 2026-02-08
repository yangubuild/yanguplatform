import { MassResourceCard } from "./MassResourceCard";
import type { Resource } from "./resourceData";

interface MassResourceSectionProps {
  title: string;
  resources: Resource[];
}

export function MassResourceSection({ title, resources }: MassResourceSectionProps) {
  // Show only first 3 cards for featured section
  const displayResources = title === "FEATURED" ? resources.slice(0, 3) : resources;
  
  return (
    <section className="mb-12">
      <h2 
        className="text-xs font-medium tracking-wider mb-6 uppercase"
        style={{ color: 'rgba(255, 255, 255, 0.38)' }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayResources.map((resource, index) => (
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
