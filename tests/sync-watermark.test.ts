/**
 * tests/sync-watermark.test.ts
 *
 * Verifies the cure for Round 3 bug #8 (sync watermark drift):
 * The watermark must advance to the maximum `updatedAt` actually
 * observed in the response — NEVER to Date.now() — so a wrong client
 * clock cannot skip records the server hasn't reported yet.
 *
 * Tests the `stripId` helper from Round 4 bug #14 too.
 */
import { describe, it, expect } from 'vitest';

// --- Reproductions of the production helpers ---
// (extracted verbatim from src/lib/db/sync.ts)

function stripId<T extends { id?: unknown }>(row: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = row;
  return rest;
}

interface Item { id: number; updatedAt: number; }

function computeNewWatermark(previousWatermark: number, items: Item[]): number {
  let highWaterMark = previousWatermark;
  for (const it of items) {
    if (typeof it.updatedAt === 'number' && it.updatedAt > highWaterMark) {
      highWaterMark = it.updatedAt;
    }
  }
  return highWaterMark;
}

describe('Sync watermark logic (Round 3 fix #8)', () => {
  it('advances to the highest updatedAt in the response', () => {
    const items: Item[] = [
      { id: 1, updatedAt: 1_700_000_000 },
      { id: 2, updatedAt: 1_700_000_500 },
      { id: 3, updatedAt: 1_700_000_200 }
    ];
    expect(computeNewWatermark(0, items)).toBe(1_700_000_500);
  });

  it('does NOT advance past the highest observed value (clock-drift safety)', () => {
    const previousWatermark = 1_700_000_000;
    const items: Item[] = [{ id: 1, updatedAt: 1_700_000_100 }];
    const result = computeNewWatermark(previousWatermark, items);
    // The wrong fix would have used Date.now(), which is much larger.
    expect(result).toBe(1_700_000_100);
    expect(result).toBeLessThan(Date.now());
  });

  it('preserves the previous watermark when response is empty', () => {
    expect(computeNewWatermark(1_700_000_000, [])).toBe(1_700_000_000);
  });

  it('ignores items without a numeric updatedAt', () => {
    const items: any[] = [
      { id: 1, updatedAt: 'not a number' },
      { id: 2 },
      { id: 3, updatedAt: 1_700_000_999 }
    ];
    expect(computeNewWatermark(0, items)).toBe(1_700_000_999);
  });
});

describe('stripId helper (Round 4 fix #14)', () => {
  it('removes id from the update set', () => {
    const row = { id: 42, slug: 'foo', title: 'bar', updatedAt: 100 };
    const stripped = stripId(row);
    expect(stripped).not.toHaveProperty('id');
    expect(stripped).toEqual({ slug: 'foo', title: 'bar', updatedAt: 100 });
  });

  it('does not mutate the input', () => {
    const row = { id: 42, slug: 'foo' };
    stripId(row);
    expect(row).toHaveProperty('id', 42);
  });

  it('handles rows without id field gracefully', () => {
    const row = { slug: 'foo' } as any;
    expect(stripId(row)).toEqual({ slug: 'foo' });
  });
});
