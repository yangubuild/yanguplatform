import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DocsPage } from "@/components/developers/DocsPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function PortalProfile() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [devOptIn, setDevOptIn] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch org name
  const { data: orgName } = useQuery({
    queryKey: ["portal-org-name", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("org_memberships")
        .select("org_id, orgs(name)")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      return (data as any)?.orgs?.name ?? null;
    },
  });

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  useEffect(() => {
    if (user?.user_metadata?.dev_updates_opt_in) setDevOptIn(true);
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update profile display name
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() || null })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      // Update dev opt-in in user_metadata
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { dev_updates_opt_in: devOptIn },
      });
      if (metaErr) throw metaErr;

      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocsPage breadcrumb="Portal" title="Profile" subtitle="Manage your developer profile.">
      <div
        className="rounded-xl p-6 space-y-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <div className="flex items-center gap-3">
          <User className="w-5 h-5" style={{ color: "#F46D2A" }} />
          <h3 className="text-white font-semibold text-sm">Your Profile</h3>
        </div>

        <div className="grid gap-4 max-w-md">
          <div>
            <Label className="text-white/40 text-xs">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/40 text-xs">Email</Label>
            <p className="text-white/60 text-sm mt-1 font-mono">{user?.email ?? "—"}</p>
          </div>

          <div>
            <Label className="text-white/40 text-xs">Organization</Label>
            <p className="text-white/60 text-sm mt-1">{orgName ?? "—"}</p>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Developer Updates</p>
                <p className="text-white/40 text-xs">Email me about new APIs and developer features</p>
              </div>
              <Switch checked={devOptIn} onCheckedChange={setDevOptIn} />
            </div>
          </div>
        </div>

        <Button variant="accent" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save Changes
        </Button>
      </div>
    </DocsPage>
  );
}
