// YANGU Surface Lifecycle — status transitions and publish guards.
// See YANGU_BUILDER_SPEC.md (Surface Lifecycle section).

export type SurfaceStatus = 'draft' | 'published' | 'archived' | 'suspended';

// Valid transitions — only these are allowed.
const ALLOWED_TRANSITIONS: Record<SurfaceStatus, SurfaceStatus[]> = {
  draft:     ['published', 'archived'],
  published: ['archived', 'draft'],
  archived:  ['draft', 'published'],
  suspended: [], // only admin can un-suspend (handled server-side)
};

export function canTransition(from: SurfaceStatus, to: SurfaceStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: SurfaceStatus, to: SurfaceStatus): void {
  if (from === to) return;
  if (!canTransition(from, to)) {
    throw new Error(
      `[YANGU LIFECYCLE] Invalid status transition: ${from} → ${to}`
    );
  }
}

// Call this before any publish action.
export function assertPublishable(status: SurfaceStatus | string | null | undefined): void {
  if (status === 'suspended') {
    throw new Error(
      '[YANGU LIFECYCLE] Surface is suspended and cannot be published. Contact support.'
    );
  }
  if (status === 'archived') {
    throw new Error(
      '[YANGU LIFECYCLE] Restore this surface to draft before publishing.'
    );
  }
}

// Canonical publish domain per surface_type (mirrors YANGU_BUILDER_SPEC.md).
const SURFACE_PUBLISH_DOMAIN: Record<string, string> = {
  eshop:             'yangu.shop',
  emenu:             'restaurant.yangu.shop',
  quick_site:        'yangu.site',
  store_listing:     'yangu.store',
  live_bio:          'yangu.live',
  live_selling:      'yangu.live',
  community_group:   'yangu.community',
  community_listing: 'yangu.community',
  studio_showcase:   'yangu.studio',
};

export function buildPublishedUrl(surfaceType: string, slug: string): string | null {
  const host = SURFACE_PUBLISH_DOMAIN[surfaceType];
  if (!host || !slug) return null;
  return `https://${host}/${slug}`;
}