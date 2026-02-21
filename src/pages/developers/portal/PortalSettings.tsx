import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Settings } from "lucide-react";

export default function PortalSettings() {
  const { user, profile } = useAuth();

  return (
    <DocsPage breadcrumb="Portal" title="Settings" subtitle="Manage your developer account settings.">
      <div
        className="rounded-xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5" style={{ color: "#F46D2A" }} />
          <h3 className="text-white font-semibold text-sm">Account</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/40 text-xs block mb-1">Email</label>
            <p className="text-white/80 text-sm">{user?.email ?? "—"}</p>
          </div>
          <div>
            <label className="text-white/40 text-xs block mb-1">Display name</label>
            <p className="text-white/80 text-sm">{profile?.display_name ?? "—"}</p>
          </div>
          <div>
            <label className="text-white/40 text-xs block mb-1">Username</label>
            <p className="text-white/80 text-sm font-mono">{profile?.username ? `@${profile.username}` : "—"}</p>
          </div>
        </div>
      </div>
    </DocsPage>
  );
}
