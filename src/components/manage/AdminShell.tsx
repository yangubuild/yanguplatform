import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AdminShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-40 h-14 flex items-center gap-4 border-b border-border bg-surface-elevated/80 backdrop-blur-sm px-4 lg:px-6">
            <SidebarTrigger className="lg:hidden" />
            <h1 className="text-lg font-semibold text-foreground">Management</h1>
          </header>
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
