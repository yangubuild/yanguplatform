import { useState } from "react";
import { Gauge, Plus, Zap } from "lucide-react";
import { AdaGlassModule } from "./AdaGlassModule";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type Segment = "all" | "builders" | "sellers" | "creators" | "orgs";

interface FeatureToggle {
  id: string;
  label: string;
  enabled: boolean;
  rollout: number;
  segment: Segment;
}

const defaultToggles: FeatureToggle[] = [
  { id: "shopping", label: "Shopping AI", enabled: true, rollout: 100, segment: "all" },
  { id: "imagegen", label: "Image Generation", enabled: true, rollout: 100, segment: "all" },
  { id: "pagebuilder", label: "Page Builder", enabled: true, rollout: 80, segment: "all" },
  { id: "visionaire", label: "Visionaire Learning", enabled: false, rollout: 0, segment: "all" },
  { id: "community", label: "Community Automation", enabled: true, rollout: 100, segment: "all" },
];

const segments: { value: Segment; label: string }[] = [
  { value: "all", label: "All" },
  { value: "builders", label: "Builders" },
  { value: "sellers", label: "Sellers" },
  { value: "creators", label: "Creators" },
  { value: "orgs", label: "Orgs" },
];

const latencyBars = [
  { label: "P50", value: 420, max: 1000 },
  { label: "P90", value: 780, max: 1000 },
  { label: "P99", value: 1240, max: 2000 },
];

interface PerformancePanelProps {
  isAdmin: boolean;
}

export function PerformancePanel({ isAdmin }: PerformancePanelProps) {
  const [toggles, setToggles] = useState<FeatureToggle[]>(defaultToggles);

  const handleToggle = (id: string) => {
    if (!isAdmin) return;
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
    toast({ title: "Feature toggle updated", description: "Pending backend wiring" });
  };

  const handleKillSwitch = (id: string) => {
    if (!isAdmin) return;
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: false, rollout: 0 } : t)));
    toast({ title: "Kill switch activated", description: "Feature disabled immediately. Pending backend wiring", variant: "destructive" });
  };

  const handleRollout = (id: string, value: number) => {
    if (!isAdmin) return;
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, rollout: value } : t)));
  };

  const handleSegment = (id: string, segment: Segment) => {
    if (!isAdmin) return;
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, segment } : t)));
  };

  const addFeature = () => {
    const name = prompt("Enter feature name:");
    if (!name) return;
    setToggles((prev) => [...prev, { id: `custom-${Date.now()}`, label: name, enabled: false, rollout: 0, segment: "all" }]);
  };

  return (
    <AdaGlassModule title="ADA Performance" icon={Gauge}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latency chart */}
        <div className="rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)] p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[hsl(var(--admin-text))]">Response Latency</span>
            <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">
              gemini-3-flash-preview
            </Badge>
          </div>
          <div className="space-y-2.5">
            {latencyBars.map((bar) => (
              <div key={bar.label}>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-[hsl(var(--admin-text-muted))]">{bar.label}</span>
                  <span className="text-[hsl(var(--admin-text))] font-medium">{bar.value}ms</span>
                </div>
                <div className="h-1.5 rounded-full bg-[hsl(var(--admin-border)/0.3)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(bar.value / bar.max) * 100}%`,
                      background: bar.value < 500
                        ? "hsl(160 84% 39%)"
                        : bar.value < 1000
                        ? "hsl(25 85% 45%)"
                        : "hsl(0 72% 51%)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature toggles */}
        <div className="rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)] p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[hsl(var(--admin-text))]">Feature Toggles</span>
            {isAdmin && (
              <button
                onClick={addFeature}
                className="p-1 rounded-md hover:bg-[hsl(25,85%,45%/0.1)] transition-colors">
                <Plus className="h-3.5 w-3.5 text-[hsl(25,85%,45%)]" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {toggles.map((t) => (
              <div key={t.id} className="space-y-1.5 pb-2.5 border-b border-[hsl(var(--admin-border)/0.1)] last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--admin-text-muted))]">{t.label}</span>
                  <div className="flex items-center gap-2">
                    {isAdmin && t.enabled && (
                      <button
                        onClick={() => handleKillSwitch(t.id)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(0,72%,51%/0.1)] text-[hsl(0,72%,51%)] hover:bg-[hsl(0,72%,51%/0.2)] transition-colors font-medium"
                        title="Kill Switch — disable immediately">
                        <Zap className="h-2.5 w-2.5 inline mr-0.5" />Kill
                      </button>
                    )}
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={() => handleToggle(t.id)}
                      disabled={!isAdmin}
                      className="data-[state=checked]:bg-[hsl(25,85%,45%)] data-[state=checked]:shadow-[0_0_8px_hsl(25,85%,45%,0.4)]"
                    />
                  </div>
                </div>
                {isAdmin && t.enabled && (
                  <div className="flex items-center gap-2">
                    {/* Segment selector */}
                    <select
                      value={t.segment}
                      onChange={(e) => handleSegment(t.id, e.target.value as Segment)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text-muted))] outline-none">
                      {segments.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {/* Rollout slider */}
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={t.rollout}
                        onChange={(e) => handleRollout(t.id, parseInt(e.target.value))}
                        className="flex-1 h-1 accent-[hsl(25,85%,45%)]"
                      />
                      <span className="text-[10px] text-[hsl(var(--admin-text-muted))] w-8 text-right">{t.rollout}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdaGlassModule>
  );
}