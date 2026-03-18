/**
 * Session-aware discovery memory.
 *
 * Tracks lightweight interaction signals (clicks, detail opens) in sessionStorage.
 * Used to gently nudge discovery ordering without breaking trust/relevance hierarchy.
 *
 * Signals decay: each click is timestamped; only clicks within DECAY_WINDOW_MS matter.
 * Memory is capped to MAX_EVENTS to prevent unbounded growth.
 */

const STORAGE_KEY = "yangu_discovery_session";
const MAX_EVENTS = 60;
const DECAY_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// ── Types ──

interface ClickEvent {
  entityId: string;
  entityType: string;
  category: string | null;
  tags: string[];
  ts: number; // epoch ms
}

interface SessionMemory {
  clicks: ClickEvent[];
}

// ── Read / Write ──

function load(): SessionMemory {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { clicks: [] };
    return JSON.parse(raw) as SessionMemory;
  } catch {
    return { clicks: [] };
  }
}

function save(mem: SessionMemory) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    // quota exceeded — silently drop
  }
}

// ── Public API ──

/** Record that a user clicked/opened an entity */
export function recordEntityClick(entity: {
  id: string;
  entity_type: string;
  primary_category?: string | null;
  tags?: string[];
}) {
  const mem = load();
  mem.clicks.push({
    entityId: entity.id,
    entityType: entity.entity_type,
    category: entity.primary_category ?? null,
    tags: entity.tags ?? [],
    ts: Date.now(),
  });
  // Cap size
  if (mem.clicks.length > MAX_EVENTS) {
    mem.clicks = mem.clicks.slice(-MAX_EVENTS);
  }
  save(mem);
}

/**
 * Compute preference scores from recent session clicks.
 * Returns maps of entity_type → weight and category → weight.
 *
 * Weights decay linearly: a click at DECAY_WINDOW_MS ago = 0, a click now = 1.
 * Total per-key is summed and capped at 1.0.
 */
export function getSessionPreferences(): {
  typeWeights: Record<string, number>;
  categoryWeights: Record<string, number>;
  tagWeights: Record<string, number>;
  clickedIds: Set<string>;
} {
  const mem = load();
  const now = Date.now();
  const cutoff = now - DECAY_WINDOW_MS;

  const typeWeights: Record<string, number> = {};
  const categoryWeights: Record<string, number> = {};
  const tagWeights: Record<string, number> = {};
  const clickedIds = new Set<string>();

  for (const click of mem.clicks) {
    if (click.ts < cutoff) continue;

    const decay = (click.ts - cutoff) / DECAY_WINDOW_MS; // 0→1
    clickedIds.add(click.entityId);

    typeWeights[click.entityType] = Math.min(
      1.0,
      (typeWeights[click.entityType] ?? 0) + decay * 0.25,
    );

    if (click.category) {
      categoryWeights[click.category] = Math.min(
        1.0,
        (categoryWeights[click.category] ?? 0) + decay * 0.25,
      );
    }

    for (const tag of click.tags.slice(0, 3)) {
      const k = tag.toLowerCase();
      tagWeights[k] = Math.min(1.0, (tagWeights[k] ?? 0) + decay * 0.15);
    }
  }

  return { typeWeights, categoryWeights, tagWeights, clickedIds };
}

/** Prune expired events (called lazily) */
export function pruneSession() {
  const mem = load();
  const cutoff = Date.now() - DECAY_WINDOW_MS;
  mem.clicks = mem.clicks.filter((c) => c.ts >= cutoff);
  save(mem);
}
