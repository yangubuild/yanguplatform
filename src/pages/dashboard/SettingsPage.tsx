import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Mail, Lock, LogOut, Eye, MessageSquare, UserPlus,
  Bell, BellRing, Shield, Globe, Palette, Loader2,
  ChevronRight, CheckCircle2, Clock, AlertTriangle, DollarSign
} from "lucide-react";

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className="w-4 h-4" style={{ color: "#F46D2A" }} />
        <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{title}</h3>
      </div>
      <div className="space-y-4 max-w-lg">{children}</div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "sw", label: "Kiswahili" },
  { value: "ar", label: "العربية" },
  { value: "pt", label: "Português" },
  { value: "zh", label: "中文" },
];

const CURRENCIES = [
  { value: "USD", label: "USD", symbol: "$" },
  { value: "EUR", label: "EUR", symbol: "€" },
  { value: "GBP", label: "GBP", symbol: "£" },
  { value: "KES", label: "KES", symbol: "KSh" },
  { value: "UGX", label: "UGX", symbol: "USh" },
  { value: "NGN", label: "NGN", symbol: "₦" },
  { value: "AED", label: "AED", symbol: "د.إ" },
  { value: "ZAR", label: "ZAR", symbol: "R" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Password change
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Notification prefs (stored in user_metadata)
  const [pushNotifs, setPushNotifs] = useState(user?.user_metadata?.push_notifications !== false);
  const [emailNotifs, setEmailNotifs] = useState(user?.user_metadata?.email_notifications !== false);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Privacy prefs
  const [profilePublic, setProfilePublic] = useState(user?.user_metadata?.profile_visibility !== "private");
  const [messagePrivacy, setMessagePrivacy] = useState<string>(user?.user_metadata?.message_privacy || "everyone");
  const [followPrivacy, setFollowPrivacy] = useState<string>(user?.user_metadata?.follow_privacy || "everyone");
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Preferences
  const [language, setLanguage] = useState<string>(user?.user_metadata?.preferred_language || "en");
  const [currency, setCurrency] = useState<string>(user?.user_metadata?.preferred_currency || "USD");
  const [savingPrefs, setSavingPrefs] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setResetSent(true);
      toast.success("Password reset email sent");
    }
  };

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    const { error } = await supabase.auth.updateUser({
      data: { push_notifications: pushNotifs, email_notifications: emailNotifs },
    });
    setSavingNotifs(false);
    if (error) toast.error(error.message);
    else toast.success("Notification preferences saved");
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        profile_visibility: profilePublic ? "public" : "private",
        message_privacy: messagePrivacy,
        follow_privacy: followPrivacy,
      },
    });
    setSavingPrivacy(false);
    if (error) toast.error(error.message);
    else toast.success("Privacy settings saved");
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    const { error } = await supabase.auth.updateUser({
      data: { preferred_language: language, preferred_currency: currency },
    });
    setSavingPrefs(false);
    if (error) toast.error(error.message);
    else toast.success("Preferences saved");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // KYC status
  const kycStatus = user?.user_metadata?.kyc_status || "not_started";
  const kycLabel: Record<string, { text: string; icon: React.ElementType; color: string }> = {
    not_started: { text: "Not Started", icon: Clock, color: "rgba(255,255,255,0.5)" },
    in_progress: { text: "In Progress", icon: Clock, color: "#F46D2A" },
    pending_review: { text: "Pending Review", icon: Clock, color: "#F46D2A" },
    verified: { text: "Verified", icon: CheckCircle2, color: "rgba(74,222,128,0.8)" },
    rejected: { text: "Rejected", icon: AlertTriangle, color: "#ef4444" },
  };
  const kyc = kycLabel[kycStatus] || kycLabel.not_started;

  const selectStyle = {
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Settings</h1>

      {/* Account */}
      <Section title="Account" icon={Mail}>
        <Row label="Email" description={user?.email || "—"}>
          <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
            Verified
          </span>
        </Row>
        <Row label="Password" description="Send a reset link to your email">
          <Button
            variant="outline" size="sm"
            onClick={handlePasswordReset}
            disabled={resetSent || resetLoading}
            className="border-white/10 text-xs"
          >
            {resetLoading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
            {resetSent ? "Sent ✓" : "Reset Password"}
          </Button>
        </Row>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs font-medium transition-colors"
            style={{ color: "#ef4444" }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </Section>

      {/* Privacy */}
      <Section title="Privacy" icon={Eye}>
        <Row label="Profile visibility" description="Make your profile discoverable">
          <Switch checked={profilePublic} onCheckedChange={setProfilePublic} />
        </Row>
        <Row label="Who can message you" description="Control who sends you DMs">
          <select
            value={messagePrivacy}
            onChange={(e) => setMessagePrivacy(e.target.value)}
            className="text-xs rounded px-2 py-1.5"
            style={selectStyle}
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers only</option>
            <option value="nobody">Nobody</option>
          </select>
        </Row>
        <Row label="Who can follow you" description="Control follow requests">
          <select
            value={followPrivacy}
            onChange={(e) => setFollowPrivacy(e.target.value)}
            className="text-xs rounded px-2 py-1.5"
            style={selectStyle}
          >
            <option value="everyone">Everyone</option>
            <option value="approval">Requires approval</option>
          </select>
        </Row>
        <Button variant="accent" size="sm" onClick={handleSavePrivacy} disabled={savingPrivacy}>
          {savingPrivacy && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Save Privacy Settings
        </Button>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <Row label="Push notifications" description="Browser and mobile push alerts">
          <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
        </Row>
        <Row label="Email notifications" description="Updates and alerts via email">
          <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
        </Row>
        <Button variant="accent" size="sm" onClick={handleSaveNotifs} disabled={savingNotifs}>
          {savingNotifs && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Save Notifications
        </Button>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        <Row label="KYC verification" description="Identity verification status">
          <button
            onClick={() => navigate("/kyc")}
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: kyc.color }}
          >
            <kyc.icon className="w-3.5 h-3.5" />
            {kyc.text}
            <ChevronRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        </Row>
        <Row label="Active sessions" description="Manage your active login sessions">
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Current session active</span>
        </Row>
      </Section>

      {/* Preferences */}
      <Section title="Preferences" icon={Palette}>
        <Row label="Language" description="Select your preferred language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs rounded px-2 py-1.5"
            style={selectStyle}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </Row>
        <Row label="Currency" description="Display currency for prices">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-xs rounded px-2 py-1.5"
            style={selectStyle}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.symbol} {c.label}</option>
            ))}
          </select>
        </Row>
        <Row label="Theme" description="Using system default">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Dark</span>
        </Row>
        <Button variant="accent" size="sm" onClick={handleSavePrefs} disabled={savingPrefs}>
          {savingPrefs && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Save Preferences
        </Button>
      </Section>
    </div>
  );
}
