import test from 'node:test';
import assert from 'node:assert/strict';
import { preserveScroll } from '../dist/esm/index.js';

const before = [
  { id: 'a', start: 0, size: 50 },
  { id: 'b', start: 50, size: 50 },
  { id: 'c', start: 100, size: 50 },
  { id: 'd', start: 150, size: 50 },
];
test('insertion above preserves first visible item relative offset', () => {
  const after = [
    { id: 'new', start: 0, size: 20 },
    ...before.map((m) => ({ ...m, start: m.start + 20 })),
  ];
  assert.deepEqual(preserveScroll(before, after, { scrollTop: 60, viewport: 50 }), {
    scrollTop: 80,
    delta: 20,
    anchorId: 'b',
    clamped: false,
    reason: 'anchor',
  });
});
test('height mutations above anchor accumulate signed delta', () => {
  const after = before.map((m, i) =>
    i === 0 ? { ...m, size: 30 } : { ...m, start: m.start - 20 },
  );
  assert.equal(preserveScroll(before, after, { scrollTop: 60, viewport: 50 }).scrollTop, 40);
});
test('removed anchor falls forward to first surviving successor with its original offset', () => {
  const after = before
    .filter((m) => m.id !== 'b')
    .map((m) => (m.start > 50 ? { ...m, start: m.start - 50 } : m));
  assert.deepEqual(preserveScroll(before, after, { scrollTop: 60, viewport: 50 }), {
    scrollTop: 10,
    delta: -50,
    anchorId: 'c',
    clamped: false,
    reason: 'successor',
  });
});
test('removed tail anchor falls back to predecessor and clamps to new scroll bounds', () => {
  const after = before.slice(0, 3);
  assert.deepEqual(preserveScroll(before, after, { scrollTop: 150, viewport: 50 }), {
    scrollTop: 100,
    delta: -50,
    anchorId: 'c',
    clamped: true,
    reason: 'predecessor',
  });
});
test('explicit anchor handles gap with signed viewport-relative offset', () => {
  const after = before.map((m) => ({ ...m, start: m.start + 10 }));
  assert.deepEqual(preserveScroll(before, after, { scrollTop: 20, viewport: 50, anchorId: 'c' }), {
    scrollTop: 30,
    delta: 10,
    anchorId: 'c',
    clamped: false,
    reason: 'anchor',
  });
});
test('empty no-survivor and zero viewport produce bounded no-anchor plan', () => {
  assert.deepEqual(preserveScroll(before, [], { scrollTop: 60, viewport: 50 }), {
    scrollTop: 0,
    delta: -60,
    anchorId: null,
    clamped: true,
    reason: 'none',
  });
  assert.equal(preserveScroll([], [], { scrollTop: 0, viewport: 50 }).scrollTop, 0);
  assert.equal(preserveScroll(before, before, { scrollTop: 60, viewport: 0 }).anchorId, null);
});
test('invalid metrics extents anchor and viewport reject without changing inputs', () => {
  assert.throws(
    () => preserveScroll(before, [before[0], before[0]], { scrollTop: 0, viewport: 50 }),
    TypeError,
  );
  assert.throws(() => preserveScroll(before, before, { scrollTop: -1, viewport: 50 }), RangeError);
  assert.throws(() => preserveScroll(before, before, { scrollTop: 151, viewport: 50 }), RangeError);
  assert.throws(
    () => preserveScroll(before, before, { scrollTop: 0, viewport: 50, afterExtent: 100 }),
    RangeError,
  );
  assert.throws(
    () => preserveScroll(before, before, { scrollTop: 0, viewport: 50, anchorId: 'missing' }),
    TypeError,
  );
  assert.equal(before[0].size, 50);
});
test('explicit trailing extent and nonintersecting gap preserve raw scroll when no anchor', () => {
  const items = [{ id: 'a', start: 100, size: 10 }];
  assert.deepEqual(
    preserveScroll(items, items, {
      scrollTop: 0,
      viewport: 20,
      beforeExtent: 200,
      afterExtent: 200,
    }),
    {
      scrollTop: 0,
      delta: 0,
      anchorId: null,
      clamped: false,
      reason: 'none',
    },
  );
});
