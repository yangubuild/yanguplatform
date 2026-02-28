import { useState, type CSSProperties } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavDashSidebar } from "./NavDashSidebar";
import { NavDashHeader } from "./NavDashHeader";
import { LegacyDashboardHeader } from "./LegacyDashboardHeader";
import { LegacyDashboardSidebar } from "./LegacyDashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const RAIL_WIDTH = 60;
const FULL_WIDTH = 260;
const EXTENDED_WIDTH = 260;
const EXTENDED_ITEMS = ["Visionaire", "Dashboard"];
const LEGACY_HEADER_HEIGHT = 52;

export function NavigationDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Offers");
  const isMobile = useIsMobile();
  const location = useLocation();

  const isLegacyDashboardHome = location.pathname === "/dashboard";

  if (isLegacyDashboardHome) {
    const legacyShellStyle: CSSProperties = {
      background: "hsl(220 26% 6%)",
      ["--dashboard-shell-header-height" as any]: `${LEGACY_HEADER_HEIGHT}px`,
    };

    return (
      <div className="h-screen w-full overflow-hidden" style={legacyShellStyle}>
        <LegacyDashboardHeader />
        <div className="h-[calc(100vh-52px)] flex overflow-hidden">
          <LegacyDashboardSidebar />
          <div className="flex-1 min-w-0 overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  const hasExtended = EXTENDED_ITEMS.includes(activeItem);
  const totalWidth = hasExtended ? RAIL_WIDTH + EXTENDED_WIDTH : FULL_WIDTH;

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #1f262b 0%, #232a30 100%)",
      }}
    >
      <NavDashHeader onMenuToggle={() => setSidebarOpen((p) => !p)} />
      <NavDashSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onActiveChange={setActiveItem}
      />

      <div
        className="pt-16 transition-all duration-300 min-h-[calc(100vh-64px)] overflow-y-auto"
        style={{ marginLeft: isMobile ? 0 : totalWidth }}
      >
        {/* Routed outlet — all /dashboard/* pages render here */}
        <Outlet />
      </div>
    </div>
  );
}

