/**
 * Soft diversity interleaving for landing rows.
 *
 * Takes a ranked array and re-orders the first `windowSize` items
 * so that consecutive cards don't share the same primary_category.
 * Ranking is still respected — items only swap within a small window.
 */
export function diversifyResults<T extends { primary_category?: string | null }>(
  items: T[],
  windowSize = 8,
): T[] {
  if (items.length <= 2) return items;

  const head = items.slice(0, Math.min(windowSize, items.length));
  const tail = items.slice(head.length);
  const result: T[] = [];
  const remaining = [...head];

  while (remaining.length> 0) {
    const lastCat = result.length> 0 ? result[result.length - 1].primary_category : null;

    // Try to pick the highest-ranked item that doesn't repeat the last category
    const diffIdx = lastCat
      ? remaining.findIndex((r) => r.primary_category !== lastCat)
      : -1;

    if (diffIdx> 0) {
      result.push(remaining.splice(diffIdx, 1)[0]);
    } else {
      // No diversity candidate or first pick — take highest ranked
      result.push(remaining.shift()!);
    }
  }

  return [...result, ...tail];
}
