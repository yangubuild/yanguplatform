import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { socialKeys } from "@/hooks/social/queryKeys";

type CallbackState = "loading" | "success" | "error";

export default function SocialMediaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [state, setState] = useState<CallbackState>("loading");
  const [message, setMessage] = useState("");
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const stateParam = searchParams.get("state");
        const error = searchParams.get("error");

        if (error) {
          setState("error");
          setMessage(searchParams.get("error_description") || error);
          return;
        }

        if (!code) {
          setState("error");
          setMessage("No authorization code received from provider.");
          return;
        }

        // Extract workspace ID from state if embedded, or fallback
        let workspaceId = "default";
        if (stateParam) {
          try {
            const parsed = JSON.parse(atob(stateParam));
            if (parsed.workspace_id) workspaceId = parsed.workspace_id;
          } catch {
            // State is opaque; use default
          }
        }

        const { data, error: fnError } = await supabase.functions.invoke("outstand-proxy", {
          body: {
            action: "oauth_callback",
            code,
            state: stateParam,
            workspaceId,
            redirectUrl: `${window.location.origin}/dashboard/social-media/callback`,
          },
        });

        if (fnError) throw fnError;

        if (data?.error) {
          setState("error");
          setMessage(data.error);
          return;
        }

        // Refresh connected accounts + home summary
        await Promise.all([
          qc.invalidateQueries({ queryKey: socialKeys.accounts() }),
          qc.invalidateQueries({ queryKey: socialKeys.homeSummary() }),
          qc.invalidateQueries({ queryKey: socialKeys.workspace() }),
        ]);

        setState("success");
        setMessage(data?.account?.display_name
          ? `Connected ${data.account.display_name} successfully!`
          : "Account connected successfully!");

        // Auto-redirect after success
        setTimeout(() => navigate("/dashboard/social-media/workspace"), 2500);
      } catch (err) {
        setState("error");
        setMessage(err instanceof Error ? err.message : "Failed to complete connection.");
      }
    };

    handleCallback();
  }, [searchParams, navigate, qc]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
      {state === "loading" && (
        <>
          <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Connecting your account…</h2>
          <p className="text-sm text-muted-foreground">Please wait while we complete the connection.</p>
        </>
      )}

      {state === "success" && (
        <>
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Connected!</h2>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <Button variant="accent" onClick={() => navigate("/dashboard/social-media/workspace")}>
            Go to Workspace
          </Button>
        </>
      )}

      {state === "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Connection Failed</h2>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard/social-media/workspace")}>
              Back to Workspace
            </Button>
            <Button variant="accent" onClick={() => navigate("/dashboard/social-media")}>
              Try Again
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
