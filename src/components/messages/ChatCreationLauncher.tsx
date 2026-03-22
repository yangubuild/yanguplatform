import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Globe2, List, Loader2, Megaphone, MessageCircle, Search, UserPlus, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CreateGroupModal } from "./CreateGroupModal";
import { CreateListModal } from "./CreateListModal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => void;
  onOpenGroup: (groupId: string) => void;
}

type View = "actions" | "people";

const ACTIONS = [
  { key: "group", title: "New group", description: "Create a group and add members.", icon: Users },
  { key: "community", title: "New community", description: "Open the community area.", icon: Globe2 },
  { key: "dm", title: "New contact / New chat", description: "Search and start a direct conversation.", icon: UserPlus },
  { key: "list", title: "New list", description: "Organize contacts into a list.", icon: List },
  { key: "broadcast", title: "New broadcast", description: "Jump into the broadcast layer.", icon: Megaphone },
] as const;

/** Max visible rows before internal scroll */
const MAX_VISIBLE_ROWS = 4;
const ROW_HEIGHT = 44; // ~py-2.5 + avatar
const RESULTS_MAX_HEIGHT = MAX_VISIBLE_ROWS * ROW_HEIGHT;

function buildSearchFilter(q: string) {
  return `display_name.ilike.%${q}%,username.ilike.%${q}%,business_name.ilike.%${q}%,creator_type.ilike.%${q}%`;
}

export function ChatCreationLauncher({ open, onOpenChange, onSelectUser, onOpenGroup }: Props) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [view, setView] = useState<View>("actions");
  const [search, setSearch] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  useEffect(() => {
    if (!open) { setView("actions"); setSearch(""); setShowGroupModal(false); setShowListModal(false); }
  }, [open]);

  const normalizedSearch = search.trim();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["chat-creation-people", user?.id, normalizedSearch],
    enabled: open && view === "people" && !!user && normalizedSearch.length>= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key, business_name, creator_type")
        .eq("account_status", "active")
        .neq("id", user!.id)
        .or(buildSearchFilter(normalizedSearch))
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const requireAuth = () => {
    if (user) return true;
    onOpenChange(false);
    navigate(`/auth?redirect=${encodeURIComponent("/dashboard/messages?tab=chats")}`);
    return false;
  };

  const handleAction = (actionKey: string) => {
    if (actionKey === "group") { if (!requireAuth()) return; setShowGroupModal(true); return; }
    if (actionKey === "list") { if (!requireAuth()) return; setShowListModal(true); return; }
    if (actionKey === "dm") { if (!requireAuth()) return; setView("people"); return; }
    if (actionKey === "community") { if (!requireAuth()) return; onOpenChange(false); navigate("/community"); return; }
    if (!requireAuth()) return;
    window.dispatchEvent(new Event("yangu:open-global-chat"));
    onOpenChange(false);
  };

  const content = view === "actions" ? (
    <div className="space-y-1 px-3 pb-3 sm:px-4 sm:pb-4">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button key={action.key} type="button" onClick={() => handleAction(action.key)} className="flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-opacity hover:opacity-85" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
              <Icon className="h-3.5 w-3.5" style={{ color: "hsl(var(--accent))" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">{action.title}</p>
              <p className="mt-0.5 text-[10px] leading-tight" style={{ color: "hsl(var(--muted-foreground))" }}>{action.description}</p>
            </div>
            <ChevronRight className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        );
      })}
    </div>
  ) : (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2.5" style={{ borderColor: "hsl(var(--border))" }}>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView("actions")}><ArrowLeft className="h-3.5 w-3.5" /></Button>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold text-foreground">New contact / New chat</h3>
          <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>Search by name, business, or category.</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <div className="space-y-2 px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, business, or category..." className="flex-1 bg-transparent text-xs outline-none text-foreground" autoFocus />
        </div>

        <div className="overflow-hidden rounded-lg border" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", maxHeight: `${RESULTS_MAX_HEIGHT}px` }}>
          <div className="overflow-y-auto" style={{ maxHeight: `${RESULTS_MAX_HEIGHT}px` }}>
            {normalizedSearch.length < 2 ? (
              <p className="px-3 py-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Type 2+ characters to search by name, business, or category.</p>
            ) : isLoading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...</div>
            ) : people.length === 0 ? (
              <p className="px-3 py-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>No matching people found.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {people.map((person: any) => {
                  const label = person.display_name || person.username || "User";
                  const initials = label.slice(0, 2).toUpperCase();
                  const avatar = resolveAvatarUrl(person);
                  return (
                    <button key={person.id} type="button" onClick={() => { onOpenChange(false); onSelectUser(person.id); }} className="flex w-full items-center gap-2 px-3 py-2 text-left transition-opacity hover:opacity-80">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}>
                        {avatar ? <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" /> : initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{label}</p>
                        <p className="truncate text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {person.business_name || (person.creator_type ? person.creator_type : person.username ? `@${person.username}` : "Start outreach")}
                        </p>
                      </div>
                      <MessageCircle className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--accent))" }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[75vh] border-t p-0" style={{ background: "hsl(var(--surface-elevated))", borderColor: "hsl(var(--border))" }}>
            {view === "actions" && (
              <DrawerHeader className="border-b px-3 pb-2 pt-3" style={{ borderColor: "hsl(var(--border))" }}>
                <DrawerTitle className="text-xs">New chat</DrawerTitle>
                <DrawerDescription className="text-[10px]">Choose how to start.</DrawerDescription>
              </DrawerHeader>
            )}
            {content}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="overflow-hidden border p-0 sm:max-w-sm" style={{ background: "hsl(var(--surface-elevated))", borderColor: "hsl(var(--border))" }}>
            {view === "actions" && (
              <DialogHeader className="border-b px-4 py-2.5" style={{ borderColor: "hsl(var(--border))" }}>
                <DialogTitle className="text-xs">New chat</DialogTitle>
                <DialogDescription className="text-[10px]">Choose how to start.</DialogDescription>
              </DialogHeader>
            )}
            {content}
          </DialogContent>
        </Dialog>
      )}

      <CreateGroupModal open={showGroupModal} onClose={() => setShowGroupModal(false)} onCreated={(gid) => { setShowGroupModal(false); onOpenChange(false); onOpenGroup(gid); }} />
      <CreateListModal open={showListModal} onClose={() => setShowListModal(false)} />
    </>
  );
}
