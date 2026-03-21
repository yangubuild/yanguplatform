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

interface GroupFormProps {
  onCancel: () => void;
  onCreated?: (groupId: string) => void;
}

type SearchProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
};

function getProfileLabel(profile: SearchProfile) {
  return profile.display_name || profile.username || "User";
}

function CreateGroupForm({ onCancel, onCreated }: GroupFormProps) {
  const { user } = useAuth();
  const createGroup = useCreateGroup();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<SearchProfile[]>([]);

  const normalizedSearch = search.trim();
  const selectedIds = useMemo(() => Array.from(new Set(selectedProfiles.map((profile) => profile.id))), [selectedProfiles]);

  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ["group-search-users", user?.id, normalizedSearch, selectedIds.join(",")],
    enabled: !!user && normalizedSearch.length >= 2,
    queryFn: async (): Promise<SearchProfile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .or(`display_name.ilike.%${normalizedSearch}%,username.ilike.%${normalizedSearch}%`)
        .eq("account_status", "active")
        .neq("id", user!.id)
        .limit(12);

      if (error) throw error;

      const selectedSet = new Set(selectedIds);
      return (data ?? []).filter((profile) => !selectedSet.has(profile.id));
    },
  });

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Group name is required");
      return;
    }

    createGroup.mutate(
      {
        name: trimmedName,
        description: description.trim() || undefined,
        memberIds: selectedIds,
      },
      {
        onSuccess: (groupId) => {
          toast.success("Group created");
          onCreated?.(groupId);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to create group");
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col" style={{ background: "hsl(var(--surface-elevated))" }}>
      <div className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: "hsl(var(--border))" }}>
        <div>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "hsl(var(--secondary))" }}>
            <Users className="h-5 w-5" style={{ color: "hsl(var(--accent))" }} />
          </div>
          <h3 className="text-lg font-semibold text-foreground">New group</h3>
          <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Search members, review selections, and open the thread once creation succeeds.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close group creation">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--muted-foreground))" }}>
            Group name
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Campaign partners"
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none text-foreground"
            style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--muted-foreground))" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional context"
            rows={3}
            className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none text-foreground"
            style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--muted-foreground))" }}>
              Add members
            </label>
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{selectedIds.length} selected</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
            <Search className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people to add"
              className="flex-1 bg-transparent text-sm outline-none text-foreground"
            />
          </div>

          {selectedProfiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedProfiles.map((profile) => (
                <span key={profile.id} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs" style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))" }}>
                  <span className="max-w-[180px] truncate">{getProfileLabel(profile)}</span>
                  <button type="button" onClick={() => setSelectedProfiles((current) => current.filter((item) => item.id !== profile.id))}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="rounded-2xl border" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}>
            {normalizedSearch.length < 2 ? (
              <div className="px-4 py-5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                Type at least 2 characters to search active members.
              </div>
            ) : searching ? (
              <div className="flex items-center justify-center gap-2 px-4 py-5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                <Loader2 className="h-4 w-4 animate-spin" /> Searching people...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                No matching people found.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {searchResults.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      setSelectedProfiles((current) => current.some((item) => item.id === profile.id) ? current : [...current, profile]);
                      setSearch("");
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-opacity hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{getProfileLabel(profile)}</p>
                      {profile.username && profile.display_name && (
                        <p className="truncate text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>@{profile.username}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "hsl(var(--accent))" }}>Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t px-6 py-4" style={{ borderColor: "hsl(var(--border))" }}>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="accent" onClick={handleCreate} disabled={!name.trim() || createGroup.isPending}>
          {createGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create group
        </Button>
      </div>
    </div>
  );
}

export function CreateGroupModal({ open, onClose, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="overflow-hidden border p-0 sm:max-w-2xl" style={{ background: "hsl(var(--surface-elevated))", borderColor: "hsl(var(--border))" }}>
        <DialogHeader className="sr-only">
          <DialogTitle>Create group</DialogTitle>
          <DialogDescription>Create a new group and add members.</DialogDescription>
        </DialogHeader>
        <CreateGroupForm onCancel={onClose} onCreated={(groupId) => { onCreated?.(groupId); onClose(); }} />
      </DialogContent>
    </Dialog>
  );
}