import { useState } from "react";
import { NavDashSidebar } from "./NavDashSidebar";
import { NavDashHeader } from "./NavDashHeader";
import { NavDashPromoCards } from "./NavDashPromoCards";

export function NavigationDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#0E1116" }}>
      <NavDashSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-[220px]">
        <NavDashHeader onMenuToggle={() => setSidebarOpen((p) => !p)} />
        <NavDashPromoCards />
      </div>
    </div>
  );
}
