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
  apiKey: string
): Promise<Array<{ id: string; name: string; mimeType: string }>> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents AND trashed=false`,
    key: apiKey,
    fields: "files(id, name, mimeType)",
    pageSize: "100",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const res = await fetch(`${DRIVE_FILES_URL}?${params}`);
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  const data = await res.json();
  return data.files || [];
}

function extractFolderId(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  const match = sourceUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonRes({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === serviceRoleKey;

    let adminClient;
    if (isServiceRole) {
      adminClient = createClient(supabaseUrl, serviceRoleKey);
    } else {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) return jsonRes({ error: "Unauthorized" }, 401);

      adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const isAdmin = roles?.some((r: any) => r.role === "admin" || r.role === "owner");
      if (!isAdmin) return jsonRes({ error: "Admin access required" }, 403);
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) return jsonRes({ error: "Google API key not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const offset = body.offset ?? 0;
    const limit = body.limit ?? 20;

    // Only process items that have Drive thumbnails AND a source folder
    const ebookCategories = ["ebooks", "guide", "workbook"];
    const { data: items, error: fetchErr } = await adminClient
      .from("visionaire_items")
      .select("id, title, thumbnail_url, source_url, category")
      .in("category", ebookCategories)
      .eq("is_active", true)
      .like("thumbnail_url", "https://lh3%")
      .like("source_url", "%folders/%")
      .order("title")
      .range(offset, offset + limit - 1);

    if (fetchErr) throw fetchErr;

    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    const details: Array<{ title: string; action: string; images?: string[] }> = [];

    for (const item of items || []) {
      const folderId = extractFolderId(item.source_url);
      if (!folderId) { skipped++; continue; }

      try {
        const files = await listDriveFiles(folderId, apiKey);
        const imageFiles = files.filter(
          (f) => /\.(jpe?g|png|webp|gif)$/i.test(f.name) || f.mimeType.startsWith("image/")
        );

        const bookCover = imageFiles.find((f) => /book\s*cover/i.test(f.name));
        const nonArtwork = imageFiles.find((f) => !/artwork/i.test(f.name));
        const bestCover = bookCover || nonArtwork || imageFiles[0];

        if (!bestCover) {
          skipped++;
          details.push({ title: item.title, action: "no images", images: files.map(f => f.name) });
          continue;
        }

        const newUrl = `https://lh3.googleusercontent.com/d/${bestCover.id}`;

        if (item.thumbnail_url === newUrl) {
          skipped++;
          details.push({ title: item.title, action: `already using ${bestCover.name}` });
          continue;
        }

        const { error: updateErr } = await adminClient
          .from("visionaire_items")
          .update({ thumbnail_url: newUrl })
          .eq("id", item.id);

        if (updateErr) {
          errors++;
          details.push({ title: item.title, action: `error: ${updateErr.message}` });
        } else {
          fixed++;
          details.push({
            title: item.title,
            action: `→ ${bestCover.name}`,
            images: imageFiles.map(f => f.name),
          });
        }
      } catch (e) {
        errors++;
        details.push({ title: item.title, action: `error: ${e.message}` });
      }
    }

    const hasMore = (items?.length || 0) === limit;

    return jsonRes({
      ok: true,
      batch: { offset, limit, returned: items?.length || 0, hasMore, nextOffset: hasMore ? offset + limit : null },
      fixed, skipped, errors, details,
    });
  } catch (err) {
    console.error("[drive-fix-covers] Error:", err);
    return jsonRes({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
