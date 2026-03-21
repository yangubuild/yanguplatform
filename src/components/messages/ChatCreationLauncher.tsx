import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Globe2, Loader2, Megaphone, MessageCircle, Search, UserPlus, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CreateGroupModal } from "./CreateGroupModal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => void;
  onOpenGroup: (groupId: string) => void;
}

type View = "actions" | "people";

const ACTIONS = [
  {
    key: "group",
    title: "New group",
    description: "Create a group and add members immediately.",
    icon: Users,
  },
  {
    key: "community",
    title: "New community",
    description: "Open the community area and continue there.",
    icon: Globe2,
  },
  {
    key: "dm",
    title: "New contact / New chat",
    description: "Search people and start a direct conversation.",
    icon: UserPlus,
  },
  {
    key: "broadcast",
    title: "New broadcast",
    description: "Jump into the broadcast layer and post there.",
    icon: Megaphone,
  },
] as const;

export function ChatCreationLauncher({ open, onOpenChange, onSelectUser, onOpenGroup }: Props) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [view, setView] = useState<View>("actions");
  const [search, setSearch] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    if (!open) {
      setView("actions");
      setSearch("");
      setShowGroupModal(false);
    }
  }, [open]);

  const normalizedSearch = search.trim();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["chat-creation-people", user?.id, normalizedSearch],
    enabled: open && view === "people" && !!user,
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key, business_name")
        .eq("account_status", "active")
        .neq("id", user!.id)
        .order("created_at", { ascending: false })
        .limit(normalizedSearch.length >= 2 ? 20 : 12);

      if (normalizedSearch.length >= 2) {
        query = query.or(`display_name.ilike.%${normalizedSearch}%,username.ilike.%${normalizedSearch}%,business_name.ilike.%${normalizedSearch}%`);
      }

      const { data, error } = await query;
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
    if (actionKey === "group") {
      if (!requireAuth()) return;
      setShowGroupModal(true);
      return;
    }

    if (actionKey === "dm") {
      if (!requireAuth()) return;
      setView("people");
      return;
    }

    if (actionKey === "community") {
      if (!requireAuth()) return;
      onOpenChange(false);
      navigate("/community");
      return;
    }

    if (!requireAuth()) return;
    window.dispatchEvent(new Event("yangu:open-global-chat"));
    onOpenChange(false);
  };

  const content = view === "actions" ? (
    <div className="space-y-1.5 px-3 pb-3 sm:px-4 sm:pb-4">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            type="button"
            onClick={() => handleAction(action.key)}
            className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-opacity hover:opacity-85"
            style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "hsl(var(--secondary))" }}>
              <Icon className="h-4 w-4" style={{ color: "hsl(var(--accent))" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground">{action.title}</p>
              <p className="mt-0.5 text-[11px] leading-tight" style={{ color: "hsl(var(--muted-foreground))" }}>{action.description}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        );
      })}
    </div>
  ) : (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-3 sm:px-4" style={{ borderColor: "hsl(var(--border))" }}>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView("actions")} aria-label="Back">
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold text-foreground">New contact / New chat</h3>
          <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>Search and open the DM instantly.</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)} aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-3 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people or business name"
            className="flex-1 bg-transparent text-[13px] outline-none text-foreground"
          />
        </div>

        <div className="overflow-hidden rounded-xl border max-h-[280px] overflow-y-auto" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-8 text-[13px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading people...
            </div>
          ) : people.length === 0 ? (
            <div className="px-3 py-8 text-center text-[13px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              {normalizedSearch.length >= 2 ? "No matching people found." : "Start typing to search or pick from recent people."}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
              {people.map((person: any) => {
                const label = person.display_name || person.username || "User";
                const initials = label.slice(0, 2).toUpperCase();
                const avatar = resolveAvatarUrl(person);

                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onSelectUser(person.id);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-opacity hover:opacity-80"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}>
                      {avatar ? <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">{label}</p>
                      <p className="truncate text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {person.business_name || (person.username ? `@${person.username}` : "Start direct outreach")}
                      </p>
                    </div>
                    <MessageCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--accent))" }} />
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
          <DrawerContent className="max-h-[80vh] border-t p-0" style={{ background: "hsl(var(--surface-elevated))", borderColor: "hsl(var(--border))" }}>
            {view === "actions" && (
              <DrawerHeader className="border-b px-3 pb-3 pt-4" style={{ borderColor: "hsl(var(--border))" }}>
                <DrawerTitle className="text-sm">New chat</DrawerTitle>
                <DrawerDescription className="text-xs">Choose how you want to start the conversation.</DrawerDescription>
              </DrawerHeader>
            )}
            {content}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="overflow-hidden border p-0 sm:max-w-md" style={{ background: "hsl(var(--surface-elevated))", borderColor: "hsl(var(--border))" }}>
            {view === "actions" && (
              <DialogHeader className="border-b px-4 py-3" style={{ borderColor: "hsl(var(--border))" }}>
                <DialogTitle className="text-sm">New chat</DialogTitle>
                <DialogDescription className="text-xs">Choose how you want to start.</DialogDescription>
              </DialogHeader>
            )}
            {content}
          </DialogContent>
        </Dialog>
      )}

      <CreateGroupModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreated={(groupId) => {
          setShowGroupModal(false);
          onOpenChange(false);
          onOpenGroup(groupId);
        }}
      />
    </>
  );
}