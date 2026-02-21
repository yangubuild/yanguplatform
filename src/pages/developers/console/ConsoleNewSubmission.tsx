import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ConsoleNewSubmission() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedAppId, setSelectedAppId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");

  const { data: apps } = useQuery({
    queryKey: ["developer-apps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("developer_apps").select("id, name, slug").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createListing = useMutation({
    mutationFn: async () => {
      // Create listing
      const { error: insertError } = await supabase.from("app_store_listings").insert({
        app_id: selectedAppId,
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        summary,
        category: category || null,
      });
      if (insertError) throw insertError;

      // Submit
      const { error: submitError } = await supabase.rpc("submit_app_listing", { p_app_id: selectedAppId });
      if (submitError) throw submitError;
    },
    onSuccess: () => {
      toast.success("App submitted for review");
      queryClient.invalidateQueries({ queryKey: ["my-app-listings"] });
      navigate("/developers/console/submissions");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DocsPage breadcrumb="Console → Submissions" title="New Submission" subtitle="Submit an app to the Yangu App Store.">
      <div className="max-w-lg space-y-4">
        <div>
          <label className="text-xs text-white/50 block mb-1">Select App</label>
          <select
            value={selectedAppId}
            onChange={(e) => {
              setSelectedAppId(e.target.value);
              const app = apps?.find((a) => a.id === e.target.value);
              if (app) { setName(app.name); setSlug(app.slug); }
            }}
            className="w-full px-3 py-2 rounded-lg text-sm text-white/90"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <option value="">Choose an app...</option>
            {apps?.map((app) => (
              <option key={app.id} value={app.id}>{app.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/50 block mb-1">Listing Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white/90" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>

        <div>
          <label className="text-xs text-white/50 block mb-1">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white/90 font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>

        <div>
          <label className="text-xs text-white/50 block mb-1">Summary</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-sm text-white/90" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>

        <div>
          <label className="text-xs text-white/50 block mb-1">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. analytics, marketing" className="w-full px-3 py-2 rounded-lg text-sm text-white/90" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="accent"
            onClick={() => createListing.mutate()}
            disabled={!selectedAppId || !name || !slug || createListing.isPending}
          >
            {createListing.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for Review"}
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/50">Cancel</Button>
        </div>
      </div>
    </DocsPage>
  );
}
