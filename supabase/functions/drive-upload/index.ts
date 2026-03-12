import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

const FOLDER_MAP: Record<string, string> = {
  Images: "/YANGU/AdaAI/Images",
  Exports: "/YANGU/AdaAI/Exports",
};

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

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return jsonRes({ error: "Unauthorized" }, 401);
    }
    const userId = user.id;

    // --- Parse body ---
    const body = await req.json();
    const { file_url, filename, mime_type, folder } = body as {
      file_url: string;
      filename: string;
      mime_type?: string;
      folder?: string;
    };

    if (!file_url || !filename) {
      return jsonRes({ error: "file_url and filename are required" }, 400);
    }

    const folderKey = folder || "Images";
    const folderPath = FOLDER_MAP[folderKey];
    if (!folderPath) {
      return jsonRes(
        { error: `Invalid folder. Use: ${Object.keys(FOLDER_MAP).join(", ")}` },
        400
      );
    }

    // --- Fetch tokens (service_role) ---
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: tokenRow, error: tokenErr } = await adminClient
      .from("drive_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .single();

    if (tokenErr || !tokenRow) {
      return jsonRes({ error: "Google Drive not connected" }, 403);
    }

    // --- Refresh if expired ---
    let accessToken = tokenRow.access_token;
    const expiresAt = new Date(tokenRow.expires_at);

    if (expiresAt.getTime() - Date.now() < 60_000) {
      // Refresh
      const clientId = (Deno.env.get("GOOGLE_DRIVE_CLIENT_ID") || "").trim();
      const clientSecret = (Deno.env.get("GOOGLE_DRIVE_CLIENT_SECRET") || "").trim();

      const refreshRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenRow.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshRes.json();
      if (!refreshRes.ok || !refreshData.access_token) {
        console.error("[drive-upload] Refresh failed:", refreshData);
        return jsonRes(
          { error: "Failed to refresh Google Drive token. Please reconnect." },
          403
        );
      }

      accessToken = refreshData.access_token;
      const newExpiry = new Date(
        Date.now() + (refreshData.expires_in || 3600) * 1000
      ).toISOString();

      await adminClient
        .from("drive_tokens")
        .update({
          access_token: accessToken,
          expires_at: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    // --- Download file server-side ---
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return jsonRes({ error: "Failed to download file from storage" }, 502);
    }
    const fileBlob = await fileRes.blob();
    const contentType =
      mime_type || fileRes.headers.get("content-type") || "application/octet-stream";

    // --- Ensure folder path exists on Drive ---
    const segments = folderPath.split("/").filter(Boolean);
    let parentId = "root";

    for (const seg of segments) {
      parentId = await findOrCreateFolder(accessToken, seg, parentId);
    }

    // --- Upload file to Drive (multipart) ---
    const metadata = JSON.stringify({
      name: filename,
      parents: [parentId],
    });

    const boundary = "----DriveBoundary" + Date.now();
    const bodyParts = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    ];

    const fileArrayBuf = await fileBlob.arrayBuffer();
    const fileBytes = new Uint8Array(fileArrayBuf);

    // Build multipart body manually
    const encoder = new TextEncoder();
    const metaPart = encoder.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
    );
    const filePart = encoder.encode(
      `--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
    );
    const endPart = encoder.encode(`\r\n--${boundary}--`);

    const fullBody = new Uint8Array(
      metaPart.length + filePart.length + fileBytes.length + endPart.length
    );
    let offset = 0;
    fullBody.set(metaPart, offset);
    offset += metaPart.length;
    fullBody.set(filePart, offset);
    offset += filePart.length;
    fullBody.set(fileBytes, offset);
    offset += fileBytes.length;
    fullBody.set(endPart, offset);

    const uploadRes = await fetch(DRIVE_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: fullBody,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      console.error("[drive-upload] Upload failed:", uploadData);
      return jsonRes({ error: "Google Drive upload failed" }, 502);
    }

    return jsonRes({
      ok: true,
      drive_file_id: uploadData.id,
      drive_web_view_link: `https://drive.google.com/file/d/${uploadData.id}/view`,
    });
  } catch (err) {
    console.error("[drive-upload] Error:", err);
    return jsonRes(
      { error: err instanceof Error ? err.message : "Internal error" },
      500
    );
  }
});

// --- Helpers ---

function jsonRes(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function findOrCreateFolder(
  accessToken: string,
  name: string,
  parentId: string
): Promise<string> {
  // Search for existing folder
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const searchRes = await fetch(
    `${DRIVE_FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();

  if (searchData.files?.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch(DRIVE_FILES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Failed to create folder '${name}': ${JSON.stringify(createData)}`);
  }

  return createData.id;
}
