import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronUp, Users, Sparkles, PenLine, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import customEbookPromo from "@/assets/custom-ebook-promo.jpg";

const TABS = [
  { key: "idea", label: "Ideas" },
  { key: "planned", label: "Planned" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function ProductRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("idea");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all requests
  const { data: requests } = useQuery({
    queryKey: ["visionaire-product-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visionaire_product_requests" as any)
        .select("*")
        .eq("is_active", true)
        .order("votes_count", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch user's votes
  const { data: userVotes } = useQuery({
    queryKey: ["visionaire-request-votes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visionaire_request_votes" as any)
        .select("request_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data as any[]).map((v: any) => v.request_id));
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error("Login required");
      if (userVotes?.has(requestId)) {
        const { error } = await supabase
          .from("visionaire_request_votes" as any)
          .delete()
          .eq("request_id", requestId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("visionaire_request_votes" as any)
          .insert({ request_id: requestId, user_id: user.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visionaire-product-requests"] });
      qc.invalidateQueries({ queryKey: ["visionaire-request-votes"] });
    },
    onError: () => toast.error("Failed to vote"),
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      const { error } = await supabase
        .from("visionaire_product_requests" as any)
        .insert({ title: newTitle.trim(), description: newDesc.trim(), user_id: user.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request submitted!");
      setNewTitle("");
      setNewDesc("");
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["visionaire-product-requests"] });
    },
    onError: () => toast.error("Failed to submit"),
  });

  // Tab counts & filtering
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { idea: 0, planned: 0, completed: 0, rejected: 0 };
    requests?.forEach((r: any) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return counts;
  }, [requests]);

  const filtered = useMemo(
    () => (requests ?? []).filter((r: any) => r.status === activeTab),
    [requests, activeTab]
  );

  return (
    <VisionairePageContainer>
      <div className="space-y-8 pb-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Community Powered
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Request a Product
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Help us decide what to build next. Submit ideas and vote for your favorites.
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent" size="lg" className="mt-2">
                Submit new idea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit a Product Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Product title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Describe the product you'd like to see..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={4}
                />
                <Button
                  className="w-full"
                  disabled={!newTitle.trim() || submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tabs + Requests */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Tabs */}
            <div className="flex gap-1 border-b border-border">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  {tab.label} ({tabCounts[tab.key] ?? 0})
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t" />
                  )}
                </button>
              ))}
            </div>

            {/* Request Items */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No {activeTab} requests yet
                </div>
              ) : (
                filtered.map((req: any) => {
                  const hasVoted = userVotes?.has(req.id) ?? false;
                  return (
                    <a
                      key={req.id}
                      href="https://www.entrepedia.co/library/request"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors cursor-pointer"
                    >
                      {/* Vote Block */}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); voteMutation.mutate(req.id); }}
                        className={`flex flex-col items-center justify-center min-w-[56px] h-[56px] rounded-xl border transition-colors shrink-0 ${
                          hasVoted
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        <ChevronUp className="h-4 w-4" />
                        <span className="text-sm font-bold leading-tight">{req.votes_count}</span>
                      </button>

                      {/* Content */}
                      <div className="min-w-0 flex-1 py-0.5">
                        <h3 className="font-semibold text-foreground text-sm leading-snug">{req.title}</h3>
                        {req.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {req.description}
                          </p>
                        )}
                      </div>
                    </a>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Custom Product Promo */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Product Image */}
              <div className="bg-muted/30 p-6 flex items-center justify-center">
                <img
                  src={customEbookPromo}
                  alt="Your custom ebook"
                  className="w-48 h-auto object-contain"
                />
              </div>

              {/* Promo Content */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-foreground text-base">
                  Get your own custom product
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We transform your idea into a signature book without you writing a single word.
                </p>
              </div>
            </div>

            {/* Feature Items */}
            <div className="space-y-2">
              {[
                { icon: Sparkles, text: "Tailored 100% to your brand" },
                { icon: PenLine, text: "Strategy, writing & design included" },
                { icon: Clock, text: "Ready-to-use in just 7 days" },
              ].map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
                >
                  <feature.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </VisionairePageContainer>
  );
}
