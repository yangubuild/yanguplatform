import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ICON_MAP } from "@/lib/app-store/icon-map";
import { ArrowLeft, ExternalLink, Loader2, CheckCircle2, XCircle, Settings } from "lucide-react";

const EXTERNAL_URLS: Record<string, string> = {
  "google-drive": "https://drive.google.com",
  gmail: "https://mail.google.com",
  "google-meet": "https://meet.google.com",
  stripe: "https://dashboard.stripe.com",
};

const MANAGEMENT_LINKS: Record<string, { label: string; route: string }> = {
  youtube: { label: "YouTube Manager", route: "/dashboard/apps/youtube" },
  stripe: { label: "Payment Settings", route: "/dashboard/payment-settings" },
};

export default function ConnectedAppPage() {
  const { appSlug } = useParams<{ appSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["connected-app", appSlug, user?.id],
    enabled: !!user?.id && !!appSlug,
    queryFn: async () => {
      const { data: app } = await supabase
        .from("app_registry")
        .select("*")
        .eq("slug", appSlug!)
        .single();
      if (!app) return null;

      const { data: install } = await supabase
        .from("app_user_installs")
        .select("id, status, installed_at")
        .eq("user_id", user!.id)
        .eq("app_id", app.id)
        .maybeSingle();

      return { app, install };
    },
  });

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: "#08120D" }}>
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!data?.app) {
    return (
      <div className="w-full min-h-screen px-6 py-6" style={{ background: "#08120D" }}>
        <button onClick={() => navigate("/dashboard/my-apps")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to My Apps
        </button>
        <p className="text-muted-foreground">App not found.</p>
      </div>
    );
  }

  const { app, install } = data;
  const icon = ICON_MAP[app.slug] || app.icon;
  const externalUrl = EXTERNAL_URLS[app.slug];
  const isConnected = install?.status === "connected";

  return (
    <div className="w-full min-h-screen px-6 py-6" style={{ background: "#08120D" }}>
      <button
        onClick={() => navigate("/dashboard/my-apps")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Apps
      </button>

      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <img src={icon} alt={app.name} className="w-14 h-14 rounded-2xl object-cover" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">{app.name}</h1>
            <p className="text-sm text-muted-foreground">{app.provider_name}</p>
          </div>
        </div>

        {/* Status card */}
        <div
          className="rounded-xl p-5 mb-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {app.short_description || app.long_description || "No description available."}
          </p>
          {install?.installed_at && (
            <p className="text-[11px] text-muted-foreground mt-3">
              Added {new Date(install.installed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {MANAGEMENT_LINKS[app.slug] && (
            <button
              onClick={() => navigate(MANAGEMENT_LINKS[app.slug].route)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground transition-colors hover:opacity-90"
              style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
            >
              <Settings className="w-4 h-4" />
              {MANAGEMENT_LINKS[app.slug].label}
            </button>
          )}
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground transition-colors hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ExternalLink className="w-4 h-4" />
              Open {app.name}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
