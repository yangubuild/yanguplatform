import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthResult = {
  data: {
    client?: { name?: string; client_name?: string; redirect_uris?: string[] } | null;
    scope?: string;
    scopes?: string[];
    redirect_url?: string;
    redirect_to?: string;
  } | null;
  error: { message: string } | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

function getOAuthApi(): OAuthApi | null {
  const api = (supabase.auth as unknown as { oauth?: OAuthApi }).oauth;
  return api ?? null;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthResult["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const oauth = getOAuthApi();
      if (!oauth) {
        setError("OAuth is not enabled on this project yet.");
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Preserve the FULL consent URL so auth returns the user here on every path.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth/login?returnTo=" + encodeURIComponent(next);
        return;
      }
      setAccount(sessionData.session.user.email ?? sessionData.session.user.id);
      const { data, error: err } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    const oauth = getOAuthApi();
    if (!oauth) return;
    setBusy(true);
    const { data, error: err } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  };

  if (error) {
    return (
      <AuthShell title="Couldn't complete the connection" showBackLink={false}>
        <p className="text-sm text-destructive text-center">{error}</p>
      </AuthShell>
    );
  }

  if (!details) {
    return (
      <AuthShell title="Preparing connection…" showBackLink={false}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AuthShell>
    );
  }

  const clientName = details.client?.name ?? details.client?.client_name ?? "an application";
  const scopeList: string[] = Array.isArray(details.scopes)
    ? details.scopes
    : typeof details.scope === "string"
    ? details.scope.split(/\s+/).filter(Boolean)
    : [];

  return (
    <AuthShell
      title={`Connect ${clientName} to Yangu`}
      subtitle={`This lets ${clientName} use Yangu as you.`}
      showBackLink={false}>
      <div className="space-y-5">
        {account && (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            Signed in as <span className="font-medium">{account}</span>
          </div>
        )}
        <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
          <div className="font-medium">What this allows</div>
          <p className="text-muted-foreground">
            {clientName} will be able to call Yangu's enabled MCP tools while you are signed in.
            This does not bypass Yangu's permissions or backend policies.
          </p>
          {scopeList.length > 0 && (
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {scopeList.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="accent"
            className="w-full"
            disabled={busy}
            onClick={() => decide(true)}>
            {busy ? "Working…" : "Approve"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => decide(false)}>
            Cancel connection
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}