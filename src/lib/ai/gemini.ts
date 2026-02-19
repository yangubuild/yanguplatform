import { supabase } from "@/integrations/supabase/client";

export interface GeminiImage {
  url: string;
  storage_path: string;
}

export interface GeminiResult {
  ok: boolean;
  generation_id?: string;
  images?: GeminiImage[];
  error?: string;
}

/**
 * Generate an image via the Gemini provider through ada-generate-image edge function.
 */
export async function generateGeminiImage(
  prompt: string,
  chatId: string
): Promise<GeminiResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const session = (await supabase.auth.getSession()).data.session;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/ada-generate-image`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt, chatId, provider: "gemini" }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    console.error("[gemini] ada-generate-image error:", data);
    return {
      ok: false,
      error: data?.message || "Gemini image generation failed",
    };
  }

  return {
    ok: true,
    images: [
      {
        url: data.image_url,
        storage_path: data.storage_path,
      },
    ],
  };
}
