import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Link2,
  AlertTriangle,
} from "lucide-react";
import type { OperationalMetrics } from "@/hooks/social/useOperationalAnalytics";

interface Props {
  metrics: OperationalMetrics;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  subtitle?: string;
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-4 h-4 ${iconColor || "text-muted-foreground"}`} />
        </div>
        <p className="text-2xl font-bold text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
          {label}
        </p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function OperationalSummaryCards({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <MetricCard
        label="Generated"
        value={metrics.generatedPosts}
        icon={FileText}
        iconColor="text-blue-400"
      />
      <MetricCard
        label="Scheduled"
        value={metrics.scheduledPosts}
        icon={Clock}
        iconColor="text-amber-400"
      />
      <MetricCard
        label="Published"
        value={metrics.publishedPosts}
        icon={CheckCircle2}
        iconColor="text-emerald-500"
      />
      <MetricCard
        label="Failed"
        value={metrics.failedPosts}
        icon={XCircle}
        iconColor="text-red-400"
      />
      <MetricCard
        label="Success Rate"
        value={`${metrics.successRate}%`}
        icon={TrendingUp}
        iconColor="text-accent"
      />
      <MetricCard
        label="Connected"
        value={metrics.connectedAccounts}
        icon={Link2}
        iconColor="text-accent"
        subtitle={
          metrics.expiredAccounts > 0
            ? `${metrics.expiredAccounts} need reconnect`
            : undefined
        }
      />
    </div>
  );
}
