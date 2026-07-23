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
  name: "list_my_surfaces",
  title: "List my Yangu surfaces",
  description:
    "List the signed-in user's Yangu builder surfaces (eshop, estore, emenu, esite, etc.) with title, slug, type, status, and published URL.",
  inputSchema: {
    limit: z.number().int().positive().max(100).optional().describe("Maximum number of surfaces to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("builder_surfaces")
      .select("id, title, slug, surface_type, status, published_url, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit ?? 25);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const surfaces = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(surfaces, null, 2) }],
      structuredContent: { surfaces },
    };
  },
});