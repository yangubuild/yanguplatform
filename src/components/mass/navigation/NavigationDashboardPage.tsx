import { useState, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavDashSidebar } from "./NavDashSidebar";
import { NavDashHeader } from "./NavDashHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { YanguLoader } from "@/components/YanguLoader";
import { YanguAmbientGlow } from "@/components/brand/YanguAmbientGlow";


const RAIL_WIDTH = 60;
const FULL_WIDTH = 260;
const EXTENDED_WIDTH = 260;
const HOME_AREA = [
  "/dashboard/home", "/dashboard/my-apps", "/dashboard/my-business",
  "/dashboard/payment-settings", "/dashboard/invoices", "/dashboard/social-media",
  "/dashboard/ads", "/dashboard/affiliates", "/dashboard/profile", "/dashboard/agency",
];

export function NavigationDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Offers");
  const isMobile = useIsMobile();
  const location = useLocation();

  const onHomeArea =
    location.pathname === "/dashboard" || HOME_AREA.some((p) => location.pathname.startsWith(p));
  const hasExtended = activeItem === "Home" && onHomeArea;
  const totalWidth = hasExtended ? RAIL_WIDTH + EXTENDED_WIDTH : FULL_WIDTH;

  return (
    <div
      className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      {/* Global lower orange/green ambient light (yangu.io identity) — one
          continuous field behind the whole authenticated shell. */}
      <YanguAmbientGlow className="fixed h-[36vh]" />

      <NavDashHeader onMenuToggle={() => setSidebarOpen((p) => !p)} />
      <NavDashSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onActiveChange={setActiveItem}
      />

      <div
        className="relative z-10 mt-16 transition-all duration-300 min-h-[calc(100vh-64px)] overflow-y-auto"
        style={{
          marginLeft: isMobile ? 0 : totalWidth,
          paddingBottom: isMobile ? "calc(56px + env(safe-area-inset-bottom, 0px))" : 0 }}>
        <Suspense fallback={<YanguLoader size={36} />}>
          <Outlet />
        </Suspense>
      </div>

      {/* Ambient light painted ABOVE opaque page backgrounds (screen blend,
          pointer-events none) so every route inherits the same field even when
          the page paints its own background. */}
      <YanguAmbientGlow variant="overlay" className="z-[30]" />

      {/* Mobile bottom navigation — hidden on desktop (lg+) */}
      <MobileBottomNav onMenuToggle={() => setSidebarOpen((p) => !p)} />
    </div>
  );
}

