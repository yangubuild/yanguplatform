import { useState } from "react";
import { Gauge, Plus } from "lucide-react";
import { AdaGlassModule } from "./AdaGlassModule";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface FeatureToggle {
  id: string;
  label: string;
  enabled: boolean;
}

const defaultToggles: FeatureToggle[] = [
  { id: "shopping", label: "Shopping AI", enabled: true },
  { id: "imagegen", label: "Image Generation", enabled: true },
  { id: "pagebuilder", label: "Page Builder", enabled: true },
  { id: "visionaire", label: "Visionaire Learning", enabled: false },
  { id: "community", label: "Community Automation", enabled: true },
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
  };

  const addFeature = () => {
    const name = prompt("Enter feature name:");
    if (!name) return;
    setToggles((prev) => [...prev, { id: `custom-${Date.now()}`, label: name, enabled: false }]);
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
                        : "hsl(0 72% 51%)",
                    }}
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
                className="p-1 rounded-md hover:bg-[hsl(25,85%,45%/0.1)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-[hsl(25,85%,45%)]" />
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {toggles.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--admin-text-muted))]">{t.label}</span>
                <Switch
                  checked={t.enabled}
                  onCheckedChange={() => handleToggle(t.id)}
                  disabled={!isAdmin}
                  className="data-[state=checked]:bg-[hsl(25,85%,45%)] data-[state=checked]:shadow-[0_0_8px_hsl(25,85%,45%,0.4)]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdaGlassModule>
  );
}
