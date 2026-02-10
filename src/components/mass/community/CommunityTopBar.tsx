import { Search } from "lucide-react";
import yanguLogo from "@/assets/yangu-logo-community.png";
import yanguLogoFull from "@/assets/yangu-logo-full.png";
import { useCommunityTheme, getThemeColors } from "./CommunityThemeContext";

export function CommunityTopBar() {
  const { theme } = useCommunityTheme();
  const c = getThemeColors(theme);

  return (
    <header className="w-full transition-colors duration-300" style={{ backgroundColor: c.bg }}>
      <div className="mx-auto flex h-[64px] max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center">
            <img
              src={theme === "dark" ? yanguLogoFull : yanguLogo}
              alt="Yangu"
              className="h-10 w-auto"
            />
          </a>
          <a
            href="#"
            className="hidden text-[14px] sm:inline"
            style={{ color: c.textMuted }}
          >
            create a community
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="hidden text-[14px] sm:inline" style={{ color: c.textMuted }}>
            List on community
          </a>
          <button
            className="rounded-lg border px-5 py-[8px] text-[14px] font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: "transparent", borderColor: c.signInBorder, color: c.signInText }}
          >
            Sign in
          </button>
          <button
            className="rounded-lg px-5 py-[8px] text-[14px] font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#F46D2A" }}
          >
            Start selling
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pb-5 pt-4 text-center">
        <h1
          className="mx-auto max-w-[520px] text-[24px] font-extrabold leading-[1.2] tracking-tight sm:text-[30px]"
          style={{ color: c.text }}
        >
          Build and run your community
        </h1>
        <p className="mx-auto mt-1.5 max-w-[380px] text-[12px] leading-relaxed" style={{ color: c.textSecondary }}>
          Find communities, creators, and products that transform your life
        </p>

        <div className="mx-auto mt-5 max-w-[420px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: c.textMuted }} />
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-2xl py-[12px] pl-11 pr-4 text-[14px] focus:outline-none transition-all duration-200 hover:border-[#F46D2A] hover:shadow-[0_2px_16px_rgba(244,109,42,0.2)]"
              style={{
                backgroundColor: theme === "dark" ? "rgba(10,23,16,0.55)" : "#FFFFFF",
                color: c.inputText,
                border: "1.5px solid rgba(244,109,42,0.25)",
                boxShadow: "0 2px 12px rgba(244,109,42,0.1)",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
