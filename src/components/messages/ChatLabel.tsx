import { useState } from "react";
import { Tag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const LABEL_OPTIONS = [
  { value: "new_customer", label: "New customer", color: "#a3b18a" },
  { value: "pending_payment", label: "Pending payment", color: "#9b59b6" },
  { value: "paid", label: "Paid", color: "#7b2d3b" },
  { value: "new_order", label: "New order", color: "#c9a84c" },
  { value: "follow_up", label: "Follow up", color: "#5dade2" },
  { value: "order_complete", label: "Order complete", color: "#d4a44c" },
];

interface ChatLabelProps {
  targetUserId: string;
}

/** Inline badge row shown in the header under the username */
export function ChatLabelBadges({ targetUserId }: ChatLabelProps) {
  const { user } = useAuth();
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

  if (labels.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap mt-0.5">
      {labels.map((l) => {
        const opt = LABEL_OPTIONS.find((o) => o.value === l.label);
        if (!opt) return null;
        return (
          <span
            key={l.id}
            className="inline-flex items-center text-[8px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: `${opt.color}25`, color: opt.color }}>
            {opt.label}
          </span>
        );
      })}
    </div>
  );
}

/** Full-screen label picker dropdown (WhatsApp Business style with checkboxes) */
export function ChatLabelPicker({ targetUserId, open, onClose }: ChatLabelProps & { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();

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

  const activeLabels = labels.map((l) => l.label);

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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute left-0 top-full mt-1 z-50 rounded-xl py-2 min-w-[220px] shadow-2xl"
        style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</p>
        {LABEL_OPTIONS.map((opt) => {
          const isActive = activeLabels.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleLabel(opt.value)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: opt.color }} />
              <span className="flex-1 text-left text-foreground">{opt.label}</span>
              <div
                className="w-5 h-5 rounded border flex items-center justify-center shrink-0"
                style={{
                  borderColor: isActive ? opt.color : "rgba(255,255,255,0.2)",
                  background: isActive ? opt.color : "transparent",
                }}>
                {isActive && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Legacy export for backwards compat */
export function ChatLabel({ targetUserId }: ChatLabelProps) {
  return <ChatLabelBadges targetUserId={targetUserId} />;
}
