import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const chartConfig = {
  views: { label: "Views", color: "hsl(var(--primary))" },
  visitors: { label: "Visitors", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

interface Props {
  data: Array<{ day: string; views: number; visitors: number }>;
}

// Lazy-loaded chart — recharts is heavy, only pulled in when this renders.
export default function AnalyticsTrafficChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="views"
          stroke="hsl(var(--primary))"
          fill="url(#viewsFill)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="visitors"
          stroke="hsl(var(--muted-foreground))"
          fillOpacity={0}
          strokeWidth={1.5}
        />
      </AreaChart>
    </ChartContainer>
  );
}