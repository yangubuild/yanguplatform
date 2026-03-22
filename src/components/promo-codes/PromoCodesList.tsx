import { Plus, Tag, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  promoCodes: any[];
  onCreateClick: () => void;
}

export function PromoCodesList({ promoCodes, onCreateClick }: Props) {
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("merchant_promo_codes" as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Promo code deleted");
      queryClient.invalidateQueries({ queryKey: ["merchant-promo-codes"] });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Promo Codes</h2>
        <Button variant="accent" onClick={onCreateClick} className="rounded-xl px-4 h-9 gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Create
        </Button>
      </div>

      <div className="space-y-2">
        {promoCodes.map((p: any) => (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground tracking-wider">{p.code}</p>
              <p className="text-xs text-muted-foreground">
                {p.discount_value}{p.discount_type === "percentage" ? "%" : "$"} off
                {" · "}{p.redemption_count || 0} redeemed
                {p.is_active ? "" : " · Inactive"}
              </p>
            </div>
            <button onClick={() => copyCode(p.code)} className="p-2 rounded-lg hover:bg-white/[0.06]">
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-white/[0.06]">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
