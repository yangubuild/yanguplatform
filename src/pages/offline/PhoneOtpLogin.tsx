import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { offlineTheme as t } from "./theme";
import { Button, Card, Field, Input } from "./OfflineLayout";

export function PhoneOtpLogin({
  title,
  subtitle,
  onSuccess,
}: {
  title: string;
  subtitle: string;
  onSuccess: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sendCode = async () => {
    setErr(null); setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setStage("code");
  };

  const verify = async () => {
    setErr(null); setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: "sms" });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    onSuccess();
  };

  return (
    <div style={{
      minHeight: "100vh", background: t.bg, fontFamily: t.fontFamily,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <h1 style={{ color: t.primary, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>{title}</h1>
        <p style={{ color: t.muted, marginTop: 0, marginBottom: 20 }}>{subtitle}</p>
        <Card>
          {stage === "phone" ? (
            <>
              <Field label="Phone number">
                <Input
                  type="tel"
                  placeholder="+256 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
              </Field>
              {err && <div style={{ color: "#9B221A", fontSize: 13, marginBottom: 8 }}>{err}</div>}
              <Button onClick={sendCode} disabled={loading || phone.length < 6}>
                {loading ? "Sending…" : "Send code"}
              </Button>
            </>
          ) : (
            <>
              <Field label={`Code sent to ${phone}`}>
                <Input
                  type="text" inputMode="numeric"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                />
              </Field>
              {err && <div style={{ color: "#9B221A", fontSize: 13, marginBottom: 8 }}>{err}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={verify} disabled={loading || code.length < 4}>
                  {loading ? "Verifying…" : "Verify"}
                </Button>
                <Button variant="ghost" onClick={() => setStage("phone")}>Change number</Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}