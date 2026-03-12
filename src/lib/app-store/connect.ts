/**
 * Client-side helper to trigger app connection flows.
 * Calls the unified app-connect edge function and handles redirect.
 */
import { supabase } from "@/integrations/supabase/client";

export async function connectApp(
  appSlug: string,
  redirectBack?: string
): Promise<{ ok: boolean; error?: string; redirect?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return { ok: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase.functions.invoke("app-connect", {
      body: {
        app_slug: appSlug,
        redirect_back: redirectBack || window.location.pathname,
        origin: window.location.origin,
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    if (!data?.ok) {
      return { ok: false, error: data?.error || "Connection failed" };
    }

    // OAuth redirect flow — redirect current tab for reliability
    if (data.method === "redirect" && data.authorize_url) {
      window.location.href = data.authorize_url;
      // Won't resolve — page is navigating away
      return new Promise(() => {});
    }

    // Direct connection (e.g. Stripe)
    if (data.method === "direct") {
      return { ok: true, redirect: data.redirect };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
