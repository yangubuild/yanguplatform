import { useCommunityTheme, getThemeColors } from "./CommunityThemeContext";
import { T } from "@/lib/typography";

export function SubscribeCta() {
  const { theme } = useCommunityTheme();
  const c = getThemeColors(theme);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 transition-colors duration-300 bg-background">
      <div
        className="mx-auto my-10 flex max-w-[1100px] items-center justify-between overflow-hidden rounded-2xl px-10 py-16"
        style={{ background: "radial-gradient(ellipse at 40% 60%, #3d2410 0%, #2a1a0f 30%, #1e150a 50%, #1a120d 70%, #100a07 100%)" }}>
        <div>
          <h2 className={`max-w-[360px] ${T.header} text-foreground`}>
            Be the first to<br />know about new creators<br />and communities
          </h2>
          <button className="mt-5 rounded-lg border border-white/30 px-5 py-[8px] text-[14px] font-medium text-foreground transition-colors hover:bg-white/10">
            Subscribe to Discover
          </button>
        </div>
        <div className="hidden gap-3 sm:flex">
          <div className="h-[140px] w-[140px] rounded-xl bg-gradient-to-br from-orange-400 to-orange-600" />
          <div className="h-[140px] w-[140px] rounded-xl bg-gradient-to-br from-amber-300 to-amber-500" />
        </div>
      </div>
    </section>
  );
}
