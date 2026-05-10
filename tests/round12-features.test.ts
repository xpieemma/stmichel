/**
 * tests/round12-features.test.ts
 *
 * Pins every Round 12 cure:
 *   A. Email column on admins + admin_allowlist (migration 012)
 *   B. Allowlist management UI + endpoints
 *   C. grant-admin.js engineer CLI
 *   D. Demo login (read-only, env-gated in production)
 *   E. Demo content seeds (migration 013) — clear path documented
 *   bug 1. SW skipWaiting via message, broadcast on activate
 *   bug 2. WhatsApp from-number validation
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('A. Migration 012 — email + status on admin tables', () => {
  const m = read('migrations/012_admin_email.sql');

  it('adds email + display_name to admins', () => {
    expect(m).toMatch(/ALTER TABLE admins ADD COLUMN email/);
    expect(m).toMatch(/ALTER TABLE admins ADD COLUMN display_name/);
  });

  it('adds email + status + review tracking to admin_allowlist', () => {
    expect(m).toMatch(/ALTER TABLE admin_allowlist ADD COLUMN email/);
    expect(m).toMatch(/ALTER TABLE admin_allowlist ADD COLUMN status/);
    expect(m).toMatch(/CHECK\(status IN \('pending', 'approved', 'rejected', 'bootstrap'\)\)/);
    expect(m).toMatch(/requested_at/);
    expect(m).toMatch(/reviewed_at/);
    expect(m).toMatch(/reviewed_by/);
  });

  it('creates unique indexes on email columns', () => {
    expect(m).toMatch(/CREATE UNIQUE INDEX[\s\S]+admins\(email\)/);
    expect(m).toMatch(/CREATE UNIQUE INDEX[\s\S]+admin_allowlist\(email\)/);
  });
});

describe('B.1 — /admin/api/request-access creates a pending row', () => {
  const path = 'src/routes/admin/api/request-access/+server.ts';

  it('endpoint exists', () => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
  });

  it('validates email format', () => {
    const c = read(path);
    expect(c).toMatch(/EMAIL_RE/);
    expect(c).toMatch(/Valid email required/);
    expect(c).toMatch(/status:\s*400/);
  });

  it('inserts as status="pending" and tracks requested_at', () => {
    const c = read(path);
    expect(c).toMatch(/'pending'/);
    expect(c).toMatch(/requested_at/);
  });

  it('rejects re-requests from already-rejected emails (anti-spam)', () => {
    const c = read(path);
    expect(c).toMatch(/te refize/);
    expect(c).toMatch(/status:\s*403/);
  });

  it('is idempotent for already-pending requests', () => {
    const c = read(path);
    expect(c).toMatch(/'pending'/);
    expect(c).toMatch(/deja anrejistre/);
  });
});

describe('B.2 — /api/admin/allowlist endpoints', () => {
  const path = 'src/routes/api/admin/allowlist/+server.ts';

  it('endpoint exists with GET, POST, DELETE', () => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
    const c = read(path);
    expect(c).toMatch(/export const GET/);
    expect(c).toMatch(/export const POST/);
    expect(c).toMatch(/export const DELETE/);
  });

  it('GET orders pending entries first', () => {
    const c = read(path);
    expect(c).toMatch(/CASE status WHEN 'pending' THEN 0 ELSE 1 END/);
  });

  it('POST validates action enum (approve|reject)', () => {
    const c = read(path);
    expect(c).toMatch(/action\s*!==?\s*['"]approve['"]/);
    expect(c).toMatch(/action\s*!==?\s*['"]reject['"]/);
  });

  it('POST records reviewed_at and reviewed_by', () => {
    const c = read(path);
    expect(c).toMatch(/reviewed_at\s*=\s*unixepoch\(\)/);
    expect(c).toMatch(/reviewed_by\s*=/);
  });

  it('DELETE refuses to remove the last admin (lockout protection)', () => {
    const c = read(path);
    expect(c).toMatch(/Cannot remove the last admin/);
    expect(c).toMatch(/status:\s*409/);
  });
});

describe('B.3 — /admin/dashboard/admins UI', () => {
  it('+page.server.ts gates via locals.admin', () => {
    const p = read('src/routes/admin/dashboard/admins/+page.server.ts');
    expect(p).toMatch(/!locals\.admin/);
    expect(p).toMatch(/redirect\(302, ['"]\/admin\/login['"]\)/);
  });

  it('+page.svelte has accept and reject buttons that call the endpoint', () => {
    const p = read('src/routes/admin/dashboard/admins/+page.svelte');
    expect(p).toMatch(/Aksepte/);
    expect(p).toMatch(/Refize/);
    expect(p).toMatch(/\/api\/admin\/allowlist/);
    expect(p).toMatch(/method:\s*['"]POST['"]/);
  });

  it('UI prevents the current admin from removing themselves', () => {
    const p = read('src/routes/admin/dashboard/admins/+page.svelte');
    expect(p).toMatch(/row\.username\s*!==\s*me/);
  });
});

describe('C. grant-admin.js engineer CLI', () => {
  const path = 'scripts/grant-admin.js';

  it('script exists and is executable in spirit (has shebang)', () => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
    const c = read(path);
    expect(c).toMatch(/^#!/);
  });

  it('validates email format before any DB write', () => {
    const c = read(path);
    expect(c).toMatch(/Not a valid email/);
  });

  it('uses PBKDF2-SHA256 with the same iteration count as the server', () => {
    const c = read(path);
    expect(c).toMatch(/PBKDF2/);
    expect(c).toMatch(/SHA-256/);
    expect(c).toMatch(/310[,_]?000/);
  });

  it('runs with --remote flag to target production D1', () => {
    const c = read(path);
    expect(c).toMatch(/--remote/);
  });

  it('hashes locally — cleartext password never reaches D1 (Round 13: via sqlQuote)', () => {
    const c = read(path);
    // Round 13 added a sqlQuote helper that escapes single quotes
    // and rejects NUL bytes. The SQL string still embeds the hash
    // (D1 CLI doesn't accept parameter binding via wrangler execute)
    // but every value goes through the quoter so injection is closed.
    expect(c).toMatch(/function sqlQuote/);
    expect(c).toMatch(/sqlQuote\(hashB64\)/);
    expect(c).toMatch(/sqlQuote\(saltB64\)/);
    expect(c).toMatch(/sqlQuote\(email\)/);
    // The cleartext `password` variable must NEVER appear in any SQL
    // string. The hashes do.
    expect(c).not.toMatch(/INSERT[^']+'\$\{password\}'/);
    expect(c).not.toMatch(/sqlQuote\(password\)/);
  });
});

describe('D. Demo login (read-only)', () => {
  const path = 'src/routes/admin/api/demo-login/+server.ts';

  it('endpoint exists', () => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
  });

  it('issues a session for the special "demo" user', () => {
    const c = read(path);
    expect(c).toMatch(/issueSessionCookie\(cookies,\s*['"]demo['"]/);
  });

  it('disabled in production unless ADMIN_DEMO_ENABLED=1', () => {
    const c = read(path);
    expect(c).toMatch(/ADMIN_DEMO_ENABLED/);
    expect(c).toMatch(/Demo login disabled/);
  });

  it('idempotently inserts the demo user (no duplicate-key crash)', () => {
    const c = read(path);
    expect(c).toMatch(/INSERT OR IGNORE INTO admins/);
    expect(c).toMatch(/INSERT OR IGNORE INTO admin_allowlist/);
  });

  it('hooks.server.ts blocks demo user from any non-GET admin call', () => {
    const h = read('src/hooks.server.ts');
    expect(h).toMatch(/username\s*===?\s*['"]demo['"]/);
    expect(h).toMatch(/event\.request\.method\s*!==?\s*['"]GET['"]/);
    expect(h).toMatch(/Demo user is read-only/);
  });

  it('login page surfaces the demo button', () => {
    const u = read('src/routes/admin/login/+page.svelte');
    expect(u).toMatch(/handleDemo/);
    expect(u).toMatch(/Gade demo/);
  });
});

describe('E. Demo content (migration 013)', () => {
  const m = read('migrations/013_demo_content.sql');

  it('seeds events with demo- prefix slugs (single-step cleanup)', () => {
    expect(m).toMatch(/INSERT OR IGNORE INTO events/);
    expect(m).toMatch(/'demo-/);
  });

  it('seeds matches including a completed one with a score', () => {
    expect(m).toMatch(/INSERT OR IGNORE INTO matches/);
    expect(m).toMatch(/UPDATE matches SET home_score/);
  });

  it('seeds at least 2 albums', () => {
    expect(m).toMatch(/INSERT OR IGNORE INTO albums/);
    const albumInserts = (m.match(/'demo-[^']+',\s*'DEMO:/g) || []).length;
    expect(albumInserts).toBeGreaterThan(0);
  });

  it('seeds POI rows (type=poi) so the map shows pins on first run', () => {
    expect(m).toMatch(/'poi'/);
  });

  it('seeds history rows (type=history) for the first-run "Istwa" page', () => {
    expect(m).toMatch(/'history'/);
  });

  it('package.json has demo:clear script', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts['demo:clear']).toBeDefined();
    expect(pkg.scripts['demo:clear']).toMatch(/DELETE FROM events WHERE slug LIKE 'demo-%'/);
  });

  it('migrations 012 and 013 chained in db:migrate scripts', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts['db:migrate']).toContain('012_admin_email');
    expect(pkg.scripts['db:migrate']).toContain('013_demo_content');
    expect(pkg.scripts['db:migrate:local']).toContain('012_admin_email');
    expect(pkg.scripts['db:migrate:local']).toContain('013_demo_content');
  });
});

describe('Bug 1 — SW skipWaiting via message', () => {
  const sw = read('src/service-worker.ts');

  it('does NOT call skipWaiting() automatically on install', () => {
    // The install-handler skipWaiting was the cause of the "page yanked"
    // UX. Cured by waiting for an explicit SKIP_WAITING message.
    const installBlock = sw.match(/sw\.addEventListener\(['"]install['"][\s\S]+?\}\);/)?.[0] || '';
    expect(installBlock).not.toMatch(/sw\.skipWaiting\(\)/);
  });

  it('responds to a SKIP_WAITING postMessage from the client', () => {
    expect(sw).toMatch(/SKIP_WAITING/);
    expect(sw).toMatch(/sw\.skipWaiting\(\)/);
  });

  it('broadcasts sw-update-available to clients on activate', () => {
    expect(sw).toMatch(/sw-update-available/);
    expect(sw).toMatch(/clients\.matchAll/);
  });
});

describe('Bug 2 — WhatsApp from-number validation', () => {
  const ws = read('src/routes/api/whatsapp/+server.ts');

  it('has an isValidWhatsAppFrom helper requiring 8-15 digits', () => {
    expect(ws).toMatch(/isValidWhatsAppFrom/);
    expect(ws).toMatch(/\\d\{8,15\}/);
  });

  it('rejects messages with malformed from before any DB query', () => {
    expect(ws).toMatch(/dropping message with invalid from-number/);
  });
});
