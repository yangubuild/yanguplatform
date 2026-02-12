import { Outlet, useLocation } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

const sectionLabels: Record<string, string> = {
  users: "Users",
  surfaces: "Surfaces",
  community: "Community (Promotions)",
  agents: "Agents",
  domains: "Domains",
  settings: "Settings",
  "audit-logs": "Audit Logs",
};

export function AdminShell() {
  const location = useLocation();
  const segments = location.pathname.replace(/^\/manage\/?/, "").split("/").filter(Boolean);
  const sectionSlug = segments[0] ?? "";
  const sectionTitle = sectionLabels[sectionSlug] ?? (sectionSlug ? sectionSlug.charAt(0).toUpperCase() + sectionSlug.slice(1) : "Dashboard");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-40 h-14 flex items-center justify-between border-b border-border bg-surface-elevated/80 backdrop-blur-sm px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {sectionSlug ? (
                      <BreadcrumbLink asChild>
                        <Link to="/manage">Management</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>Management</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {sectionSlug && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{sectionTitle}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {/* Right-side area reserved for future actions */}
            <div className="flex items-center gap-2" />
          </header>
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
