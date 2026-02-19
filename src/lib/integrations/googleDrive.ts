/**
 * Google Drive integration service.
 * Uses server-side OAuth via Edge Functions.
 * Client NEVER handles access_token or refresh_token.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user has connected Google Drive.
 * Calls the SECURITY DEFINER RPC that returns a boolean.
 */
export async function isConnected(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_drive_connected");
  if (error) {
    console.error("[GoogleDrive] isConnected error:", error);
    return false;
  }
  return data === true;
}

/**
 * Start the Google Drive OAuth flow.
 * Calls drive-connect edge function, then redirects the browser
 * to Google's consent screen.
 * @param redirectBack - path to return to after OAuth (default: current path)
 */
export async function connect(
  redirectBack?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return { ok: false, error: "Not authenticated" };
    }

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/drive-connect`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        redirect_back: redirectBack || window.location.pathname,
      }),
    });

    const body = await res.json();

    if (!res.ok || !body.url) {
      return { ok: false, error: body.error || "Failed to start OAuth" };
    }

    // Redirect browser to Google consent
    window.location.href = body.url;
    return { ok: true };
  } catch (err) {
    console.error("[GoogleDrive] connect error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Upload a file to Google Drive via the drive-upload edge function.
 * The server downloads the file and uploads it to Drive — tokens stay server-side.
 */
export async function uploadFile(opts: {
  fileUrl: string;
  filename: string;
  mimeType?: string;
  folder?: "Images" | "Exports";
}): Promise<{
  ok: boolean;
  drive_file_id?: string;
  drive_web_view_link?: string;
  error?: string;
}> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return { ok: false, error: "Not authenticated" };
    }

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/drive-upload`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        file_url: opts.fileUrl,
        filename: opts.filename,
        mime_type: opts.mimeType || "image/png",
        folder: opts.folder || "Images",
      }),
    });

    const body = await res.json();

    if (!res.ok || !body.ok) {
      return { ok: false, error: body.error || "Upload failed" };
    }

    return {
      ok: true,
      drive_file_id: body.drive_file_id,
      drive_web_view_link: body.drive_web_view_link,
    };
  } catch (err) {
    console.error("[GoogleDrive] uploadFile error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
