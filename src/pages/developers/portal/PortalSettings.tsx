import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DocsPage } from "@/components/developers/DocsPage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Settings, Bell, Shield, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function PortalSettings() {
  const { user } = useAuth();
  const [devOptIn, setDevOptIn] = useState(false);
  const [securityEmails, setSecurityEmails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.dev_updates_opt_in) setDevOptIn(true);
    if (user?.user_metadata?.security_emails !== undefined)
      setSecurityEmails(user.user_metadata.security_emails !== false);
  }, [user]);

  const handleSaveNotifs = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { dev_updates_opt_in: devOptIn, security_emails: securityEmails },
      });
      if (error) throw error;
      toast.success("Notification preferences saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetSent(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) {
      toast.error(error.message);
      setResetSent(false);
    } else {
      toast.success("Password reset email sent");
    }
  };

  return (
    <DocsPage breadcrumb="Portal" title="Settings" subtitle="Manage your developer account settings.">
      <div className="space-y-6">
        {/* Notifications */}
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5" style={{ color: "#F46D2A" }} />
            <h3 className="text-foreground font-semibold text-sm">Notifications</h3>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Developer Updates</p>
                <p className="text-muted-foreground text-xs">New APIs, features, and platform news</p>
              </div>
              <Switch checked={devOptIn} onCheckedChange={setDevOptIn} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Security Emails</p>
                <p className="text-muted-foreground text-xs">Login alerts and security-related notifications</p>
              </div>
              <Switch checked={securityEmails} onCheckedChange={setSecurityEmails} />
            </div>

            <Button variant="accent" size="sm" onClick={handleSaveNotifs} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Save Preferences
            </Button>
          </div>
        </div>

        {/* Security */}
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5" style={{ color: "#F46D2A" }} />
            <h3 className="text-foreground font-semibold text-sm">Security</h3>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Change Password</p>
              <p className="text-muted-foreground text-xs mb-3">
                Send a password reset link to <span className="font-mono text-muted-foreground">{user?.email}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasswordReset}
                disabled={resetSent}
                className="border-white/20 text-muted-foreground">
                {resetSent ? "Email Sent" : "Send Reset Link"}
              </Button>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-muted-foreground text-sm font-medium">Active Sessions</p>
              <p className="text-muted-foreground text-xs">
                You are currently signed in. Sessions expire after inactivity.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div
          className="rounded-xl p-6"
          style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-red-400 font-semibold text-sm">Danger Zone</h3>
          </div>

          <div className="max-w-md">
            <p className="text-muted-foreground text-sm font-medium">Delete Developer Account</p>
            <p className="text-muted-foreground text-xs mb-3">
              This will revoke all API keys, remove all apps, and permanently delete your developer account. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}>
              Delete Developer Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-background border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" /> Delete Developer Account
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This feature is not yet available. Please contact{" "}
              <a href="mailto:developers@yangu.com" className="text-accent hover:underline">developers@yangu.com</a>{" "}
              to request account deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DocsPage>
  );
}
