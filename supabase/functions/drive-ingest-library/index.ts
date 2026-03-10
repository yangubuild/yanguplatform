import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

// Map Drive folder names → DB category slugs
const CATEGORY_MAP: Record<string, string> = {
  AUDIO: "audio",
  BUNDLES: "bundles",
  "BUSINESS PODCAST": "business_podcast",
  CHECKLISTS: "checklists",
  COURSES: "courses",
  EBOOKS: "ebooks",
  GUIDE: "guide",
  PROMPTS: "prompts",
  TEMPLATES: "templates",
  TOOLSTACK: "toolstack",
  "VIDEO LEARNING": "video_learning",
  VLS: "vls",
  WORKBOOK: "workbook",
};

// Map category → item type
const TYPE_MAP: Record<string, string> = {
  audio: "audio",
  bundles: "bundle",
  business_podcast: "podcast",
  checklists: "checklist",
  courses: "course",
  ebooks: "ebook",
  guide: "guide",
  prompts: "prompt",
  templates: "template",
  toolstack: "tool",
  video_learning: "video",
  vls: "vls",
  workbook: "workbook",
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_DRIVE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_DRIVE_CLIENT_SECRET")!;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function listDriveFiles(
  folderId: string,
  accessToken: string,
  query?: string
): Promise<Array<{ id: string; name: string; mimeType: string }>> {
  const allFiles: Array<{ id: string; name: string; mimeType: string }> = [];
  let pageToken: string | undefined;

  do {
    const q = query
      ? `'${folderId}' in parents AND ${query} AND trashed=false`
      : `'${folderId}' in parents AND trashed=false`;

    const params = new URLSearchParams({
      q,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: "1000",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${DRIVE_FILES_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Drive API error: ${res.status} ${err}`);
    }

    const data = await res.json();
    allFiles.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allFiles;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonRes({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return jsonRes({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { folder_id } = body as { folder_id: string };

    if (!folder_id) {
      return jsonRes({ error: "folder_id is required" }, 400);
    }

    // --- Get Drive tokens ---
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: tokenRow, error: tokenErr } = await adminClient
      .from("drive_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .single();

    if (tokenErr || !tokenRow) {
      return jsonRes({ error: "Google Drive not connected. Connect Drive first." }, 403);
    }

    // Refresh if needed
    let accessToken = tokenRow.access_token;
    const expiresAt = new Date(tokenRow.expires_at);
    if (expiresAt.getTime() - Date.now() < 60_000) {
      accessToken = await refreshAccessToken(tokenRow.refresh_token);
      await adminClient
        .from("drive_tokens")
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // --- Step 1: List category folders ---
    const categoryFolders = await listDriveFiles(
      folder_id,
      accessToken,
      "mimeType='application/vnd.google-apps.folder'"
    );

    console.log(`[drive-ingest] Found ${categoryFolders.length} category folders`);

    let totalInserted = 0;
    let totalSkipped = 0;
    const results: Array<{ category: string; inserted: number; skipped: number }> = [];

    for (const catFolder of categoryFolders) {
      const categorySlug = CATEGORY_MAP[catFolder.name.toUpperCase().trim()] || catFolder.name.toLowerCase().replace(/\s+/g, "_");
      const itemType = TYPE_MAP[categorySlug] || "ebook";

      // --- Step 2: List product folders inside each category ---
      const productFolders = await listDriveFiles(
        catFolder.id,
        accessToken,
        "mimeType='application/vnd.google-apps.folder'"
      );

      console.log(`[drive-ingest] Category "${catFolder.name}" → ${productFolders.length} products`);

      let catInserted = 0;
      let catSkipped = 0;

      for (const prodFolder of productFolders) {
        // Check if already exists (by title + category)
        const { data: existing } = await adminClient
          .from("visionaire_items")
          .select("id")
          .eq("title", prodFolder.name)
          .eq("category", categorySlug)
          .limit(1);

        if (existing && existing.length > 0) {
          catSkipped++;
          continue;
        }

        // --- Step 3: List files inside product folder ---
        const files = await listDriveFiles(prodFolder.id, accessToken);

        // Find cover image (jpg/png/webp)
        const coverFile = files.find((f) =>
          /\.(jpe?g|png|webp|gif)$/i.test(f.name) ||
          f.mimeType.startsWith("image/")
        );

        // Find PDF
        const pdfFile = files.find(
          (f) => f.mimeType === "application/pdf" || /\.pdf$/i.test(f.name)
        );

        // Build URLs
        const thumbnailUrl = coverFile
          ? `https://lh3.googleusercontent.com/d/${coverFile.id}`
          : null;

        const downloadUrl = pdfFile
          ? `https://drive.google.com/uc?export=download&id=${pdfFile.id}`
          : null;

        const sourceUrl = `https://drive.google.com/drive/folders/${prodFolder.id}`;

        // Clean title from folder name
        const title = prodFolder.name
          .replace(/[-_]+/g, " ")
          .replace(/\.(pdf|epub|doc|docx)$/i, "")
          .trim();

        // --- Step 4: Insert ---
        const { error: insertErr } = await adminClient.from("visionaire_items").insert({
          title,
          description: `${title} — part of the ${catFolder.name} collection.`,
          type: itemType,
          category: categorySlug,
          thumbnail_url: thumbnailUrl,
          download_url: downloadUrl,
          source_url: sourceUrl,
          tags: [catFolder.name],
          is_active: true,
        });

        if (insertErr) {
          console.error(`[drive-ingest] Insert error for "${title}":`, insertErr);
        } else {
          catInserted++;
        }
      }

      // Also check for loose files (not in subfolders) — e.g. PDFs directly in category folder
      const looseFiles = await listDriveFiles(
        catFolder.id,
        accessToken,
        "mimeType!='application/vnd.google-apps.folder'"
      );

      const loosePDFs = looseFiles.filter(
        (f) => f.mimeType === "application/pdf" || /\.pdf$/i.test(f.name)
      );

      for (const pdf of loosePDFs) {
        const title = pdf.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim();

        const { data: existing } = await adminClient
          .from("visionaire_items")
          .select("id")
          .eq("title", title)
          .eq("category", categorySlug)
          .limit(1);

        if (existing && existing.length > 0) {
          catSkipped++;
          continue;
        }

        // Look for matching image among loose files
        const matchCover = looseFiles.find(
          (f) =>
            f.mimeType.startsWith("image/") &&
            f.name.toLowerCase().includes(title.toLowerCase().split(" ")[0].toLowerCase())
        );

        const thumbnailUrl = matchCover
          ? `https://lh3.googleusercontent.com/d/${matchCover.id}`
          : null;

        const { error: insertErr } = await adminClient.from("visionaire_items").insert({
          title,
          description: `${title} — part of the ${catFolder.name} collection.`,
          type: itemType,
          category: categorySlug,
          thumbnail_url: thumbnailUrl,
          download_url: `https://drive.google.com/uc?export=download&id=${pdf.id}`,
          source_url: `https://drive.google.com/file/d/${pdf.id}/view`,
          tags: [catFolder.name],
          is_active: true,
        });

        if (insertErr) {
          console.error(`[drive-ingest] Loose insert error for "${title}":`, insertErr);
        } else {
          catInserted++;
        }
      }

      totalInserted += catInserted;
      totalSkipped += catSkipped;
      results.push({ category: catFolder.name, inserted: catInserted, skipped: catSkipped });
    }

    return jsonRes({
      ok: true,
      total_inserted: totalInserted,
      total_skipped: totalSkipped,
      categories: results,
    });
  } catch (err) {
    console.error("[drive-ingest] Error:", err);
    return jsonRes(
      { error: err instanceof Error ? err.message : "Internal error" },
      500
    );
  }
});
