import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Google Drive folder ID from the shared link
const DRIVE_FOLDER_ID = "16cbr0fAp8azPliz0AaG0-5cwa5FfeURN";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("Google API key not configured");
    }

    // Fetch all image files from the public Drive folder
    // Using Drive API v3 files.list with q filter for the folder
    const query = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents and (mimeType contains 'image/')`);
    const fields = encodeURIComponent("files(id,name,mimeType,thumbnailLink,webContentLink)");

    let allFiles: any[] = [];
    let pageToken = "";

    // Paginate through all results
    do {
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=nextPageToken,${fields}&pageSize=1000&key=${apiKey}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;

      const res = await fetch(url);
      if (!res.ok) {
        const errBody = await res.text();
        console.error("Drive API error:", res.status, errBody);
        throw new Error(`Drive API error ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      allFiles = allFiles.concat(data.files || []);
      pageToken = data.nextPageToken || "";
    } while (pageToken);

    // Map to emoji objects
    const emojis = allFiles.map((file: any) => {
      // filename without extension = keyword
      const keyword = file.name.replace(/\.[^.]+$/, "").toLowerCase();
      // Use Drive thumbnail or direct link
      // For public files, construct a direct view URL
      const imageUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;

      return {
        id: file.id,
        keyword,
        name: file.name,
        url: imageUrl,
        // Smaller thumbnail for picker grid
        thumbnailUrl: file.thumbnailLink
          ? file.thumbnailLink.replace(/=s\d+/, "=s64")
          : imageUrl,
      };
    });

    // Sort alphabetically by keyword
    emojis.sort((a: any, b: any) => a.keyword.localeCompare(b.keyword));

    return new Response(JSON.stringify({ emojis, count: emojis.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error listing drive emojis:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
