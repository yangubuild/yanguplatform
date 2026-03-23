import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MessageReactionsProps {
  messageId: string;
  type: "dm" | "group";
}

interface ReactionGroup {
  emoji: string;
  count: number;
  mine: boolean;
}

export function MessageReactions({ messageId, type }: MessageReactionsProps) {
  const { user } = useAuth();
  const table = type === "dm" ? "dm_reactions" : "group_message_reactions";

  const { data: reactions = [] } = useQuery({
    queryKey: [`${type}-reactions`, messageId],
    queryFn: async () => {
      const { data } = await supabase
        .from(table)
        .select("id, emoji, user_id")
        .eq("message_id", messageId);
      return data || [];
    },
    staleTime: 10_000,
  });

  if (reactions.length === 0) return null;

  // Group by emoji
  const groups: ReactionGroup[] = [];
  const map = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count++;
      if (r.user_id === user?.id) existing.mine = true;
    } else {
      map.set(r.emoji, { count: 1, mine: r.user_id === user?.id });
    }
  }
  map.forEach((v, emoji) => groups.push({ emoji, ...v }));

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {groups.map((g) => (
        <span
          key={g.emoji}
          className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full"
          style={{
            background: g.mine ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
            border: g.mine ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.08)",
          }}>
          <span>{g.emoji}</span>
          {g.count > 1 && <span className="text-muted-foreground">{g.count}</span>}
        </span>
      ))}
    </div>
  );
}
