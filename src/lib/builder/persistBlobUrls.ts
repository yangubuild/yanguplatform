/**
 * Finds all blob: URLs in an HTML string, uploads each to Supabase storage,
 * and returns the HTML with blob URLs replaced by persistent public URLs.
 */
import { supabase } from "@/integrations/supabase/client";

export async function persistBlobUrls(html: string, userId: string): Promise<string> {
  // Match all blob: URLs
  const blobRegex = /blob:https?:\/\/[^\s"'<>)]+/g;
  const blobUrls = [...new Set(html.match(blobRegex) || [])];

  if (blobUrls.length === 0) return html;

  let result = html;

  for (const blobUrl of blobUrls) {
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) continue;
      const blob = await response.blob();

      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const path = `${userId}/editor/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage.from("builder-media").upload(path, blob, {
        contentType: blob.type,
        upsert: false,
      });
      if (error) continue;

      const { data: pub } = supabase.storage.from("builder-media").getPublicUrl(path);
      if (pub?.publicUrl) {
        // Replace all occurrences of this blob URL
        result = result.split(blobUrl).join(pub.publicUrl);
      }
    } catch {
      // Skip failed blob URLs silently
    }
  }

  return result;
}
