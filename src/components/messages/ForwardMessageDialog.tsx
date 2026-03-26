import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSendMessage } from "@/hooks/useDirectMessages";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { X, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  content: string;
  onClose: () => void;
}

export function ForwardMessageDialog({ content, onClose }: Props) {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const sendMessage = useSendMessage();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["forward-users", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("public_profile_view")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key")
        .neq("id", user!.id)
        .limit(50);
      return data ?? [];
    },
  });

  const filtered = users.filter((u: any) =>
    (u.display_name || u.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleForward = (userId: string, name: string) => {
    sendMessage.mutate({ receiverId: userId, content: `↪️ Forwarded:\n${content}` });
    toast.success(`Forwarded to ${name}`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div
        className="fixed inset-x-4 top-[20%] z-50 mx-auto max-w-sm rounded-xl overflow-hidden shadow-2xl sm:max-w-md"
        style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-sm font-semibold text-foreground">Forward to</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto px-1 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
          ) : (
            filtered.map((u: any) => {
              const name = u.display_name || u.username || "User";
              const av = resolveAvatarUrl(u);
              return (
                <button
                  key={u.id}
                  onClick={() => handleForward(u.id, name)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                    {av ? <img src={av} alt="" className="w-8 h-8 rounded-full object-cover" /> : <span className="text-[10px] font-bold text-muted-foreground">{name.slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{name}</p>
                    {u.username && <p className="text-[10px] text-muted-foreground">@{u.username}</p>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
