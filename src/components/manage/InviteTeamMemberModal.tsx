import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateInvitation } from "@/hooks/manage/useAgencyInvitations";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

const INVITE_ROLES = [
  { value: "foot_soldier", label: "Foot Soldier" },
  { value: "agency_manager", label: "Sales Lead" },
  { value: "finance_officer", label: "Finance Officer" },
  { value: "creator", label: "Creator" },
  { value: "influencer", label: "Influencer" },
];

const DEFAULT_SPLITS: Record<string, { p1: number; p2: number }> = {
  foot_soldier: { p1: 0.50, p2: 1.00 },
  agency_manager: { p1: 0.25, p2: 0.50 },
  finance_officer: { p1: 0, p2: 0 },
  creator: { p1: 0.50, p2: 1.00 },
  influencer: { p1: 0.50, p2: 1.00 },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
}

export function InviteTeamMemberModal({ open, onOpenChange, agencyId }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("foot_soldier");
  const [p1, setP1] = useState(0.50);
  const [p2, setP2] = useState(1.00);
  const createInvite = useCreateInvitation();

  const handleRoleChange = (val: string) => {
    setRole(val);
    const defaults = DEFAULT_SPLITS[val] ?? { p1: 0.50, p2: 1.00 };
    setP1(defaults.p1);
    setP2(defaults.p2);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await createInvite.mutateAsync({
        agency_id: agencyId,
        email: email.trim().toLowerCase(),
        role,
        commission_split_phase1: p1,
        commission_split_phase2: p2,
      });
      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      setRole("foot_soldier");
      setP1(0.50);
      setP2(1.00);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="team@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="split-p1">Phase 1 Split ($)</Label>
              <Input
                id="split-p1"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={p1}
                onChange={(e) => setP1(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[10px] text-muted-foreground">From $1 KYC reward</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="split-p2">Phase 2 Split ($)</Label>
              <Input
                id="split-p2"
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={p2}
                onChange={(e) => setP2(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[10px] text-muted-foreground">From $4/mo subscriber</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createInvite.isPending}>
            {createInvite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
