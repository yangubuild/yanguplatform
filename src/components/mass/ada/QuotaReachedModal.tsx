import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface QuotaReachedModalProps {
  open: boolean;
  onClose: () => void;
  used: number;
  limit: number;
  nextResetAt: string | null;
  tier: string;
}

export function QuotaReachedModal({ open, onClose, used, limit, nextResetAt, tier }: QuotaReachedModalProps) {
  const navigate = useNavigate();

  const resetDate = nextResetAt
    ? new Date(nextResetAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Image limit reached</DialogTitle>
          <DialogDescription>
            You've used {used}/{limit} images on the <span className="font-semibold capitalize">{tier}</span> plan.
            {resetDate && <> Next reset: <span className="font-semibold">{resetDate}</span>.</>}
            {" "}Upgrade to generate more.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { onClose(); navigate("/subscriptions"); }}>Upgrade</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
