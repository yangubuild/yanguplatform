import { Settings, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SOCIAL_PROVIDERS = [
  { name: "Facebook Page", icon: "📘" },
  { name: "Instagram", icon: "📸" },
  { name: "Instagram Story", icon: "🎬" },
  { name: "X", icon: "✖️" },
  { name: "LinkedIn Company Page", icon: "🔗" },
  { name: "LinkedIn Personal Profile", icon: "👤" },
  { name: "TikTok", icon: "🎵" },
];

export default function SocialMediaWorkspace() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-lg font-semibold text-foreground mb-6">Workspace</h1>

      {/* Connected Accounts */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4">Connected Socials</h2>
        <div className="space-y-3">
          {SOCIAL_PROVIDERS.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <span className="text-sm font-medium text-foreground">{p.name}</span>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace Settings Shell */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Workspace Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your posting schedule, team members, and workspace preferences here.
        </p>
      </div>
    </div>
  );
}
