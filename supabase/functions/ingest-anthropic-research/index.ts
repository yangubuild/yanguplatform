import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function generateCoverImage(
  title: string,
  apiKey: string,
): Promise<Uint8Array | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            text: `Generate a stylish abstract editorial cover image for an AI research publication titled "${title}". Use a muted earth-tone palette (cream, tan, dark green, charcoal). Geometric and minimal. No text. 3:4 aspect ratio.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      console.error("Image gen failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) return null;

    // data:image/png;base64,...
    const base64 = imageUrl.split(",")[1];
    if (!base64) return null;

    // Decode base64 to Uint8Array
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.error("Image generation error:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Try sitemap first, fallback to research page
    let urls: { url: string }[] = [];

    try {
      const sitemapRes = await fetch("https://www.anthropic.com/sitemap.xml", {
        headers: { "User-Agent": "Yangu-Bot/1.0" },
      });
      if (sitemapRes.ok) {
        const sitemapText = await sitemapRes.text();
        const urlMatches = sitemapText.matchAll(/<loc>(https:\/\/www\.anthropic\.com\/research\/[^<]+)<\/loc>/g);
        for (const m of urlMatches) {
          urls.push({ url: m[1] });
        }
      }
    } catch {
      // Sitemap fetch failed
    }

    if (urls.length === 0) {
      try {
        const pageRes = await fetch("https://www.anthropic.com/research", {
          headers: { "User-Agent": "Yangu-Bot/1.0" },
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const linkMatches = html.matchAll(/href="(\/research\/[^"]+)"/g);
          const seen = new Set<string>();
          for (const m of linkMatches) {
            const fullUrl = `https://www.anthropic.com${m[1]}`;
            if (!seen.has(fullUrl)) {
              seen.add(fullUrl);
              urls.push({ url: fullUrl });
            }
          }
        }
      } catch {
        // Research page also failed
      }
    }

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, message: "No research URLs found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which URLs are already in DB
    const { data: existing } = await supabase
      .from("external_publications")
      .select("url, image_url")
      .eq("source_key", "anthropic_research");

    const existingMap = new Map(
      (existing || []).map((r: { url: string; image_url: string | null }) => [r.url, r.image_url])
    );
    const newUrls = urls.filter((u) => !existingMap.has(u.url));

    let inserted = 0;
    let imagesGenerated = 0;

    for (const entry of newUrls.slice(0, 30)) {
      let title = "";
      let image_url: string | null = null;
      let published_at: string | null = null;
      let category: string | null = null;
      let excerpt: string | null = null;
      let image_source = "generated";

      try {
        const pageRes = await fetch(entry.url, {
          headers: { "User-Agent": "Yangu-Bot/1.0" },
        });
        if (pageRes.ok) {
          const html = await pageRes.text();

          const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
          const titleTag = html.match(/<title>([^<]+)<\/title>/i);
          title = ogTitle?.[1] || titleTag?.[1] || entry.url.split("/").pop()?.replace(/-/g, " ") || "Untitled";

          // Do NOT use Anthropic og:image — always generate our own
          // image_url stays null here, we generate below

          const datePublished = html.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i)
            || html.match(/<meta\s+name="date"\s+content="([^"]+)"/i)
            || html.match(/"datePublished"\s*:\s*"([^"]+)"/i);
          if (datePublished?.[1]) {
            try {
              published_at = new Date(datePublished[1]).toISOString();
            } catch { /* invalid date */ }
          }

          const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
          excerpt = ogDesc?.[1] || null;

          const ogType = html.match(/<meta\s+property="article:section"\s+content="([^"]+)"/i);
          category = ogType?.[1] || "Research";
        }
      } catch {
        title = entry.url.split("/").pop()?.replace(/-/g, " ") || "Untitled";
      }

      if (!title) continue;

      // Generate cover image
      if (lovableApiKey) {
        const imageBytes = await generateCoverImage(title, lovableApiKey);
        if (imageBytes) {
          const slug = entry.url.split("/").pop() || "cover";
          const storagePath = `covers/${slug}-${Date.now()}.png`;

          const { error: uploadErr } = await supabase.storage
            .from("ada-media")
            .upload(storagePath, imageBytes, {
              contentType: "image/png",
              upsert: false,
            });

          if (!uploadErr) {
            const { data: publicUrl } = supabase.storage
              .from("ada-media")
              .getPublicUrl(storagePath);
            image_url = publicUrl?.publicUrl || null;
            image_source = "generated";
            imagesGenerated++;
          } else {
            console.error("Upload error:", uploadErr);
          }
        }
      }

      const { error } = await supabase.from("external_publications").upsert(
        {
          source_key: "anthropic_research",
          title,
          url: entry.url,
          category,
          published_at,
          image_url,
          image_source,
          excerpt,
        },
        { onConflict: "url" }
      );

      if (!error) inserted++;
    }

    // For existing rows with null image_url, generate images now
    let backfilled = 0;
    if (lovableApiKey) {
      const { data: noImage } = await supabase
        .from("external_publications")
        .select("id, title, url")
        .eq("source_key", "anthropic_research")
        .is("image_url", null)
        .limit(10);

      for (const row of noImage || []) {
        const imageBytes = await generateCoverImage(row.title, lovableApiKey);
        if (imageBytes) {
          const slug = row.url.split("/").pop() || "cover";
          const storagePath = `covers/${slug}-${Date.now()}.png`;

          const { error: uploadErr } = await supabase.storage
            .from("ada-media")
            .upload(storagePath, imageBytes, {
              contentType: "image/png",
              upsert: false,
            });

          if (!uploadErr) {
            const { data: publicUrl } = supabase.storage
              .from("ada-media")
              .getPublicUrl(storagePath);

            await supabase
              .from("external_publications")
              .update({ image_url: publicUrl?.publicUrl, image_source: "generated" })
              .eq("id", row.id);
            backfilled++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total_found: urls.length,
        new_inserted: inserted,
        already_existing: existingMap.size,
        images_generated: imagesGenerated,
        images_backfilled: backfilled,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
