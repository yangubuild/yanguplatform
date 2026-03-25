import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rocket, Users, TrendingUp, Globe, Clock, UserCheck, ShieldCheck, BarChart3 } from "lucide-react";
import { format, differenceInSeconds, differenceInMinutes, differenceInHours } from "date-fns";

function useLaunchStats(launchDate: string | null) {
  return useQuery({
    queryKey: ["manage", "launch-stats", launchDate],
    queryFn: async () => {
      if (!launchDate) return null;

      // Total users since launch
      const { count: totalSince, error: e1 } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", launchDate);
      if (e1) throw e1;

      // Total users overall
      const { count: totalAll, error: e2 } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (e2) throw e2;

      // KYC verified since launch
      const { count: kycVerified, error: e3 } = await (supabase as any)
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", launchDate)
        .eq("kyc_status", "verified");
      if (e3) throw e3;

      // By country (top 5)
      const { data: countryData, error: e4 } = await supabase
        .from("profiles")
        .select("country")
        .gte("created_at", launchDate)
        .not("country", "is", null);
      if (e4) throw e4;

      const countryCounts: Record<string, number> = {};
      for (const p of countryData || []) {
        if (p.country) countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
      }
      const topCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const launchTime = new Date(launchDate);
      const now = new Date();
      const minutesElapsed = Math.max(1, differenceInMinutes(now, launchTime));
      const usersPerMinute = (totalSince || 0) / minutesElapsed;

      return {
        totalSinceLaunch: totalSince || 0,
        totalAll: totalAll || 0,
        kycVerified: kycVerified || 0,
        usersPerMinute: usersPerMinute,
        topCountries,
        minutesElapsed,
      };
    },
    enabled: !!launchDate,
    refetchInterval: 10_000,
  });
}

export default function ManageLaunchCounter() {
  const [launchDate, setLaunchDate] = useState<string | null>(
    localStorage.getItem("yangu_launch_date")
  );
  const [inputDate, setInputDate] = useState("");
  const { data: stats, isLoading } = useLaunchStats(launchDate);

  const handleSetLaunch = () => {
    if (inputDate) {
      localStorage.setItem("yangu_launch_date", inputDate);
      setLaunchDate(inputDate);
    }
  };

  const handleSetNow = () => {
    const now = new Date().toISOString();
    localStorage.setItem("yangu_launch_date", now);
    setLaunchDate(now);
  };

  const elapsed = launchDate ? differenceInSeconds(new Date(), new Date(launchDate)) : 0;
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Launch Counter" description="Real-time user growth tracking since launch" />

      {!launchDate ? (
        <AdminGlassCard>
          <div className="text-center py-8 space-y-4">
            <Rocket className="h-12 w-12 mx-auto text-[hsl(var(--admin-accent))] opacity-60" />
            <h3 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Set Launch Time</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Set the launch start time to begin tracking new user signups in real-time
            </p>
            <div className="flex items-center gap-3 justify-center max-w-md mx-auto">
              <Input
                type="datetime-local"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSetLaunch} disabled={!inputDate}>Set Date</Button>
            </div>
            <div className="text-xs text-muted-foreground">or</div>
            <Button variant="outline" onClick={handleSetNow}>
              <Rocket className="h-4 w-4 mr-2" /> Launch Now
            </Button>
          </div>
        </AdminGlassCard>
      ) : (
        <>
          {/* Big counter hero */}
          <AdminGlassCard>
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">New Users Since Launch</p>
              <p className="text-6xl font-bold text-[hsl(var(--admin-accent))] font-mono tabular-nums">
                {stats?.totalSinceLaunch?.toLocaleString() ?? "—"}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                  <Clock className="h-3 w-3 mr-1" />
                  {hours}h {minutes}m {seconds}s since launch
                </Badge>
                <Badge variant="outline" className="text-[hsl(var(--admin-accent))] border-[hsl(var(--admin-accent)/0.3)]">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats?.usersPerMinute?.toFixed(1) ?? "0"}/min
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Launch: {format(new Date(launchDate), "PPp")}
              </p>
            </div>
          </AdminGlassCard>

          <div className="grid gap-4 sm:grid-cols-4">
            <AdminMetricCard label="Since Launch" value={stats?.totalSinceLaunch ?? 0} icon={<Rocket className="h-4 w-4" />} />
            <AdminMetricCard label="Total Platform Users" value={stats?.totalAll ?? 0} icon={<Users className="h-4 w-4" />} />
            <AdminMetricCard label="KYC Verified (New)" value={stats?.kycVerified ?? 0} icon={<ShieldCheck className="h-4 w-4" />} />
            <AdminMetricCard label="Users/Min" value={stats?.usersPerMinute?.toFixed(1) ?? "0"} icon={<TrendingUp className="h-4 w-4" />} />
          </div>

          {/* Country breakdown */}
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4" /> Top Countries (Since Launch)
            </h3>
            {stats?.topCountries && stats.topCountries.length > 0 ? (
              <div className="space-y-2">
                {stats.topCountries.map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between rounded-lg border border-[hsl(var(--admin-border)/0.3)] px-4 py-2">
                    <span className="text-sm text-[hsl(var(--admin-text))]">{country}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 rounded-full bg-[hsl(var(--admin-surface-elevated))] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[hsl(var(--admin-accent))]"
                          style={{ width: `${Math.min(100, (count / (stats.totalSinceLaunch || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No country data yet</p>
            )}
          </AdminGlassCard>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("yangu_launch_date");
                setLaunchDate(null);
              }}
            >
              Reset Launch Timer
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
