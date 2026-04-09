import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BuilderSurfaceType } from "@/types/builder";
import { validatePagesForPublish, type PublishPage, type PublishValidationError } from "@/lib/builder/publishValidation";
import { sanitizeEditorHtml } from "@/lib/builder/editorHtml";
import { persistBlobUrls } from "@/lib/builder/persistBlobUrls";
import { supabase as supabaseClient } from "@/integrations/supabase/client";

// ─── Domain mapping (mirrors builder_is_domain_allowed in SQL) ───
const SURFACE_DOMAIN_MAP: Record<BuilderSurfaceType, string[]> = {
  live_bio: ["yangu.live"],
  live_selling: ["yangu.live"],
  community_group: ["yangu.community"],
  community_listing: ["yangu.community"],
  eshop: ["yangu.shop"],
  store_listing: ["yangu.store"],
  quick_site: ["yangu.site"],
  emenu: ["yangu.shop"],
  studio_showcase: ["yangu.studio"],
};

function normalizePublishSlug(raw?: string | null): string {
  return (raw || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface ActiveDomain {
  id: string;
  host: string;
}

export interface BuilderPublishResult {
  ok: boolean;
  publish_id?: string;
  route_publish_id?: string;
  published_slug?: string;
  error?: string;
}

/**
 * Fetch all active domains from the domains table
 */
export function useActiveDomains() {
  return useQuery({
    queryKey: ["builder-active-domains"],
    queryFn: async (): Promise<ActiveDomain[]> => {
      const { data, error } = await supabase
        .from("domains")
        .select("id, host")
        .eq("is_active", true)
        .order("host");

      if (error) {
        console.error("[useActiveDomains] Error:", error.message);
        throw error;
      }

      return (data || []) as ActiveDomain[];
    },
  });
}

/**
 * Filter domains allowed for a given surface type
 */
export function filterDomainsForSurface(
  domains: ActiveDomain[],
  surfaceType: BuilderSurfaceType
): ActiveDomain[] {
  const allowedHosts = SURFACE_DOMAIN_MAP[surfaceType] || [];
  return domains.filter((d) => allowedHosts.includes(d.host));
}

/**
 * Hook for the builder publish flow
 */
export function useBuilderPublish(surfaceId: string, surfaceType: BuilderSurfaceType, pages?: PublishPage[]) {
  const { data: allDomains, isLoading: domainsLoading } = useActiveDomains();

  const allowedDomains = allDomains
    ? filterDomainsForSurface(allDomains, surfaceType)
    : [];

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [customSlug, setCustomSlug] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<BuilderPublishResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<PublishValidationError[]>([]);

  const selectedDomain = allowedDomains.find((d) => d.id === selectedDomainId) ?? null;

  const validate = useCallback((): PublishValidationError[] => {
    if (!pages) return [];
    return validatePagesForPublish(pages, surfaceType, surfaceId);
  }, [pages, surfaceType, surfaceId]);

  const syncPublishedRecord = useCallback(async (publishId: string, requestedSlug?: string): Promise<string> => {
    const { data: surfaceData, error: surfaceError } = await supabase
      .from("builder_surfaces")
      .select("slug, metadata")
      .eq("id", surfaceId)
      .single();

    if (surfaceError) throw surfaceError;

    const surfaceRecord = surfaceData as {
      slug?: string | null;
      metadata?: {
        builder_new_html?: string | null;
        pages_html?: Record<string, string> | null;
      } | null;
    } | null;

    const metadata = surfaceRecord?.metadata || {};
    const fallbackPageHtml = Object.values(metadata.pages_html || {}).find(
      (html): html is string => typeof html === "string" && html.trim().length > 0,
    );
    const publishedSlug = normalizePublishSlug(requestedSlug || customSlug || surfaceRecord?.slug) || surfaceRecord?.slug || "";

    if (!publishedSlug) {
      throw new Error("Enter a URL name before publishing.");
    }

    const { error: surfaceUpdateError } = await supabase
      .from("builder_surfaces")
      .update({ slug: publishedSlug })
      .eq("id", surfaceId);

    if (surfaceUpdateError) throw surfaceUpdateError;

    if (surfaceType !== "emenu") {
      return publishedSlug;
    }

    const rawPublishedHtml = metadata.builder_new_html || fallbackPageHtml || "";
    // Persist any remaining blob URLs before sanitizing
    let resolvedHtml = rawPublishedHtml;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user?.id && resolvedHtml.includes("blob:")) {
        resolvedHtml = await persistBlobUrls(resolvedHtml, session.user.id);
        // Also update the surface metadata so future publishes don't hit this again
        const updatedMeta = { ...metadata, builder_new_html: resolvedHtml };
        if (metadata.pages_html) {
          const updatedPages = { ...metadata.pages_html };
          for (const [pageId, pageHtml] of Object.entries(updatedPages)) {
            if (typeof pageHtml === "string" && pageHtml.includes("blob:")) {
              updatedPages[pageId] = await persistBlobUrls(pageHtml, session.user.id);
            }
          }
          updatedMeta.pages_html = updatedPages;
        }
        await supabase.from("builder_surfaces").update({ metadata: updatedMeta as any }).eq("id", surfaceId);
      }
    } catch (e) {
      console.error("[syncPublishedRecord] blob persist error:", e);
    }
    const emenuHtml = sanitizeEditorHtml(resolvedHtml);

    if (!emenuHtml) {
      throw new Error("Couldn't find the latest Emenu page to publish.");
    }

    const { data: publishData, error: publishFetchError } = await supabase
      .from("builder_publishes")
      .select("published_schema")
      .eq("id", publishId)
      .single();

    if (publishFetchError) throw publishFetchError;

    const currentSchema = (publishData?.published_schema as Record<string, unknown> | null) || {};
    const currentSurface = ((currentSchema.surface as Record<string, unknown> | undefined) ?? {});
    const syncedSchema = {
      ...currentSchema,
      surface: {
        ...currentSurface,
        id: surfaceId,
        slug: publishedSlug,
        surface_type: surfaceType,
        emenu_html: emenuHtml,
      },
    };

    const { error: publishUpdateError } = await supabase
      .from("builder_publishes")
      .update({
        slug: publishedSlug,
        published_schema: syncedSchema as any,
      })
      .eq("id", publishId);

    if (publishUpdateError) throw publishUpdateError;

    return publishedSlug;
  }, [customSlug, surfaceId, surfaceType]);

  const publish = useCallback(async (slugOverride?: string): Promise<BuilderPublishResult | null> => {
    if (!selectedDomainId) return null;
    const normalizedSlug = normalizePublishSlug(slugOverride || customSlug);

    // Run client-side validation first
    const vErrors = validate();
    setValidationErrors(vErrors);
    if (vErrors.length> 0) {
      setPublishError(vErrors[0].message);
      return { ok: false, error: vErrors[0].message };
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishResult(null);

    try {
      const { data, error } = await supabase.rpc("builder_publish_surface", {
        p_surface_id: surfaceId,
        p_domain_id: selectedDomainId,
        p_slug: normalizedSlug || undefined,
      });

      if (error) {
        console.error("[useBuilderPublish] RPC error:", error);
        setPublishError(error.message);
        return { ok: false, error: error.message };
      }

      let result = data as unknown as BuilderPublishResult;

      if (result.ok && result.publish_id) {
        try {
          const publishedSlug = await syncPublishedRecord(result.publish_id, normalizedSlug);
          setCustomSlug(publishedSlug);
          result = {
            ...result,
            published_slug: publishedSlug,
          };
        } catch (syncError) {
          console.error("[useBuilderPublish] Publish sync error:", syncError);
          const syncMessage = syncError instanceof Error
            ? syncError.message
            : "Couldn't sync the latest published page.";
          setPublishError(syncMessage);
          const failedResult: BuilderPublishResult = { ok: false, error: syncMessage };
          setPublishResult(failedResult);
          return failedResult;
        }
      }

      setPublishResult(result);

      if (!result.ok) {
        const errorMessages: Record<string, string> = {
          surface_not_found_or_not_owner: "Surface not found or you don't own it.",
          domain_not_found_or_inactive: "The selected domain is not available.",
          domain_not_allowed_for_surface: "This domain is not allowed for this surface type.",
          no_pages: "Add at least one page before publishing.",
          missing_primary_page: "A required primary page is missing.",
          duplicate_page_slugs: "Two or more pages have the same slug.",
          empty_primary_page: "Primary page must have content before publishing.",
          invalid_page_slug: "A page has an invalid slug.",
          orphan_sections: "Some sections are attached to missing pages.",
        };
        setPublishError(errorMessages[result.error || ""] || result.error || "Unknown error");
      }

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publish failed";
      setPublishError(msg);
      return { ok: false, error: msg };
    } finally {
      setIsPublishing(false);
    }
  }, [surfaceId, selectedDomainId, customSlug, validate, syncPublishedRecord]);

  const reset = useCallback(() => {
    setSelectedDomainId(null);
    setCustomSlug("");
    setPublishResult(null);
    setPublishError(null);
    setValidationErrors([]);
  }, []);

  return {
    allDomains: allDomains || [],
    allowedDomains,
    domainsLoading,
    selectedDomainId,
    setSelectedDomainId,
    selectedDomain,
    customSlug,
    setCustomSlug,
    isPublishing,
    publishResult,
    publishError,
    validationErrors,
    publish,
    validate,
    reset,
  };
}
