import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Loader2, UserCog } from "lucide-react";
import { AddTeamModal } from "../AddTeamModal";

interface OrgMember {
  user_id: string;
  role: string;
  org_id: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export function StaffPanel() {
  const { user } = useAuth();
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["staff-panel-members", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<OrgMember[]> => {
      if (!user) return [];

      // Get user's orgs
      const { data: orgs, error: orgErr } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", user.id);
      if (orgErr) throw orgErr;
      if (!orgs?.length) return [];

      const orgIds = orgs.map((o) => o.org_id);

      // Get all members of those orgs
      const { data: allMembers, error: memErr } = await supabase
        .from("org_memberships")
        .select("user_id, role, org_id")
        .in("org_id", orgIds);
      if (memErr) throw memErr;
      if (!allMembers?.length) return [];

      // Get profiles for members
      const userIds = [...new Set(allMembers.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      return allMembers.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) || undefined,
      }));
    },
  });

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Staff</span>
        <button
          onClick={() => setTeamModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "rgba(181,98,42,0.12)", color: "#E67E22" }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Staff
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <UserCog className="w-8 h-8 mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm text-white mb-1">No staff members yet</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Add team members to help manage your business.
            </p>
          </div>
        ) : (
          members.map((member, i) => {
            const name = member.profile?.display_name || member.profile?.username || "Member";
            const initials = name.slice(0, 2).toUpperCase();
            return (
              <div
                key={`${member.user_id}-${member.org_id}-${i}`}
                className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                >
                  {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{name}</p>
                  <p className="text-xs truncate capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {member.role}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddTeamModal open={teamModalOpen} onOpenChange={setTeamModalOpen} />
    </div>
  );
}
