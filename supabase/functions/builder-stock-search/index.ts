import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, mediaType = "image", page = 1 } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "missing_query" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!PEXELS_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "stock_not_configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Pexels API
    const perPage = 15;
    let url: string;
    if (mediaType === "video") {
      url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
    } else {
      url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
    }

    const pexelsRes = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!pexelsRes.ok) {
      const body = await pexelsRes.text();
      console.error("Pexels error:", pexelsRes.status, body);
      return new Response(JSON.stringify({ ok: false, error: "pexels_error", status: pexelsRes.status }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await pexelsRes.json();

    let results: Array<{ id: string; thumbUrl: string; fullUrl: string; author: string; sourceUrl: string }>;

    if (mediaType === "video") {
      results = (data.videos || []).map((v: any) => {
        const file = v.video_files?.find((f: any) => f.quality === "hd") || v.video_files?.[0];
        return {
          id: String(v.id),
          thumbUrl: v.image || "",
          fullUrl: file?.link || "",
          author: v.user?.name || "Pexels",
          sourceUrl: v.url || "",
        };
      });
    } else {
      results = (data.photos || []).map((p: any) => ({
        id: String(p.id),
        thumbUrl: p.src?.small || p.src?.tiny || "",
        fullUrl: p.src?.large2x || p.src?.original || "",
        author: p.photographer || "Pexels",
        sourceUrl: p.url || "",
      }));
    }

    return new Response(JSON.stringify({ ok: true, results, provider: "pexels" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("builder-stock-search error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
