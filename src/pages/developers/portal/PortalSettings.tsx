import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DocsPage } from "@/components/developers/DocsPage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, Shield, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function PortalSettings() {
  const { user } = useAuth();
  const [devOptIn, setDevOptIn] = useState(false);
  const [securityEmails, setSecurityEmails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
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
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5" style={{ color: "#F46D2A" }} />
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Developer Updates</p>
                <p className="text-white/40 text-xs">New APIs, features, and platform news</p>
              </div>
              <Switch checked={devOptIn} onCheckedChange={setDevOptIn} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Security Emails</p>
                <p className="text-white/40 text-xs">Login alerts and security-related notifications</p>
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
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5" style={{ color: "#F46D2A" }} />
            <h3 className="text-white font-semibold text-sm">Security</h3>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <p className="text-white/80 text-sm font-medium">Change Password</p>
              <p className="text-white/40 text-xs mb-3">
                Send a password reset link to <span className="font-mono text-white/50">{user?.email}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasswordReset}
                disabled={resetSent}
                className="border-white/20 text-white/70"
              >
                {resetSent ? "Email Sent" : "Send Reset Link"}
              </Button>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-white/80 text-sm font-medium">Active Sessions</p>
              <p className="text-white/40 text-xs">
                You are currently signed in. Session management is handled automatically — sessions expire after inactivity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DocsPage>
  );
}
