import { useState } from "react";
import { Tag, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const LABEL_OPTIONS = [
  { value: "new_customer", label: "New Customer", color: "#3b82f6" },
  { value: "pending_payment", label: "Pending Payment", color: "#f59e0b" },
  { value: "paid", label: "Paid", color: "#22c55e" },
  { value: "new_order", label: "New Order", color: "#8b5cf6" },
  { value: "follow_up", label: "Follow Up", color: "#ef4444" },
  { value: "order_complete", label: "Order Complete", color: "#06b6d4" },
];

interface ChatLabelProps {
  targetUserId: string;
}

export function ChatLabel({ targetUserId }: ChatLabelProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);

  const { data: labels = [] } = useQuery({
    queryKey: ["chat-labels", user?.id, targetUserId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_labels")
        .select("*")
        .eq("user_id", user!.id)
        .eq("target_user_id", targetUserId);
      return data || [];
    },
  });

  const toggleLabel = async (labelValue: string) => {
    if (!user) return;
    const existing = labels.find((l) => l.label === labelValue);
    if (existing) {
      await supabase.from("chat_labels").delete().eq("id", existing.id);
    } else {
      await supabase.from("chat_labels").insert({
        user_id: user.id,
        target_user_id: targetUserId,
        label: labelValue,
      });
    }
    qc.invalidateQueries({ queryKey: ["chat-labels", user?.id, targetUserId] });
  };

  const activeLabels = labels.map((l) => l.label);

  return (
    <div className="relative">
      {/* Active label badges */}
      <div className="flex items-center gap-1 flex-wrap">
        {labels.map((l) => {
          const opt = LABEL_OPTIONS.find((o) => o.value === l.label);
          if (!opt) return null;
          return (
            <span
              key={l.id}
              className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: `${opt.color}20`, color: opt.color, border: `1px solid ${opt.color}40` }}>
              {opt.label}
              <button onClick={() => toggleLabel(l.label)} className="hover:opacity-70">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          );
        })}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded hover:bg-white/10 text-muted-foreground"
          title="Add label">
          <Tag className="w-3 h-3" />
        </button>
      </div>

      {showPicker && (
        <div
          className="absolute top-full left-0 mt-1 z-30 rounded-lg py-1 min-w-[160px] shadow-xl"
          style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
          {LABEL_OPTIONS.map((opt) => {
            const isActive = activeLabels.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => { toggleLabel(opt.value); setShowPicker(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />
                <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>{opt.label}</span>
                {isActive && <span className="ml-auto text-[9px] text-success">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
