import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Settings, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Tab = "users" | "memberships";

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
    <div className="p-6 space-y-6 max-w-6xl min-h-screen bg-background" >
      <button onClick={() => navigate("/dashboard/my-business")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to My Business
      </button>

      <h1 className="text-xl font-bold text-foreground">Users — {businessTitle}</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        {(["users", "memberships"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "memberships" && <MembershipsTab />}
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
