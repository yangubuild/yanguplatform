import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Detects ?accept_invite=ID in the URL, calls the accept_team_invite RPC,
 * marks the notification read, and cleans the URL.
 */
export function useAcceptInvite() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const processedRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (inviteId: string) => {
      // Get invite details before accepting (for confirmation messages)
      const { data: inviteData } = await supabase
        .from("admin_invites")
        .select("invited_by, role, email")
        .eq("id", inviteId)
        .single();

      const { error } = await (supabase.rpc as any)("accept_team_invite", {
        p_invite_id: inviteId,
      });
      if (error) throw error;

      // Mark related notification as read
      await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .eq("user_id", user!.id)
        .eq("type", "team_invite")
        .filter("metadata->>invite_id", "eq", inviteId);

      // Get current user's profile for the confirmation message
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user!.id)
        .single();

      const myHandle = myProfile?.username ? `@${myProfile.username}` : (myProfile?.display_name || "A user");

      // Notify the original inviter that the invite was accepted
      if (inviteData?.invited_by) {
        await supabase.from("notifications").insert({
          user_id: inviteData.invited_by,
          type: "team_invite_accepted",
          title: "Invite Accepted",
          body: `${myHandle} accepted your team invite.`,
          link: `/dashboard/home`,
          metadata: { invite_id: inviteId, accepted_by: user!.id },
        });

        // Send DM to inviter confirming acceptance (from the accepting user)
        await supabase.from("direct_messages").insert({
          sender_id: user!.id,
          receiver_id: inviteData.invited_by,
          content: `✅ I've accepted your team invite! Happy to be on the team.`,
        });
      }
    },
    onSuccess: () => {
      toast.success("Invite accepted! You've been added to the team.");
      qc.invalidateQueries({ queryKey: ["staff-panel-members"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["team-invites"] });
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to accept invite";
      if (msg.includes("already")) {
        toast.info("This invite has already been accepted.");
      } else if (msg.includes("not for your")) {
        toast.error("This invite is for a different account.");
      } else if (msg.includes("not found")) {
        toast.error("Invite not found or expired.");
      } else {
        toast.error(msg);
      }
    },
  });

  useEffect(() => {
    const inviteId = searchParams.get("accept_invite");
    if (!inviteId || !user || processedRef.current === inviteId) return;
    processedRef.current = inviteId;

    // Clean URL immediately
    const next = new URLSearchParams(searchParams);
    next.delete("accept_invite");
    setSearchParams(next, { replace: true });

    mutation.mutate(inviteId);
  }, [searchParams, user]);

  return mutation;
}
