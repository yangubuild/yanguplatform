import { Card, CardContent } from "@/components/ui/card";
import type { FailureBreakdown } from "@/hooks/social/useOperationalAnalytics";

interface Props {
  data: FailureBreakdown[];
}

const REASON_COLORS: Record<string, string> = {
  "Auth Expired": "bg-amber-500",
  "Invalid Media": "bg-orange-500",
  "Rate Limited": "bg-yellow-500",
  "Timeout": "bg-blue-500",
  "Unsupported Format": "bg-purple-500",
  "Rejected by Platform": "bg-red-500",
  "Provider Outage": "bg-red-700",
  "Other": "bg-muted-foreground",
  "Unknown": "bg-muted-foreground",
};

export function FailureBreakdownChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground mb-4">
          Failure Reasons
        </p>
        <div className="space-y-2.5">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            const color = REASON_COLORS[item.reason] || "bg-muted-foreground";
            return (
              <div key={item.reason}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground">{item.reason}</span>
                  <span className="text-muted-foreground">{item.count} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
