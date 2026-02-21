import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Code, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  disabled: "bg-white/10 text-white/50 border-white/20",
};

export default function PortalApps() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugError, setSlugError] = useState("");
  const [search, setSearch] = useState("");

  // Auto-open create on ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") setShowCreate(true);
  }, [searchParams]);

  // Get user's org
  const { data: membership } = useQuery({
    queryKey: ["my-org-membership"],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("org_memberships")
        .select("org_id, role")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: apps, isLoading } = useQuery({
    queryKey: ["developer-apps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_apps")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Slug uniqueness check
  const checkSlug = async (s: string) => {
    if (!s || !SLUG_RE.test(s)) return;
    const { data } = await supabase
      .from("developer_apps")
      .select("id")
      .eq("slug", s)
      .limit(1);
    if (data && data.length > 0) {
      setSlugError("This app key is already taken");
    } else {
      setSlugError("");
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setSlug(generated);
    setSlugError("");
    if (generated) checkSlug(generated);
  };

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(clean);
    setSlugError("");
    if (clean && SLUG_RE.test(clean)) checkSlug(clean);
    else if (clean && !SLUG_RE.test(clean)) setSlugError("Must be lowercase letters, numbers, and dashes only");
  };

  const createApp = useMutation({
    mutationFn: async () => {
      if (!membership?.org_id) throw new Error("No organization found. Please set up your org first.");
      const { data, error } = await supabase.rpc("create_developer_app", {
        p_org_id: membership.org_id,
        p_name: name.trim(),
        p_slug: slug,
      });
      if (error) throw error;
      // Update description if provided
      if (description.trim() && data) {
        await supabase.from("developer_apps").update({ description: description.trim() }).eq("id", data);
      }
      return data;
    },
    onSuccess: (appId) => {
      toast.success("App created successfully");
      queryClient.invalidateQueries({ queryKey: ["developer-apps"] });
      resetForm();
      navigate(`/developers/portal/apps/${appId}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setShowCreate(false);
    setName("");
    setSlug("");
    setDescription("");
    setSlugError("");
  };

  const canSubmit = name.trim().length > 0 && slug.length > 0 && SLUG_RE.test(slug) && !slugError && !createApp.isPending;

  const filteredApps = apps?.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">My Apps</h2>
          <p className="text-sm text-white/40">Create and manage your developer applications.</p>
        </div>
        <Button variant="accent" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Create App
        </Button>
      </div>

      {/* Search */}
      {apps && apps.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps…"
            className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      )}

      {/* Apps list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      ) : filteredApps && filteredApps.length > 0 ? (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left text-white/50 font-medium px-4 py-3">Name</th>
                <th className="text-left text-white/50 font-medium px-4 py-3 hidden sm:table-cell">App Key</th>
                <th className="text-left text-white/50 font-medium px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-left text-white/50 font-medium px-4 py-3 hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/developers/portal/apps/${app.id}`)}
                  className="border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Code className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-white font-medium">{app.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs text-white/40 font-mono">{app.slug}</code>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge className={`text-xs ${statusColors[app.status] || statusColors.draft}`}>{app.status}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-white/40 text-xs">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center bg-white/[0.02] border border-white/10">
          <Code className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm mb-4">No apps yet. Create your first one.</p>
          <Button variant="accent" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Create App
          </Button>
        </div>
      )}

      {/* Create App Modal */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && resetForm()}>
        <DialogContent className="bg-[#111a14] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create a new app</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-white/70 text-xs mb-1.5 block">App Name *</Label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome App"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                maxLength={100}
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1.5 block">App Key (slug) *</Label>
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-awesome-app"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono"
                maxLength={60}
              />
              {slugError && <p className="text-red-400 text-xs mt-1">{slugError}</p>}
              {slug && !slugError && SLUG_RE.test(slug) && (
                <p className="text-green-400/60 text-xs mt-1">Available</p>
              )}
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1.5 block">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of your app"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={resetForm} className="text-white/60">Cancel</Button>
            <Button
              variant="accent"
              onClick={() => createApp.mutate()}
              disabled={!canSubmit}
              className="gap-1.5"
            >
              {createApp.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
