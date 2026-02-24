import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductMeta {
  title: string;
  description: string;
  images: string[];
}

interface OrchestrationRequest {
  product_urls: string[]; // supports single or bulk
  studio_project_id?: string;
  provider?: "gemini" | "ideogram" | "qwen";
  count?: number; // variations per product
  orientation?: "square" | "landscape" | "portrait";
}

// ─── Helpers ─────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getUserClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

/** Scrape product metadata using Lovable AI (Gemini Flash) to extract from URL */
async function scrapeProductMeta(url: string): Promise<ProductMeta> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract product metadata from URLs. Return a JSON object with title, description, and images (array of image URLs). Be concise.",
        },
        {
          role: "user",
          content: `Extract product info from this URL: ${url}\n\nReturn JSON with keys: title (string), description (string max 200 chars), images (array of up to 6 image URLs found on the page). If you can't access the page, infer from the URL structure.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_product",
            description: "Extract structured product metadata",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                images: { type: "array", items: { type: "string" } },
              },
              required: ["title", "description", "images"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_product" } },
    }),
  });

  if (!res.ok) {
    console.error("AI scrape failed:", res.status, await res.text());
    // Fallback metadata from URL
    return {
      title: new URL(url).pathname.split("/").filter(Boolean).pop() || "Product",
      description: "Product from " + new URL(url).hostname,
      images: [],
    };
  }

  const data = await res.json();
  try {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = JSON.parse(toolCall.function.arguments);
    return {
      title: args.title || "Product",
      description: args.description || "",
      images: Array.isArray(args.images) ? args.images.slice(0, 6) : [],
    };
  } catch {
    return {
      title: "Product",
      description: "Product from " + new URL(url).hostname,
      images: [],
    };
  }
}

/** Build an ad prompt from product meta + optional brand blueprint */
function buildAdPrompt(
  meta: ProductMeta,
  blueprint: Record<string, unknown> | null,
  orientation: string,
  variationIdx: number
): string {
  const styles = [
    "clean minimal white background, product-focused",
    "vibrant lifestyle scene, product in use",
    "bold promotional banner with text overlay",
    "premium dark background, dramatic lighting",
  ];
  const style = styles[variationIdx % styles.length];

  let prompt = `Create a professional ${orientation} product advertisement image.\n`;
  prompt += `Product: ${meta.title}\n`;
  prompt += `Description: ${meta.description}\n`;
  prompt += `Style: ${style}\n`;

  if (blueprint) {
    const bp = blueprint as Record<string, unknown>;
    if (bp.brand_name) prompt += `Brand: ${bp.brand_name}\n`;
    if (Array.isArray(bp.colors) && bp.colors.length)
      prompt += `Brand colors: ${bp.colors.join(", ")}\n`;
    if (bp.tone) prompt += `Tone: ${bp.tone}\n`;
    if (bp.tagline) prompt += `Tagline: "${bp.tagline}"\n`;
  }

  prompt += `\nMake it high quality, commercial-grade, ready for social media advertising.`;
  return prompt;
}

/** Generate image via existing edge function */
async function generateImage(
  prompt: string,
  provider: string,
  authHeader: string
): Promise<{ url?: string; storage_path?: string; error?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const fnMap: Record<string, string> = {
    gemini: "ada-generate-image",
    ideogram: "ideogram-generate",
    qwen: "qwen-generate",
  };
  const fnName = fnMap[provider] || "ada-generate-image";

  const body: Record<string, unknown> =
    provider === "gemini"
      ? { prompt, chatId: crypto.randomUUID(), provider: "gemini" }
      : { prompt };

  const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || (!data?.ok && !data?.success && !data?.image_url)) {
    return { error: data?.error || data?.message || `${provider} generation failed` };
  }

  // Normalize response across providers
  const url = data.image_url || data.images?.[0]?.url || data.url;
  const storagePath = data.storage_path || data.images?.[0]?.storage_path;

  return { url, storage_path: storagePath };
}

// ─── Main Handler ────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = getUserClient(authHeader);
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid auth" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: OrchestrationRequest = await req.json();
    const {
      product_urls = [],
      studio_project_id,
      provider = "gemini",
      count = 4,
      orientation = "portrait",
    } = body;

    if (!product_urls.length) {
      return new Response(
        JSON.stringify({ success: false, error: "product_urls is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch brand blueprint if project provided
    let blueprint: Record<string, unknown> | null = null;
    let projectId = studio_project_id;

    if (studio_project_id) {
      const { data: project } = await userClient
        .from("studio_projects")
        .select("brand_blueprint")
        .eq("id", studio_project_id)
        .eq("user_id", user.id)
        .single();
      if (project?.brand_blueprint) {
        blueprint = project.brand_blueprint as Record<string, unknown>;
      }
    }

    // If no project, create an ad-hoc one
    if (!projectId) {
      const admin = getSupabaseAdmin();
      const { data: newProject } = await admin
        .from("studio_projects")
        .insert({
          user_id: user.id,
          title: `Image Ads – ${new Date().toLocaleDateString()}`,
          status: "active",
        })
        .select("id")
        .single();
      projectId = newProject?.id;
    }

    const allAssets: unknown[] = [];

    // Process each product URL sequentially (controlled concurrency)
    for (const productUrl of product_urls) {
      console.log(`Processing product: ${productUrl}`);

      // 1. Scrape metadata
      const meta = await scrapeProductMeta(productUrl);
      console.log(`Scraped: ${meta.title}`);

      // 2. Generate variations
      const variationCount = Math.min(count, 10); // cap at 10
      for (let i = 0; i < variationCount; i++) {
        const prompt = buildAdPrompt(meta, blueprint, orientation, i);
        console.log(`Generating variation ${i + 1}/${variationCount}`);

        const result = await generateImage(prompt, provider, authHeader);

        if (result.error) {
          console.error(`Variation ${i} failed: ${result.error}`);
          continue;
        }

        // 3. Save to studio_assets
        if (projectId) {
          const admin = getSupabaseAdmin();
          const { data: asset, error: insertErr } = await admin
            .from("studio_assets")
            .insert({
              user_id: user.id,
              project_id: projectId,
              asset_type: "image",
              title: `${meta.title} – Ad ${i + 1}`,
              file_url: result.url,
              thumbnail_url: result.url,
              generation_prompt: prompt,
              variation_index: i,
              is_uploaded: false,
              download_credits: 1,
            })
            .select()
            .single();

          if (insertErr) {
            console.error("Failed to save asset:", insertErr);
          } else {
            allAssets.push(asset);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        project_id: projectId,
        assets: allAssets,
        total: allAssets.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Orchestration error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Orchestration failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
