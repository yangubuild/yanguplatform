import { useState } from "react";
import { BarChart3, Eye, MousePointerClick, TrendingUp, Shield, Layers, Image } from "lucide-react";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { useExploreAnalytics, type ExploreAnalyticsData } from "@/hooks/manage/useExploreAnalytics";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const PERIOD_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <AdminGlassCard className="p-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
        <Icon className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[hsl(var(--admin-text-muted))] truncate">{label}</p>
        <p className="text-lg font-semibold text-[hsl(var(--admin-text))] font-display">{value}</p>
        {sub && <p className="text-xs text-[hsl(var(--admin-text-muted))]">{sub}</p>}
      </div>
    </AdminGlassCard>
  );
}

function SurfaceTable({ data }: { data: ExploreAnalyticsData["impressions_by_surface"] }) {
  if (!data?.length) return <p className="text-xs text-[hsl(var(--admin-text-muted))]">No surface data yet</p>;
  return (
    <AdminGlassCard className="p-4">
      <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Impressions & CTR by Surface</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[hsl(var(--admin-text-muted))] border-b border-[hsl(var(--admin-border)/0.3)]">
              <th className="text-left py-2 pr-4">Surface</th>
              <th className="text-right py-2 px-2">Impressions</th>
              <th className="text-right py-2 px-2">Clicks</th>
              <th className="text-right py-2 pl-2">CTR</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const ctr = row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : "0.00";
              return (
                <tr key={row.surface} className="border-b border-[hsl(var(--admin-border)/0.1)]">
                  <td className="py-2 pr-4 text-[hsl(var(--admin-text))]">{row.surface}</td>
                  <td className="py-2 px-2 text-right text-[hsl(var(--admin-text-muted))]">{row.impressions}</td>
                  <td className="py-2 px-2 text-right text-[hsl(var(--admin-text-muted))]">{row.clicks}</td>
                  <td className="py-2 pl-2 text-right font-medium text-[hsl(var(--admin-accent))]">{ctr}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminGlassCard>
  );
}

function TrustBandTable({ data }: { data: ExploreAnalyticsData["trust_band_performance"] }) {
  if (!data?.length) return null;
  return (
    <AdminGlassCard className="p-4">
      <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Trust Band Performance</p>
      <div className="space-y-2">
        {data.map((band) => (
          <div key={band.trust_band} className="flex items-center justify-between text-xs">
            <span className="text-[hsl(var(--admin-text))] capitalize">{band.trust_band}</span>
            <div className="flex gap-4 text-[hsl(var(--admin-text-muted))]">
              <span>{band.impressions} imp</span>
              <span>{band.clicks} clicks</span>
              <span className="font-medium text-[hsl(var(--admin-accent))]">{band.ctr}% CTR</span>
            </div>
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}

function RotationFairnessCard({ data }: { data: ExploreAnalyticsData["rotation_fairness"] }) {
  if (!data) return null;
  return (
    <AdminGlassCard className="p-4">
      <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Rotation Fairness</p>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">Unique Entities Shown</p>
          <p className="text-lg font-semibold text-[hsl(var(--admin-text))]">{data.total_entities_shown}</p>
        </div>
        <div>
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">Paid Impression Share</p>
          <p className="text-lg font-semibold text-[hsl(var(--admin-text))]">{data.paid_impression_share}%</p>
        </div>
      </div>
      {data.top_overexposed?.length > 0 && (
        <>
          <p className="text-xs text-[hsl(var(--admin-text-muted))] mb-2">Top Overexposed</p>
          <div className="space-y-1">
            {data.top_overexposed.slice(0, 5).map((e) => (
              <div key={e.entity_id} className="flex items-center justify-between text-xs">
                <span className="text-[hsl(var(--admin-text))] truncate max-w-[200px]">{e.entity_id.slice(0, 12)}…</span>
                <span className="text-[hsl(var(--admin-text-muted))]">{e.impressions} imp</span>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminGlassCard>
  );
}

function DailyChart({ data }: { data: DiscoveryAnalyticsData["daily_trend"] }) {
  if (!data?.length) return null;
  const formatted = data.map((d) => ({
    ...d,
    day: new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));
  return (
    <AdminGlassCard className="p-4">
      <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Daily Impressions & Clicks</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="grad-imp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--admin-accent))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--admin-accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-border))" strokeOpacity={0.2} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--admin-text-muted))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--admin-text-muted))" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--admin-surface))",
                border: "1px solid hsl(var(--admin-border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--admin-text))",
              }}
            />
            <Area type="monotone" dataKey="impressions" stroke="hsl(var(--admin-accent))" fill="url(#grad-imp)" strokeWidth={2} />
            <Area type="monotone" dataKey="clicks" stroke="hsl(150 60% 50%)" fill="transparent" strokeWidth={2} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AdminGlassCard>
  );
}

export default function ManageDiscoveryAnalytics() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useDiscoveryAnalytics(days);

  const totalImpressions = data?.impressions_by_surface?.reduce((s, r) => s + r.impressions, 0) ?? 0;
  const totalClicks = data?.impressions_by_surface?.reduce((s, r) => s + r.clicks, 0) ?? 0;
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
            <Eye className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[hsl(var(--admin-text))] font-display">Discovery Analytics</h1>
            <p className="text-xs text-[hsl(var(--admin-text-muted))]">Exposure measurement & optimization intelligence</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-[hsl(var(--admin-surface-elevated)/0.4)] p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === opt.value
                  ? "bg-[hsl(var(--admin-accent))] text-[hsl(var(--admin-bg))]"
                  : "text-[hsl(var(--admin-text-muted))] hover:text-[hsl(var(--admin-text))]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <AdminGlassCard className="p-8 text-center">
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Loading discovery analytics…</p>
        </AdminGlassCard>
      )}

      {error && (
        <AdminGlassCard className="p-6 border-red-500/30">
          <p className="text-sm text-red-400">Failed to load: {(error as Error).message}</p>
        </AdminGlassCard>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Eye} label="Total Impressions" value={totalImpressions.toLocaleString()} />
            <StatCard icon={MousePointerClick} label="Total Clicks" value={totalClicks.toLocaleString()} />
            <StatCard icon={TrendingUp} label="Overall CTR" value={`${overallCTR}%`} />
            <StatCard icon={Layers} label="Unique Entities" value={data.rotation_fairness?.total_entities_shown ?? 0} />
          </div>

          {/* Daily trend */}
          <DailyChart data={data.daily_trend} />

          {/* Surface breakdown + Trust bands */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SurfaceTable data={data.impressions_by_surface} />
            <TrustBandTable data={data.trust_band_performance} />
          </div>

          {/* Rotation fairness + Tier performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RotationFairnessCard data={data.rotation_fairness} />
            {data.visibility_tier_performance?.length > 0 && (
              <AdminGlassCard className="p-4">
                <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Paid vs Free Performance</p>
                <div className="space-y-2">
                  {data.visibility_tier_performance.map((tier) => (
                    <div key={tier.visibility_tier} className="flex items-center justify-between text-xs">
                      <span className="text-[hsl(var(--admin-text))] capitalize">{tier.visibility_tier}</span>
                      <div className="flex gap-4 text-[hsl(var(--admin-text-muted))]">
                        <span>{tier.impressions} imp</span>
                        <span>{tier.clicks} clicks</span>
                        <span className="font-medium text-[hsl(var(--admin-accent))]">{tier.ctr}% CTR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminGlassCard>
            )}
          </div>

          {/* Banner performance */}
          {data.banner_performance?.length > 0 && (
            <AdminGlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Image className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                <p className="text-sm font-medium text-[hsl(var(--admin-text))]">Banner Performance</p>
              </div>
              <div className="space-y-2">
                {data.banner_performance.map((b) => (
                  <div key={b.surface} className="flex items-center justify-between text-xs">
                    <span className="text-[hsl(var(--admin-text))]">{b.surface.replace("banner_", "Banner ")}</span>
                    <div className="flex gap-4 text-[hsl(var(--admin-text-muted))]">
                      <span>{b.impressions} imp</span>
                      <span>{b.clicks} clicks</span>
                      <span className="font-medium text-[hsl(var(--admin-accent))]">{b.ctr}% CTR</span>
                    </div>
                  </div>
                ))}
              </div>
            </AdminGlassCard>
          )}

          {/* Top entities */}
          {data.top_entities?.length > 0 && (
            <AdminGlassCard className="p-4">
              <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Top Entities by Impressions</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[hsl(var(--admin-text-muted))] border-b border-[hsl(var(--admin-border)/0.3)]">
                      <th className="text-left py-2 pr-4">Entity</th>
                      <th className="text-right py-2 px-2">Impressions</th>
                      <th className="text-right py-2 px-2">Clicks</th>
                      <th className="text-right py-2 pl-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_entities.slice(0, 20).map((e) => (
                      <tr key={e.entity_id} className="border-b border-[hsl(var(--admin-border)/0.1)]">
                        <td className="py-2 pr-4 text-[hsl(var(--admin-text))] truncate max-w-[200px]">{e.entity_id.slice(0, 16)}…</td>
                        <td className="py-2 px-2 text-right text-[hsl(var(--admin-text-muted))]">{e.impressions}</td>
                        <td className="py-2 px-2 text-right text-[hsl(var(--admin-text-muted))]">{e.clicks}</td>
                        <td className="py-2 pl-2 text-right font-medium text-[hsl(var(--admin-accent))]">{e.ctr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminGlassCard>
          )}
        </>
      )}
    </div>
  );
}
