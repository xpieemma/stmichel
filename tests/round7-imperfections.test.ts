/**
 * tests/round7-imperfections.test.ts
 *
 * Pins every Round 7 cure. These bugs were found in a final review
 * pass — the kind of issues that wouldn't show up in architecture
 * narratives but bite when real users, real admins, or real
 * attackers interact with the running system.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('Bug 3 — WebAuthn registration is allowlisted', () => {
  it('migration 009 creates the admin_allowlist table', () => {
    const m = read('migrations/009_admin_allowlist.sql');
    expect(m).toMatch(/CREATE TABLE IF NOT EXISTS admin_allowlist/);
  });

  it('migration 009 seeds at least one bootstrap username', () => {
    const m = read('migrations/009_admin_allowlist.sql');
    expect(m).toMatch(/INSERT OR IGNORE INTO admin_allowlist/);
  });

  it('/admin/api/webauthn/verify checks admin_allowlist BEFORE accepting registration', () => {
    const v = read('src/routes/admin/api/webauthn/verify/+server.ts');
    // Must do the actual SELECT query against admin_allowlist
    expect(v).toMatch(/SELECT\s+username\s+FROM\s+admin_allowlist\s+WHERE\s+username\s*=\s*\?/);
    // Must reject (403) when the username is not on the list
    expect(v).toMatch(/if\s*\(!allowed\)/);
    expect(v).toMatch(/status:\s*403/);
    expect(v).toMatch(/pa otorize/);
  });
});

describe('Bug 4 — WebAuthn counter replay protection', () => {
  it('migration 010 adds counter column to admins', () => {
    const m = read('migrations/010_admin_counter.sql');
    expect(m).toMatch(/ALTER TABLE admins ADD COLUMN counter INTEGER/);
  });

  it('verify endpoint reads the stored counter instead of hardcoding 0', () => {
    const v = read('src/routes/admin/api/webauthn/verify/+server.ts');
    // Before: counter: 0 (hardcoded)
    expect(v).not.toMatch(/counter:\s*0\s*,/);
    // After: counter: (admin.counter as number) || 0
    expect(v).toMatch(/admin\.counter/);
  });

  it('verify endpoint persists the new counter on successful authentication', () => {
    const v = read('src/routes/admin/api/webauthn/verify/+server.ts');
    expect(v).toMatch(/UPDATE admins SET counter/);
    expect(v).toMatch(/authenticationInfo\?\.newCounter/);
  });

  it('admin INSERT explicitly sets counter = 0 on registration', () => {
    const v = read('src/routes/admin/api/webauthn/verify/+server.ts');
    expect(v).toMatch(/INSERT INTO admins \(username, credential_id, public_key, counter/);
  });
});

describe('Bug 6 — CSRF origin check on admin endpoints', () => {
  const hooks = read('src/hooks.server.ts');

  it('hooks.server.ts defines an adminOriginHandle', () => {
    expect(hooks).toMatch(/adminOriginHandle/);
  });

  it('rejects mutating requests with mismatched or missing Origin header', () => {
    expect(hooks).toMatch(/missing Origin/);
    expect(hooks).toMatch(/origin mismatch/);
  });

  it('only checks mutating methods (POST/PUT/PATCH/DELETE)', () => {
    expect(hooks).toMatch(/POST['"],\s*['"]PUT['"],\s*['"]PATCH['"],\s*['"]DELETE/);
  });

  it('adminOriginHandle is wired into the handle sequence', () => {
    expect(hooks).toMatch(/sequence\([^)]*adminOriginHandle[^)]*\)/);
  });
});

describe('Bug 12 — Admin endpoints for photos exist', () => {
  it('/api/admin/match-photos endpoint exists with POST and DELETE', () => {
    const path = resolve(ROOT, 'src/routes/api/admin/match-photos/+server.ts');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf8');
    expect(content).toMatch(/export const POST/);
    expect(content).toMatch(/export const DELETE/);
  });

  it('/api/admin/album-photos endpoint exists with POST and DELETE', () => {
    const path = resolve(ROOT, 'src/routes/api/admin/album-photos/+server.ts');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf8');
    expect(content).toMatch(/export const POST/);
    expect(content).toMatch(/export const DELETE/);
  });

  it('match-photos POST touches matches.updated_at so sync picks up the change', () => {
    const content = read('src/routes/api/admin/match-photos/+server.ts');
    expect(content).toMatch(/UPDATE matches SET updated_at/);
  });

  it('album-photos POST touches albums.updated_at so sync picks up the change', () => {
    const content = read('src/routes/api/admin/album-photos/+server.ts');
    expect(content).toMatch(/UPDATE albums SET updated_at/);
  });

  it('both photo endpoints require an admin_session cookie', () => {
    for (const p of ['src/routes/api/admin/match-photos/+server.ts', 'src/routes/api/admin/album-photos/+server.ts']) {
      const c = read(p);
      expect(c).toMatch(/cookies\.get\(['"]admin_session['"]\)/);
      expect(c).toMatch(/Unauthorized/);
    }
  });
});

describe('Bug 14 — /api/admin/albums endpoint exists', () => {
  const path = resolve(ROOT, 'src/routes/api/admin/albums/+server.ts');

  it('endpoint file exists (was silently missing before)', () => {
    expect(existsSync(path)).toBe(true);
  });

  it('has POST (what syncToServer calls) and DELETE', () => {
    const content = readFileSync(path, 'utf8');
    expect(content).toMatch(/export const POST/);
    expect(content).toMatch(/export const DELETE/);
  });

  it('requires admin_session', () => {
    const content = readFileSync(path, 'utf8');
    expect(content).toMatch(/cookies\.get\(['"]admin_session['"]\)/);
  });

  it('handles both insert (no id) and update (id present)', () => {
    const content = readFileSync(path, 'utf8');
    expect(content).toMatch(/if \(data\.id\)/);
    expect(content).toMatch(/INSERT INTO albums/);
    expect(content).toMatch(/UPDATE albums/);
  });
});

describe('Bug 19 — Logout clears server cookie', () => {
  const logoutPath = resolve(ROOT, 'src/routes/admin/api/logout/+server.ts');

  it('/admin/api/logout endpoint exists', () => {
    expect(existsSync(logoutPath)).toBe(true);
  });

  it('logout endpoint calls cookies.delete for admin_session', () => {
    const content = readFileSync(logoutPath, 'utf8');
    expect(content).toMatch(/cookies\.delete\(['"]admin_session['"]/);
  });

  it('admin dashboard calls the logout endpoint BEFORE clearing localStorage', () => {
    const dash = read('src/routes/admin/dashboard/+page.svelte');
    expect(dash).toMatch(/\/admin\/api\/logout/);
    // Order matters: fetch first, then localStorage.removeItem
    const fetchIdx = dash.indexOf("'/admin/api/logout'");
    const lsIdx = dash.indexOf("localStorage.removeItem('admin_auth')");
    expect(fetchIdx).toBeGreaterThan(-1);
    expect(lsIdx).toBeGreaterThan(-1);
    expect(fetchIdx).toBeLessThan(lsIdx);
  });
});

describe('Bug 1+22 — Self-hosted (no external) font strategy', () => {
  const html = read('src/app.html');

  it('app.html does NOT import Google Fonts CSS', () => {
    expect(html).not.toMatch(/fonts\.googleapis\.com/);
  });

  it('app.html has no external preconnect for fonts', () => {
    expect(html).not.toMatch(/preconnect[^>]*fonts\./);
  });

  it('CSP does not open font-src to external CDNs', () => {
    const hooks = read('src/hooks.server.ts');
    expect(hooks).not.toMatch(/font-src[^,]*fonts\.gstatic\.com/);
  });
});

describe('Bug 2 — WhatsApp webhook verifies Meta signature', () => {
  const ws = read('src/routes/api/whatsapp/+server.ts');

  it('has a verifyMetaSignature helper using crypto.subtle HMAC-SHA256', () => {
    expect(ws).toMatch(/async function verifyMetaSignature\(/);
    expect(ws).toMatch(/crypto\.subtle\.importKey/);
    expect(ws).toMatch(/HMAC['"],\s*hash:\s*['"]SHA-256/);
  });

  it('POST actually CALLS the signature verifier and uses its result', () => {
    // Catches the mutation where the helper exists, is called, but
    // its result is overridden with `true` before the gate.
    expect(ws).toMatch(/const signatureValid = await verifyMetaSignature\(/);
    expect(ws).toMatch(/if\s*\(!signatureValid\)/);
  });

  it('POST reads rawBody as text BEFORE JSON-parsing (signature needs raw)', () => {
    expect(ws).toMatch(/const rawBody = await request\.text\(\)/);
  });

  it('POST checks the x-hub-signature-256 header', () => {
    expect(ws).toMatch(/x-hub-signature-256/);
  });

  it('POST drops the request (returns 200) if signature is invalid', () => {
    expect(ws).toMatch(/invalid signature/);
  });

  it('POST refuses to run if WHATSAPP_APP_SECRET is unset (fail-safe)', () => {
    expect(ws).toMatch(/WHATSAPP_APP_SECRET/);
    expect(ws).toMatch(/rejecting webhook/);
  });

  it('.env.example documents the new WHATSAPP_APP_SECRET var', () => {
    expect(read('.env.example')).toMatch(/WHATSAPP_APP_SECRET/);
  });
});

describe('Bug 10 — match_photos sync down to OPFS', () => {
  const syncMatches = read('src/routes/api/matches/sync/+server.ts');
  const sync = read('src/lib/db/sync.ts');

  it('/api/matches/sync embeds photos in the response (like albums does)', () => {
    expect(syncMatches).toMatch(/match_id IN/);
    expect(syncMatches).toMatch(/photos:/);
  });

  it('sync.ts imports matchPhotos from schema', () => {
    expect(sync).toMatch(/matchPhotos/);
  });

  it('sync.ts declares a SyncMatchPhoto interface', () => {
    expect(sync).toMatch(/interface SyncMatchPhoto/);
  });

  it('sync.ts replaces local match photos atomically (delete-then-insert)', () => {
    expect(sync).toMatch(/db\.delete\(matchPhotos\)/);
    expect(sync).toMatch(/db\.insert\(matchPhotos\)/);
  });
});

describe('Bug 7 — Admin dashboard has server-side auth gate', () => {
  const server = 'src/routes/admin/dashboard/+page.server.ts';

  it('+page.server.ts exists and redirects unauthenticated users', () => {
    expect(existsSync(resolve(ROOT, server))).toBe(true);
    const content = read(server);
    expect(content).toMatch(/redirect\(302, ['"]\/admin\/login['"]\)/);
  });

  it('dashboard no longer reads localStorage to gate the UI', () => {
    const svelte = read('src/routes/admin/dashboard/+page.svelte');
    // Old: if (!localStorage.getItem('admin_auth')) { goto('/admin/login'); return; }
    expect(svelte).not.toMatch(/if \(!localStorage\.getItem\(['"]admin_auth['"]\)/);
  });
});

describe('Bug 8 — Service worker matches both forms of /offline.html', () => {
  const sw = read('src/service-worker.ts');

  it('tries /offline.html/ (with trailing slash) AND /offline.html (without)', () => {
    expect(sw).toMatch(/caches\.match\(['"]\/offline\.html\/['"]/);
    expect(sw).toMatch(/caches\.match\(['"]\/offline\.html['"]\)/);
  });
});

describe('Bug 23 — dev:wrangler builds and runs against the production worker (Round 9)', () => {
  const pkg = JSON.parse(read('package.json'));

  it('dev:wrangler builds first then runs wrangler pages dev (Round 9 — was concurrently)', () => {
    // Round 7 used `concurrently` to start vite dev + wrangler pages dev
    // in parallel. That was wrong: wrangler pages dev needs the
    // .svelte-kit/cloudflare directory to exist, which only happens
    // AFTER vite build. The Round 8 platformProxy in svelte.config.js
    // makes vite dev alone provide D1+KV via Miniflare, so this script
    // is only useful for testing the actual production worker bundle.
    expect(pkg.scripts['dev:wrangler']).toMatch(/build/);
    expect(pkg.scripts['dev:wrangler']).toMatch(/wrangler pages dev/);
  });

  it('dev:wrangler binds D1 and KV explicitly (no longer relies on --proxy)', () => {
    expect(pkg.scripts['dev:wrangler']).toMatch(/--d1/);
    expect(pkg.scripts['dev:wrangler']).toMatch(/--kv/);
  });

  it('package.json provides a one-shot setup script that runs migrations', () => {
    expect(pkg.scripts.setup).toBeDefined();
    expect(pkg.scripts.setup).toMatch(/db:push|db:migrate/);
  });
});

describe('Migration chains include new Round 7 migrations', () => {
  const pkg = JSON.parse(read('package.json'));

  it('db:migrate uses drizzle-kit (handles all schema changes)', () => {
  expect(pkg.scripts['db:migrate']).toBe('drizzle-kit migrate');
});

  it('db:push|db:migrate pushes schema to local DB', () => {
  expect(pkg.scripts['db:push|db:migrate']).toBeDefined();
});
});
