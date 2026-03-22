import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DocsPage } from "@/components/developers/DocsPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Loader2, Save, Camera } from "lucide-react";
import { toast } from "sonner";

export default function PortalProfile() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [devOptIn, setDevOptIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile]);

  useEffect(() => {
    if (user?.user_metadata?.dev_updates_opt_in) setDevOptIn(true);
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size> 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      setAvatarUrl(url);
      toast.success("Avatar updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() || null })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

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

  const initials = (displayName || user?.email || "D").slice(0, 2).toUpperCase();

  return (
    <DocsPage breadcrumb="Portal" title="Profile" subtitle="Manage your developer profile.">
      <div
        className="rounded-xl p-6 space-y-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
        <div className="flex items-center gap-3">
          <User className="w-5 h-5" style={{ color: "#F46D2A" }} />
          <h3 className="text-foreground font-semibold text-sm">Your Profile</h3>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-white/10 text-foreground text-lg">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center hover:brightness-110 transition-all">
              {uploading ? <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" /> : <Camera className="w-3.5 h-3.5 text-foreground" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">{displayName || "Developer"}</p>
            <p className="text-muted-foreground text-xs">{user?.email}</p>
          </div>
        </div>

        <div className="grid gap-4 max-w-md">
          <div>
            <Label className="text-muted-foreground text-xs">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="mt-1 bg-white/5 border-white/10 text-foreground"
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p className="text-muted-foreground text-sm mt-1 font-mono">{user?.email ?? "—"}</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Organization</Label>
            <p className="text-muted-foreground text-sm mt-1">{orgName ?? "—"}</p>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Developer Updates</p>
                <p className="text-muted-foreground text-xs">Email me about new APIs and developer features</p>
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
