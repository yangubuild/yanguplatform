import { createContext, useContext, useState, type ReactNode } from "react";

type CommunityTheme = "light" | "dark";

interface CommunityThemeCtx {
  theme: CommunityTheme;
  toggle: () => void;
}

const Ctx = createContext<CommunityThemeCtx>({ theme: "light", toggle: () => {} });

export function useCommunityTheme() {
  return useContext(Ctx);
}

/* Color tokens per theme */
export function getThemeColors(theme: CommunityTheme) {
  if (theme === "dark") {
    return {
      bg: "#08120D",
      text: "#F0F0F0",
      textSecondary: "#9CA3AF",
      textMuted: "#6B7280",
      border: "rgba(255,255,255,0.12)",
      cardBg: "#0A1710",
      filterBg: "#0A1710",
      filterActiveBg: "linear-gradient(180deg, #b5622a 0%, #5c2a12 100%)",
      filterActiveText: "#FFFFFF",
      filterInactiveBg: "transparent",
      filterInactiveText: "#9CA3AF",
      filterInactiveBorder: "rgba(255,255,255,0.15)",
      inputBg: "rgba(10,23,16,0.55)",
      inputText: "#E0E0E0",
      inputPlaceholder: "#6B7280",
      signInBorder: "rgba(255,255,255,0.2)",
      signInText: "#D1D5DB",
      seeAllText: "#9CA3AF",
      scrollBtnBorder: "rgba(255,255,255,0.15)",
      scrollBtnText: "#9CA3AF",
      priceText: "#F0F0F0",
      descText: "#9CA3AF",
      nameText: "#6B7280",
    };
  }
  return {
    bg: "#FFFFFF",
    text: "#111827",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    cardBg: "#FFFFFF",
    filterBg: "#FFFFFF",
    filterActiveBg: "#111827",
    filterActiveText: "#FFFFFF",
    filterInactiveBg: "#FFFFFF",
    filterInactiveText: "#374151",
    filterInactiveBorder: "#E5E7EB",
    inputBg: "#FFFFFF",
    inputText: "#374151",
    inputPlaceholder: "#9CA3AF",
    signInBorder: "#D1D5DB",
    signInText: "#374151",
    seeAllText: "#6B7280",
    scrollBtnBorder: "#E5E7EB",
    scrollBtnText: "#9CA3AF",
    priceText: "#111827",
    descText: "#6B7280",
    nameText: "#9CA3AF",
  };
}

export function CommunityThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<CommunityTheme>("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}
