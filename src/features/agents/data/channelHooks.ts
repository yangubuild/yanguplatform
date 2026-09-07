import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { auditRepo } from "./repo";
import { useOrgId } from "./hooks";


export type AgentChannel = {
  id: string;
  org_id: string;
  agent_id: string;
  channel: "voice" | "whatsapp" | "webchat";
  enabled: boolean;
  status: "setup_required" | "connected" | "error" | "disabled";
  config: Record<string, any>;
  last_error: string | null;
  last_health_check_at: string | null;
};

const key = (agentId: string | undefined) => ["agents", "channels", agentId ?? "none"] as const;

export function useAgentChannels(agentId?: string) {
  const { data: orgId, isLoading: orgLoading } = useOrgId();
  return useQuery({
    queryKey: key(agentId),
    queryFn: async () => {
      if (!agentId || !orgId) return [] as AgentChannel[];
      const { data, error } = await supabase.from("agent_channels").select("*").eq("agent_id", agentId).eq("org_id", orgId).order("channel");
      if (error) throw error;
      return (data ?? []) as AgentChannel[];
    },
    enabled: !orgLoading && !!agentId && !!orgId,
    staleTime: 10_000,
  });
}

export type WebchatSettings = {
  agentId: string;
  allowedOrigins: string[];
  greeting: string;
  launcherLabel: string;
  accentColor: string;
  displayName?: string;
  avatarUrl?: string;
  launcherPosition?: "right" | "left";
  offlineMessage?: string;
};

export function useConnectWebchat() {
  const qc = useQueryClient();
  const { data: orgId } = useOrgId();
  return useMutation({
    mutationFn: async (input: WebchatSettings) => {
      if (!orgId) throw new Error("No active organization");
      const { data, error } = await supabase.from("agent_channels").upsert({
        org_id: orgId,
        agent_id: input.agentId,
        channel: "webchat",
        enabled: true,
        status: "connected",
        config: {
          allowed_origins: input.allowedOrigins,
          greeting: input.greeting || null,
          launcher_label: input.launcherLabel || "Chat with us",
          accent_color: input.accentColor || null,
          display_name: input.displayName || null,
          avatar_url: input.avatarUrl || null,
          launcher_position: input.launcherPosition === "left" ? "left" : "right",
          offline_message: input.offlineMessage || null,
        },
        last_error: null,
        last_health_check_at: new Date().toISOString(),
      }, { onConflict: "agent_id,channel" }).select("*").single();
      if (error) throw error;
      await auditRepo.log("channel.webchat.save", "agent_channel", (data as AgentChannel).id, null, {
        agent_id: input.agentId,
        allowed_origins: input.allowedOrigins,
        launcher_position: input.launcherPosition ?? "right",
      });
      return data as AgentChannel;
    },
    onSuccess: (_data, values) => { qc.invalidateQueries({ queryKey: key(values.agentId) }); toast.success("Web chat saved"); },
    onError: (error: Error) => toast.error(error.message || "Could not connect web chat"),
  });
}

export function useConnectWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { agentId: string; phoneNumberId: string; wabaId: string; accessToken: string }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-connect", { body: { action: "connect", ...input } });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).message || (data as any).error);
      // Never log credentials — only the non-secret identifiers.
      await auditRepo.log("channel.whatsapp.connect", "agent_channel", undefined, null, {
        agent_id: input.agentId,
        phone_number_id: input.phoneNumberId,
      });
      return data;
    },
    onSuccess: (_data, values) => { qc.invalidateQueries({ queryKey: key(values.agentId) }); toast.success("WhatsApp connected"); },
    onError: (error: Error) => toast.error(error.message || "Could not connect WhatsApp"),
  });
}

export function useDisconnectChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { agentId: string; channel: "whatsapp" | "webchat" }) => {
      if (input.channel === "whatsapp") {
        const { data, error } = await supabase.functions.invoke("whatsapp-connect", { body: { action: "disconnect", agentId: input.agentId } });
        if (error) throw new Error(error.message);
        if ((data as any)?.error) throw new Error((data as any).message || (data as any).error);
        await auditRepo.log("channel.whatsapp.disconnect", "agent_channel", undefined, null, { agent_id: input.agentId });
        return data;
      }
      const { error } = await supabase.from("agent_channels").update({ enabled: false, status: "disabled" }).eq("agent_id", input.agentId).eq("channel", input.channel);
      if (error) throw error;
      await auditRepo.log("channel.webchat.disable", "agent_channel", undefined, null, { agent_id: input.agentId });
      return { ok: true };
    },
    onSuccess: (_data, values) => { qc.invalidateQueries({ queryKey: key(values.agentId) }); toast.success("Channel disconnected"); },
    onError: (error: Error) => toast.error(error.message || "Could not disconnect channel"),
  });
}


export function webchatEndpoint() {
  return `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/webchat`;
}
