import { useState } from "react";
import { NavDashSidebar } from "./NavDashSidebar";
import { NavDashHeader } from "./NavDashHeader";
import { NavDashPromoCards } from "./NavDashPromoCards";

export function NavigationDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      />

      <div className="pt-16 lg:ml-[260px]">
        <NavDashPromoCards />
      </div>
    </div>
  );
}
