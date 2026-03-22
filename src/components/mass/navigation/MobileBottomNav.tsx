import { useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, MessageCircle, Menu } from "lucide-react";
import adaIcon from "@/assets/ada-icon.png";
import { useUnreadDmCount } from "@/hooks/useUnreadMessages";

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home, to: "/dashboard/home" },
  { key: "discover", label: "Discover", icon: Compass, to: "/dashboard/explore" },
  { key: "messages", label: "Messages", icon: MessageCircle, to: "/dashboard/messages" },
  { key: "ada", label: "Ada", icon: null, to: "/dashboard/ada" },
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
  const { data: unreadDmCount = 0 } = useUnreadDmCount();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around lg:hidden"
      style={{
        height: 56,
        background: "linear-gradient(180deg, #1f262b 0%, #1a2025 100%)",
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
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
            style={{ color: active ? "hsl(var(--accent))" : "rgba(255,255,255,0.4)" }}
          >
            {item.key === "ada" ? (
              <img
                src={adaIcon}
                alt="Ada"
                className="w-5 h-5 object-contain"
                style={{
                  filter: active ? "brightness(1.3)" : "grayscale(0.6) opacity(0.5)",
                }}
              />
            ) : item.icon ? (
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.key === "messages" && unreadDmCount > 0 && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[8px] font-bold text-white px-0.5"
                    style={{ background: "#ef4444" }}
                  >
                    {unreadDmCount > 9 ? "9+" : unreadDmCount}
                  </span>
                )}
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
