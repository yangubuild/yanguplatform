import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Users, X } from "lucide-react";
import { toast } from "sonner";

import { useCreateGroup } from "@/hooks/useGroupChats";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (groupId: string) => void;
}

type SearchProfile = { id: string; display_name: string | null; username: string | null; business_name?: string | null; creator_type?: string | null };

function getLabel(p: SearchProfile) { return p.display_name || p.username || "User"; }

const MAX_VISIBLE = 4;
const ROW_H = 42;
const LIST_MAX = MAX_VISIBLE * ROW_H;

function CreateGroupForm({ onCancel, onCreated }: { onCancel: () => void; onCreated?: (id: string) => void }) {
  const { user } = useAuth();
  const createGroup = useCreateGroup();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<SearchProfile[]>([]);

  const normalized = search.trim();
  const selectedIds = useMemo(() => Array.from(new Set(selectedProfiles.map((p) => p.id))), [selectedProfiles]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["group-search-users", user?.id, normalized, selectedIds.join(",")],
    enabled: !!user && normalized.length>= 2,
    queryFn: async (): Promise<SearchProfile[]> => {
      const { data, error } = await (supabase
        .from("public_profile_view") as any)
        .select("id, display_name, username, business_name, creator_type")
        .or(`display_name.ilike.%${normalized}%,username.ilike.%${normalized}%,business_name.ilike.%${normalized}%,creator_type.ilike.%${normalized}%`)
        .neq("id", user!.id)
        .limit(20);
      if (error) throw error;
      const set = new Set(selectedIds);
      return (data ?? []).filter((p) => !set.has(p.id));
    },
  });

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Group name is required"); return; }
    createGroup.mutate(
      { name: trimmed, description: description.trim() || undefined, memberIds: selectedIds },
      {
        onSuccess: (id) => { toast.success("Group created"); onCreated?.(id); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create group"),
      },
    );
  };

  return (
    <div className="flex flex-col" style={{ background: "hsl(var(--surface-elevated))" }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
            <Users className="h-4 w-4" style={{ color: "hsl(var(--accent))" }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">New group</h3>
            <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>Add members and start collaborating.</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>Group name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign partners" className="w-full rounded-lg border px-3 py-2 text-sm outline-none text-foreground" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional context" rows={2} className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none text-foreground" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>Add members</label>
            <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{selectedIds.length} selected</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
            <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, business, or category" className="flex-1 bg-transparent text-xs outline-none text-foreground" />
          </div>

          {selectedProfiles.length> 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedProfiles.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px]" style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))" }}>
                  <span className="max-w-[120px] truncate">{getLabel(p)}</span>
                  <button type="button" onClick={() => setSelectedProfiles((c) => c.filter((x) => x.id !== p.id))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", maxHeight: `${LIST_MAX}px` }}>
            <div className="overflow-y-auto" style={{ maxHeight: `${LIST_MAX}px` }}>
              {normalized.length < 2 ? (
                <p className="px-3 py-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Type 2+ characters to search by name or category.</p>
              ) : isLoading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...</div>
              ) : results.length === 0 ? (
                <p className="px-3 py-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>No matching people found.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                  {results.map((p) => (
                    <button key={p.id} type="button" onClick={() => { setSelectedProfiles((c) => c.some((x) => x.id === p.id) ? c : [...c, p]); setSearch(""); }} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-opacity hover:opacity-80">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{getLabel(p)}</p>
                        {(p.business_name || p.creator_type) && <p className="truncate text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{p.business_name || p.creator_type}</p>}
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--accent))" }}>Add</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-4 py-3" style={{ borderColor: "hsl(var(--border))" }}>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="accent" size="sm" onClick={handleCreate} disabled={!name.trim() || createGroup.isPending}>
          {createGroup.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Create group
        </Button>
      </div>
    </div>
  );
}

export function CreateGroupModal({ open, onClose, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="overflow-hidden border p-0 sm:max-w-sm" style={{ background: "hsl(var(--surface-elevated))", borderColor: "hsl(var(--border))" }}>
        <DialogHeader className="sr-only"><DialogTitle>Create group</DialogTitle><DialogDescription>Create a new group and add members.</DialogDescription></DialogHeader>
        <CreateGroupForm onCancel={onClose} onCreated={(id) => { onCreated?.(id); onClose(); }} />
      </DialogContent>
    </Dialog>
  );
}
