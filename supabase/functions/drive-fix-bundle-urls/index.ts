import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function listDriveFiles(
  folderId: string,
  apiKey: string,
  query?: string
): Promise<Array<{ id: string; name: string; mimeType: string }>> {
  const q = query
    ? `'${folderId}' in parents AND ${query} AND trashed=false`
    : `'${folderId}' in parents AND trashed=false`;
  const params = new URLSearchParams({
    q,
    key: apiKey,
    fields: "nextPageToken, files(id, name, mimeType)",
    pageSize: "1000",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const res = await fetch(`${DRIVE_FILES_URL}?${params}`);
  if (!res.ok) throw new Error(`Drive API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.files || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!apiKey) return jsonRes({ error: "Google API key not configured" }, 500);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const ROOT_FOLDER = "1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362";

    // Find the BUNDLES category folder
    const categoryFolders = await listDriveFiles(
      ROOT_FOLDER,
      apiKey,
      "mimeType='application/vnd.google-apps.folder'"
    );

    const bundlesFolder = categoryFolders.find(
      (f) => f.name.toUpperCase().trim() === "BUNDLES"
    );

    if (!bundlesFolder) return jsonRes({ error: "BUNDLES folder not found" }, 404);

    // List all product subfolders inside BUNDLES
    const productFolders = await listDriveFiles(
      bundlesFolder.id,
      apiKey,
      "mimeType='application/vnd.google-apps.folder'"
    );

    console.log(`[fix-bundle-urls] Found ${productFolders.length} bundle folders in Drive`);

    // Get all bundle items from DB
    const { data: bundles } = await adminClient
      .from("visionaire_items")
      .select("id, title, source_url, thumbnail_url")
      .eq("category", "bundles")
      .eq("is_active", true);

    if (!bundles) return jsonRes({ error: "No bundles found in DB" }, 404);

    const updates: Array<{ id: string; title: string; folder_id: string; thumbnail_url: string | null }> = [];

    for (const bundle of bundles) {
      // Fuzzy match: normalize both names
      const normalizedTitle = bundle.title
        .toLowerCase()
        .replace(/\s*(bundle|–|—|-)\s*/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

      const match = productFolders.find((pf) => {
        const normalizedFolder = pf.name
          .toLowerCase()
          .replace(/[-_]+/g, " ")
          .replace(/\s*(bundle|–|—|-)\s*/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        return (
          normalizedFolder === normalizedTitle ||
          normalizedFolder.includes(normalizedTitle) ||
          normalizedTitle.includes(normalizedFolder)
        );
      });

      if (match) {
        const newSourceUrl = `https://drive.google.com/drive/folders/${match.id}`;

        // Also scan for cover image inside the folder if missing thumbnail
        let newThumbnailUrl = bundle.thumbnail_url;
        if (!newThumbnailUrl) {
          const files = await listDriveFiles(match.id, apiKey);
          const imageFiles = files.filter(
            (f) =>
              /\.(jpe?g|png|webp|gif)$/i.test(f.name) ||
              f.mimeType.startsWith("image/")
          );
          const coverFile =
            imageFiles.find((f) => /book\s*cover|artwork|cover/i.test(f.name)) ||
            imageFiles[0];
          if (coverFile) {
            newThumbnailUrl = `https://drive.google.com/thumbnail?id=${coverFile.id}&sz=w800`;
          }
        }

        const { error } = await adminClient
          .from("visionaire_items")
          .update({
            source_url: newSourceUrl,
            ...(newThumbnailUrl && !bundle.thumbnail_url
              ? { thumbnail_url: newThumbnailUrl }
              : {}),
          })
          .eq("id", bundle.id);

        if (!error) {
          updates.push({
            id: bundle.id,
            title: bundle.title,
            folder_id: match.id,
            thumbnail_url: newThumbnailUrl,
          });
        } else {
          console.error(`[fix-bundle-urls] Update error for "${bundle.title}":`, error);
        }
      } else {
        console.warn(`[fix-bundle-urls] No Drive folder match for: "${bundle.title}"`);
      }
    }

    return jsonRes({
      ok: true,
      total_bundles: bundles.length,
      updated: updates.length,
      unmatched: bundles.length - updates.length,
      updates,
    });
  } catch (err) {
    console.error("[fix-bundle-urls] Error:", err);
    return jsonRes(
      { error: err instanceof Error ? err.message : "Internal error" },
      500
    );
  }
});
