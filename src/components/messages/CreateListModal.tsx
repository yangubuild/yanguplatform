import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, List, X } from "lucide-react";
import { toast } from "sonner";

import { useCreateChatList } from "@/hooks/useChatLists";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (listId: string) => void;
}

type SearchProfile = { id: string; display_name: string | null; username: string | null; business_name: string | null; creator_type: string | null };

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ["food", "restaurant", "chef", "catering", "bakery", "cooking"],
  fashion: ["fashion", "clothing", "apparel", "style", "wear", "boutique"],
  beauty: ["beauty", "skincare", "cosmetics", "makeup", "salon", "spa"],
  fitness: ["fitness", "gym", "health", "wellness", "sport", "training"],
  tech: ["tech", "gadgets", "electronics", "software", "digital", "it"],
  "real estate": ["real estate", "housing", "property", "homes", "apartment", "rental"],
  music: ["music", "artist", "band", "producer", "dj", "audio"],
  furniture: ["furniture", "decor", "interior", "home", "design"],
};

function isCategorySearch(q: string): boolean {
  const lower = q.toLowerCase();
  return Object.keys(CATEGORY_KEYWORDS).some((k) => lower.includes(k)) ||
    Object.values(CATEGORY_KEYWORDS).some((arr) => arr.some((w) => lower.includes(w)));
}

function buildCategoryFilter(q: string): string {
  const lower = q.toLowerCase();
  const parts = [
    `display_name.ilike.%${q}%`,
    `username.ilike.%${q}%`,
    `business_name.ilike.%${q}%`,
    `creator_type.ilike.%${q}%`,
  ];
  for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw) && kw !== lower) {
        parts.push(`business_name.ilike.%${kw}%`);
        break;
      }
    }
  }
  return parts.join(",");
}

function getLabel(p: SearchProfile) {
  return p.display_name || p.username || "User";
}

export function CreateListModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const createList = useCreateChatList();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SearchProfile[]>([]);

  const normalized = search.trim();
  const selectedIds = useMemo(() => new Set(selected.map((p) => p.id)), [selected]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["list-search-users", user?.id, normalized],
    enabled: !!user && normalized.length>= 2,
    queryFn: async (): Promise<SearchProfile[]> => {
      const filter = buildCategoryFilter(normalized);
      const { data, error } = await supabase
        .from("public_profile_view" as any)
        .select("id, display_name, username, business_name, creator_type")
        .or(filter)
        .neq("id", user!.id)
        .limit(20);
      if (error) throw error;
      return (data ?? []).filter((p) => !selectedIds.has(p.id));
    },
  });

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("List name is required"); return; }
    createList.mutate(
      { name: trimmed, memberUserIds: [...selectedIds] },
      {
        onSuccess: (id) => { toast.success("List created"); onCreated?.(id); onClose(); setName(""); setSelected([]); setSearch(""); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create list"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="overflow-hidden border p-0 sm:max-w-sm" style={{ background: "hsl(var(--surface-elevated))", borderColor: "hsl(var(--border))" }}>
        <DialogHeader className="sr-only"><DialogTitle>Create list</DialogTitle><DialogDescription>Create a new list.</DialogDescription></DialogHeader>
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
                <List className="h-4 w-4" style={{ color: "hsl(var(--accent))" }} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">New list</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
          </div>

          <div className="space-y-3 px-4 py-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fashion influencers" className="w-full rounded-lg border px-3 py-2 text-sm outline-none text-foreground" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }} />

            <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
              <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, business, or category" className="flex-1 bg-transparent text-xs outline-none text-foreground" />
            </div>

            {selected.length> 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px]" style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))" }}>
                    <span className="max-w-[120px] truncate">{getLabel(p)}</span>
                    <button type="button" onClick={() => setSelected((c) => c.filter((x) => x.id !== p.id))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}

            <div className="max-h-[176px] overflow-y-auto rounded-lg border" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
              {normalized.length < 2 ? (
                <p className="px-3 py-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Type 2+ characters to search people by name or category.</p>
              ) : isLoading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...</div>
              ) : results.length === 0 ? (
                <p className="px-3 py-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>No matching people found.</p>
              ) : (
                <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                  {results.map((p) => (
                    <button key={p.id} type="button" onClick={() => { setSelected((c) => c.some((x) => x.id === p.id) ? c : [...c, p]); setSearch(""); }} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-opacity hover:opacity-80">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{getLabel(p)}</p>
                        {p.business_name && <p className="truncate text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{p.business_name}</p>}
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--accent))" }}>Add</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t px-4 py-3" style={{ borderColor: "hsl(var(--border))" }}>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="accent" size="sm" onClick={handleCreate} disabled={!name.trim() || createList.isPending}>
              {createList.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Create list
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
