import { useState } from "react";
import { Outlet } from "react-router-dom";
import { NavDashSidebar } from "./NavDashSidebar";
import { NavDashHeader } from "./NavDashHeader";
import { useIsMobile } from "@/hooks/use-mobile";

const RAIL_WIDTH = 60;
const FULL_WIDTH = 260;
const EXTENDED_WIDTH = 260;
const EXTENDED_ITEMS = ["Visionaire", "Dashboard"];

export function NavigationDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Offers");
  const isMobile = useIsMobile();

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
