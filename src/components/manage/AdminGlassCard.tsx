import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/** Reusable glass card for all admin module content blocks */
export function AdminGlassCard({ className, children, ...props }: AdminGlassCardProps) {
  return (
    <div className={cn("admin-glass-card p-5", className)} {...props}>
      {children}
    </div>
  );
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/** Consistent page header for every admin module */
export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-[hsl(var(--admin-text))]"
          style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[hsl(var(--admin-text-muted))] mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 mt-3 sm:mt-0">{actions}</div>}
    </div>
  );
}

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}

/** Small glass metric card for dashboard-style top rows */
export function AdminMetricCard({ label, value, icon, trend }: AdminMetricCardProps) {
  return (
    <div className="admin-glass-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">{label}</span>
        {icon && <div className="text-[hsl(24,95%,53%)]">{icon}</div>}
      </div>
      <div className="flex items-end gap-2">
        <span
          className="text-2xl font-bold text-[hsl(var(--admin-text))]"
          style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
          {value}
        </span>
        {trend}
      </div>
    </div>
  );
}
