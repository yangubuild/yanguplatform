import { useState } from "react";
import { useCreateGroup } from "@/hooks/useGroupChats";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (groupId: string) => void;
}

export function CreateGroupModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<any[]>([]);
  const { user } = useAuth();
  const createGroup = useCreateGroup();

  if (!open) return null;

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .neq("id", user?.id ?? "")
      .limit(10);
    setSearchResults((data ?? []).filter(p => !selectedIds.includes(p.id)));
  };

  const toggleUser = (profile: any) => {
    if (selectedIds.includes(profile.id)) {
      setSelectedIds(prev => prev.filter(id => id !== profile.id));
      setSelectedProfiles(prev => prev.filter(p => p.id !== profile.id));
    } else {
      setSelectedIds(prev => [...prev, profile.id]);
      setSelectedProfiles(prev => [...prev, profile]);
    }
  };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Group name is required"); return; }
    createGroup.mutate(
      { name: name.trim(), description: description.trim() || undefined, memberIds: selectedIds },
      {
        onSuccess: (groupId) => {
          toast.success("Group created!");
          onCreated?.(groupId);
          onClose();
          setName(""); setDescription(""); setSelectedIds([]); setSelectedProfiles([]); setSearch(""); setSearchResults([]);
        },
        onError: () => toast.error("Failed to create group"),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ background: "#141a22", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Create Group</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-white/40" /></button>
        </div>

        <div className="space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Group name *"
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          />

          {/* Add members */}
          <div>
            <p className="text-xs font-medium text-white/60 mb-2">Add Members</p>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
              <Search className="w-3.5 h-3.5 text-white/35" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search users..."
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                {searchResults.map(p => (
                  <button key={p.id} onClick={() => toggleUser(p)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:opacity-80">
                    <span className="truncate">{p.display_name || p.username}</span>
                    <span className="ml-auto text-[9px]" style={{ color: "#4ade80" }}>+ Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected chips */}
          {selectedProfiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedProfiles.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] text-white" style={{ background: "rgba(96,165,250,0.2)" }}>
                  {p.display_name || p.username}
                  <button onClick={() => toggleUser(p)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-white/60 hover:opacity-80" style={{ background: "rgba(255,255,255,0.06)" }}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || createGroup.isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}
          >
            {createGroup.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
