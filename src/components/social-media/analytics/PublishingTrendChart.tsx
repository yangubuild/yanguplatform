import { Card, CardContent } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { PublishingTrend } from "@/hooks/social/useOperationalAnalytics";

interface Props {
  data: PublishingTrend[];
}

export function PublishingTrendChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5), // MM-DD
  }));

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground mb-4">
          Publishing Trend
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="pubFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="failFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="published"
              stroke="hsl(var(--accent))"
              fill="url(#pubFill)"
              strokeWidth={2}
              name="Published"
            />
            <Area
              type="monotone"
              dataKey="failed"
              stroke="#ef4444"
              fill="url(#failFill)"
              strokeWidth={1.5}
              name="Failed"
            />
            <Area
              type="monotone"
              dataKey="scheduled"
              stroke="#f59e0b"
              fill="transparent"
              strokeWidth={1}
              strokeDasharray="4 2"
              name="Scheduled"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
