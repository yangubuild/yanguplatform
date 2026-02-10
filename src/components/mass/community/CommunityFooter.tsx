import yanguLogo from "@/assets/yangu-logo-community.png";
import yanguLogoFull from "@/assets/yangu-logo-full.png";
import { useCommunityTheme, getThemeColors } from "./CommunityThemeContext";

export function CommunityFooter() {
  const { theme } = useCommunityTheme();
  const c = getThemeColors(theme);

  return (
    <footer className="w-full px-6 py-10 transition-colors duration-300" style={{ backgroundColor: c.bg }}>
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        {theme === "dark" ? (
          <img src={yanguLogoFull} alt="Yangu" className="h-8 w-auto" style={{ opacity: 0.6 }} />
        ) : (
          <img src={yanguLogo} alt="Yangu" className="h-10 w-auto" style={{ opacity: 0.6 }} />
        )}
        <div className="flex gap-6">
          <a href="#" className="text-[12px] transition-colors" style={{ color: c.textMuted }}>Terms of service</a>
          <a href="#" className="text-[12px] transition-colors" style={{ color: c.textMuted }}>Privacy policy</a>
        </div>
      </div>
    </footer>
  );
}
