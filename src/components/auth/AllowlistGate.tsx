import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw } from "lucide-react";
import { YanguLogo } from "@/components/brand/YanguLogo";
import { YanguPageBackground } from "@/components/brand/YanguPageBackground";
import { YanguLoadingScreen } from "@/components/brand/YanguLoadingScreen";

interface AllowlistGateProps {
  children: ReactNode;
}

/**
 * Access states are strictly independent:
 *  - checking       → Yangu spinner only (no copy)
 *  - allowed        → render app immediately
 *  - pending        → approval required (backend actually decided)
 *  - signed_out     → session expired
 *  - failed         → technical failure, retryable (NEVER "access denied")
 */
type State = "checking" | "allowed" | "pending" | "signed_out" | "failed";

const CHECK_TIMEOUT_MS = 12000;

export function AllowlistGate({ children }: AllowlistGateProps) {
  const [state, setState] = useState<State>("checking");
  const cancelled = useRef(false);
  // Once access is granted the app shell stays mounted. Background re-checks
  // (token refresh, tab focus, realtime auth events) must never blank the app.
  const grantedRef = useRef(false);
  const checkedUidRef = useRef<string | null>(null);

  const check = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? grantedRef.current;
    if (!silent) setState("checking");
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (cancelled.current) return;
      if (userErr) {
        if (!grantedRef.current) setState("failed");
        return;
      }
      const uid = userData?.user?.id;
      if (!uid) {
        grantedRef.current = false;
        setState("signed_out");
        return;
      }

      const rpc = supabase.rpc("is_dashboard_allowed", { _user_id: uid });
      const timeout = new Promise<{ timedOut: true }>((resolve) =>
        setTimeout(() => resolve({ timedOut: true }), CHECK_TIMEOUT_MS)
      );
      const result = (await Promise.race([rpc, timeout])) as any;
      if (cancelled.current) return;

      if (result?.timedOut || result?.error) {
        if (import.meta.env.DEV) console.error("allowlist check failed", result?.error);
        if (!grantedRef.current) setState("failed");
        return;
      }
      if (result?.data === true) {
        grantedRef.current = true;
        checkedUidRef.current = uid;
        setState("allowed");
      } else {
        grantedRef.current = false;
        setState("pending");
      }
    } catch (e) {
      if (cancelled.current) return;
      if (import.meta.env.DEV) console.error("allowlist check threw", e);
      if (!grantedRef.current) setState("failed");
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      if (event === "SIGNED_OUT" || !uid) {
        grantedRef.current = false;
        checkedUidRef.current = null;
        setState("signed_out");
        return;
      }
      // Same user (token refresh / re-validation): re-verify silently so the
      // app shell is never replaced by a full-screen spinner.
      if (uid === checkedUidRef.current) {
        check({ silent: true });
        return;
      }
      checkedUidRef.current = uid;
      check();
    });
    return () => {
      cancelled.current = true;
      sub.subscription.unsubscribe();
    };
  }, [check]);


  if (state === "allowed") return <>{children}</>;
  if (state === "checking") return <YanguLoadingScreen />;

  const copy = {
    pending: {
      title: "Access approval required",
      body: "Your Yangu account has been created successfully. Access to Yangu services requires administrator approval — you'll receive an email as soon as it's ready.",
    },
    signed_out: {
      title: "Please sign in again",
      body: "Your session has expired. Sign in again to continue where you left off.",
    },
    failed: {
      title: "Something went wrong",
      body: "We couldn't reach Yangu just now. This isn't a problem with your account — please try again.",
    },
  }[state];

  return (
    <YanguPageBackground contentClassName="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between p-4 md:p-6">
        <YanguLogo className="h-8" />
      </header>

      <main
        className="flex-1 flex items-center justify-center p-4 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="allowlist-gate-title">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 id="allowlist-gate-title" className="text-2xl md:text-3xl font-bold tracking-tight">
            {copy.title}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">{copy.body}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {state === "failed" ? (
              <>
                <Button className="w-full sm:w-auto" onClick={() => check()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try again
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}>
                  Sign out
                </Button>
              </>
            ) : state === "signed_out" ? (
              <Button className="w-full sm:w-auto" onClick={() => (window.location.href = "/auth/login")}>
                Sign in
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            )}
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} yangu. All rights reserved.</p>
      </footer>
    </YanguPageBackground>
  );
}
