const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { file_id, list_folder, folder_id } = body;

    // --- Folder listing mode ---
    if (list_folder && folder_id) {
      const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const q = `'${folder_id}' in parents AND trashed=false`;
      const params = new URLSearchParams({
        q,
        key: apiKey,
        fields: "files(id, name, mimeType)",
        pageSize: "100",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      });
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Failed to list folder" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      return new Response(JSON.stringify({ files: data.files || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!file_id) {
      return new Response(JSON.stringify({ error: "file_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use the Drive API to get file metadata first
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file_id}?fields=name,mimeType,size&key=${apiKey}`
    );
    if (!metaRes.ok) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const meta = await metaRes.json();

    // Download via Drive API
    const dlRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file_id}?alt=media&key=${apiKey}`
    );
    if (!dlRes.ok) {
      const errText = await dlRes.text();
      console.error("[drive-download-proxy] Download failed:", errText);
      return new Response(JSON.stringify({ error: "Download failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filename = meta.name || "download.pdf";
    const contentType = meta.mimeType || "application/octet-stream";

    return new Response(dlRes.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err) {
    console.error("[drive-download-proxy] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
