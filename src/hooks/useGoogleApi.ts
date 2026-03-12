import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type GoogleApiAction =
  | "drive/files"
  | "drive/file-detail"
  | "gmail/messages"
  | "gmail/message-detail"
  | "gmail/send"
  | "calendar/events"
  | "calendar/create"
  | "youtube/channel";

export function useGoogleApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const callApi = useCallback(async <T = unknown>(
    action: GoogleApiAction,
    params: Record<string, unknown> = {}
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("google-api-proxy", {
        body: { action, ...params },
      });

      if (fnError) {
        setError(fnError.message);
        return null;
      }

      if (data?.error) {
        setError(data.error);
        return null;
      }

      return data as T;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { callApi, loading, error, clearError };
}
