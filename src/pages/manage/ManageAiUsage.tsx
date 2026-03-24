import { useState } from "react";
import { AdminGlassCard, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Image, Video, Activity, TrendingUp, AlertTriangle, Users,
} from "lucide-react";
import { useManageAiUsage, type TopUser, type DailyTrend } from "@/hooks/manage/useManageAiUsage";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
] as const;

export default function ManageAiUsage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useManageAiUsage(days);

  const imgStats = data?.image_stats ?? { total: 0, completed: 0, failed: 0, pending: 0 };
  const vidStats = data?.video_stats ?? { total: 0, completed: 0, failed: 0, pending: 0 };
  const topUsers = data?.top_users ?? [];
  const trend = data?.daily_trend ?? [];

  const formattedTrend = trend.map((d) => ({
    ...d,
    day: new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));

  const userColumns: AdminColumn<TopUser>[] = [
    {
      key: "email",
      header: "User",
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{r.username ? `@${r.username}` : "—"}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[160px]">{r.email ?? "—"}</span>
        </div>
      ),
    },
    { key: "image_count", header: "Images", render: (r) => <span className="text-sm font-mono">{r.image_count}</span> },
    { key: "video_count", header: "Videos", render: (r) => <span className="text-sm font-mono">{r.video_count}</span> },
    {
      key: "total_generations",
      header: "Total",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{r.total_generations}</span>
          {r.total_generations > 50 && (
            <Badge variant="destructive" className="text-[10px] px-1.5">High Usage</Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-3">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminMetricCard icon={<Image className="h-4 w-4" />} label="Images Generated" value={imgStats.total} trend={<span className="text-xs text-muted-foreground">{imgStats.failed} failed</span>} />
        <AdminMetricCard icon={<Video className="h-4 w-4" />} label="Videos Generated" value={vidStats.total} trend={<span className="text-xs text-muted-foreground">{vidStats.failed} failed</span>} />
        <AdminMetricCard icon={<Activity className="h-4 w-4" />} label="Total Generations" value={imgStats.total + vidStats.total} />
        <AdminMetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Total Failures" value={imgStats.failed + vidStats.failed} />
      </div>

      {/* Trend chart */}
      {formattedTrend.length > 0 && (
        <AdminGlassCard className="p-4">
          <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Daily Generation Trend</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--admin-text-muted))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--admin-text-muted))" }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="images" stackId="1" stroke="hsl(var(--admin-accent))" fill="hsl(var(--admin-accent))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="videos" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminGlassCard>
      )}

      {/* Top Users */}
      <AdminGlassCard className="p-4">
        <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Top Users by Generation Volume</p>
        <AdminTable columns={userColumns} data={topUsers} loading={isLoading} rowKey={(r) => r.user_id} />
      </AdminGlassCard>
    </div>
  );
}
