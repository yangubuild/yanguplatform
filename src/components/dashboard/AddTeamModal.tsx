import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!email || !selectedRole || !user || !activeOrg) return;
    setInviting(true);
    try {
      // Look up user by email via profiles (match on username or display_name won't work — we need to find via auth)
      // Since we can't query auth.users, look for a profile whose id matches a user with this email.
      // Best approach: look up profile by email-like username or use a lookup approach.
      // For now, we look up profiles that have the email as username (common pattern).
      // Alternatively, we store the invite and the user accepts it on login.

      // Check if user already in org
      const { data: existingMember } = await supabase
        .from("org_memberships")
        .select("user_id")
        .eq("org_id", activeOrg.id)
        .limit(100);

      // Find the db role for the selected role
      const selectedRoleObj = ROLES.find(r => r.name === selectedRole);
      if (!selectedRoleObj) return;

      const { error } = await supabase
        .from("admin_invites")
        .insert({
          email: email.trim().toLowerCase(),
          role: selectedRoleObj.dbRole as any,
          invited_by: user.id,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("An invite for this email already exists");
        } else {
          throw error;
        }
      } else {
        toast.success(`Invite sent to ${email}`);
        setEmail("");
        setSelectedRole(null);
        queryClient.invalidateQueries({ queryKey: ["staff-panel-members"] });
        queryClient.invalidateQueries({ queryKey: ["team-invites"] });
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Invite error:", err);
      toast.error(err.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 border-0 gap-0"
        style={{ background: "#111a15", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-white">Add team member</DialogTitle>
        </div>

        <div className="px-4 py-2 space-y-1">
          {ROLES.map((role) => (
            <button
              key={role.name}
              onClick={() => setSelectedRole(role.name)}
              className="w-full flex items-center justify-between px-3 py-4 rounded-lg transition-colors"
              style={{
                background: selectedRole === role.name ? "rgba(181,98,42,0.12)" : "transparent",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor: selectedRole === role.name ? "#E67E22" : "rgba(255,255,255,0.2)",
                  }}
                >
                  {selectedRole === role.name && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#E67E22" }} />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{role.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{role.desc}</p>
                </div>
              </div>
              <Eye className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
            </button>
          ))}
        </div>

        <div className="mx-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white hover:text-white/80 transition-colors">
          <span style={{ color: "#E67E22" }}>+</span> New custom role
        </button>

        <div className="flex items-center gap-2 px-4 pb-5 pt-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@company.com"
            className="flex-1 h-10 rounded-lg px-3 text-sm text-white outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1.5px solid rgba(181,98,42,0.4)",
            }}
          />
          <button
            className="h-10 px-5 rounded-lg text-sm font-semibold transition-opacity flex items-center gap-2"
            style={{
              background: email && selectedRole ? "linear-gradient(135deg, #c47a3a, #5c2a12)" : "rgba(255,255,255,0.08)",
              color: email && selectedRole ? "#fff" : "rgba(255,255,255,0.35)",
            }}
            disabled={!email || !selectedRole || inviting}
            onClick={handleInvite}
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
