import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CheckCircle2, AlertTriangle, XCircle, FileText, Plus, Download, ArrowUpRight,
} from "lucide-react";
import { useState } from "react";

const CAPABILITY_GAP_DEFAULTS = [
  { capability: "AI Shop Builder", key: "ai_shop_builder", status: "strong", priority: "low", rec: "Maintain" },
  { capability: "AI Bio Pages", key: "ai_bio_pages", status: "strong", priority: "low", rec: "Maintain" },
  { capability: "AI Selling", key: "ai_selling", status: "strong", priority: "low", rec: "Maintain" },
  { capability: "Digital Product Uni", key: "digital_product_uni", status: "medium", priority: "high", rec: "Create tutorial series" },
  { capability: "AI Avatars", key: "ai_avatars", status: "medium", priority: "medium", rec: "Showcase use cases" },
  { capability: "AI Influencers", key: "ai_influencers", status: "medium", priority: "high", rec: "Case studies needed" },
  { capability: "Live Selling AI", key: "live_selling_ai", status: "low", priority: "critical", rec: "Comparison guide" },
  { capability: "Business Communities", key: "business_communities", status: "medium", priority: "medium", rec: "Feature highlights" },
  { capability: "AI Learning", key: "ai_learning", status: "medium", priority: "medium", rec: "How-to guides" },
  { capability: "AI Marketing", key: "ai_marketing", status: "medium", priority: "medium", rec: "How-to guide" },
  { capability: "Surface Builder", key: "surface_builder", status: "strong", priority: "low", rec: "Maintain" },
  { capability: "AI Discovery Engine", key: "ai_discovery_engine", status: "low", priority: "critical", rec: "Explainer content" },
];

const RECOMMENDED_CONTENT = [
  { title: "How to create an AI influencer with Yangu", type: "Tutorial", region: "Global" },
  { title: "Live selling with AI: Complete guide", type: "Guide", region: "Africa" },
  { title: "Yangu vs Gumroad vs Kajabi: Which is better?", type: "Comparison", region: "Global" },
  { title: "Digital Product University: Learn to sell", type: "Case Study", region: "Middle East" },
  { title: "AI Discovery Engine: How it works", type: "Explainer", region: "Global" },
  { title: "Building an AI-powered shop in 10 minutes", type: "Quick Start", region: "Africa" },
  { title: "Create your own AI avatar for business", type: "Tutorial", region: "Global" },
  { title: "Marketing automation with Yangu AI tools", type: "Guide", region: "Middle East" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "strong") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "medium") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: "border-red-500/40 text-red-500 bg-red-500/10",
    high: "border-amber-500/40 text-amber-500 bg-amber-500/10",
    medium: "border-blue-500/40 text-blue-500 bg-blue-500/10",
    low: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
  };
  return (
    <Badge variant="outline" className={`text-xs capitalize ${colors[priority] ?? ""}`}>
      {priority}
    </Badge>
  );
}

export default function ManageAiVisibilityContentGaps() {
  const qc = useQueryClient();

  const { data: gaps = [], isLoading } = useQuery({
    queryKey: ["content-gap-recommendations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("content_gap_recommendations")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("content_gap_recommendations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-gap-recommendations"] });
      toast.success("Status updated");
    },
  });

  const createGap = useMutation({
    mutationFn: async (rec: typeof RECOMMENDED_CONTENT[0]) => {
      const { error } = await supabase.from("content_gap_recommendations").insert({
        query: rec.title,
        gap_description: `Content needed: ${rec.title}`,
        recommended_content_type: rec.type.toLowerCase().replace(" ", "_"),
        recommended_title: rec.title,
        target_region: rec.region.toLowerCase().replace(" ", "_"),
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-gap-recommendations"] });
      toast.success("Content task created");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const pendingCount = gaps.filter((g: any) => g.status === "pending").length;
  const inProgressCount = gaps.filter((g: any) => g.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Content Gap Recommendations"
        description={`${pendingCount} pending • ${inProgressCount} in progress • ${gaps.length} total recommendations`}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[hsl(var(--admin-card))] border border-[hsl(var(--admin-border)/0.3)]">
          <TabsTrigger value="overview">Gaps by Capability</TabsTrigger>
          <TabsTrigger value="recommendations">Recommended Content</TabsTrigger>
          <TabsTrigger value="tasks">Content Tasks</TabsTrigger>
        </TabsList>

        {/* ── Gaps Overview ── */}
        <TabsContent value="overview">
          <AdminGlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-[hsl(var(--admin-card))]">
                  <tr className="text-left text-xs text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">
                    <th className="px-4 py-3">Capability</th>
                    <th className="px-4 py-3">Gap Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--admin-border)/0.2)]">
                  {CAPABILITY_GAP_DEFAULTS.map((g) => (
                    <tr key={g.key} className="hover:bg-[hsl(var(--admin-border)/0.05)]">
                      <td className="px-4 py-3 text-[hsl(var(--admin-text))] font-medium">{g.capability}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={g.status} />
                          <span className="text-xs text-[hsl(var(--admin-text-muted))] capitalize">{g.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={g.priority} /></td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--admin-text))]">{g.rec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminGlassCard>
        </TabsContent>

        {/* ── Recommended Content ── */}
        <TabsContent value="recommendations">
          <AdminGlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-[hsl(var(--admin-card))]">
                  <tr className="text-left text-xs text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--admin-border)/0.2)]">
                  {RECOMMENDED_CONTENT.map((rec, i) => (
                    <tr key={i} className="hover:bg-[hsl(var(--admin-border)/0.05)]">
                      <td className="px-4 py-3 text-[hsl(var(--admin-text))] font-medium">{rec.title}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">
                          {rec.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--admin-text))]">{rec.region}</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => createGap.mutate(rec)}
                          disabled={createGap.isPending}>
                          <Plus className="h-3 w-3 mr-1" /> Create Task
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminGlassCard>
        </TabsContent>

        {/* ── Content Tasks ── */}
        <TabsContent value="tasks">
          <AdminGlassCard>
            {gaps.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="h-8 w-8 text-[hsl(var(--admin-text-muted))] mx-auto mb-3" />
                <p className="text-sm text-[hsl(var(--admin-text-muted))]">
                  No content tasks yet. Create tasks from the Recommended Content tab.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {gaps.map((g: any) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--admin-border)/0.2)] hover:border-[hsl(var(--admin-border)/0.4)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--admin-text))] truncate">
                        {g.recommended_title || g.query}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">
                          {g.recommended_content_type?.replace("_", " ") ?? "—"}
                        </Badge>
                        {g.target_region && (
                          <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">
                            {g.target_region.replace("_", " ")}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            g.status === "published" ? "border-emerald-500/40 text-emerald-500" :
                            g.status === "in_progress" ? "border-blue-500/40 text-blue-500" :
                            g.status === "archived" ? "border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]" :
                            "border-amber-500/40 text-amber-500"
                          }`}>
                          {g.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {g.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => updateStatus.mutate({ id: g.id, status: "in_progress" })}>
                          Start
                        </Button>
                      )}
                      {g.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => updateStatus.mutate({ id: g.id, status: "published" })}>
                          Mark Published
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminGlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
