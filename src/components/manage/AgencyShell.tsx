import { Suspense } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { AgencySidebar } from "./AgencySidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { agencySectionLabels } from "./agencyNavConfig";
import { UserMenu } from "./UserMenu";

export function AgencyShell() {
  const location = useLocation();
  // Root-level routes: strip leading slash to get segment
  const segments = location.pathname.split("/").filter(Boolean);
  const sectionTitle = agencySectionLabels[segments.join("/")] ?? agencySectionLabels[segments[0] ?? ""] ?? (segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : "Dashboard");

  return (
    <SidebarProvider>
      <div className="admin-shell flex w-full min-h-screen">
        <AgencySidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="admin-glass-header sticky top-0 z-40 h-14 flex items-center justify-between px-3 sm:px-4 lg:px-6">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <SidebarTrigger className="lg:hidden text-[hsl(var(--admin-text-muted))] shrink-0" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {segments.length > 0 ? (
                      <BreadcrumbLink asChild>
                        <Link to="/" className="text-[hsl(var(--admin-text-muted))] hover:text-[hsl(24,95%,53%)] transition-colors text-sm">Agency</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-[hsl(var(--admin-text))] text-sm">Agency</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {segments.length > 0 && (
                    <>
                      <BreadcrumbSeparator className="text-[hsl(var(--admin-text-muted))]" />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-[hsl(var(--admin-text))] text-sm truncate max-w-[200px]">{sectionTitle}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Suspense fallback={<div className="flex items-center justify-center py-24"><img src="/yangu-y-loader.png" alt="Loading" width={36} height={36} style={{ animation: "spin 1.4s linear infinite" }} /></div>}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
