import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Globe, Users, MapPin, Shield, CreditCard, Loader2 } from "lucide-react";

interface CountryData {
  country: string;
  count: number;
}

interface SegmentData {
  byCountry: CountryData[];
  byOnboardingStage: Record<string, number>;
  bySubscription: Record<string, number>;
  byKycStatus: Record<string, number>;
  total: number;
}

export function UserSegmentationPanel() {
  const [segmentBy, setSegmentBy] = useState("country");

  const { data, isLoading } = useQuery({
    queryKey: ["user-segmentation"],
    queryFn: async () => {
      // Fetch profiles with relevant fields
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("country, onboarding_completed, creator_type, account_status")
        .limit(1000);
      if (error) throw error;

      const byCountry: Record<string, number> = {};
      const byOnboardingStage: Record<string, number> = { completed: 0, incomplete: 0 };
      const bySubscription: Record<string, number> = { free: 0 };
      const byKycStatus: Record<string, number> = {};

      (profiles || []).forEach((p: any) => {
        const country = p.country || "Unknown";
        byCountry[country] = (byCountry[country] || 0) + 1;

        if (p.onboarding_completed) {
          byOnboardingStage.completed++;
        } else {
          byOnboardingStage.incomplete++;
        }

        const status = p.account_status || "active";
        byKycStatus[status] = (byKycStatus[status] || 0) + 1;
      });

      const countryData = Object.entries(byCountry)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      return {
        byCountry: countryData,
        byOnboardingStage,
        bySubscription,
        byKycStatus,
        total: profiles?.length || 0,
      } as SegmentData;
    },
    staleTime: 60_000,
  });

  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[hsl(24,95%,53%)]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">User Segmentation</h3>
          {data && (
            <Badge variant="outline" className="text-[10px]">{data.total} users</Badge>
          )}
        </div>
        <Select value={segmentBy} onValueChange={setSegmentBy}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="country">By Country</SelectItem>
            <SelectItem value="onboarding">By Onboarding Stage</SelectItem>
            <SelectItem value="kyc">By Account Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? null : (
        <>
          {segmentBy === "country" && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.byCountry.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No country data available</p>
              ) : (
                data.byCountry.map(({ country, count }) => {
                  const pct = data.total > 0 ? (count / data.total) * 100 : 0;
                  return (
                    <div key={country} className="flex items-center gap-3">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground min-w-[100px]">{country}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums min-w-[50px] text-right">
                        {count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {segmentBy === "onboarding" && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data.byOnboardingStage).map(([stage, count]) => (
                <div key={stage} className="rounded-lg border border-border p-3 text-center">
                  <span className="text-lg font-bold text-foreground">{count}</span>
                  <p className="text-[10px] text-muted-foreground capitalize">{stage}</p>
                </div>
              ))}
            </div>
          )}

          {segmentBy === "kyc" && (
            <div className="space-y-2">
              {Object.entries(data.byKycStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-foreground capitalize">{status.replace(/_/g, " ")}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminGlassCard>
  );
}
