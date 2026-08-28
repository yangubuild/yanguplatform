import { useLocation, useNavigate } from "react-router-dom";
import { Home, Bot, Hammer, Palette, Menu } from "lucide-react";

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home, to: "/dashboard/home" },
  { key: "agents", label: "Agents", icon: Bot, to: "/dashboard/agents" },
  { key: "builders", label: "Builders", icon: Hammer, to: "/dashboard/builders" },
  { key: "studio", label: "Studio", icon: Palette, to: "/dashboard/studio" },
  { key: "menu", label: "Menu", icon: Menu, to: null },
] as const;


function isActive(pathname: string, to: string | null) {
  if (!to) return false;
  if (to === "/dashboard/home") return pathname === "/dashboard/home" || pathname === "/dashboard";
  return pathname.startsWith(to);
}

interface MobileBottomNavProps {
  onMenuToggle: () => void;
}

export function MobileBottomNav({ onMenuToggle }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around lg:hidden"
      style={{
        minHeight: 56,
        background: "rgba(12,17,14,0.82)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(location.pathname, item.to);
        const handleTap = () => {
          if (item.key === "menu") {
            onMenuToggle();
          } else if (item.to) {
            navigate(item.to);
          }
        };

        return (
          <button
            key={item.key}
            onClick={handleTap}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative min-w-[48px]"
            style={{ color: active ? "hsl(var(--accent))" : "rgba(255,255,255,0.4)" }}
          >
            {item.icon ? (
              <div className="relative">
                <item.icon className="w-5 h-5" />
              </div>
            ) : null}
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                style={{ background: "hsl(var(--accent))" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
