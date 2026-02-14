import { Outlet } from "react-router-dom";

/**
 * DashboardModuleLayout — renders child routes for /dashboard/dashboard/*.
 * The sub-sidebar is already handled by NavDashSidebar's extended panel
 * when "Dashboard" is the active item, so this layout just passes through.
 */
export default function DashboardModuleLayout() {
  return <Outlet />;
}
