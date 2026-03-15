import { useCommunityTheme, getThemeColors } from "./CommunityThemeContext";
import { T } from "@/lib/typography";

export function SubscribeCta() {
  const { theme } = useCommunityTheme();
  const c = getThemeColors(theme);

  return (
    <section className="w-full px-6 transition-colors duration-300" style={{ backgroundColor: c.bg }}>
      <div
        className="mx-auto my-10 flex max-w-[1200px] items-center justify-between overflow-hidden rounded-2xl px-10 py-16"
        style={{ background: "radial-gradient(ellipse at 40% 60%, #1a5c3a 0%, #0f3d2a 30%, #0a2e1e 50%, #0d1f15 70%, #0a1710 100%)" }}
      >
        <div>
          <h2 className={`max-w-[360px] ${T.header} text-white`}>
            Be the first to<br />know about new creators<br />and communities
          </h2>
          <button className="mt-5 rounded-lg border border-white/30 px-5 py-[8px] text-[14px] font-medium text-white transition-colors hover:bg-white/10">
            Subscribe to Discover
          </button>
        </div>
        <div className="hidden gap-3 sm:flex">
          <div className="h-[140px] w-[140px] rounded-xl bg-gradient-to-br from-teal-400 to-teal-600" />
          <div className="h-[140px] w-[140px] rounded-xl bg-gradient-to-br from-amber-300 to-amber-500" />
        </div>
      </div>
    </section>
  );
}
