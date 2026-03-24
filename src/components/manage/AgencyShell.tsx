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
import { useRoles } from "@/hooks/useRoles";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Users } from "lucide-react";

function AgencyRoleBadge() {
  const { isAgencyAdmin, isAgencyManager, isFootSoldier, isAdmin } = useRoles();
  let label = "Agent";
  let Icon = Users;
  if (isAdmin) { label = "Platform Admin"; Icon = Shield; }
  else if (isAgencyAdmin) { label = "Agency Admin"; Icon = Building2; }
  else if (isAgencyManager) { label = "Agency Manager"; Icon = Users; }
  else if (isFootSoldier) { label = "Foot Soldier"; Icon = Users; }

  return (
    <Badge variant="outline" className="text-[10px] font-medium border-[hsl(var(--admin-border)/0.5)] text-[hsl(var(--admin-text-muted))] flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function AgencyShell() {
  const location = useLocation();
  const agencyPath = location.pathname.replace(/^\/agency\/?/, "");
  const segments = agencyPath.split("/").filter(Boolean);
  const sectionTitle = agencySectionLabels[segments.join("/")] ?? agencySectionLabels[segments[0] ?? ""] ?? (segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : "Dashboard");

  return (
    <SidebarProvider>
      <div className="admin-shell flex w-full">
        <AgencySidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="admin-glass-header sticky top-0 z-40 h-14 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden text-[hsl(var(--admin-text-muted))]" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {segments.length > 0 ? (
                      <BreadcrumbLink asChild>
                        <Link to="/agency" className="text-[hsl(var(--admin-text-muted))] hover:text-[hsl(24,95%,53%)] transition-colors text-sm">Agency</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-[hsl(var(--admin-text))] text-sm">Agency</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {segments.length > 0 && (
                    <>
                      <BreadcrumbSeparator className="text-[hsl(var(--admin-text-muted))]" />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-[hsl(var(--admin-text))] text-sm">{sectionTitle}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-3">
              <AgencyRoleBadge />
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
