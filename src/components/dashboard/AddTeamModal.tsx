import { useState } from "react";
import { X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const ROLES = [
  { name: "Owner", desc: "Full access" },
  { name: "Operations", desc: "Manage products, members, settings & payments" },
  { name: "Sales", desc: "Members, plans, payments & promo codes" },
  { name: "Support", desc: "Chat, forums, support tickets & content moderation" },
  { name: "Advertiser", desc: "Create & manage ad campaigns and spend company budget" },
];

interface AddTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTeamModal({ open, onOpenChange }: AddTeamModalProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 border-0 gap-0"
        style={{ background: "#1a2129", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-white">Add team member</DialogTitle>
        </div>

        {/* Roles */}
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

        {/* Divider */}
        <div className="mx-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {/* New custom role */}
        <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white hover:text-white/80 transition-colors">
          <span style={{ color: "#E67E22" }}>+</span> New custom role
        </button>

        {/* Email + Invite */}
        <div className="flex items-center gap-2 px-4 pb-5 pt-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@company.com"
            className="flex-1 h-10 rounded-lg px-3 text-sm text-white outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1.5px solid rgba(100,140,255,0.4)",
            }}
          />
          <button
            className="h-10 px-5 rounded-lg text-sm font-semibold transition-opacity"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.35)",
            }}
            disabled={!email || !selectedRole}
          >
            Invite
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
