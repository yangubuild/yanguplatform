import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSurfaceAnalytics, useSurfacePublishHistory } from "@/hooks/useSurfaceAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ResponsiveContainer,
} from "recharts";
import { Eye, Users, MousePointerClick, Loader2, ExternalLink } from "lucide-react";

const RANGES: Array<{ label: string; days: number }> = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

const chartConfig = {
  views: { label: "Views", color: "hsl(var(--primary))" },
  visitors: { label: "Visitors", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold text-foreground">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SurfaceAnalyticsPage() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const [days, setDays] = useState(30);

  const { data: surface } = useQuery({
    queryKey: ["surface_meta", surfaceId],
    enabled: !!surfaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("builder_surfaces")
        .select("id, title, surface_type, status")
        .eq("id", surfaceId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useSurfaceAnalytics(surfaceId, days);
  const { data: history = [] } = useSurfacePublishHistory(surfaceId);

  const dailySeries = useMemo(
    () => (data?.daily ?? []).map((d) => ({ ...d, day: d.day.slice(5) })),
    [data],
  );

  if (!surfaceId) {
    return <div className="p-6 text-muted-foreground">Missing surface id.</div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Analytics</div>
          <h1 className="text-2xl font-semibold text-foreground">
            {surface?.title || "Surface"}
          </h1>
          <div className="text-xs text-muted-foreground capitalize mt-0.5">
            {(surface?.surface_type || "").replace(/_/g, " ")} · {surface?.status ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? "default" : "outline"}
              onClick={() => setDays(r.days)}
              className="rounded-lg"
            >
              {r.label}
            </Button>
          ))}
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <Link to={`/builder/${surfaceId}`}>Open editor</Link>
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat icon={<Eye className="h-5 w-5" />} label="Views" value={data?.totals.views ?? 0} />
            <Stat icon={<Users className="h-5 w-5" />} label="Unique visitors" value={data?.totals.visitors ?? 0} />
            <Stat icon={<MousePointerClick className="h-5 w-5" />} label="Link clicks" value={data?.totals.clicks ?? 0} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Traffic — last {days} days</CardTitle>
            </CardHeader>
            <CardContent>
              {dailySeries.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                  No views recorded in this period.
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <AreaChart data={dailySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top referrers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(data?.referrers ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No referrer data yet.</div>
                ) : (
                  data!.referrers.map((r) => (
                    <div key={r.referrer} className="flex items-center justify-between text-sm">
                      <span className="truncate text-foreground max-w-[70%]" title={r.referrer}>
                        {r.referrer}
                      </span>
                      <span className="text-muted-foreground tabular-nums">{r.n}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(data?.paths ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No page data yet.</div>
                ) : (
                  data!.paths.map((p) => (
                    <div key={p.path} className="flex items-center justify-between text-sm">
                      <span className="font-mono truncate text-foreground max-w-[70%]" title={p.path}>
                        {p.path}
                      </span>
                      <span className="text-muted-foreground tabular-nums">{p.n}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top link clicks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.top_clicks ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No outbound clicks recorded yet.</div>
              ) : (
                data!.top_clicks.map((c, i) => (
                  <div key={`${c.target_url}-${i}`} className="flex items-center justify-between text-sm gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate text-foreground" title={c.target_url}>
                        {c.label || c.target_url}
                      </span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">{c.n}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Publish history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">Not published yet.</div>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">v{h.version ?? "—"} · {h.state}</span>
                    <span className="text-muted-foreground">
                      {h.published_at ? new Date(h.published_at).toLocaleString() : "—"}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}