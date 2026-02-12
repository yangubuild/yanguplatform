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
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold">ADA Alerts</p>
          <Badge variant="outline" className="text-[10px]">{mockAdaAlerts.length}</Badge>
        </div>
        <div className="divide-y divide-border">
          {mockAdaAlerts.map((a) => (
            <div key={a.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-muted/50 transition-colors">
              <div className={`p-1.5 rounded-md shrink-0 ${a.severity === "error" ? "bg-destructive/10" : "bg-warning/10"}`}>
                <a.icon className={`h-4 w-4 ${a.severity === "error" ? "text-destructive" : "text-warning"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium">{a.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{a.detail}</p>
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
    <Badge variant="outline" className="text-[10px] font-medium">
      Role: {label}
    </Badge>
  );
}

export function AdminShell() {
  const location = useLocation();
  const { isAdmin } = useRoles();
  const tail = location.pathname.replace(/^\/manage\/?/, "");
  const segments = tail.split("/").filter(Boolean);

  const fullSlug = segments.join("/");
  const sectionTitle =
    sectionLabels[fullSlug] ??
    sectionLabels[segments[0] ?? ""] ??
    (segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : "Dashboard");

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
                    {segments.length > 0 ? (
                      <BreadcrumbLink asChild>
                        <Link to="/manage">Management</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>Management</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {segments.length > 0 && (
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
            <div className="flex items-center gap-3">
              <RoleBadge />
              {isAdmin && <AdaAlertsButton />}
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
