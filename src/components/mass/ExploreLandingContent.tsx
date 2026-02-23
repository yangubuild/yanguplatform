import { MassHero } from "./MassHero";
import { MassSearchBar } from "./MassSearchBar";
import { MassResourceSection } from "./MassResourceSection";
import { MassTrendsBar } from "./MassTrendsBar";
import {
  featuredResources,
  inspirationResources,
  noCodeResources,
  templatesResources,
  aiResources,
  typographyResources,
  designToolsResources,
} from "./resourceData";

/**
 * The "center content" of the landing page — hero, search bar, and resource grids.
 * Designed to be embedded standalone (e.g. inside the dashboard explore page)
 * without any landing header, auth buttons, or sidebar.
 */
export function ExploreLandingContent() {
  return (
    <div>
      <MassTrendsBar />
      <div className="pt-10">
        <MassHero />
      </div>
      <MassSearchBar />
      <MassResourceSection title="Featured" resources={featuredResources} />
      <MassResourceSection title="Inspiration" resources={inspirationResources} />
      <MassResourceSection title="No Code" resources={noCodeResources} />
      <MassResourceSection title="Templates" resources={templatesResources} />
      <MassResourceSection title="Ai" resources={aiResources} />
      <MassResourceSection title="Typography" resources={typographyResources} />
      <MassResourceSection title="Design Tools" resources={designToolsResources} />
    </div>
  );
}
