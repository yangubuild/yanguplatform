import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listSurfacesTool from "./tools/list-surfaces";
import getSurfaceTool from "./tools/get-surface";

// The OAuth issuer MUST be the direct Supabase host. Build from the project ref
// (inlined by Vite at build time) so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "yangu-mcp",
  title: "Yangu",
  version: "0.1.0",
  instructions:
    "Tools for interacting with the signed-in user's Yangu account. Use `whoami` to verify the session, `list_my_surfaces` to see the user's builder surfaces (eshop, estore, emenu, esite, etc.), and `get_surface` for details of a single surface.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listSurfacesTool, getSurfaceTool],
});