import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase env vars are not configured for this function.");
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_surface",
  title: "Get a Yangu surface",
  description:
    "Fetch a single Yangu surface (by id or slug) owned by the signed-in user, including title, status, published URL, description and SEO metadata.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Surface UUID."),
    slug: z.string().optional().describe("Surface slug (used when id is not provided)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!id && !slug) {
      return { content: [{ type: "text", text: "Provide either id or slug." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("builder_surfaces")
      .select(
        "id, title, slug, description, surface_type, status, published_url, seo_title, seo_description, updated_at, created_at",
      )
      .is("deleted_at", null)
      .limit(1);
    query = id ? query.eq("id", id) : query.eq("slug", slug!);
    const { data, error } = await query.maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Surface not found" }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { surface: data },
    };
  },
});