import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HardDrive } from "lucide-react";
import { setDriveConnected } from "@/lib/integrations/googleDrive";
import { toast } from "@/hooks/use-toast";

interface DriveConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriveConnectModal({ open, onOpenChange }: DriveConnectModalProps) {
  const handleConnect = () => {
    // Stub: mark as connected for now
    setDriveConnected(true);
    toast({ title: "Google Drive connected (stub)" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#F4A83D]" />
            Connect Google Drive
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Connect your Google Drive to save files directly from ADA AI.
            Files will be saved to <span className="text-white/70 font-mono text-xs">/YANGU/AdaAI/</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/80 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #D4952B, #F4A83D)" }}
          >
            Connect Drive
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
