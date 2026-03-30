import { Card, CardContent } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { PlatformBreakdown } from "@/hooks/social/useOperationalAnalytics";

interface Props {
  data: PlatformBreakdown[];
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  instagram_story: "IG Story",
  x: "X",
  linkedin_company: "LinkedIn Co.",
  linkedin_personal: "LinkedIn",
  tiktok: "TikTok",
};

export function PlatformBreakdownChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    name: PLATFORM_LABELS[d.platform] || d.platform,
  }));

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground mb-4">
          By Platform
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={formatted} barGap={2}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={25}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
            <Bar dataKey="published" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} name="Published" />
            <Bar dataKey="scheduled" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Scheduled" />
            <Bar dataKey="failed" fill="#ef4444" radius={[3, 3, 0, 0]} name="Failed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
