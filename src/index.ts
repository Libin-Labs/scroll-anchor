export interface ItemMetric {
  id: string;
  start: number;
  size: number;
}
export interface ScrollOptions {
  scrollTop: number;
  viewport: number;
  beforeExtent?: number;
  afterExtent?: number;
  anchorId?: string;
}
export interface AnchorResult {
  scrollTop: number;
  delta: number;
  anchorId: string | null;
  clamped: boolean;
  reason: 'anchor' | 'successor' | 'predecessor' | 'none';
}
function metrics(items: readonly ItemMetric[], explicit: number | undefined): number {
  if (items.length > 100000) throw new RangeError('Too many metrics');
  const ids = new Set<string>();
  let end = 0;
  for (const item of items) {
    if (
      typeof item.id !== 'string' ||
      !item.id ||
      ids.has(item.id) ||
      !Number.isFinite(item.start) ||
      !Number.isFinite(item.size) ||
      item.start < end ||
      item.size < 0 ||
      !Number.isFinite(item.start + item.size)
    )
      throw new TypeError('Invalid ordered metrics');
    ids.add(item.id);
    end = item.start + item.size;
  }
  const extent = explicit ?? end;
  if (!Number.isFinite(extent) || extent < end) throw new RangeError('Extent smaller than content');
  return extent;
}
export function preserveScroll(
  before: readonly ItemMetric[],
  after: readonly ItemMetric[],
  options: ScrollOptions,
): AnchorResult {
  const beforeExtent = metrics(before, options.beforeExtent);
  const afterExtent = metrics(after, options.afterExtent);
  const { scrollTop, viewport } = options;
  if (
    !Number.isFinite(scrollTop) ||
    !Number.isFinite(viewport) ||
    viewport < 0 ||
    scrollTop < 0 ||
    scrollTop > Math.max(0, beforeExtent - viewport)
  )
    throw new RangeError('Invalid viewport');
  let index =
    options.anchorId === undefined
      ? before.findIndex(
          (m) => viewport > 0 && m.start + m.size > scrollTop && m.start < scrollTop + viewport,
        )
      : before.findIndex((m) => m.id === options.anchorId);
  if (options.anchorId !== undefined && index < 0) throw new TypeError('Unknown anchor');
  const next = new Map(after.map((m) => [m.id, m]));
  let reason: AnchorResult['reason'] = 'anchor';
  if (index >= 0 && !next.has(before[index]!.id)) {
    const original = index;
    index = before.findIndex((m, i) => i > original && next.has(m.id));
    reason = 'successor';
    if (index < 0) {
      for (let i = original - 1; i >= 0; i--) {
        if (next.has(before[i]!.id)) {
          index = i;
          break;
        }
      }
      reason = 'predecessor';
    }
  }
  const anchor = index >= 0 ? before[index]! : null;
  const desired = anchor ? next.get(anchor.id)!.start + (scrollTop - anchor.start) : scrollTop;
  const result = Math.max(0, Math.min(Math.max(0, afterExtent - viewport), desired));
  return {
    scrollTop: result,
    delta: result - scrollTop,
    anchorId: anchor?.id ?? null,
    clamped: result !== desired,
    reason: anchor ? reason : 'none',
  };
}
