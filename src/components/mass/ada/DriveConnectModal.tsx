import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HardDrive, CheckCircle, Loader2 } from "lucide-react";
import { isConnected, connect } from "@/lib/integrations/googleDrive";
import { toast } from "@/hooks/use-toast";

interface DriveConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriveConnectModal({ open, onOpenChange }: DriveConnectModalProps) {
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setChecking(true);
    isConnected()
      .then(setConnected)
      .finally(() => setChecking(false));
  }, [open]);

  const handleConnect = async () => {
    setConnecting(true);
    const result = await connect(window.location.pathname);
    if (!result.ok) {
      toast({ title: result.error || "Failed to start connection", variant: "destructive" });
      setConnecting(false);
    }
    // If ok, browser redirects — no need to reset state
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#F4A83D]" />
            {connected ? "Google Drive Connected" : "Connect Google Drive"}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {checking ? (
              "Checking connection…"
            ) : connected ? (
              <>Your Google Drive is connected. Files will be saved to <span className="text-white/70 font-mono text-xs">/YANGU/AdaAI/</span>.</>
            ) : (
              <>Connect your Google Drive to save files directly from ADA AI. Files will be saved to <span className="text-white/70 font-mono text-xs">/YANGU/AdaAI/</span>.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/80 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {connected ? "Close" : "Cancel"}
          </button>
          {!checking && !connected && (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #D4952B, #F4A83D)" }}
            >
              {connecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Connect Drive
            </button>
          )}
          {!checking && connected && (
            <div className="flex items-center gap-1.5 px-4 py-2 text-sm text-green-400">
              <CheckCircle className="w-4 h-4" />
              Connected
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
