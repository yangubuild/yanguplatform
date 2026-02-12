import { useState } from "react";
import { Bell, Plus, Pause, Play, Eye, MousePointer, X as XIcon, Trash2 } from "lucide-react";
import { AdaGlassModule, KpiCard } from "./AdaGlassModule";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

type PopupType = "release" | "bonus" | "promo" | "notice";
type TriggerType = "chat_open" | "login" | "scheduled";
type AudienceType = "all" | "builders" | "sellers" | "creators" | "orgs" | "new_users" | "specific";

interface PopupConfig {
  id: string;
  title: string;
  message: string;
  ctaText: string;
  ctaLink: string;
  type: PopupType;
  audience: AudienceType;
  trigger: TriggerType;
  repeat: boolean;
  active: boolean;
  seen: number;
  clicked: number;
  dismissed: number;
  createdAt: string;
}

const typeLabels: Record<PopupType, { label: string; color: string }> = {
  release: { label: "Release", color: "text-[hsl(217,91%,60%)]" },
  bonus: { label: "Bonus", color: "text-[hsl(25,85%,45%)]" },
  promo: { label: "Promo", color: "text-[hsl(160,84%,39%)]" },
  notice: { label: "Notice", color: "text-[hsl(var(--admin-text-muted))]" },
};

const mockPopups: PopupConfig[] = [
  { id: "1", title: "New Studio Features!", message: "Try our enhanced image gen with 4x resolution.", ctaText: "Try Now", ctaLink: "/studio", type: "release", audience: "all", trigger: "chat_open", repeat: false, active: true, seen: 342, clicked: 89, dismissed: 201, createdAt: "2026-02-10" },
  { id: "2", title: "5 Bonus Credits!", message: "Thanks for being an early creator. Enjoy 5 free credits.", ctaText: "Claim", ctaLink: "/dashboard", type: "bonus", audience: "creators", trigger: "login", repeat: false, active: false, seen: 128, clicked: 112, dismissed: 16, createdAt: "2026-02-08" },
];

export function UserMessagingPanel() {
  const [popups, setPopups] = useState<PopupConfig[]>(mockPopups);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", ctaText: "", ctaLink: "", type: "release" as PopupType, audience: "all" as AudienceType, trigger: "chat_open" as TriggerType, repeat: false });

  const toggleActive = (id: string) => {
    setPopups((prev) => prev.map((p) => p.id === id ? { ...p, active: !p.active } : p));
    toast({ title: "Popup status updated", description: "Pending backend wiring" });
  };

  const deletePopup = (id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Popup deleted", description: "Pending backend wiring" });
  };

  const createPopup = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: "Title and message required", variant: "destructive" });
      return;
    }
    setPopups((prev) => [...prev, {
      ...form, id: `${Date.now()}`, active: true, seen: 0, clicked: 0, dismissed: 0, createdAt: new Date().toISOString().split("T")[0],
    }]);
    setForm({ title: "", message: "", ctaText: "", ctaLink: "", type: "release", audience: "all", trigger: "chat_open", repeat: false });
    setShowCreate(false);
    toast({ title: "Popup created", description: "Pending backend wiring" });
  };

  const totalSeen = popups.reduce((s, p) => s + p.seen, 0);
  const totalClicked = popups.reduce((s, p) => s + p.clicked, 0);
  const totalDismissed = popups.reduce((s, p) => s + p.dismissed, 0);

  return (
    <AdaGlassModule
      title="User Messaging & Popups"
      icon={Bell}
      headerRight={
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[hsl(25,85%,45%/0.12)] text-[hsl(25,85%,45%)] border border-[hsl(25,85%,45%/0.25)] hover:bg-[hsl(25,85%,45%/0.2)] transition-colors">
          <Plus className="h-3 w-3" /> Create Popup
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KpiCard label="Total Seen" value={totalSeen} icon={Eye} />
        <KpiCard label="Total Clicked" value={totalClicked} icon={MousePointer} severity="success" />
        <KpiCard label="Dismissed" value={totalDismissed} icon={XIcon} severity="warning" />
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-md border border-[hsl(25,85%,45%/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.4)] p-4 mb-4 space-y-3">
          <span className="text-xs font-medium text-[hsl(var(--admin-text))]">Create New Popup</span>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="px-2 py-1.5 rounded text-xs bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PopupType })} className="px-2 py-1.5 rounded text-xs bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none">
              <option value="release">Release</option>
              <option value="bonus">Bonus</option>
              <option value="promo">Promo</option>
              <option value="notice">Notice</option>
            </select>
          </div>
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message body..." rows={2} className="w-full px-2 py-1.5 rounded text-xs bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="CTA button text" className="px-2 py-1.5 rounded text-xs bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none" />
            <input value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="CTA link (e.g. /studio)" className="px-2 py-1.5 rounded text-xs bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as AudienceType })} className="px-2 py-1.5 rounded text-xs bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none">
              <option value="all">All Users</option>
              <option value="builders">Builders</option>
              <option value="sellers">Sellers</option>
              <option value="creators">Creators</option>
              <option value="orgs">Organizations</option>
              <option value="new_users">New Users</option>
              <option value="specific">Specific User</option>
            </select>
            <select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value as TriggerType })} className="px-2 py-1.5 rounded text-xs bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none">
              <option value="chat_open">On ADA chat open</option>
              <option value="login">On login</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <div className="flex items-center gap-2 px-2">
              <Switch checked={form.repeat} onCheckedChange={(v) => setForm({ ...form, repeat: v })} className="data-[state=checked]:bg-[hsl(25,85%,45%)]" />
              <span className="text-[10px] text-[hsl(var(--admin-text-muted))]">Repeat</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={createPopup} className="px-4 py-1.5 rounded text-xs font-medium bg-[hsl(25,85%,45%/0.15)] text-[hsl(25,85%,45%)] border border-[hsl(25,85%,45%/0.25)] hover:bg-[hsl(25,85%,45%/0.25)] transition-colors">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 rounded text-xs font-medium border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--admin-surface-elevated)/0.4)] transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Popup List */}
      <div className="rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[hsl(var(--admin-border)/0.2)]">
          <span className="text-xs font-medium text-[hsl(var(--admin-text))]">Active & Past Popups</span>
        </div>
        <div className="divide-y divide-[hsl(var(--admin-border)/0.15)]">
          {popups.map((popup) => {
            const tl = typeLabels[popup.type];
            return (
              <div key={popup.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[hsl(var(--admin-surface-elevated)/0.3)] transition-colors">
                <span className={`text-[10px] font-semibold ${tl.color}`}>{tl.label}</span>
                <span className="text-xs text-[hsl(var(--admin-text))] flex-1 truncate">{popup.title}</span>
                <span className="text-[10px] text-[hsl(var(--admin-text-muted))]">{popup.seen}👁 {popup.clicked}👆 {popup.dismissed}✕</span>
                <button onClick={() => toggleActive(popup.id)} className="p-1 rounded hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] transition-colors">
                  {popup.active ? <Pause className="h-3 w-3 text-[hsl(38,92%,50%)]" /> : <Play className="h-3 w-3 text-[hsl(160,84%,39%)]" />}
                </button>
                <button onClick={() => deletePopup(popup.id)} className="p-1 rounded hover:bg-[hsl(0,72%,51%/0.15)] transition-colors">
                  <Trash2 className="h-3 w-3 text-[hsl(0,72%,51%)]" />
                </button>
              </div>
            );
          })}
          {popups.length === 0 && (
            <div className="px-3 py-6 text-center text-[10px] text-[hsl(var(--admin-text-muted))]">No popups created yet</div>
          )}
        </div>
      </div>
    </AdaGlassModule>
  );
}