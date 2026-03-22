import { useCommunityTheme, getThemeColors } from "./CommunityThemeContext";
import bottomCtaBg from "@/assets/bottom-cta-bg.jpg";
import { T } from "@/lib/typography";

export function BottomCta() {
  const { theme } = useCommunityTheme();
  const c = getThemeColors(theme);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 pb-0 transition-colors duration-300" style={{ backgroundColor: c.bg }}>
      <div
        className="mx-auto max-w-[1100px] overflow-hidden rounded-2xl px-10 py-16"
        style={{ backgroundImage: `url(${bottomCtaBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`max-w-[400px] ${T.header} text-foreground`}>
              Circle powers the top communities. Now it's your turn.
            </h2>
            <button className="mt-5 rounded-lg border border-white/40 px-5 py-[8px] text-[14px] font-medium text-foreground transition-colors hover:bg-white/10">
              Create a Circle
            </button>
          </div>
          <div className="hidden gap-3 sm:flex">
            <div className="flex h-[90px] w-[90px] items-center justify-center rounded-xl bg-white/20 text-[10px] font-bold text-foreground">spi</div>
            <div className="flex h-[90px] w-[90px] items-center justify-center rounded-xl bg-white/20 text-[10px] font-bold text-foreground">MAKER</div>
          </div>
        </div>
      </div>
    </section>
  );
}
