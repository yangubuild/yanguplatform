import { useState } from "react";
import { Eye, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatarUtils";

const ROLES = [
  { name: "Owner", desc: "Full access", dbRole: "owner" },
  { name: "Manager", desc: "Manage products, members, settings & payments", dbRole: "manager" },
  { name: "Designer", desc: "Design and content editing access", dbRole: "designer" },
  { name: "Admin", desc: "Administrative access to all features", dbRole: "admin" },
  { name: "Member", desc: "Basic team member access", dbRole: "user" },
];

interface AddTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTeamModal({ open, onOpenChange }: AddTeamModalProps) {
  const { user } = useAuth();
  const { data: activeOrg } = useActiveOrg();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; email?: string; username?: string; display_name?: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  // Search for existing YANGU accounts by username or display_name
  const { data: searchResults = [] } = useQuery({
    queryKey: ["team-user-search", searchInput],
    enabled: searchInput.trim().length>= 2 && !selectedUser,
    queryFn: async () => {
      const term = searchInput.trim().toLowerCase();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, avatar_mode, avatar_emoji_key")
        .eq("account_status", "active")
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .neq("id", user?.id ?? "")
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSelectUser = (u: typeof searchResults[0]) => {
    setSelectedUser({ id: u.id, username: u.username ?? undefined, display_name: u.display_name ?? undefined });
    setSearchInput(u.display_name || u.username || "");
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setSearchInput("");
  };

  const handleInvite = async () => {
    if (!selectedRole || !user) return;

    if (!activeOrg) {
      toast.error("No team/organization found. Please create or join one first.");
      return;
    }
    
    // Must have selected a valid existing user
    if (!selectedUser) {
      toast.error("Please select an existing YANGU account to invite.");
      return;
    }

    setInviting(true);
    try {
      const selectedRoleObj = ROLES.find(r => r.name === selectedRole);
      if (!selectedRoleObj) return;

      // Check if user already in org
      const { data: existingMember } = await supabase
        .from("org_memberships")
        .select("user_id")
        .eq("org_id", activeOrg.id)
        .eq("user_id", selectedUser.id)
        .maybeSingle();

      if (existingMember) {
        toast.error("This user is already a team member.");
        setInviting(false);
        return;
      }

      // Save invite to database with real user ID for acceptance matching
      const { data: invite, error } = await supabase
        .from("admin_invites")
        .insert({
          email: (selectedUser.username ?? selectedUser.id) + "@yangu.internal",
          role: selectedRoleObj.dbRole as any,
          invited_by: user.id,
          invited_user_id: selectedUser.id,
          status: "pending",
        } as any)
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("An invite for this user already exists");
        } else {
          throw error;
        }
        setInviting(false);
        return;
      }

      const handle = selectedUser.username ? `@${selectedUser.username}` : (selectedUser.display_name || "user");

      // Get sender's profile for the invite DM identity
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .single();
      const senderHandle = senderProfile?.username ? `@${senderProfile.username}` : (senderProfile?.display_name || "Someone");

      // 1. Notification for the INVITEE — links to messages chats tab to see the DM
      await supabase.from("notifications").insert({
        user_id: selectedUser.id,
        type: "team_invite",
        title: "Team Invitation",
        body: `${senderHandle} invited you to join as ${selectedRoleObj.name}. Check your messages to accept.`,
        link: `/dashboard/messages?tab=chats&user=${user.id}`,
        metadata: {
          invite_id: invite.id,
          role: selectedRoleObj.dbRole,
          invited_by: user.id,
          org_id: activeOrg.id,
        },
      });

      // 2. DM to INVITEE from sender — contains accept link
      await supabase.from("direct_messages").insert({
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: `🤝 Hey! I'm inviting you to join my team as **${selectedRoleObj.name}**.\n\n[Accept Invite](/dashboard/home?accept_invite=${invite.id})`,
      });

      // 3. SENDER notification — routes to Support tab (system confirmation)
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "team_invite_sent",
        title: "Team Invite Sent",
        body: `You invited ${handle} to join your team as ${selectedRoleObj.name}. Status: Pending acceptance.`,
        link: `/dashboard/messages?tab=support`,
        metadata: {
          invite_id: invite.id,
          target_user_id: selectedUser.id,
          role: selectedRoleObj.dbRole,
        },
      });

      toast.success(`Invite sent to ${selectedUser.display_name || selectedUser.username}`);
      setSearchInput("");
      setSelectedUser(null);
      setSelectedRole(null);
      queryClient.invalidateQueries({ queryKey: ["staff-panel-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-invites"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Invite error:", err);
      toast.error(err.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const isEmailLike = searchInput.includes("@") && !selectedUser;
  const noResultsAndSearching = searchInput.trim().length>= 2 && searchResults.length === 0 && !selectedUser;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 border-0 gap-0"
        style={{ background: "#1a2027", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-foreground">Add team member</DialogTitle>
        </div>

        <div className="px-4 py-2 space-y-1">
          {ROLES.map((role) => (
            <button
              key={role.name}
              onClick={() => setSelectedRole(role.name)}
              className="w-full flex items-center justify-between px-3 py-4 rounded-lg transition-colors"
              style={{
                background: selectedRole === role.name ? "rgba(181,98,42,0.12)" : "transparent" }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor: selectedRole === role.name ? "#E67E22" : "rgba(255,255,255,0.2)" }}>
                  {selectedRole === role.name && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#E67E22" }} />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.desc}</p>
                </div>
              </div>
              <Eye className="w-4 h-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="mx-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {/* Search input */}
        <div className="px-4 pt-3 relative">
          <div className="flex items-center gap-2 rounded-lg px-3 h-10 bg-muted border border-border">
            <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (selectedUser) setSelectedUser(null);
              }}
              placeholder="Search by name or username..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {selectedUser && (
              <button onClick={handleClearUser} className="text-xs text-muted-foreground hover:text-muted-foreground">✕</button>
            )}
          </div>

          {/* Search results dropdown */}
          {searchInput.trim().length>= 2 && !selectedUser && searchResults.length> 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 z-50 rounded-lg overflow-hidden"
              style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
              {searchResults.map((u) => {
                const resolved = resolveAvatarUrl(u);
                const fallbackInitials = (u.display_name || u.username || "?").slice(0, 2).toUpperCase();
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                      style={{ background: resolved ? "transparent" : "rgba(255,255,255,0.1)" }}>
                      {resolved ? (
                        <img src={resolved} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        fallbackInitials
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.display_name || u.username}</p>
                      {u.username && <p className="text-xs text-muted-foreground truncate">@{u.username}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Warning messages */}
        {(noResultsAndSearching || isEmailLike) && (
          <div className="px-4 pt-2">
            <p className="text-xs px-1" style={{ color: "#E67E22" }}>
              {isEmailLike
                ? "Search by name or username instead of email. The user must have an active YANGU account."
                : "No matching accounts found. The user must sign up first before being added to a team."}
            </p>
          </div>
        )}

        {/* Selected user indicator */}
        {selectedUser && (
          <div className="px-4 pt-1">
            <p className="text-xs text-green-400 px-1">
              ✓ {selectedUser.display_name || selectedUser.username} selected
            </p>
          </div>
        )}

        {/* Hint for missing steps */}
        {selectedUser && !selectedRole && (
          <div className="px-4 pt-1">
            <p className="text-xs px-1" style={{ color: "#E67E22" }}>
              Select a role above to continue
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-4 pb-5 pt-3">
          <button
            className="h-10 px-5 rounded-lg text-sm font-semibold transition-opacity flex items-center gap-2"
            style={{
              background: selectedUser && selectedRole && activeOrg ? "linear-gradient(135deg, #c47a3a, #5c2a12)" : "rgba(255,255,255,0.08)",
              color: selectedUser && selectedRole && activeOrg ? "#fff" : "rgba(255,255,255,0.35)",
              cursor: selectedUser && selectedRole && activeOrg ? "pointer" : "not-allowed" }}
            disabled={!selectedUser || !selectedRole || inviting || !activeOrg}
            onClick={handleInvite}>
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
