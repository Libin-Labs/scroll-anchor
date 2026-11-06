import { preserveScroll } from '@lp-labs/scroll-anchor';

const before = [
  { id: 'a', start: 0, size: 50 },
  { id: 'b', start: 50, size: 50 },
  { id: 'c', start: 100, size: 50 },
];
const after = before.map((item) => ({ ...item, start: item.start + 20 }));
const plan = preserveScroll(before, after, { scrollTop: 60, viewport: 50 });
if (plan.scrollTop !== 80 || plan.anchorId !== 'b') throw new Error('Anchor failed');

// @ts-expect-error invalid public API input must be rejected
preserveScroll([], [], { scrollTop: 0, viewport: 'screen' });
