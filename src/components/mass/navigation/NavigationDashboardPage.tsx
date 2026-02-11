import { useState } from "react";
import { NavDashSidebar, ICON_RAIL_W } from "./NavDashSidebar";
import { NavDashHeader } from "./NavDashHeader";
import { NavDashPromoCards } from "./NavDashPromoCards";

export function NavigationDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(ICON_RAIL_W);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #1f262b 0%, #232a30 100%)",
      }}
    >
      <NavDashHeader onMenuToggle={() => setSidebarOpen((p) => !p)} />
      <NavDashSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onWidthChange={setSidebarWidth}
      />

      <div
        className="pt-16 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <NavDashPromoCards />
      </div>
    </div>
  );
}
