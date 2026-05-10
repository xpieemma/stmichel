/**
 * tests/round11-deeper-bugs.test.ts
 *
 * Pins every Round 11 cure:
 *   1. /api/feedback validates inputs and caps lengths
 *   2. Map popups use real DOM (.textContent) not HTML strings — no XSS
 *   3. Service worker tolerates per-asset failures via Promise.allSettled
 *   4. Admin dashboard +page.server.ts files use locals.admin
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('Bug 1 — /api/feedback validates and caps inputs', () => {
  const fb = read('src/routes/api/feedback/+server.ts');

  it('validates rating is an integer 1-5 (not NaN, -1, or 99)', () => {
    expect(fb).toMatch(/Number\.isInteger\(rating\)/);
    expect(fb).toMatch(/rating\s*<\s*1/);
    expect(fb).toMatch(/rating\s*>\s*5/);
  });

  it('caps eventTitle length to prevent DB stuffing attacks', () => {
    expect(fb).toMatch(/MAX_TITLE/);
    expect(fb).toMatch(/eventTitle\.slice\(0, MAX_TITLE\)/);
  });

  it('caps comment length', () => {
    expect(fb).toMatch(/MAX_COMMENT/);
    expect(fb).toMatch(/comment\.slice\(0, MAX_COMMENT\)/);
  });

  it('returns 400 (not 500) on malformed JSON', () => {
    expect(fb).toMatch(/Invalid JSON/);
    expect(fb).toMatch(/status:\s*400/);
  });

  it('rejects non-string eventTitle and non-string comment', () => {
    expect(fb).toMatch(/typeof eventTitle !== ['"]string['"]/);
    expect(fb).toMatch(/typeof comment !== ['"]string['"]/);
  });

  it('validates eventId is a positive integer when present', () => {
    expect(fb).toMatch(/Number\.isInteger\(eventId\)/);
    expect(fb).toMatch(/eventId\s*<\s*1/);
  });
});

describe('Bug 2 — Map popup is XSS-safe (real DOM, not HTML string)', () => {
  const map = read('src/routes/map/+page.svelte');

  it('does NOT use bindPopup with template-string interpolation', () => {
    // Pre-Round-11: bindPopup(`<b>${poi.title}</b><br>${poi.description}`)
    expect(map).not.toMatch(/bindPopup\(\s*`[^`]*\$\{poi\.title\}/);
    expect(map).not.toMatch(/bindPopup\(\s*`[^`]*\$\{poi\.description\}/);
  });

  it('uses createElement + .textContent for popup content', () => {
    expect(map).toMatch(/document\.createElement/);
    expect(map).toMatch(/\.textContent\s*=\s*poi\.title/);
  });

  it('passes a DOM node to bindPopup (Leaflet supports this)', () => {
    // Cured: bindPopup(node) where node is a real HTMLElement
    expect(map).toMatch(/bindPopup\(node\)/);
  });
});

describe('Bug 3 — Service worker install tolerates partial failures', () => {
  const sw = read('src/service-worker.ts');

  it('does NOT use cache.addAll (atomic — fails entirely on one 404)', () => {
    expect(sw).not.toMatch(/cache\.addAll\(ASSETS\)/);
  });

  it('uses Promise.allSettled so missing assets degrade gracefully', () => {
    expect(sw).toMatch(/Promise\.allSettled/);
  });

  it('logs how many assets cached vs failed (visible diagnostic)', () => {
    expect(sw).toMatch(/cached\s*\$\{[^}]+\}\/\$\{ASSETS\.length\}/);
    expect(sw).toMatch(/console\.warn/);
  });

  it('uses cache: reload to bypass HTTP cache during install', () => {
    // Without this, an installing SW could pick up a stale cached copy
    // of an asset that the freshly-deployed worker no longer wants.
    expect(sw).toMatch(/cache:\s*['"]reload['"]/);
  });
});

describe('Bug 4 — Admin dashboard server loads use locals.admin', () => {
  it('/admin/dashboard/+page.server.ts uses locals.admin (not raw cookie)', () => {
    const f = read('src/routes/admin/dashboard/+page.server.ts');
    expect(f).toMatch(/locals\.admin/);
    // Stale Round-7 pattern removed
    expect(f).not.toMatch(/cookies\.get\(['"]admin_session['"]\)/);
  });

  it('/admin/dashboard/analytics/+page.server.ts uses locals.admin', () => {
    const f = read('src/routes/admin/dashboard/analytics/+page.server.ts');
    expect(f).toMatch(/!locals\.admin/);
    expect(f).not.toMatch(/cookies\.get\(['"]admin_session['"]\)/);
  });

  it('both files redirect to /admin/login if locals.admin is missing', () => {
    for (const f of [
      'src/routes/admin/dashboard/+page.server.ts',
      'src/routes/admin/dashboard/analytics/+page.server.ts',
    ]) {
      const c = read(f);
      expect(c).toMatch(/redirect\(302, ['"]\/admin\/login['"]\)/);
    }
  });
});
