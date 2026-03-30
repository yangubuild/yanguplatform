/**
 * YANGU Social Media — Template Design Hook
 * React Query hooks for template CRUD, design editing, and brand auto-apply.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import {
  templateService,
  designService,
  applyBrandToTemplate,
  type BrandConfig,
} from "@/services/socialMedia/templateService";
import type {
  DesignTemplate,
  TemplateLayer,
  CreateDesignInput,
  LayerOverride,
  TemplateColorSlots,
} from "@/types/templateDesign";

export function useSystemTemplates() {
  return useQuery({
    queryKey: [...socialKeys.all, "templates", "system"],
    queryFn: () => templateService.listSystemTemplates(),
  });
}

export function useTemplateWithLayers(templateId: string | null) {
  return useQuery({
    queryKey: [...socialKeys.all, "templates", "detail", templateId],
    enabled: !!templateId,
    queryFn: () => templateService.getTemplateWithLayers(templateId!),
  });
}

export function useWorkspaceTemplates(workspaceId: string | null) {
  return useQuery({
    queryKey: [...socialKeys.all, "templates", "workspace", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => templateService.getWorkspaceTemplates(workspaceId!),
  });
}

export function useDesigns(workspaceId: string | null) {
  return useQuery({
    queryKey: [...socialKeys.all, "designs", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => designService.listDesigns(workspaceId!),
  });
}

export function useCreateDesign() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDesignInput) =>
      designService.createDesign({ ...input, user_id: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "designs"] });
    },
  });
}

export function useUpdateDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      designId: string;
      updates: {
        layer_overrides?: LayerOverride[];
        color_overrides?: Partial<TemplateColorSlots>;
        font_overrides?: Record<string, string>;
        logo_url?: string | null;
        title?: string;
        status?: string;
      };
    }) => designService.updateDesign(params.designId, params.updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "designs"] });
    },
  });
}

export function useDeleteDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (designId: string) => designService.deleteDesign(designId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "designs"] });
    },
  });
}

/**
 * Given template layers + brand config, compute auto-applied overrides.
 */
export function useBrandAutoApply(
  layers: TemplateLayer[],
  colorSlots: TemplateColorSlots,
  brand: BrandConfig | null
) {
  if (!brand || !layers.length) {
    return { layerOverrides: [], colorOverrides: {} };
  }
  return applyBrandToTemplate(layers, colorSlots, brand);
}
