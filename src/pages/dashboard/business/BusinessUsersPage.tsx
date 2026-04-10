import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Settings, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OwnerOrdersPanel } from "@/components/commerce/OwnerOrdersPanel";

type Tab = "users" | "memberships" | "orders" | "support";

export default function BusinessUsersPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");
  const [businessTitle, setBusinessTitle] = useState("");

  useEffect(() => {
    if (!businessId) return;
    supabase.from("builder_surfaces").select("title").eq("id", businessId).single().then(({ data }) => {
      if (data) setBusinessTitle(data.title);
    });
  }, [businessId]);

  return (
    <div className="p-6 space-y-6 max-w-6xl min-h-screen bg-background">
      <button onClick={() => navigate("/dashboard/my-business")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to My Business
      </button>

      <h1 className="text-xl font-bold text-foreground">Manage — {businessTitle}</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        {(["users", "memberships", "orders", "support"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "memberships" && <MembershipsTab />}
      {tab === "orders" && businessId && <OwnerOrdersPanel surfaceId={businessId} />}
      {tab === "support" && businessId && <SupportTab surfaceId={businessId} />}
    </div>
  );
}

function UsersTab() {
  const columns = ["User", "Email", "Status", "Country", "Total spend", "Joined at", "Last accessed", "Contact"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button size="sm" variant="ghost" className="text-xs rounded-xl">Date joined</Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1"><ExternalLink className="h-3 w-3" /> Export</Button>
          <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1"><Settings className="h-3 w-3" /> Edit</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th key={c} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border hover:bg-muted/5 transition-colors">
              <td className="px-4 py-3 text-foreground text-sm">—</td>
              <td className="px-4 py-3 text-muted-foreground text-sm">—</td>
              <td className="px-4 py-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Joined</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-sm">—</td>
              <td className="px-4 py-3 text-muted-foreground text-sm">$0.00</td>
              <td className="px-4 py-3 text-muted-foreground text-sm">—</td>
              <td className="px-4 py-3 text-muted-foreground text-sm">—</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                  <Mail className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing 0 to 0 of 0</span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" disabled className="text-xs h-7">«</Button>
          <Button size="sm" variant="ghost" disabled className="text-xs h-7">‹</Button>
          <Button size="sm" variant="ghost" disabled className="text-xs h-7">›</Button>
          <Button size="sm" variant="ghost" disabled className="text-xs h-7">»</Button>
        </div>
      </div>
    </div>
  );
}

function MembershipsTab() {
  const columns = ["User", "Email", "Product", "Status", "Total spend", "Created", "Cancelled", "Cancel reason"];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th key={c} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{c}</th>
              ))}
            </tr>
          </thead>
        </table>

        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-20 w-20 rounded-2xl bg-muted/20 flex items-center justify-center text-3xl">🎁</div>
          <h3 className="text-lg font-semibold text-foreground">Get your first user</h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs">Share your YANGU link with potential customers to get your first user!</p>
          <Button variant="accent" className="rounded-xl">Go to products</Button>
        </div>
      </div>
    </div>
  );
}

function SupportTab({ surfaceId }: { surfaceId: string }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("support_tickets")
      .select("id, subject, status, priority, category, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setTickets(data || []);
        setLoading(false);
      });
  }, [surfaceId]);

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground text-sm">Loading support tickets…</div>;
  }

  if (!tickets.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg mb-1">📭</p>
        <p className="text-sm">No support tickets yet</p>
        <p className="text-xs mt-1">Customer inquiries related to orders will appear here.</p>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    resolved: "bg-green-500/10 text-green-500 border-green-500/30",
    closed: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <div key={t.id} className="border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{t.subject}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${statusColor[t.status] || statusColor.pending}`}>
              {t.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t.category} · {t.priority} · {new Date(t.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
