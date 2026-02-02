import { Store, Package, Globe, Palette, Radio, Users, type LucideIcon } from "lucide-react";
import type { Subdomain } from "@/config/platform";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Store,
  Package,
  Globe,
  Palette,
  Radio,
  Users,
};

const colorMap: Record<string, string> = {
  emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 group-hover:border-emerald-500/40",
  blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 group-hover:border-blue-500/40",
  violet: "from-violet-500/20 to-violet-500/5 border-violet-500/20 group-hover:border-violet-500/40",
  amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 group-hover:border-amber-500/40",
  rose: "from-rose-500/20 to-rose-500/5 border-rose-500/20 group-hover:border-rose-500/40",
  cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 group-hover:border-cyan-500/40",
};

const iconColorMap: Record<string, string> = {
  emerald: "text-emerald-500",
  blue: "text-blue-500",
  violet: "text-violet-500",
  amber: "text-amber-500",
  rose: "text-rose-500",
  cyan: "text-cyan-500",
};

interface SurfaceCardProps {
  surface: Subdomain;
  index: number;
}

export function SurfaceCard({ surface, index }: SurfaceCardProps) {
  const Icon = iconMap[surface.icon] || Globe;
  const gradientClasses = colorMap[surface.color] || colorMap.blue;
  const iconClasses = iconColorMap[surface.color] || iconColorMap.blue;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-gradient-to-b p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer",
        gradientClasses
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Icon */}
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-card", iconClasses)}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <h3 className="mb-2 text-lg font-semibold">{surface.label}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{surface.description}</p>

      {/* Domain preview */}
      <div className="mt-auto">
        <code className="rounded-md bg-card px-3 py-1.5 text-xs font-mono text-muted-foreground">
          yourname.{surface.domain}
        </code>
      </div>
    </div>
  );
}
