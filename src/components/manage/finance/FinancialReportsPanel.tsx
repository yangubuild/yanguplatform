import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface ReportMetric {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

const MOCK_METRICS: ReportMetric[] = [
  { label: "MRR", value: "$0", change: "—", isPositive: true },
  { label: "ARR", value: "$0", change: "—", isPositive: true },
  { label: "Total Commissions", value: "$0", change: "—", isPositive: false },
  { label: "Avg Revenue/User", value: "$0", change: "—", isPositive: true },
];

export function FinancialReportsPanel() {
  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileBarChart className="h-4 w-4 text-[hsl(24,95%,53%)]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Financial Reports</h3>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Download className="h-3.5 w-3.5 mr-1" />Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {MOCK_METRICS.map(metric => (
          <div key={metric.label} className="rounded-lg border border-border bg-card/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-lg font-bold text-foreground">{metric.value}</span>
              <span className={`text-[10px] flex items-center gap-0.5 ${
                metric.isPositive ? "text-green-500" : "text-destructive"
              }`}>
                {metric.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Available Reports</h4>
        {["Monthly Revenue Breakdown", "Commission Summary", "Subscription Churn", "Payout History"].map(report => (
          <div key={report} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground">{report}</span>
            </div>
            <Badge variant="outline" className="text-[9px] text-muted-foreground">
              Backend not connected
            </Badge>
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}
