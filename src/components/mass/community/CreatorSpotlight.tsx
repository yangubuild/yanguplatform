import { ChevronLeft, ChevronRight } from "lucide-react";
import { creatorItems } from "./communityData";
import { useCommunityTheme, getThemeColors } from "./CommunityThemeContext";
import { T } from "@/lib/typography";

export function CreatorSpotlight() {
  const { theme } = useCommunityTheme();
  const c = getThemeColors(theme);

  return (
    <section className="w-full transition-colors duration-300" style={{ backgroundColor: c.bg }}>
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10 pb-4 pt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className={T.sectionH2} style={{ color: c.text }}>Creators you might like</h2>
          <div className="flex gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded-md border transition-colors" style={{ borderColor: c.border, color: c.textMuted }}>
              <ChevronLeft size={16} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-md border transition-colors" style={{ borderColor: c.border, color: c.textMuted }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto px-6 pb-6" style={{ scrollbarWidth: "none" }}>
        {creatorItems.map((creator) => (
          <a key={creator.id} href="#" className="group relative shrink-0 overflow-hidden rounded-2xl" style={{ width: "210px", height: "280px" }}>
            <img src={creator.image} alt={creator.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(234,120,50,0.7) 0%, rgba(234,120,50,0.3) 30%, rgba(0,0,0,0) 60%)" }} />
            <div className="absolute bottom-0 left-0 p-3">
              <h3 className={`${T.body} font-bold leading-tight text-foreground`}>{creator.name}</h3>
              <p className={`mt-0.5 ${T.bodyCompact} text-muted-foreground`}>{creator.role}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
