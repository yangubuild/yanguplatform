import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AdaGlassModuleProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export function AdaGlassModule({ title, icon: Icon, children, className, headerRight }: AdaGlassModuleProps) {
  return (
    <div className={cn(
      "rounded-lg border border-[hsl(var(--admin-border)/0.4)] bg-[hsl(var(--admin-surface)/0.6)] backdrop-blur-md p-5",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[hsl(25,85%,45%,0.12)]">
            <Icon className="h-4 w-4 text-[hsl(25,85%,45%)]" />
          </div>
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
            {title}
          </h3>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  severity?: "default" | "success" | "warning" | "error";
}

export function KpiCard({ label, value, icon: Icon, trend, severity = "default" }: KpiCardProps) {
  const sevColor = {
    default: "text-[hsl(var(--admin-text))]",
    success: "text-[hsl(160,84%,39%)]",
    warning: "text-[hsl(38,92%,50%)]",
    error: "text-[hsl(0,72%,51%)]",
  }[severity];

  return (
    <div className="rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.4)] p-3">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-[hsl(var(--admin-text-muted))]" />}
        <span className="text-[11px] text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-xl font-bold", sevColor)}>{value}</p>
      {trend && <p className="text-[10px] text-[hsl(var(--admin-text-muted))] mt-0.5">{trend}</p>}
    </div>
  );
}
