import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreatifyTemplate {
  id: string;
  name: string;
  preview_url: string | null;
  aspect_ratio: string | null;
}

async function fetchTemplates(): Promise<CreatifyTemplate[]> {
  // 1. Try cache first
  const { data: cached, error: cacheErr } = await supabase
    .from("creatify_templates")
    .select("id, name, preview_url, aspect_ratio")
    .order("name");

  if (cacheErr) {
    console.warn("[useCreatifyTemplates] cache read error:", cacheErr.message);
  }

  if (cached && cached.length > 0) {
    console.log("[useCreatifyTemplates] Loaded from cache:", cached.length, "templates");
    return cached as unknown as CreatifyTemplate[];
  }

  // 2. Cache empty — seed from edge function
  console.log("[useCreatifyTemplates] Cache empty, calling edge function list-templates");

  const { data, error } = await supabase.functions.invoke("creatify-generate", {
    body: { action: "list-templates" },
  });

  if (error) {
    console.error("[useCreatifyTemplates] Edge function error:", error.message);
    return [];
  }

  console.log("[useCreatifyTemplates] Edge response:", JSON.stringify({ ok: data?.ok, count: data?.count, templatesSample: (data?.templates || []).slice(0, 2) }));

  if (!data?.ok) {
    console.warn("[useCreatifyTemplates] Edge returned not-ok:", data?.message || data?.error_code);
    return [];
  }

  // 3. Re-read cache after edge function seeded it
  const { data: refreshed, error: refreshErr } = await supabase
    .from("creatify_templates")
    .select("id, name, preview_url, aspect_ratio")
    .order("name");

  if (refreshErr) {
    console.warn("[useCreatifyTemplates] Re-read cache error:", refreshErr.message);
  }

  if (refreshed && refreshed.length > 0) {
    console.log("[useCreatifyTemplates] Re-read cache after seed:", refreshed.length, "templates");
    return refreshed as unknown as CreatifyTemplate[];
  }

  // 4. Fallback: use edge response directly
  const fallback = (data.templates || []) as CreatifyTemplate[];
  console.log("[useCreatifyTemplates] Using edge response directly as fallback:", fallback.length);
  return fallback;
}

export function useCreatifyTemplates() {
  return useQuery({
    queryKey: ["creatify-templates"],
    queryFn: fetchTemplates,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}
