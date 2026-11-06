# @lp-labs/scroll-anchor

Identity-based scroll preservation across inserted, removed and resized supplied item metrics.

Standalone original implementation with zero runtime, peer or sibling dependencies.
Library ID 444. ES2022, strict TypeScript, NodeNext ESM and CommonJS with declarations.

## Install

```bash
npm install @lp-labs/scroll-anchor
```

CommonJS: `const { preserveScroll } = require('@lp-labs/scroll-anchor')`.

## Quickstart

```js
import { preserveScroll } from '@lp-labs/scroll-anchor';

const before = [
  { id: 'a', start: 0, size: 50 },
  { id: 'b', start: 50, size: 50 },
  { id: 'c', start: 100, size: 50 },
];
const after = before.map((item) => ({ ...item, start: item.start + 20 }));
const plan = preserveScroll(before, after, { scrollTop: 60, viewport: 50 });
if (plan.scrollTop !== 80 || plan.anchorId !== 'b') throw new Error('Anchor failed');
```

## API, customization and contracts

`preserveScroll(before, after, options)` accepts ordered nonoverlapping metrics:
unique nonempty id, nonnegative finite start/size and finite end. Gaps and zero-size metrics
are allowed; each list is bounded to 100000 items. No sorting or measuring is guessed.
scrollTop and viewport must be finite nonnegative, with scrollTop <= max(0,beforeExtent-viewport).
beforeExtent/afterExtent default to the respective last item end (zero for empty lists);
explicit finite extents cannot be smaller than that content end and can include trailing space.

The default anchor is the first before item intersecting the nonempty viewport. Optional
anchorId explicitly chooses a before item, including one offscreen. Unknown explicit IDs
throw TypeError. If the ID survives, preserve scrollTop - before.start against after.start.
If removed, choose the first surviving successor in before order, then the nearest surviving
predecessor; preserve that fallback item's own original signed offset, not the removed offset.
No survivor/no intersection/zero viewport preserves the raw scrollTop before final clamping.

The returned plan has scrollTop, delta from input, anchorId or null, clamped (relative to
the unbounded desired offset) and reason: anchor, successor, predecessor or none. It is
always clamped to 0..max(0,afterExtent-viewport). Your adapter applies or ignores the plan.
Inputs are read only; no DOM, global document or scrolling function is accessed.
Invalid ordered metrics/IDs/anchors throw TypeError; viewport/extents/count bounds throw
RangeError. Time and memory O(before + after).
Unlike virtual-surface's immutable index/within-item capture, this algorithm reconciles two
explicit ID metric lists, including removed anchor fallbacks and above-viewport mutations.

## Complete public declarations

```ts
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
export declare function preserveScroll(
  before: readonly ItemMetric[],
  after: readonly ItemMetric[],
  options: ScrollOptions,
): AnchorResult;
```

## Scope and performance

Before/after metric reconciliation and viewport offset plans; no DOM side effects, browser scroll anchoring or one-dimensional virtual-surface import.

Complexities and bounds above assume ordinary JavaScript number arithmetic and Map/Set
average constant-time lookup. No runtime or peer dependencies, automatic browser adapters,
global registries or hidden services are included. Importing the module has no browser effects.

## Development

```bash
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
