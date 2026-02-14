import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreatifyTemplate {
  id: string;
  name: string;
  preview_url: string | null;
  aspect_ratio: string | null;
}

async function fetchTemplates(): Promise<CreatifyTemplate[]> {
  // Try cache first
  const { data: cached } = await supabase
    .from("creatify_templates" as any)
    .select("id, name, preview_url, aspect_ratio")
    .order("name");

  if (cached && cached.length > 0) {
    return cached as unknown as CreatifyTemplate[];
  }

  // Cache empty — fetch from edge function
  const { data, error } = await supabase.functions.invoke("creatify-generate", {
    body: { action: "list-templates" },
  });

  if (error || !data?.ok) {
    console.warn("[useCreatifyTemplates] fetch failed:", error || data?.message);
    return [];
  }

  return (data.templates || []) as CreatifyTemplate[];
}

export function useCreatifyTemplates() {
  return useQuery({
    queryKey: ["creatify-templates"],
    queryFn: fetchTemplates,
    staleTime: 1000 * 60 * 30, // 30 min
    retry: 1,
  });
}
