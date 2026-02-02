import * as React from "react";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  topbar?: React.ReactNode;
  className?: string;
}

/**
 * AppShell - Main application layout with sidebar and topbar
 * Use this for authenticated/dashboard pages
 */
export function AppShell({ children, sidebar, topbar, className }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className={cn("min-h-screen flex w-full bg-background", className)}>
        {sidebar}
        <div className="flex flex-1 flex-col min-w-0">
          {topbar && (
            <header className="sticky top-0 z-40 h-14 flex items-center gap-4 border-b border-border bg-surface-elevated/80 backdrop-blur-sm px-4 lg:px-6">
              <SidebarTrigger className="lg:hidden" />
              {topbar}
            </header>
          )}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

interface TopBarProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * TopBar - Topbar content wrapper
 */
export function TopBar({ children, className }: TopBarProps) {
  return (
    <div className={cn("flex flex-1 items-center justify-between gap-4", className)}>
      {children}
    </div>
  );
}
