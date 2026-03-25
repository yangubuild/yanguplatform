import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, Zap, Clock, Users, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailTrigger {
  id: string;
  trigger_event: string;
  template_id: string | null;
  is_active: boolean;
  created_at: string;
}

const TRIGGER_CONFIG: Record<string, { label: string; description: string; icon: typeof Clock }> = {
  kyc_incomplete_24h: { label: "KYC Incomplete > 24h", description: "Remind users who haven't completed KYC after signup", icon: Clock },
  surface_unpublished_7d: { label: "Surface Unpublished > 7d", description: "Nudge users with draft surfaces older than 7 days", icon: Clock },
  trial_ending_3d: { label: "Trial Ending in 3 Days", description: "Alert users their trial period is ending soon", icon: Clock },
  inactive_30d: { label: "Inactive > 30 Days", description: "Re-engagement email for dormant users", icon: Users },
  onboarding_stalled: { label: "Onboarding Stalled", description: "Users who started but didn't complete onboarding", icon: Clock },
};

export function ProactiveOutreachPanel() {
  const qc = useQueryClient();

  const { data: triggers = [], isLoading } = useQuery({
    queryKey: ["email-triggers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_triggers")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as EmailTrigger[];
    },
    staleTime: 30_000,
  });

  const toggleTrigger = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("email_triggers")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-triggers"] });
      toast.success("Trigger updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createTrigger = useMutation({
    mutationFn: async (trigger_event: string) => {
      const { error } = await supabase
        .from("email_triggers")
        .insert({ trigger_event, is_active: false });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-triggers"] });
      toast.success("Trigger created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const existingEvents = triggers.map(t => t.trigger_event);
  const availableTriggers = Object.keys(TRIGGER_CONFIG).filter(k => !existingEvents.includes(k));

  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[hsl(24,95%,53%)]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Proactive Outreach Emails</h3>
        </div>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {triggers.filter(t => t.is_active).length} active triggers
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {triggers.map(trigger => {
            const config = TRIGGER_CONFIG[trigger.trigger_event];
            return (
              <div key={trigger.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3">
                  <Zap className={`h-3.5 w-3.5 ${trigger.is_active ? "text-accent" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {config?.label || trigger.trigger_event}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {config?.description || "Custom trigger"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={trigger.is_active}
                  onCheckedChange={(checked) => toggleTrigger.mutate({ id: trigger.id, is_active: checked })}
                />
              </div>
            );
          })}

          {availableTriggers.length > 0 && (
            <div className="pt-3 border-t border-border/40">
              <p className="text-[10px] text-muted-foreground mb-2">Add triggers:</p>
              <div className="flex flex-wrap gap-1.5">
                {availableTriggers.map(event => (
                  <Button
                    key={event}
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => createTrigger.mutate(event)}
                    disabled={createTrigger.isPending}
                  >
                    + {TRIGGER_CONFIG[event]?.label || event}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminGlassCard>
  );
}
