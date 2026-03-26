import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then((r) => r.json())
      .then((d) => {
        if (d.valid === false && d.reason === "already_unsubscribed") setStatus("already");
        else if (d.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Email Preferences</h1>
        {status === "loading" && <p className="text-muted-foreground">Verifying…</p>}
        {status === "valid" && (
          <>
            <p className="text-muted-foreground">Click below to unsubscribe from app emails.</p>
            <button onClick={handleUnsubscribe} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
              Confirm Unsubscribe
            </button>
          </>
        )}
        {status === "success" && <p className="text-muted-foreground">You've been unsubscribed. You won't receive app emails anymore.</p>}
        {status === "already" && <p className="text-muted-foreground">You're already unsubscribed.</p>}
        {status === "invalid" && <p className="text-destructive">Invalid or expired unsubscribe link.</p>}
        {status === "error" && <p className="text-destructive">Something went wrong. Please try again later.</p>}
      </div>
    </div>
  );
}
