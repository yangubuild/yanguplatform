import { Suspense } from "react";
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
import { Bell, AlertTriangle, CheckCircle2, Globe, Mail, ServerCrash, FileWarning, Webhook, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRoles } from "@/hooks/useRoles";
import { UserMenu } from "./UserMenu";
import { usePlatformAlerts, useCriticalAlertCount } from "@/hooks/manage/useManageDashboardData";
import { useNavigate } from "react-router-dom";

function AdaAlertsButton() {
  const navigate = useNavigate();
  const { data, isLoading } = usePlatformAlerts();
  const criticalCount = useCriticalAlertCount();

  const auto = data?.auto_detected ?? { email_dlq_24h: 0, failed_publishes: 0 };
  const manualAlerts = data?.manual_alerts ?? [];

  // Build display items
  const items: Array<{ id: string; icon: typeof AlertTriangle; label: string; detail: string; severity: "error" | "warning" }> = [];
  if (auto.email_dlq_24h> 0) {
    items.push({ id: "dlq", icon: Mail, label: "Email DLQ", detail: `${auto.email_dlq_24h} failed in 24h`, severity: "error" });
  }
  if (auto.failed_publishes> 0) {
    items.push({ id: "pub", icon: Globe, label: "Publish failure", detail: `${auto.failed_publishes} failed`, severity: "error" });
  }
  if ((auto as any).failed_webhooks_24h> 0) {
    items.push({ id: "whk", icon: Webhook, label: "Webhook failures", detail: `${(auto as any).failed_webhooks_24h} failed in 24h`, severity: "error" });
  }
  if ((auto as any).stuck_jobs> 0) {
    items.push({ id: "jobs", icon: Clock, label: "Stuck jobs", detail: `${(auto as any).stuck_jobs} stuck`, severity: "warning" });
  }
  manualAlerts.slice(0, 5).forEach((a) => {
    items.push({
      id: a.id,
      icon: a.severity === "critical" ? ServerCrash : FileWarning,
      label: a.title,
      detail: a.detail ?? "",
      severity: a.severity === "critical" ? "error" : "warning",
    });
  });

  const totalCount = items.length;
  const hasCritical = criticalCount> 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] transition-colors">
          {hasCritical ? (
            <AlertTriangle className="h-5 w-5 text-[hsl(0,72%,51%)] animate-pulse" />
          ) : (
            <Bell className="h-5 w-5 text-[hsl(var(--admin-text-muted))]" />
          )}
          {totalCount> 0 && (
            <span className={`absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-[hsl(var(--admin-bg))] ${hasCritical ? "bg-[hsl(0,72%,51%)] text-foreground" : "bg-[hsl(24,95%,53%)] text-foreground"}`}>
              {totalCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 admin-glass-card border-[hsl(var(--admin-border)/0.5)]">
        <div className="px-4 py-3 border-b border-[hsl(var(--admin-border)/0.4)] flex items-center justify-between">
          <p className="text-sm font-semibold text-[hsl(var(--admin-text))]" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>Platform Alerts</p>
          {totalCount> 0 && (
            <Badge variant="outline" className={`text-[10px] border-[hsl(var(--admin-border)/0.5)] ${hasCritical ? "text-[hsl(0,72%,51%)]" : "text-[hsl(24,95%,53%)]"}`}>
              {totalCount}
            </Badge>
          )}
        </div>
        <div className="divide-y divide-[hsl(var(--admin-border)/0.3)]">
          {items.length === 0 ? (
            <div className="px-4 py-4 flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-[hsl(160,84%,45%)]" />
              <p className="text-xs text-[hsl(var(--admin-text-muted))]">No active issues</p>
            </div>
          ) : (
            items.map((a) => (
              <button
                key={a.id}
                className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-[hsl(var(--admin-surface-elevated)/0.3)] transition-colors text-left"
                onClick={() => navigate(manageLink("alerts-security"))}>
                <div className={`p-1.5 rounded-md shrink-0 ${a.severity === "error" ? "bg-[hsl(0,72%,51%,0.12)]" : "bg-[hsl(38,92%,50%,0.12)]"}`}>
                  <a.icon className={`h-4 w-4 ${a.severity === "error" ? "text-[hsl(0,72%,51%)]" : "text-[hsl(38,92%,55%)]"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[hsl(var(--admin-text))]">{a.label}</p>
                  <p className="text-[11px] text-[hsl(var(--admin-text-muted))] truncate">{a.detail}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// RoleBadge removed — UserMenu now handles role display

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
                    {segments.length> 0 ? (
                      <BreadcrumbLink asChild>
                        <Link to={manageLink("")} className="text-[hsl(var(--admin-text-muted))] hover:text-[hsl(24,95%,53%)] transition-colors text-sm">Management</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-[hsl(var(--admin-text))] text-sm">Management</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {segments.length> 0 && (
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
              {isAdmin && <AdaAlertsButton />}
              <UserMenu />
            </div>
          </header>
          {/* Main Content Canvas */}
          <main className="flex-1 p-6 lg:p-8">
            <Suspense fallback={<div className="flex items-center justify-center py-24"><img src="/yangu-y-loader.png" alt="Loading" width={36} height={36} style={{ animation: "spin 1.4s linear infinite" }} /></div>}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
