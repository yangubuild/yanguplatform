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
    fields: "files(id, name, mimeType)",
    pageSize: "1000",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const res = await fetch(`${DRIVE_FILES_URL}?${params}`);
  if (!res.ok) throw new Error(`Drive API error: ${res.status} ${await res.text()}`);
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
    if (!authHeader?.startsWith("Bearer ")) return jsonRes({ error: "Unauthorized" }, 401);

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
      const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", user.id);
      const isAdmin = roles?.some((r: any) => r.role === "admin" || r.role === "owner");
      if (!isAdmin) return jsonRes({ error: "Admin access required" }, 403);
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) return jsonRes({ error: "Google API key not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const itemIds = body.item_ids as string[] | undefined;

    if (!itemIds || !itemIds.length) {
      return jsonRes({ error: "item_ids required" }, 400);
    }

    const { data: items, error: fetchErr } = await adminClient
      .from("visionaire_items")
      .select("id, title, thumbnail_url, source_url, category, download_url")
      .in("id", itemIds);

    if (fetchErr) throw fetchErr;

    const results: any[] = [];

    for (const item of items || []) {
      const folderId = extractFolderId(item.source_url);
      const result: any = {
        id: item.id,
        title: item.title,
        thumbnail_url: item.thumbnail_url,
        source_url: item.source_url,
        folderId,
        files: [],
        subfolders: [],
      };

      if (folderId) {
        // List ALL files in folder
        const allFiles = await listDriveFiles(folderId, apiKey);
        result.files = allFiles.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType }));

        // Check subfolders
        const subfolders = allFiles.filter(f => f.mimeType === "application/vnd.google-apps.folder");
        for (const sub of subfolders) {
          const subFiles = await listDriveFiles(sub.id, apiKey);
          result.subfolders.push({
            name: sub.name,
            id: sub.id,
            files: subFiles.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
          });
        }
      }

      results.push(result);
    }

    return jsonRes({ ok: true, results });
  } catch (err) {
    console.error("[drive-debug] Error:", err);
    return jsonRes({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
