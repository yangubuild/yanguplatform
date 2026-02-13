import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Try sitemap first, fallback to research page
    let urls: { url: string; title?: string; published_at?: string; category?: string; image_url?: string }[] = [];

    try {
      const sitemapRes = await fetch("https://www.anthropic.com/sitemap.xml", {
        headers: { "User-Agent": "Yangu-Bot/1.0" },
      });
      if (sitemapRes.ok) {
        const sitemapText = await sitemapRes.text();
        // Extract /research/ URLs from sitemap
        const urlMatches = sitemapText.matchAll(/<loc>(https:\/\/www\.anthropic\.com\/research\/[^<]+)<\/loc>/g);
        for (const m of urlMatches) {
          urls.push({ url: m[1] });
        }
      }
    } catch {
      // Sitemap fetch failed, try research page
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
      .select("url")
      .eq("source_key", "anthropic_research");

    const existingUrls = new Set((existing || []).map((r: { url: string }) => r.url));
    const newUrls = urls.filter((u) => !existingUrls.has(u.url));

    let inserted = 0;

    for (const entry of newUrls.slice(0, 30)) {
      // Fetch each page to extract metadata
      let title = "";
      let image_url: string | null = null;
      let published_at: string | null = null;
      let category: string | null = null;
      let excerpt: string | null = null;

      try {
        const pageRes = await fetch(entry.url, {
          headers: { "User-Agent": "Yangu-Bot/1.0" },
        });
        if (pageRes.ok) {
          const html = await pageRes.text();

          // Extract title from og:title or <title>
          const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
          const titleTag = html.match(/<title>([^<]+)<\/title>/i);
          title = ogTitle?.[1] || titleTag?.[1] || entry.url.split("/").pop()?.replace(/-/g, " ") || "Untitled";

          // Extract og:image
          const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
          image_url = ogImage?.[1] || null;

          // Extract published date from various meta tags
          const datePublished = html.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i)
            || html.match(/<meta\s+name="date"\s+content="([^"]+)"/i)
            || html.match(/"datePublished"\s*:\s*"([^"]+)"/i);
          if (datePublished?.[1]) {
            try {
              published_at = new Date(datePublished[1]).toISOString();
            } catch { /* invalid date */ }
          }

          // Extract og:description for excerpt
          const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
          excerpt = ogDesc?.[1] || null;

          // Try to extract category
          const ogType = html.match(/<meta\s+property="article:section"\s+content="([^"]+)"/i);
          category = ogType?.[1] || "Research";
        }
      } catch {
        // Page fetch failed, use URL-derived title
        title = entry.url.split("/").pop()?.replace(/-/g, " ") || "Untitled";
      }

      if (!title) continue;

      const { error } = await supabase.from("external_publications").upsert(
        {
          source_key: "anthropic_research",
          title,
          url: entry.url,
          category,
          published_at,
          image_url,
          image_source: image_url ? "anthropic" : "generated",
          excerpt,
        },
        { onConflict: "url" }
      );

      if (!error) inserted++;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total_found: urls.length,
        new_inserted: inserted,
        already_existing: existingUrls.size,
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
