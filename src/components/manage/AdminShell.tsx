import { Outlet, useLocation, Link } from "react-router-dom";
import { getManageSlug, manageLink } from "@/lib/routing/managePathUtils";
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
import { sectionLabels } from "./adminNavConfig";
import { Bell, FileWarning, ServerCrash, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRoles } from "@/hooks/useRoles";

const mockAdaAlerts = [
  { id: "1", icon: FileWarning, label: "Content flagged", detail: "Blog post #412 needs review", severity: "warning" as const },
  { id: "2", icon: ServerCrash, label: "System anomaly", detail: "5xx spike on payments API", severity: "error" as const },
  { id: "3", icon: CreditCard, label: "Payment risk", detail: "Chargeback dispute #9102", severity: "warning" as const },
];

function AdaAlertsButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] transition-colors">
          <Bell className="h-5 w-5 text-[hsl(var(--admin-text-muted))]" />
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-[hsl(24,95%,53%)] ring-2 ring-[hsl(var(--admin-bg))]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 admin-glass-card border-[hsl(var(--admin-border)/0.5)]">
        <div className="px-4 py-3 border-b border-[hsl(var(--admin-border)/0.4)] flex items-center justify-between">
          <p className="text-sm font-semibold text-[hsl(var(--admin-text))]" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>ADA Alerts</p>
          <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.5)] text-[hsl(24,95%,53%)]">{mockAdaAlerts.length}</Badge>
        </div>
        <div className="divide-y divide-[hsl(var(--admin-border)/0.3)]">
          {mockAdaAlerts.map((a) => (
            <div key={a.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-[hsl(var(--admin-surface-elevated)/0.3)] transition-colors">
              <div className={`p-1.5 rounded-md shrink-0 ${a.severity === "error" ? "bg-[hsl(0,72%,51%,0.12)]" : "bg-[hsl(38,92%,50%,0.12)]"}`}>
                <a.icon className={`h-4 w-4 ${a.severity === "error" ? "text-[hsl(0,72%,51%)]" : "text-[hsl(38,92%,55%)]"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[hsl(var(--admin-text))]">{a.label}</p>
                <p className="text-[11px] text-[hsl(var(--admin-text-muted))] truncate">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RoleBadge() {
  const { isAdmin, isContentEditor } = useRoles();
  const label = isAdmin ? "Admin" : isContentEditor ? "Content Editor" : null;
  if (!label) return null;
  return (
    <Badge variant="outline" className="text-[10px] font-medium border-[hsl(var(--admin-border)/0.5)] text-[hsl(var(--admin-text-muted))]">
      Role: {label}
    </Badge>
  );
}

export function AdminShell() {
  const location = useLocation();
  const { isAdmin } = useRoles();
  const tail = getManageSlug(location.pathname);
  const segments = tail.split("/").filter(Boolean);

  const fullSlug = segments.join("/");
  const sectionTitle =
    sectionLabels[fullSlug] ??
    sectionLabels[segments[0] ?? ""] ??
    (segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : "Dashboard");

  return (
    <SidebarProvider>
      <div className="admin-shell flex w-full">
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          {/* Glass Header */}
          <header className="admin-glass-header sticky top-0 z-40 h-14 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden text-[hsl(var(--admin-text-muted))]" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {segments.length > 0 ? (
                      <BreadcrumbLink asChild>
                        <Link to={manageLink("")} className="text-[hsl(var(--admin-text-muted))] hover:text-[hsl(24,95%,53%)] transition-colors text-sm">Management</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-[hsl(var(--admin-text))] text-sm">Management</BreadcrumbPage>
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
              <RoleBadge />
              {isAdmin && <AdaAlertsButton />}
            </div>
          </header>
          {/* Main Content Canvas */}
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
