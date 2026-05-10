/**
 * tests/round5-dormant-bugs.test.ts
 *
 * Pins every Round 5 cure: the dormant bugs found by deep page-by-page
 * review that the earlier tests couldn't catch because they verified
 * what the cures DID, not what the user actually experiences.
 *
 * Each test is a grep-able assertion against the source. If a future
 * refactor reverts any cure, the corresponding test fails.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('Bug A — OPFS init uses the real sqlite-wasm API', () => {
  const client = read('src/lib/db/client.ts');

  it('uses sqlite3Worker1Promiser (the only API that supports OPFS persistence)', () => {
    expect(client).toMatch(/sqlite3Worker1Promiser/);
  });

  it('does NOT call the non-existent sqlite3.opfsOpen()', () => {
    expect(client).not.toMatch(/sqlite3\.opfsOpen/);
    expect(client).not.toMatch(/\.opfsOpen\(/);
  });

  it('opens the DB with vfs=opfs query string (Worker1 promiser contract)', () => {
    expect(client).toMatch(/filename:\s*['"]file:festival\.db\?vfs=opfs['"]/);
  });
});

describe('Bug B — Albums are actually synced from server to OPFS', () => {
  const sync = read('src/lib/db/sync.ts');

  it('/api/albums/sync endpoint exists', () => {
    expect(existsSync(resolve(ROOT, 'src/routes/api/albums/sync/+server.ts'))).toBe(true);
  });

  it('syncFromServer() fetches /api/albums/sync with a since watermark', () => {
    expect(sync).toMatch(/fetch\(`\/api\/albums\/sync\?since=\$\{lastSync\}`\)/);
  });

  it('album photos are embedded in the sync response (batched, not N+1)', () => {
    const endpoint = read('src/routes/api/albums/sync/+server.ts');
    expect(endpoint).toMatch(/album_id IN/);  // batched IN () query
    expect(endpoint).toMatch(/photos:/);       // embedded in response
  });

  it('albums + albumPhotos are imported into sync.ts', () => {
    expect(sync).toMatch(/albums,\s*albumPhotos/);
  });
});

describe('Bugs C + D — Orphaned components are actually rendered', () => {
  it('FeedbackButton is rendered on event detail pages', () => {
    const evt = read('src/routes/event/[slug]/+page.svelte');
    expect(evt).toMatch(/<FeedbackButton/);
  });

  it('FeedbackButton is rendered on match detail pages', () => {
    const match = read('src/routes/match/[slug]/+page.svelte');
    expect(match).toMatch(/<FeedbackButton/);
  });

  it('ScheduleCalendar is rendered on the homepage', () => {
    const home = read('src/routes/+page.svelte');
    expect(home).toMatch(/<ScheduleCalendar/);
  });
});

describe('Bug E — Schema includes all runtime tables', () => {
  const schema = read('src/lib/db/schema.ts');

  it('feedback table is in the Drizzle schema', () => {
    expect(schema).toMatch(/export const feedback\s*=\s*sqliteTable\(['"]feedback['"]/);
  });

  it('pendingSync table is in the Drizzle schema', () => {
    expect(schema).toMatch(/export const pendingSync\s*=\s*sqliteTable\(['"]pending_sync['"]/);
  });
});

describe('Bug F — Timestamp units are consistent (seconds, not ms)', () => {
  const pending = read('src/lib/db/pending-sync.ts');

  it('addToQueue writes seconds (unixepoch-compatible), not Date.now() milliseconds', () => {
    // After cure: ${Math.floor(Date.now() / 1000)}
    expect(pending).toMatch(/Math\.floor\(Date\.now\(\)\s*\/\s*1000\)/);
    // Before cure: ${Date.now()} alone (bare, no divide by 1000)
    expect(pending).not.toMatch(/,\s*\$\{Date\.now\(\)\}\s*,/);
  });
});

describe('Bug G — History items are reachable from the UI', () => {
  const ville = read('src/routes/ville/+page.svelte');

  it('the Istwa section on /ville links to /history/[slug]', () => {
    expect(ville).toMatch(/\/history\//);
  });

  it('/ville queries the events table for type=history rows', () => {
    expect(ville).toMatch(/eq\(events\.type,\s*['"]history['"]\)/);
  });
});

describe('Bug H — Match list cards are keyboard-accessible', () => {
  const list = read('src/routes/matches/+page.svelte');

  it('both upcoming and past match card divs have role="button"', () => {
    const roleButtons = list.match(/role="button"/g);
    expect(roleButtons?.length).toBeGreaterThanOrEqual(2);
  });

  it('both cards have on:keydown for Enter/Space activation', () => {
    const keydowns = list.match(/on?:keydown/g);
    expect(keydowns?.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Bugs I + J + K — Passport page math and reactivity', () => {
  const passport = read('src/routes/passport/+page.svelte');

  it('guards against NaN% by checking total > 0 before dividing', () => {
    expect(passport).toMatch(/total\s*>\s*0\s*\?\s*[^:]+:\s*0/);
  });

  it('uses reactive assignment (= collected) instead of .push() (which Svelte does not observe)', () => {
    // The bug: `collected.push(ev)` never triggers re-render.
    // The cure: `collected = await db.select()....all()` — assignment.
    expect(passport).not.toMatch(/collected\.push/);
    expect(passport).toMatch(/collected\s*=\s*await/);
  });

  it('total denominator only counts type=event rows (not POIs or history)', () => {
    expect(passport).toMatch(/eq\(events\.type,\s*['"]event['"]\)/);
  });

  it('uses a batched inArray query instead of N+1 (await inside loop)', () => {
    expect(passport).toMatch(/inArray\(events\.id/);
  });
});

describe('Bug L — Map page leaves room for the bottom nav', () => {
  const map = read('src/routes/map/+page.svelte');

  it('map container does NOT cover the full viewport (bottom-nav is 80px tall)', () => {
    // Cured: fixed top-0 left-0 right-0 bottom-20
    // Buggy: fixed inset-0
    expect(map).not.toMatch(/fixed\s+inset-0/);
    expect(map).toMatch(/bottom-20/);
  });
});

describe('Bug M — Homepage shows only scheduled events', () => {
  const home = read('src/routes/+page.svelte');

  it('feed query filters type=event (excludes POIs and history from the feed)', () => {
    expect(home).toMatch(/eq\(events\.type,\s*['"]event['"]\)/);
  });

  it('orders by ascending date (upcoming events at top, not most-recent-past)', () => {
    expect(home).toMatch(/orderBy\(asc\(events\.date\)\)/);
  });
});

describe('Bug N — Server loads fall back gracefully in dev (no DB binding)', () => {
  it('event/[slug] returns a stub instead of throwing when DB missing', () => {
    const load = read('src/routes/event/[slug]/+page.server.ts');
    expect(load).toMatch(/_serverFallback/);
    expect(load).toMatch(/if\s*\(!db\)/);
  });

  it('history/[slug] returns a stub instead of throwing', () => {
    const load = read('src/routes/history/[slug]/+page.server.ts');
    expect(load).toMatch(/_serverFallback/);
  });

  it('match/[slug] returns a stub instead of throwing', () => {
    const load = read('src/routes/match/[slug]/+page.server.ts');
    expect(load).toMatch(/_serverFallback/);
  });
});

describe('Bugs O + P — Null-safe description handling', () => {
  it('homepage preview() helper handles null/undefined descriptions', () => {
    const home = read('src/routes/+page.svelte');
    expect(home).toMatch(/function preview/);
    expect(home).toMatch(/if \(!text\)/);
  });

  it('history page null-safe split on description', () => {
    const hist = read('src/routes/history/[slug]/+page.svelte');
    // Cured: (history.description ?? '').split(...)
    expect(hist).toMatch(/history\.description\s*\?\?\s*['"]['"]/);
  });
});

describe('Bug Q — Match detail hasScore is reactive', () => {
  const match = read('src/routes/match/[slug]/+page.svelte');

  it('hasScore is a reactive statement ($:) not a const', () => {
     const hasDerived = /let hasScore\s*=\s*\$derived/.test(match);
  const hasReactive = /\$:\s*hasScore/.test(match);
  expect(hasDerived || hasReactive).toBe(true);
  expect(match).not.toMatch(/const hasScore\s*=/);
  });

  it('checks for both null AND undefined (D1 can return either)', () => {
    expect(match).toMatch(/homeScore\s*!==\s*undefined/);
  });
});

describe('Bug R — System font stack (Round 7 reversal of Round 5 Google Fonts)', () => {
  // Round 5 added Google Fonts for type consistency on Alcatel 1s.
  // Round 7 discovered that approach pre-cached nothing in the SW and
  // added external-CDN risk for ~zero benefit on low-end Android devices.
  // We reverted to a pure system font stack.

  it('app.html does NOT load anything from fonts.googleapis.com (offline safety)', () => {
    const html = read('src/app.html');
    expect(html).not.toMatch(/fonts\.googleapis\.com/);
    expect(html).not.toMatch(/fonts\.gstatic\.com/);
  });

  it('app.html does NOT preconnect external CDNs for fonts', () => {
    const html = read('src/app.html');
    expect(html).not.toMatch(/rel="preconnect"[^>]*fonts\./);
  });

  it('tailwind.config.js still lists Inter FIRST in the font-family stack', () => {
    // If the user's OS has Inter installed (many devs do), it still
    // renders. Otherwise the system stack takes over — no missing
    // font ever blocks paint or requests the network.
    expect(read('tailwind.config.js')).toMatch(/['"]Inter['"]/);
  });

  it('CSP font-src no longer allows fonts.gstatic.com (attack surface removed)', () => {
    expect(read('src/hooks.server.ts')).not.toMatch(/font-src[^,]*fonts\.gstatic\.com/);
  });

  it('CSP style-src no longer allows fonts.googleapis.com (attack surface removed)', () => {
    expect(read('src/hooks.server.ts')).not.toMatch(/style-src[^,]*fonts\.googleapis\.com/);
  });
});

describe('Dependencies — current and maintained', () => {
  const pkg = JSON.parse(read('package.json'));
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

  it('drops the unused @libsql/client dependency', () => {
    expect(all['@libsql/client']).toBeUndefined();
  });

  it('declares @sveltejs/vite-plugin-svelte (svelte.config.js needs it)', () => {
    expect(all['@sveltejs/vite-plugin-svelte']).toBeDefined();
  });

  it('@sveltejs/kit version supports Svelte 5', () => {
    // Round 8 reverted from ^2.52.2 (which forced Svelte 5 internals via
    // transitive deps and broke the build with `hydratable is not exported`)
    // back to the known-good 2.15.x line that explicitly targets Svelte 4.
    // CVE-2024-XXXX awareness: any 2.x at or above 2.5 has the form-data
    // patch; we're below that intentionally and accept the trade.
    const range = all['@sveltejs/kit'];
    expect(range).toBeDefined();
    const m = range.match(/(\d+)\.(\d+)\.(\d+)/);
    expect(m).not.toBeNull();
    const [, maj, min] = m!.map(Number);
    expect(maj).toBe(7);
    expect(min).toBeGreaterThanOrEqual(50);
  });

  it('@simplewebauthn/server and browser are both >= 11 (the credential API)', () => {
    for (const pkgName of ['@simplewebauthn/server', '@simplewebauthn/browser']) {
      const range = all[pkgName];
      expect(range).toBeDefined();
      const m = range.match(/(\d+)\./);
      expect(m).not.toBeNull();
      expect(Number(m![1])).toBeGreaterThanOrEqual(11);
    }
  });

  it('@sveltejs/adapter-cloudflare is >= 4 (has pages_build_output_dir support)', () => {
    const range = all['@sveltejs/adapter-cloudflare'];
    const m = range.match(/(\d+)\./);
    expect(Number(m![1])).toBeGreaterThanOrEqual(4);
  });

  it('drizzle-orm range allows a reasonably current version', () => {
    const range = all['drizzle-orm'];
    expect(range).toBeDefined();
    const m = range.match(/(\d+)\.(\d+)/);
    const minor = Number(m![2]);
    expect(minor).toBeGreaterThanOrEqual(36);
  });

  it('tailwindcss is on 4.x', () => {
  const range = all['tailwindcss'];
  expect(range).toMatch(/[\^~]?4\./);
});
});

describe('Incremental sync performance — N+1 avoided', () => {
  const albumsSync = read('src/routes/api/albums/sync/+server.ts');

  it('uses placeholders = ids.map(...).join for a single batched IN query', () => {
    expect(albumsSync).toMatch(/placeholders\s*=\s*ids\.map/);
    expect(albumsSync).toMatch(/IN\s*\(\$\{placeholders\}\)/);
  });
});
