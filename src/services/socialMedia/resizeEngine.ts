/**
 * YANGU — Platform Auto-Resize Engine (Template-Safe)
 *
 * Transforms template layers from a normalized 1000×1000 base grid
 * to platform-specific aspect ratios without breaking layout.
 *
 * Supported targets:
 *   1:1  → 1000×1000  (instagram_feed, facebook, linkedin, x)
 *   4:5  → 1000×1250  (instagram_feed alt, facebook)
 *   9:16 → 1080×1920  (instagram_story, tiktok)
 */

import { supabase } from "@/integrations/supabase/client";
import type { TemplateLayer, TemplateAspectRatio } from "@/types/templateDesign";

// ── Canvas Dimensions ────────────────────────────────────

const BASE_WIDTH = 1000;
const BASE_HEIGHT = 1000;

export const CANVAS_SIZES: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1000, height: 1000 },
  "4:5": { width: 1000, height: 1250 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

// ── Safe Areas (%) ───────────────────────────────────────

const SAFE_ZONES = {
  top: 0.08,
  bottom: 0.10,
  side: 0.06,
};

// ── Platform → Aspect Ratio Mapping ──────────────────────

export const PLATFORM_ASPECT_MAP: Record<string, TemplateAspectRatio> = {
  instagram_feed: "4:5",
  instagram_story: "9:16",
  tiktok: "9:16",
  facebook: "1:1",
  linkedin: "1:1",
  x: "1:1",
};

export const ALL_PLATFORMS = Object.keys(PLATFORM_ASPECT_MAP);

// ── Types ────────────────────────────────────────────────

export interface LayerTransform {
  layer_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  fontSize?: number;
  opacity?: number;
  cropRect?: { x: number; y: number; width: number; height: number };
}

export interface PlatformVariant {
  id?: string;
  design_id: string;
  platform: string;
  aspect_ratio: string;
  width: number;
  height: number;
  layer_transforms: LayerTransform[];
  rendered_url?: string;
  status: string;
}

// ── Resize Engine ────────────────────────────────────────

export const resizeEngine = {
  /**
   * Transform all layers from base 1:1 to a target aspect ratio.
   * Layout-aware: repositions intelligently, never distorts.
   */
  transformLayers(
    layers: TemplateLayer[],
    targetRatio: TemplateAspectRatio
  ): LayerTransform[] {
    const target = CANVAS_SIZES[targetRatio] || CANVAS_SIZES["1:1"];
    const scaleX = target.width / BASE_WIDTH;
    const scaleY = target.height / BASE_HEIGHT;

    // Safe area bounds in target pixels
    const safeLeft = target.width * SAFE_ZONES.side;
    const safeRight = target.width * (1 - SAFE_ZONES.side);
    const safeTop = target.height * SAFE_ZONES.top;
    const safeBottom = target.height * (1 - SAFE_ZONES.bottom);

    // Sort layers by role priority for vertical stacking in portrait
    const sorted = [...layers].sort((a, b) => {
      const order = roleVerticalOrder(a.role) - roleVerticalOrder(b.role);
      return order !== 0 ? order : (a.sort_order || 0) - (b.sort_order || 0);
    });

    if (targetRatio === "1:1") {
      return layers.map((l) => ({
        layer_id: l.id,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        rotation: l.rotation,
        fontSize: l.style?.fontSize,
      }));
    }

    if (targetRatio === "9:16") {
      return this._transformVertical(sorted, target, safeLeft, safeRight, safeTop, safeBottom);
    }

    if (targetRatio === "4:5") {
      return this._transformPortrait45(sorted, target, scaleX, scaleY, safeLeft, safeRight, safeTop, safeBottom);
    }

    if (targetRatio === "16:9") {
      return this._transformWide(sorted, target, scaleX, scaleY, safeLeft, safeRight, safeTop, safeBottom);
    }

    // Fallback: proportional scale
    return layers.map((l) => ({
      layer_id: l.id,
      x: l.x * scaleX,
      y: l.y * scaleY,
      width: l.width * scaleX,
      height: l.height * scaleY,
      rotation: l.rotation,
      fontSize: l.style?.fontSize ? Math.round(l.style.fontSize * Math.min(scaleX, scaleY)) : undefined,
    }));
  },

  /**
   * 9:16 vertical layout — stack elements vertically with expanded spacing.
   */
  _transformVertical(
    layers: TemplateLayer[],
    target: { width: number; height: number },
    safeLeft: number,
    safeRight: number,
    safeTop: number,
    safeBottom: number
  ): LayerTransform[] {
    const transforms: LayerTransform[] = [];
    const usableWidth = safeRight - safeLeft;
    const usableHeight = safeBottom - safeTop;
    const widthScale = target.width / BASE_WIDTH;

    let currentY = safeTop;
    const spacing = usableHeight * 0.03;

    for (const layer of layers) {
      const transform: LayerTransform = { layer_id: layer.id, x: 0, y: 0, width: 0, height: 0 };

      if (layer.layer_type === "background") {
        transform.x = 0;
        transform.y = 0;
        transform.width = target.width;
        transform.height = target.height;
        transforms.push(transform);
        continue;
      }

      if (layer.role === "logo") {
        const logoScale = Math.min(widthScale * 0.8, 1.2);
        transform.width = layer.width * logoScale;
        transform.height = layer.height * logoScale;
        transform.x = (target.width - transform.width) / 2;
        transform.y = safeTop;
        currentY = transform.y + transform.height + spacing * 2;
        transforms.push(transform);
        continue;
      }

      if (layer.layer_type === "image" && (layer.role === "product_image" || layer.role === "person_image")) {
        const imgWidth = usableWidth * 0.9;
        const imgHeight = imgWidth * (layer.height / layer.width);
        transform.width = imgWidth;
        transform.height = Math.min(imgHeight, usableHeight * 0.4);
        transform.x = (target.width - imgWidth) / 2;
        transform.y = currentY;
        currentY = transform.y + transform.height + spacing;
        transforms.push(transform);
        continue;
      }

      if (layer.layer_type === "text") {
        const textWidth = usableWidth * 0.9;
        const fontScale = layer.role === "headline" ? 1.15 : layer.role === "subheadline" ? 1.1 : 1.05;
        transform.width = textWidth;
        transform.height = layer.height * fontScale;
        transform.x = (target.width - textWidth) / 2;
        transform.y = currentY;
        transform.fontSize = layer.style?.fontSize ? Math.round(layer.style.fontSize * fontScale) : undefined;
        currentY = transform.y + transform.height + spacing;
        transforms.push(transform);
        continue;
      }

      if (layer.role === "cta") {
        transform.width = Math.min(layer.width * widthScale, usableWidth * 0.7);
        transform.height = layer.height * 1.1;
        transform.x = (target.width - transform.width) / 2;
        transform.y = Math.max(currentY, safeBottom - transform.height - spacing);
        transforms.push(transform);
        continue;
      }

      transform.width = layer.width * widthScale;
      transform.height = layer.height * (target.height / BASE_HEIGHT);
      transform.x = clampSafe(layer.x * widthScale, safeLeft, safeRight - transform.width);
      transform.y = currentY;
      currentY = transform.y + transform.height + spacing;
      transforms.push(transform);
    }

    return transforms;
  },

  /**
   * 4:5 portrait — extend vertically with slight repositioning.
   */
  _transformPortrait45(
    layers: TemplateLayer[],
    target: { width: number; height: number },
    scaleX: number,
    scaleY: number,
    safeLeft: number,
    safeRight: number,
    safeTop: number,
    safeBottom: number
  ): LayerTransform[] {
    const verticalOffset = (target.height - BASE_HEIGHT) / 2;

    return layers.map((layer) => {
      if (layer.layer_type === "background") {
        return { layer_id: layer.id, x: 0, y: 0, width: target.width, height: target.height };
      }

      const newY = layer.y * scaleY + verticalOffset * 0.3;
      const newWidth = layer.width * scaleX;
      const newHeight = layer.height * scaleY;

      const finalY = layer.role === "cta"
          ? Math.min(newY, safeBottom - newHeight)
          : clampSafe(newY, safeTop, safeBottom - newHeight);

      return {
        layer_id: layer.id,
        x: clampSafe(layer.x * scaleX, safeLeft, safeRight - newWidth),
        y: finalY,
        width: newWidth,
        height: newHeight,
        rotation: layer.rotation,
        fontSize: layer.style?.fontSize ? Math.round(layer.style.fontSize * Math.min(scaleX, scaleY) * 1.05) : undefined,
      };
    });
  },

  /**
   * 16:9 wide — compress vertically, expand horizontally.
   */
  _transformWide(
    layers: TemplateLayer[],
    target: { width: number; height: number },
    scaleX: number,
    scaleY: number,
    safeLeft: number,
    safeRight: number,
    safeTop: number,
    safeBottom: number
  ): LayerTransform[] {
    return layers.map((layer) => {
      if (layer.layer_type === "background") {
        return { layer_id: layer.id, x: 0, y: 0, width: target.width, height: target.height };
      }

      const newWidth = layer.width * scaleX;
      const newHeight = layer.height * scaleY * 0.9;
      const newX = clampSafe(layer.x * scaleX, safeLeft, safeRight - newWidth);
      const newY = clampSafe(layer.y * scaleY, safeTop, safeBottom - newHeight);

      return {
        layer_id: layer.id,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        rotation: layer.rotation,
        fontSize: layer.style?.fontSize ? Math.round(layer.style.fontSize * scaleY * 0.95) : undefined,
      };
    });
  },

  async generateAllVariants(
    designId: string,
    layers: TemplateLayer[],
    platforms?: string[]
  ): Promise<PlatformVariant[]> {
    const targetPlatforms = platforms || ALL_PLATFORMS;
    const variants: PlatformVariant[] = [];

    const ratioMap = new Map<string, string[]>();
    for (const platform of targetPlatforms) {
      const ratio = PLATFORM_ASPECT_MAP[platform] || "1:1";
      if (!ratioMap.has(ratio)) ratioMap.set(ratio, []);
      ratioMap.get(ratio)!.push(platform);
    }

    for (const [ratio, platformsForRatio] of ratioMap) {
      const canvas = CANVAS_SIZES[ratio] || CANVAS_SIZES["1:1"];
      const transforms = this.transformLayers(layers, ratio as TemplateAspectRatio);

      for (const platform of platformsForRatio) {
        const { data, error } = await supabase
          .from("social_platform_variants")
          .upsert(
            {
              design_id: designId,
              platform,
              aspect_ratio: ratio,
              width: canvas.width,
              height: canvas.height,
              layer_transforms: JSON.parse(JSON.stringify(transforms)),
              status: "ready",
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "design_id,platform" }
          )
          .select("*")
          .single();

        if (!error && data) {
          variants.push({
            ...data,
            layer_transforms: (data as any).layer_transforms,
          } as PlatformVariant);
        }
      }
    }

    return variants;
  },

  async getVariants(designId: string): Promise<PlatformVariant[]> {
    const { data, error } = await supabase
      .from("social_platform_variants")
      .select("*")
      .eq("design_id", designId);
    if (error) throw error;
    return (data || []) as unknown as PlatformVariant[];
  },

  async getVariantForPlatform(designId: string, platform: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("social_platform_variants")
      .select("rendered_url")
      .eq("design_id", designId)
      .eq("platform", platform)
      .single();

    if (error || !data) return null;
    return (data as any).rendered_url || null;
  },
};

function clampSafe(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roleVerticalOrder(role?: string | null): number {
  const order: Record<string, number> = {
    logo: 0,
    headline: 1,
    subheadline: 2,
    product_image: 3,
    person_image: 3,
    body: 4,
    price: 5,
    cta: 6,
    accent: 7,
    background: -1,
  };
  return order[role || ""] ?? 4;
}
