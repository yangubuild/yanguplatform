import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface QuickReactionBarProps {
  messageId: string;
  /** "dm" or "group" — determines which table to write to */
  type: "dm" | "group";
  onClose: () => void;
}

export function QuickReactionBar({ messageId, type, onClose }: QuickReactionBarProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reacting, setReacting] = useState(false);

  const handleReact = async (emoji: string) => {
    if (!user || reacting) return;
    setReacting(true);
    const table = type === "dm" ? "dm_reactions" : "group_message_reactions";
    // Toggle: if already reacted with same emoji, remove it
    const { data: existing } = await supabase
      .from(table)
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing) {
      await supabase.from(table).delete().eq("id", existing.id);
    } else {
      await supabase.from(table).insert({ message_id: messageId, user_id: user.id, emoji });
    }
    // Invalidate reactions query
    qc.invalidateQueries({ queryKey: [`${type}-reactions`, messageId] });
    setReacting(false);
    onClose();
  };

  return (
    <div
      className="flex items-center gap-0.5 rounded-full px-1.5 py-1 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
      style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.12)" }}
      onClick={(e) => e.stopPropagation()}>
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          disabled={reacting}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-base">
          {emoji}
        </button>
      ))}
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-muted-foreground"
        title="More reactions">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
