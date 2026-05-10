/**
 * tests/architectural-invariants.test.ts
 *
 * Verifies architectural invariants that, if broken, kill the app
 * silently in production. Each test is a single-line `grep`-able
 * fact about the source — but expressed as an assertion that fails
 * loudly if a future refactor regresses the cure.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('Service worker (Round 4 bugs #9, #10)', () => {
  const sw = read('src/service-worker.ts');
  const layout = read('src/routes/+layout.svelte');

  it('does NOT import lib/db/sync (which transitively imports sqlite-wasm — would throw in SW scope)', () => {
    expect(sw).not.toMatch(/import\(['"]\.\/lib\/db\/sync['"]\)/);
    expect(sw).not.toMatch(/from\s+['"][./]*lib\/db\/sync['"]/);
  });

  it('uses message-passing to wake the page on background-sync', () => {
    expect(sw).toMatch(/notifyClientsToSync/);
    expect(sw).toMatch(/postMessage\(\{\s*type:\s*'sync-pending'/);
  });

  it('skips /api/ routes FIRST (before origin check) so sync never gets cached', () => {
    // The handler body must check /api/ before any other branch.
    const fetchHandlerMatch = sw.match(/addEventListener\(['"]fetch['"][\s\S]*?\}\)\s*;/);
    expect(fetchHandlerMatch).not.toBeNull();
    const handler = fetchHandlerMatch![0];
    const apiCheck = handler.indexOf("'/api/'");
    const originCheck = handler.indexOf('sw.location.origin');
    expect(apiCheck).toBeGreaterThan(0);
    expect(originCheck).toBeGreaterThan(apiCheck); // /api/ check comes first
  });

  it('skips non-GET requests so POST/DELETE pass through to network', () => {
    expect(sw).toMatch(/event\.request\.method\s*!==\s*'GET'/);
  });

  it('layout REGISTERS the service worker (without this, SW is dead code)', () => {
    expect(layout).toMatch(/navigator\.serviceWorker\.register\(['"]\/service-worker\.js['"]/);
  });

  it('layout listens for the sync-pending message', () => {
    expect(layout).toMatch(/'sync-pending'/);
  });
});

describe('Multi-tab OPFS lock (Round 4 bug #18)', () => {
  const client = read('src/lib/db/client.ts');
  const layout = read('src/routes/+layout.svelte');

  it('client.ts uses navigator.locks to coordinate OPFS access', () => {
    expect(client).toMatch(/navigator\.locks[\s\S]*?\.request\(['"]festival_db['"]/);
  });

  it('client.ts dispatches a db-locked event when another tab holds the lock', () => {
    expect(client).toMatch(/dispatchEvent\(new CustomEvent\(['"]db-locked['"]\)\)/);
  });

  it('layout listens for db-locked and shows the warning banner', () => {
    expect(layout).toMatch(/['"]db-locked['"]/);
    expect(layout).toMatch(/dbLocked/);
  });
});

describe('OPFS schema evolution (Round 4 bug #8)', () => {
  const client = read('src/lib/db/client.ts');

  it('introspects existing stamps table for nonce column', () => {
    expect(client).toMatch(/PRAGMA table_info\(stamps\)/);
  });

  it('runs ALTER TABLE to add nonce when missing (existing OPFS users)', () => {
    expect(client).toMatch(/ALTER TABLE stamps ADD COLUMN nonce TEXT/);
  });

  it('backfills synthetic nonces for legacy rows so the unique index can be created', () => {
    expect(client).toMatch(/UPDATE stamps SET nonce = printf\('legacy-opfs-%d', id\)/);
  });

  it('creates the unique index idempotently', () => {
    expect(client).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS idx_stamps_nonce/);
  });
});

describe('WebAuthn RP ID host fallback (Round 4 bug #16)', () => {
  const reg = read('src/routes/admin/api/webauthn/+server.ts');
  const verify = read('src/routes/admin/api/webauthn/verify/+server.ts');

  it('register endpoint resolves rpID with hostname fallback', () => {
    expect(reg).toMatch(/resolveRpId/);
    expect(reg).toMatch(/reqUrl\.hostname/);
  });

  it('verify endpoint resolves rpID with hostname fallback', () => {
    expect(verify).toMatch(/resolveRpId/);
    expect(verify).toMatch(/reqUrl\.hostname/);
  });

  it('challenges live in KV (not in a global Map — Round 2 bug #5)', () => {
    expect(reg).toMatch(/kv\.put\(`challenge:/);
    expect(verify).toMatch(/kv\.get\(`challenge:/);
    expect(verify).toMatch(/kv\.delete\(`challenge:/);
  });
});

describe('Offline feedback queue (Round 4 bug #15)', () => {
  const button = read('src/lib/components/FeedbackButton.svelte');
  const sync = read('src/lib/db/sync.ts');

  it('FeedbackButton uses addToQueue (NOT a private feedback_queue table)', () => {
    expect(button).toMatch(/addToQueue\(['"]feedback['"]/);
    // The bug was writing to `feedback_queue` (a table nothing read from)
    expect(button).not.toMatch(/INSERT INTO feedback_queue/);
  });

  it('processPendingQueue routes feedback to the public /api/feedback endpoint', () => {
    expect(sync).toMatch(/op\.type === ['"]feedback['"]/);
    expect(sync).toMatch(/['"]\/api\/feedback['"]/);
  });
});

describe('TypeScript ambient types (Round 4 bug #11)', () => {
  const appdts = read('src/app.d.ts');

  it('typed locals.db as OPTIONAL (was incorrectly required, hiding null-derefs)', () => {
    expect(appdts).toMatch(/db\?:\s*D1Database/);
    expect(appdts).toMatch(/kv\?:\s*KVNamespace/);
  });

  it('exposes platform.context.waitUntil for adapter-cloudflare', () => {
    expect(appdts).toMatch(/waitUntil/);
  });
});

describe('Homepage accessibility (Round 4 bug #12)', () => {
  const page = read('src/routes/+page.svelte');

  it('event card uses semantic <a href> for native nav (Round 9)', () => {
    // Round 4 wrapped the card in <article role="button"> + tabindex +
    // keydown — but Svelte's compiler correctly warns: <article> is a
    // non-interactive element and cannot accept role="button". Round 9
    // replaced that pattern with a native <a href={`/event/${slug}`}>
    // which gives keyboard nav, screen-reader semantics, middle-click
    // -to-open-tab, and right-click-copy-link for free.
    expect(page).toMatch(/<a[\s\S]*?href=\{`\/event\/\$\{event\.slug\}`\}/);
    expect(page).not.toMatch(/<article[^>]*role="button"/);
  });
});

describe('Sync engine — id stripping (Round 4 bug #14)', () => {
  const sync = read('src/lib/db/sync.ts');

  it('stripId helper exists', () => {
    expect(sync).toMatch(/function stripId/);
  });

  it('all four onConflictDoUpdate calls use stripId (events, matches, albums, cityInfo)', () => {
    // Round 4 added the helper for events/matches/cityInfo.
    // Round 5 added albums sync, which uses the same helper.
    const matches = sync.match(/onConflictDoUpdate\([^)]*set:\s*stripId/g);
    expect(matches?.length).toBe(4);
  });
});

describe('Update-detection prompt (Round 4 — the zombie chunk fix)', () => {
  const layout = read('src/routes/+layout.svelte');

  it('subscribes to SvelteKit `updated` store', () => {
    expect(layout).toMatch(/updated\.subscribe/);
  });

  it('exposes a refresh button when an update is detected', () => {
    expect(layout).toMatch(/updateAvailable/);
    expect(layout).toMatch(/reloadApp|window\.location\.reload/);
  });
});

describe('No regression of older fixes', () => {
  it('schema.ts has NO `mode: timestamp` (Round 1 bug #3)', () => {
    expect(read('src/lib/db/schema.ts')).not.toMatch(/mode:\s*['"]timestamp['"]/);
  });

  it('admin del() functions DELETE on server before locally (Round 1 bug #1)', () => {
    expect(read('src/routes/admin/dashboard/+page.svelte')).toMatch(/fetch\(`\/api\/admin\/events\?id=/);
    expect(read('src/routes/admin/dashboard/matches/+page.svelte')).toMatch(/fetch\(`\/api\/admin\/matches\?id=/);
    expect(read('src/routes/admin/dashboard/albums/+page.svelte')).toMatch(/fetch\(`\/api\/albums\//);
  });

  it('map route disables SSR (Round 2 bug #6)', () => {
    expect(read('src/routes/map/+page.svelte')).toMatch(/export const ssr = false/);
  });

  it('analytics page has +page.server.ts hitting D1 (Round 3 bug #10)', () => {
    expect(read('src/routes/admin/dashboard/analytics/+page.server.ts'))
      .toMatch(/locals\.db|prepare\(/);
  });

  it('schedule calendar reads festival dates from city_info (Round 2 bug #8)', () => {
    expect(read('src/lib/components/ScheduleCalendar.svelte')).toMatch(/festival_start/);
  });

  it('whatsapp endpoint imports from $env/dynamic/private (Round 1 bug #2)', () => {
    expect(read('src/routes/api/whatsapp/+server.ts')).toMatch(/\$env\/dynamic\/private/);
  });
});
