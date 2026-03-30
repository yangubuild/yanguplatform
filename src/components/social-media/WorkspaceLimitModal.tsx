import { useState } from "react";
import { X, Trash2, Building2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgencySubscriptionModal } from "./AgencySubscriptionModal";

interface WorkspaceLimitModalProps {
  open: boolean;
  onClose: () => void;
  onDeleteAndCreate: () => void;
  isDeleting?: boolean;
}

export function WorkspaceLimitModal({ open, onClose, onDeleteAndCreate, isDeleting }: WorkspaceLimitModalProps) {
  const [showAgency, setShowAgency] = useState(false);

  if (!open) return null;

  if (showAgency) {
    return <AgencySubscriptionModal open onClose={() => { setShowAgency(false); onClose(); }} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-[480px] mx-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">You already have a workspace</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Normal accounts are limited to 1 workspace. Choose an option below:
          </p>

          <div className="space-y-3">
            <button
              onClick={onDeleteAndCreate}
              disabled={isDeleting}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-red-500/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Delete current & create new</div>
                <div className="text-xs text-muted-foreground">Remove your existing workspace and start fresh</div>
              </div>
            </button>

            <button
              onClick={() => setShowAgency(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Create Agency Workspace</div>
                <div className="text-xs text-muted-foreground">Upgrade to manage multiple workspaces</div>
              </div>
            </button>

            <Button variant="outline" className="w-full" onClick={onClose}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
