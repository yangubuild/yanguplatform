import { SUBDOMAINS } from "@/config/platform";
import { SurfaceCard } from "./SurfaceCard";

export function Surfaces() {
  const surfaces = Object.values(SUBDOMAINS);

  return (
    <section id="surfaces" className="py-20 md:py-32">
      <div className="container">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4">
            Six Surfaces. <span className="text-gradient">Infinite Possibilities.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Each surface type is designed for a specific purpose. 
            Choose what fits your vision and own your corner of the web.
          </p>
        </div>

        {/* Surface grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {surfaces.map((surface, index) => (
            <SurfaceCard key={surface.id} surface={surface} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
